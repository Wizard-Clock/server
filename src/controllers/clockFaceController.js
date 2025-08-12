const wizardDAO = require("../dao/wizardDao");
const clockFaceDAO = require("../dao/clockFaceDao");
const locationDAO = require("../dao/locationDAO");

async function getClockPositionFromUserID(user_id, defaultLocationID) {
    let location = await wizardDAO.getUserLocationFromUserID(user_id);
    let positionLocation = await clockFaceDAO.getClockPositionLocationFromLocationID(location.location_id);

    if (!positionLocation) {
        return clockFaceDAO.getClockPositionFromLocationID(defaultLocationID);
    } else {
        return clockFaceDAO.getClockPositionFromID(positionLocation.position_id);
    }
}

async function getAllUsersClockFacePositions() {
    const users = await wizardDAO.getAllUsers();
    let usersClockPosition = [];
    for (let user of users) {
        let userLocation = await wizardDAO.getUserLocationFromUserID(user.id);
        let position = await getClockPositionFromUserLocation(userLocation);
        let wizard= {name: user.username, position: position};
        usersClockPosition.push(wizard);
    }
    return usersClockPosition;
}

async function getClockPositionFromUserLocation(userLocation) {
    let defaultLocation = await locationDAO.getDefaultLocation();
    let positionLocation = await clockFaceDAO.getClockPositionLocationFromLocationID(userLocation.location_id);
    if (!positionLocation) {
        return clockFaceDAO.getClockPositionFromLocationID(defaultLocation.id);
    } else {
        return clockFaceDAO.getClockPositionFromID(positionLocation.position_id);
    }
}

module.exports = {
    getAllUsersClockFacePositions,
    getClockPositionFromUserID
};