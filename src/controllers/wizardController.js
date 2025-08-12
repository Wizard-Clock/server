const roleDAO = require("../dao/roleDao");
const locationDAO = require("../dao/locationDAO");
const loggingDAO = require("../dao/loggingDao");
const followerDAO = require("../dao/followerDao");
const wizardDAO = require("../dao/wizardDao");

async function addUserInfo(username, password, role, isFollower, leadID) {
    const defaultLocation = await locationDAO.getDefaultLocation();
    await wizardDAO.addUser(username, password, role, isFollower).then(async () => {
        let newUser = await wizardDAO.getUserFromName(username)
        await roleDAO.addUserToRole(newUser.id, role);
        await wizardDAO.setUserLocation(newUser.id, defaultLocation.id);
        if (isFollower) {
            await updateUserToFollower(newUser.id, leadID);
        }
    });
}

async function updateUserInfo(user) {
    const oldUser = await wizardDAO.getUserFromID(user.id);

    if (oldUser.username !== user.username) {
        await wizardDAO.updateUserUsername(user.id, user.username);
    }
    if (user.password !== "") {
        await wizardDAO.updateUserPassword(user.id, user.password);
    }

    if (user.isFollower === "true") {
        await updateUserToFollower(user.id, user.leadID);
    } else {
        await followerDAO.removeFollowLink(user.id);
    }
    await wizardDAO.updateUserFollowerStatus(user.id, user.isFollower)

    await roleDAO.updateUserRole(user.id, user.role);
}

async function deleteUserInfo(userID){
    await wizardDAO.deleteUserLocation(userID);
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
    await wizardDAO.getUserLocationFromUserID(leadID).then(async (locationInfo) => {
        if (locationInfo) {
            await wizardDAO.setUserLocation(followerID, locationInfo.location_id);
        }
    })
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
    deleteUserInfo
};