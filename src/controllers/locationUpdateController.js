const locationDAO = require("../dao/locationDAO");
const followerDAO = require("../dao/followerDao");
const loggingDAO = require("../dao/loggingDao");
const wizardDAO = require("../dao/wizardDao");
const clockFaceDAO = require("../dao/clockFaceDao");
const dobby = require("./discordController");
const settingsService = require("../controllers/serverSettingController").default.getInstance();


async function updateUserLocation(userID, coords, isHeartbeat) {
    const locations = await locationDAO.getAllLocations();
    const followerIDList = [];

    // Check for Followers
    await followerDAO.getFollowerInfoFromLeadID(userID).then(results => {
        for (let followInfo of results) {
            followerIDList.push(followInfo.follower_id);
        }
    });

    // Update Location Logs
    await loggingDAO.updateUserLocationLog(userID, coords.latitude, coords.longitude);
    if (followerIDList.length > 0) {
        for (let idx = 0; idx < followerIDList.length; idx++) {
            await loggingDAO.updateUserLocationLog(followerIDList[idx], coords.latitude, coords.longitude);
        }
    }

    for (let location of locations) {
        if (isUserWithinLocation(coords.latitude, coords.longitude, location.latitude, location.longitude, location.radius)) {
            await fireLocationUpdate(userID, location.id, isHeartbeat);
            await wizardDAO.updateUserLocation(userID, location.id).catch(() =>{
                return false;
            });
            if (followerIDList.length > 0) {
                await updateFollowersLocations(followerIDList, location.id);
            }
            return true;
        }
    }

    const defaultLocation = await locationDAO.getDefaultLocation();
    await fireLocationUpdate(userID, defaultLocation.id, isHeartbeat);
    await wizardDAO.updateUserLocation(userID, defaultLocation.id).catch(() =>{
        return false;
    });
    if (followerIDList.length > 0) {
        await updateFollowersLocations(followerIDList, defaultLocation.id);
    }
    return true;
}

async function updateFollowersLocations(followers, locationID) {
    for (let idx = 0; idx < followers.length; idx++) {
        await fireLocationUpdate(followers[idx], locationID);
        await wizardDAO.updateUserLocation(followers[idx], locationID);
    }
}

async function fireLocationUpdate(userID, locationID, isHearbeat) {
    let clockPosition = await clockFaceDAO.getClockPositionFromLocationID(locationID);
    await clockFaceDAO.getClockPositionFromUserID(userID).then((result) => {
        if (settingsService.getSettingValue("notifyEveryPositionUpdate") === "true") {
            wizardDAO.getUserFromID(userID).then(async (result) => {
                if (result.isFollower === "false") {
                    await dobby.notifyLocationChange(result.username, clockPosition.name, isHearbeat);
                } else {
                    let lead = await followerDAO.getLeadFromFollowerID(result.id);
                    await dobby.notifyFollowerLocationChange(result.username, lead.username, clockPosition.name);
                }

            })
        } else {
            if (result.face_position !== clockPosition.face_position) {
                wizardDAO.getUserFromID(userID).then(async (result) => {
                    if (result.isFollower === "false") {
                        await dobby.notifyLocationChange(result.username, clockPosition.name, isHearbeat);
                    } else {
                        let lead = await followerDAO.getLeadFromFollowerID(result.id);
                        await dobby.notifyFollowerLocationChange(result.username, lead.username, clockPosition.name);
                    }
                })
            }
        }
    });
}

function isUserWithinLocation(userLat, userLong, locationLat, locationLong, radius) {
    return getDistanceFromLatLonInM(userLat, userLong, locationLat, locationLong) <= radius;
}

// From https://stackoverflow.com/a/27943
function getDistanceFromLatLonInM(userLat, userLong, locationLat, locationLong) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(locationLat-userLat);  // deg2rad below
    var dLon = deg2rad(locationLong-userLong);
    var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(locationLat)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d * 1000; // Convert to m
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

module.exports = updateUserLocation;
