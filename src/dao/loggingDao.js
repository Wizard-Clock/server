const db = require("../controllers/dbController");

async function updateUserLocationLog(userID, latitude, longitude) {
    return await new Promise((resolve, reject) => {
        db.all(`INSERT INTO user_location_log (user_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`, [
            userID,
            latitude,
            longitude,
            new Date().toISOString()
        ], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    })
}

async function getUserLocationLog(userID) {
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM user_location_log WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function clearUserLocationLog(userID) {
    return await new Promise((resolve, reject) => {
        db.all('DELETE FROM user_location_log WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

module.exports = {
    updateUserLocationLog,
    getUserLocationLog,
    clearUserLocationLog
}
