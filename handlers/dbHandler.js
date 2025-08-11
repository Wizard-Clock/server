const sqlite = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const migrationsDir = require('path').dirname(require.main.filename) + '/migrations/';

const dbDir = require('path').dirname(require.main.filename) + '/db/';
const dbName = (process.env.DATABASE_NAME === ":memory:" ? "" : dbDir) + process.env.DATABASE_NAME;
const sqlite_inst = new sqlite.Database(dbName, (err) => {
    if (err) {
        return console.error(err.message);
    }  console.log('Connected to the SQLite database.');
});

let files = fs.readdirSync(migrationsDir);
files.sort((a, b) => {
    a = parseInt(a.slice(1, a.indexOf("_")));
    b = parseInt(b.slice(1, b.indexOf("_")));
    return +a - +b;
});


sqlite_inst.serialize(() => {
    sqlite_inst.run("BEGIN TRANSACTION");
    files.forEach((file) => {
        const sqlArray = fs.readFileSync(migrationsDir + file)
            .toString()
            .split("**");
        sqlArray.forEach((query) => {
            sqlite_inst.run(query, (err) => {
                if(err) throw err;
            });
        })
    });

    let salt = crypto.randomBytes(16);
    sqlite_inst.run(`INSERT OR IGNORE INTO users (id,username, hashed_password, salt, isFollower) VALUES (?, ?, ?, ?, ?)`, [
        1,
        'admin',
        crypto.pbkdf2Sync('admin', salt, 310000, 32, 'sha256'),
        salt,
        'false'
    ]);
    sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(1,1)`);
    sqlite_inst.run(`INSERT OR IGNORE INTO user_location (user_id, location_id) VALUES (1, 1)`);
    sqlite_inst.run(`DELETE FROM user_location_log`);
    sqlite_inst.run("COMMIT");
});

setInterval(async () => {
    sqlite_inst.run(`DELETE FROM user_location_log`);
}, 86400000);

//Follow Management
async function updateUserFollowStatus(userInfo) {
    if (userInfo.isFollower === "true") {
        await applyFollowLink(userInfo.id, userInfo.leadID);
    } else {
        await removeFollowLink(userInfo.id);
    }
    await sqlite_inst.run(`UPDATE users SET isFollower=? WHERE id=?`, [userInfo.isFollower, userInfo.id], () => {});
}

async function applyFollowLink(followerID, leadID) {
    sqlite_inst.all(`INSERT INTO follower_link (follower_id, lead_id) VALUES (?, ?) ON CONFLICT(follower_id) DO UPDATE SET lead_id=?`,[
            followerID,
            leadID,
            leadID
        ]);
}

async function removeFollowLink(followerID) {
    await sqlite_inst.run(`DELETE FROM follower_link WHERE follower_id=?`, followerID, () => {});
}

async function getLeadFromFollowerID(followerID) {
    let leadID = await getLeadIDFromFollowerID(followerID);
    return getUserFromID(leadID.lead_id);
}

async function getLeadIDFromFollowerID(followerID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT lead_id FROM follower_link WHERE follower_id=?', followerID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getFollowerInfoFromLeadID(leadID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM follower_link WHERE lead_id=?', leadID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

// Location Management
async function addLocation(location) {
    await sqlite_inst.run(`INSERT INTO locations (name, latitude, longitude, radius, description) VALUES (?, ?, ?, ?, ?)`, [
        location.name,
        location.latitude,
        location.longitude,
        location.radius,
        location.description,
    ]);

    if (location.clockPosition) {
        let locationID;
        await getLocationFromName(location.name).then(value => locationID = value.id);
        return updatePositionLocations(location.clockPosition, locationID);
    }
}

async function updateLocation(location) {
    await sqlite_inst.run(`UPDATE locations SET name=?, latitude=?, longitude=?, radius=?, description=? WHERE id=?`, [
        location.name,
        location.latitude,
        location.longitude,
        location.radius,
        location.description,
        location.id
    ]);

    if (location.clockPosition) {
        return updatePositionLocations(location.clockPosition, location.id);
    } else {
        return await removeLocationFromPosition(location.id);
    }
}

async function deleteLocation(locationID) {
    await removeLocationFromPosition(locationID);

    return await new Promise((resolve, reject) => {
        sqlite_inst.run(`DELETE FROM locations WHERE id=?`, locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllLocations() {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM locations', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getLocationFromID(locationID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM locations WHERE id=?', locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
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

async function getLocationFromName(locationName) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM locations WHERE name=?', locationName, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getDefaultLocation() {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM locations WHERE isDefault=1', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

// Clock Face Management
async function updatePositionLocations(position, locationID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all(`INSERT INTO position_locations (location_id, position_id) VALUES (?, ?) ON CONFLICT(location_id) DO UPDATE SET position_id=?`,[
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

async function getClockPositionFromID(id) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM clock_face WHERE id=?', id,(err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getAllClockPositions() {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM clock_face', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function updateClockPosition(clockPosition) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.run(`UPDATE clock_face SET name=? WHERE id=?`, [
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

async function getUserLocationFromUserID(userID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM user_location WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getPositionLocationFromLocationID(locationID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM position_locations WHERE location_id=?', locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getAllLocationIDsFromPositionID(positionID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM position_locations WHERE position_id=?', positionID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getClockPositionFromUserID(user_id) {
    let location = await getUserLocationFromUserID(user_id);
    let positionLocation = await getPositionLocationFromLocationID(location.location_id);

    if (!positionLocation) {
        let locationID = await getDefaultLocation();
        return getClockPositionFromLocationID(locationID);
    } else {
        return getClockPositionFromID(positionLocation.position_id);
    }
}

async function getClockPositionFromLocationID(locationID) {
    let position = await getPositionLocationFromLocationID(locationID);

    if (position) {
        return await new Promise((resolve, reject) => {
            sqlite_inst.all('SELECT * FROM clock_face WHERE id=?', position.position_id, (err, rows) => {
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

// Misc Functions
async function removeLocationFromPosition(locationID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.run(`DELETE FROM position_locations WHERE location_id=?`, locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllUsersClockFacePositions() {
    const users = await getAllUsers();
    let usersClockPosition = [];
    for (let user of users) {
        let position = await getClockPositionFromUserID(user.id);
        let wizard= {name: user.username, position: position};
        usersClockPosition.push(wizard);
    }
    return usersClockPosition;
}

async function setUserLocation(userID, locationID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all(`INSERT INTO user_location (user_id, location_id) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET location_id=?`, [
            userID,
            locationID,
            locationID
        ], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    })
}

async function updateUserLocationLog(userID, latitude, longitude) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all(`INSERT INTO user_location_log (user_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`, [
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
        sqlite_inst.all('SELECT * FROM user_location_log WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function clearUserLog(userID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('DELETE FROM user_location_log WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function updateUserLocation(userID, locationID) {
    return setUserLocation(userID, locationID);
}

async function getAllServerSettings() {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM server_settings', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function updateServerSetting(serverSetting) {
    await sqlite_inst.run(`INSERT INTO server_settings (setting_name, value) VALUES (?, ?) ON CONFLICT(setting_name) DO UPDATE SET value=?`, [
        serverSetting.name,
        serverSetting.value,
        serverSetting.value
    ]);
}


async function updateAllServerSettings(serverSettingsList) {
    for (let serverSetting of serverSettingsList) {
        await updateServerSetting(serverSetting);
    }
}


module.exports = {
    getLeadFromFollowerID,
    getFollowerInfoFromLeadID,
    getDefaultLocation,
    getAllLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    getAllUsersClockFacePositions,
    getClockPositionFromLocationID,
    getClockPositionFromUserID,
    getAllLocationsForClockPosition,
    getAllClockPositions,
    updateClockPosition,
    updateUserLocation,
    updateUserLocationLog,
    getUserLocationLog,
    clearUserLog,
    updateAllServerSettings,
    getAllServerSettings,
    sqlite_inst
};