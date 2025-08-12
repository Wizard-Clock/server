const roleDAO = require("../dao/roleDao");
const locationDAO = require("../dao/locationDAO");
const followerDAO = require("../dao/followerDao");
const wizardDAO = require("../dao/wizardDao");

async function addUserInfo(username, password, role, isFollower, leadID) {
    await wizardDAO.addUser(username, password, role, isFollower);

    let newUser = await wizardDAO.getUserFromName(username);
    await roleDAO.addUserToRole(newUser.id, role);

    const defaultLocation = await locationDAO.getDefaultLocation();
    await wizardDAO.setUserLocation(newUser.id, defaultLocation.id);

    if (isFollower) {
        await followerDAO.applyFollowLink(newUser.id, leadID);
    }
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
        await followerDAO.applyFollowLink(user.id, user.leadID);
    } else {
        await followerDAO.removeFollowLink(user.id);
    }
    await wizardDAO.updateUserFollowerStatus(user.id, user.isFollower)

    await roleDAO.updateUserRole(user.id, user.role);
}

async function deleteUserInfo(userID){
    await roleDAO.removeUserFromRole(userID);
    await followerDAO.removeFollowLink(userID);
    return await wizardDAO.deleteUser(userID);
}

module.exports = {
    addUserInfo,
    updateUserInfo,
    deleteUserInfo
};