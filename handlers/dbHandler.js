const sqlite = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const migrationsDir = require('path').dirname(require.main.filename) + '/migrations/';

const sqlite_inst = new sqlite.Database(process.env.DATABASE_NAME, (err) => {
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
    sqlite_inst.run(`INSERT OR IGNORE INTO users (id,username, hashed_password, salt) VALUES (?, ?, ?, ?)`, [
        1,
        'admin',
        crypto.pbkdf2Sync('admin', salt, 310000, 32, 'sha256'),
        salt
    ]);
    sqlite_inst.run(`INSERT INTO user_location (user_id, location_id) VALUES (1, 1)`);
    salt = crypto.randomBytes(16);
    sqlite_inst.run(`INSERT OR IGNORE INTO users (id,username, hashed_password, salt) VALUES (?, ?, ?, ?)`, [
        2,
        'user',
        crypto.pbkdf2Sync('user', salt, 310000, 32, 'sha256'),
        salt
    ]);
    sqlite_inst.run(`INSERT INTO user_location (user_id, location_id) VALUES (2, 1)`);
    sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(1,1)`);
    sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(2,2)`);
    sqlite_inst.run(`INSERT OR IGNORE INTO locations (name, latitude, longitude, radius, description) VALUES (?, ?, ?, ?, ?)`, [
        "The Burrow",
        "41.221007",
        "-96.627713",
        100,
        "The home of the creator.",
    ]);
    sqlite_inst.run("COMMIT");
});

// User Management
async function addUser(username, password, role) {
    let salt = crypto.randomBytes(16);
    await sqlite_inst.run(`INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)`, [
        username,
        crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
        salt
    ]);

    let userID, roleID;
    await getUserFromName(username).then(value => userID = value.id);
    await getRoleFromRoleName(role).then(value => roleID = value.id);
    await sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(?, ?)`, [
        userID,
        roleID
    ]);

    const defaultLocation = await getDefaultLocation();
    await updateUserLocation(userID, defaultLocation.id);
}

async function updateUser(user) {
    const oldUser = await getUserFromID(user.id);

    if (oldUser.username !== user.username) {
        await sqlite_inst.run(`UPDATE users SET username=? WHERE id=?`, [user.username, user.id], (err, rows) => {})
    }

    if (user.password !== "") {
        let salt = crypto.randomBytes(16);
        await sqlite_inst.run(`UPDATE users SET hashed_password=?, salt=? WHERE id=?`, [
            crypto.pbkdf2Sync(user.password, salt, 310000, 32, 'sha256'),
            salt,
            user.id
        ], (err, rows) => {})
    }

    let updateRole = false;
    await getRoleFromUserID(user.id).then(value => updateRole = value.role !== user.role);
    if (updateRole) {
        let roleID;
        await getRoleFromRoleName(user.role).then(value => roleID = value.id);
        return await new Promise((resolve, reject) => {
            sqlite_inst.run(`UPDATE user_roles SET role_id=? WHERE user_id=?`, [roleID, user.id], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }

}

async function deleteUser(userID) {
    await sqlite_inst.run(`DELETE FROM user_roles WHERE user_id=?`, userID, (err, rows) => {});
    return await new Promise((resolve, reject) => {
        sqlite_inst.run(`DELETE FROM users WHERE id=?`, userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllUsers() {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM users', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getUserFromID(user_id) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM users WHERE id=?', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getUserFromName(name) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM users WHERE username=?', name, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

// Role Management
async function getAllRoles() {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM roles', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getRoleFromUserID(user_id) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM roles WHERE id=(SELECT role_id FROM user_roles WHERE user_id=?)', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getRoleFromRoleName(roleName) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT * FROM roles WHERE role=?', roleName, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
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

async function getClockPositionFromLocationID(locationID) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT position_id FROM position_locations WHERE location_id=?', locationID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
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

async function updateUserLocation(userID, locationID) {
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



module.exports = {
    addUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserFromID,
    getRoleFromUserID,
    getAllRoles,
    getDefaultLocation,
    getAllLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    getClockPositionFromLocationID,
    getAllClockPositions,
    updateUserLocation,
    sqlite_inst
};