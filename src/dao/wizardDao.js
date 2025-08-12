const db = require("../controllers/dbController");
const crypto = require("crypto");

async function addUser(username, password, role, isFollower) {
    let salt = crypto.randomBytes(16);
    await db.dbConnector.run(`INSERT INTO users (username, hashed_password, salt, isFollower) VALUES (?, ?, ?, ?)`, [
        username,
        crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
        salt,
        isFollower.toString()
    ]);
}

async function updateUserUsername(userID, newUsername) {
    await db.dbConnector.run(`UPDATE users SET username=? WHERE id=?`, [newUsername, userID], (err, rows) => {})
}

async function updateUserPassword(userID, newPassword) {
    let salt = crypto.randomBytes(16);
    await db.dbConnector.run(`UPDATE users SET hashed_password=?, salt=? WHERE id=?`, [
        crypto.pbkdf2Sync(newPassword, salt, 310000, 32, 'sha256'),
        salt,
        userID
    ], (err, rows) => {})
}

async function updateUserFollowerStatus(userID, followVal) {
    await db.dbConnector.run(`UPDATE users SET isFollower=? WHERE id=?`,
        [followVal, userID], () => {});
}

async function deleteUser(userID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`DELETE FROM users WHERE id=?`, userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllUsers() {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM users', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getUserFromID(user_id) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM users WHERE id=?', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getUserFromName(name) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM users WHERE username=?', name, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getUserLocationFromUserID(userID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM user_location WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function setUserLocation(userID, locationID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all(`INSERT INTO user_location (user_id, location_id) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET location_id=?`, [
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

async function updateUserLocation(userID, locationID) {
    return setUserLocation(userID, locationID);
}

module.exports = {
    addUser,
    updateUserUsername,
    updateUserPassword,
    updateUserFollowerStatus,
    deleteUser,
    getAllUsers,
    getUserFromID,
    getUserFromName,
    getUserLocationFromUserID,
    updateUserLocation,
    setUserLocation
}