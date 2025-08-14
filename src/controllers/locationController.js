const locationDAO = require("../dao/locationDAO");
const followerDAO = require("../dao/followerDao");
const loggingDAO = require("../dao/loggingDao");
const wizardDAO = require("../dao/wizardDao");
const clockFaceDAO = require("../dao/clockFaceDao");
const clockFaceController =  require("./clockFaceController");
const dobby = require("./discordController");
const settingsService = require("../controllers/serverSettingController").default.getInstance();

async function addLocationInfo(location) {
    await locationDAO.addLocation(location);
    if (location.clockPosition) {
        let locationID;
        await locationDAO.getLocationFromName(location.name).then(value => locationID = value.id);
        await clockFaceDAO.updatePositionLocations(location.clockPosition, locationID);
        return true;
    }
}

async function updateLocationInfo(location) {
    await locationDAO.updateLocation(location);
    if (location.clockPosition) {
        await clockFaceDAO.updatePositionLocations(location.clockPosition, location.id);
    } else {
        await locationDAO.removeLocationFromPosition(location.id);
    }
    return true;
}

async function deleteLocationInfo(locationID) {
    await locationDAO.removeLocationFromPosition(locationID);
    await locationDAO.deleteLocation(locationID);
    return true;
}

async function getAllLocationsForClockPositionID(clockPositionID) {
    let locationIDs = await locationDAO.getAllLocationIDsFromPositionID(clockPositionID);

    const locations = [];
    for (let entry of locationIDs) {
        await locationDAO.getLocationFromID(entry.location_id).then(value => locations.push(value.name));
    }
    return locations;
}

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
        for (let followerID of followerIDList) {
            await loggingDAO.updateUserLocationLog(followerID, coords.latitude, coords.longitude);
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
    for  (let followerID of followers) {
        await fireLocationUpdate(followerID, locationID);
        await wizardDAO.updateUserLocation(followerID, locationID);
    }
}

async function fireLocationUpdate(userID, locationID, isHeartbeat) {
    let clockPosition = await clockFaceDAO.getClockPositionFromLocationID(locationID);
    let defaultLocationID = await locationDAO.getDefaultLocation();
    await clockFaceController.getClockPositionFromUserID(userID, defaultLocationID).then((result) => {
        if (settingsService.getSettingValue("notifyEveryPositionUpdate") === "true") {
            sendDiscordPing(userID, clockPosition, isHeartbeat);
        } else {
            if (result.face_position !== clockPosition.face_position) {
                sendDiscordPing(userID, clockPosition, isHeartbeat);
            }
        }
    });
}

async function sendDiscordPing(userID, clockPosition, isHeartbeat) {
    await wizardDAO.getUserFromID(userID).then(async (result) => {
        if (result.isFollower === "false") {
            await dobby.notifyLocationChange(result.username, clockPosition.name, isHeartbeat);
        } else {
            let leadID = await followerDAO.getLeadIDFromFollowerID(result.id);
            let lead = await wizardDAO.getUserFromID(leadID.lead_id);
            await dobby.notifyFollowerLocationChange(result.username, lead.username, clockPosition.name);
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

module.exports = {
    addLocationInfo,
    updateLocationInfo,
    deleteLocationInfo,
    getAllLocationsForClockPositionID,
    updateUserLocation
}
