const roleDAO = require("../dao/roleDao");
const wizardDAO = require("../dao/wizardDao");
const loggingDAO = require("../dao/loggingDao");
const locationDAO = require("../dao/locationDAO");
const followerDAO = require("../dao/followerDao");
const clockFaceDAO = require("../dao/clockFaceDao");
const clockFaceController = require("../controllers/clockFaceController");
const dobby = require("./discordController");
const settingsService = require("../controllers/serverSettingController").default.getInstance();

async function addUserInfo(username, password, role, reportingMethod, isFollower, leadID) {
    const defaultPosition = await clockFaceController.getDefaultClockPosition();
    await wizardDAO.addUser(username, password, role, reportingMethod, isFollower).then(async () => {
        let newUser = await wizardDAO.getUserFromName(username)
        await roleDAO.addUserToRole(newUser.id, role);
        await wizardDAO.setUserClockPosition(newUser.id, defaultPosition.id);
        if (isFollower) {
            await updateUserToFollower(newUser.id, leadID);
        }
    });
    return true;
}

async function updateUserInfo(user) {
    const oldUser = await wizardDAO.getUserFromID(user.id);

    if (oldUser.username !== user.username) {
        await wizardDAO.updateUserUsername(user.id, user.username);
    }
    if (user.password !== "") {
        await wizardDAO.updateUserPassword(user.id, user.password);
    }
    if (oldUser.reportingMethod !== user.reportingMethod) {
        await updateUserReportingMethod(user.id, user.reportingMethod);
    }
    if (user.isFollower === "true") {
        await updateUserToFollower(user.id, user.leadID);
    } else {
        await followerDAO.removeFollowLink(user.id);
    }
    await wizardDAO.updateUserFollowerStatus(user.id, user.isFollower)

    await roleDAO.updateUserRole(user.id, user.role);
    return true;
}

async function handleUserLocationUpdate(userID, coords, isHeartbeat) {
    const locations = await locationDAO.getAllLocations();
    const followerIDList = [];

    // Check for Followers
    await followerDAO.getFollowerInfoFromLeadID(userID).then(results => {
        for (let followInfo of results) {
            followerIDList.push(followInfo.follower_id);
        }
    });

    // Update Location Logs
    const releaseType = settingsService.getSettingValue("releaseType");
    if (releaseType === "development") {
        await loggingDAO.updateUserLocationLog(userID, coords.latitude, coords.longitude);
        if (followerIDList.length > 0) {
            for (let followerID of followerIDList) {
                await loggingDAO.updateUserLocationLog(followerID, coords.latitude, coords.longitude);
            }
        }
    }

    for (let location of locations) {
        if (isUserWithinLocation(coords.latitude, coords.longitude, location.latitude, location.longitude, location.radius)) {
            let clockPosition = await clockFaceController.getClockPositionFromLocationID(location.id);
            await fireLocationUpdate(userID, clockPosition, isHeartbeat);
            await wizardDAO.updateUserClockPosition(userID, clockPosition.id).catch(() =>{
                return false;
            });
            if (followerIDList.length > 0) {
                await updateFollowersClockPosition(followerIDList, clockPosition.id);
            }
            return true;
        }
    }

    const defaultClockPosition = await clockFaceController.getDefaultClockPosition();
    await fireLocationUpdate(userID, defaultClockPosition, isHeartbeat);
    await wizardDAO.updateUserClockPosition(userID, defaultClockPosition.id).catch(() =>{
        return false;
    });
    if (followerIDList.length > 0) {
        await updateFollowersClockPosition(followerIDList, defaultClockPosition.id);
    }
    return true;
}

async function handleUserPositionUpdate(userID, positionID) {
    const followerIDList = [];

    // Check for Followers
    await followerDAO.getFollowerInfoFromLeadID(userID).then(results => {
        for (let followInfo of results) {
            followerIDList.push(followInfo.follower_id);
        }
    });

    let clockPosition = await clockFaceDAO.getClockPositionFromID(positionID);
    await fireLocationUpdate(userID, clockPosition, false);
    await wizardDAO.updateUserClockPosition(userID, clockPosition.id).catch(() =>{
        return false;
    });
    if (followerIDList.length > 0) {
        await updateFollowersClockPosition(followerIDList, clockPosition.id);
    }
    return true;
}

async function updateFollowersClockPosition(followers, clockPositionID) {
    const clockPosition = clockFaceDAO.getClockPositionFromID(clockPositionID);
    for  (let followerID of followers) {
        await fireLocationUpdate(followerID, clockPosition, null);
        await wizardDAO.updateUserClockPosition(followerID, clockPositionID);
    }
}

async function fireLocationUpdate(userID, clockPosition, isHeartbeat) {
    if (settingsService.getSettingValue("notifyEveryPositionUpdate") === "true") {
        await sendDiscordPing(userID, clockPosition, isHeartbeat);
    } else {
        const userClockPosition = await clockFaceController.getClockPositionFromUserID(userID);
        if (userClockPosition.face_position !== clockPosition.face_position) {
            await sendDiscordPing(userID, clockPosition, isHeartbeat);
        }
    }
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


async function deleteUserInfo(userID){
    await wizardDAO.deleteUserClockPosition(userID);
    await loggingDAO.clearUserLocationLog(userID);
    await roleDAO.removeUserFromRole(userID);
    await wizardDAO.getUserFromID(userID).then(async user => {
        if (user.isFollower === "true") {
            await followerDAO.removeFollowLink(userID);
        } else {
            await removeLeadFromFollowers(userID)
        }
    });
    return await wizardDAO.deleteUser(userID);
}

async function updateUserToFollower(followerID, leadID) {
    await followerDAO.applyFollowLink(followerID, leadID);
    await wizardDAO.getUserClockPositionInfoFromUserID(leadID).then(async (clockPositionInfo) => {
        if (clockPositionInfo) {
            await wizardDAO.setUserClockPosition(followerID, clockPositionInfo.position_id);
        }
    })
}

async function updateUserReportingMethod(userID, reportingMethod) {
    let user = await wizardDAO.getUserFromID(userID);
    if (user.reportingMethod !== reportingMethod) {
        await wizardDAO.updateUserReportingMethod(userID, reportingMethod);
        await dobby.notifyReportingMethodChange(user.username, reportingMethod);
    }
}

async function removeLeadFromFollowers(userID) {
    let followerIDList = [];
    await followerDAO.getFollowerInfoFromLeadID(userID).then(results => {
        for (let followInfo of results) {
            followerIDList.push(followInfo.follower_id);
        }
    });

    if (followerIDList.length > 0) {
        for (let followerID of followerIDList) {
            await followerDAO.removeFollowLink(followerID);
            await wizardDAO.updateUserFollowerStatus(followerID, false.toString());
        }
    }
}

module.exports = {
    addUserInfo,
    updateUserInfo,
    updateUserReportingMethod,
    deleteUserInfo,
    handleUserLocationUpdate,
    handleUserPositionUpdate
};