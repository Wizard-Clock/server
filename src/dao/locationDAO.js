const db = require("../controllers/dbController");
const clockFaceDAO = require("./clockFaceDao");

async function addLocation(location) {
    await db.dbConnector.run(`INSERT INTO locations (name, latitude, longitude, radius, description) VALUES (?, ?, ?, ?, ?)`, [
        location.name,
        location.latitude,
        location.longitude,
        location.radius,
        location.description,
    ]);

    if (location.clockPosition) {
        let locationID;
        await getLocationFromName(location.name).then(value => locationID = value.id);
        return clockFaceDAO.updatePositionLocations(location.clockPosition, locationID);
    }
}

async function updateLocation(location) {
    await db.dbConnector.run(`UPDATE locations SET name=?, latitude=?, longitude=?, radius=?, description=? WHERE id=?`, [
        location.name,
        location.latitude,
        location.longitude,
        location.radius,
        location.description,
        location.id
    ]);

    if (location.clockPosition) {
        return clockFaceDAO.updatePositionLocations(location.clockPosition, location.id);
    } else {
        return await removeLocationFromPosition(location.id);
    }
}

async function deleteLocation(locationID) {
    await removeLocationFromPosition(locationID);

    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`DELETE FROM locations WHERE id=?`, locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function removeLocationFromPosition(locationID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`DELETE FROM position_locations WHERE location_id=?`, locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllLocations() {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM locations', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllLocationsForClockPosition(clockPositionID) {
    let locationIDs = await getAllLocationIDsFromPositionID(clockPositionID);

    const locations = [];
    for (let entry of locationIDs) {
        await getLocationFromID(entry.location_id).then(value => locations.push(value.name));
    }
    return locations;
}

async function getAllLocationIDsFromPositionID(positionID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM position_locations WHERE position_id=?', positionID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getLocationFromID(locationID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM locations WHERE id=?', locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getLocationFromName(locationName) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM locations WHERE name=?', locationName, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getDefaultLocation() {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM locations WHERE isDefault=1', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

module.exports = {
    addLocation,
    updateLocation,
    deleteLocation,
    removeLocationFromPosition,
    getAllLocations,
    getAllLocationsForClockPosition,
    getAllLocationIDsFromPositionID,
    getLocationFromID,
    getLocationFromName,
    getDefaultLocation
}
