const locationDAO = require("../dao/locationDAO");
const clockFaceDAO = require("../dao/clockFaceDao");

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

module.exports = {
    addLocationInfo,
    updateLocationInfo,
    deleteLocationInfo,
    getAllLocationsForClockPositionID,
}
