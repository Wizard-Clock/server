const wizardDAO = require("../dao/wizardDao");
const clockFaceDAO = require("../dao/clockFaceDao");
const locationDAO = require("../dao/locationDAO");

async function getClockPositionFromUserID(user_id) {
    let positionInfo = await wizardDAO.getUserClockPositionInfoFromUserID(user_id);

    if (!positionInfo) {
        return getDefaultClockPosition();
    } else {
        return clockFaceDAO.getClockPositionFromID(positionInfo.position_id);
    }
}

async function getClockPositionFromLocationID(locationID) {
    let clockPositionInfo = await clockFaceDAO.getClockPositionInfoFromLocationID(locationID);
    if (!clockPositionInfo) {
        return null;
    } else {
        return clockFaceDAO.getClockPositionFromID(clockPositionInfo.position_id);
    }
}

async function getAllUsersClockFacePositions() {
    const users = await wizardDAO.getAllUsers();
    let usersClockPosition = [];
    for (let user of users) {
        let clockPosition = await getClockPositionFromUserID(user.id);
        let wizard= {name: user.username, position: clockPosition};
        usersClockPosition.push(wizard);
    }
    return usersClockPosition;
}

async function getDefaultClockPosition() {
    const defaultLocation = await locationDAO.getDefaultLocation();
    return getClockPositionFromLocationID(defaultLocation.id);
}

module.exports = {
    getAllUsersClockFacePositions,
    getClockPositionFromUserID,
    getClockPositionFromLocationID,
    getDefaultClockPosition
};