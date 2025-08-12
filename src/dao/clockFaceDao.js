const db = require("../controllers/dbController");

async function updateClockPosition(clockPosition) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`UPDATE clock_face SET name=? WHERE id=?`, [
            clockPosition.name,
            clockPosition.id
        ], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllClockPositions() {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM clock_face', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getClockPositionFromID(id) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM clock_face WHERE id=?', id,(err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getClockPositionLocationFromLocationID(locationID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM position_locations WHERE location_id=?', locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getClockPositionFromLocationID(locationID) {
    let position = await getClockPositionLocationFromLocationID(locationID);
    if (position) {
        return await new Promise((resolve, reject) => {
            db.dbConnector.all('SELECT * FROM clock_face WHERE id=?', position.position_id, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows[0]);
            });
        });
    } else {
        return null;
    }
}

async function updatePositionLocations(position, locationID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all(`INSERT INTO position_locations (location_id, position_id) VALUES (?, ?) ON CONFLICT(location_id) DO UPDATE SET position_id=?`,[
            locationID,
            position,
            position
        ], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

module.exports = {
    updateClockPosition,
    updatePositionLocations,
    getClockPositionLocationFromLocationID,
    getAllClockPositions,
    getClockPositionFromID,
    getClockPositionFromLocationID
}
