const db = require("../controllers/dbController");
const crypto = require("crypto");

async function addUser(username, password, role, reportingMethod, isFollower) {
    let salt = crypto.randomBytes(16);
    await db.dbConnector.run(`INSERT INTO users (username, hashed_password, salt, reportingMethod, isFollower) VALUES (?, ?, ?, ?, ?)`, [
        username,
        crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
        salt,
        reportingMethod,
        isFollower.toString()
    ]);
}

async function updateUserUsername(userID, newUsername) {
    await db.dbConnector.run(`UPDATE users SET username=? WHERE id=?`, [newUsername, userID], (err, rows) => {})
}

async function updateUserPassword(userID, newPassword) {
    let salt = crypto.randomBytes(16);
    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`UPDATE users SET hashed_password=?, salt=? WHERE id=?`, [
            crypto.pbkdf2Sync(newPassword, salt, 310000, 32, 'sha256'), salt, userID], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        })
    });
}

async function updateUserReportingMethod(userID, newReportingMethod) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`UPDATE users SET reportingMethod=? WHERE id=?`, [newReportingMethod, userID], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        })
    });
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

async function getUserClockPositionInfoFromUserID(userID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM user_position WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function setUserClockPosition(userID, clockPositionID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all(`INSERT INTO user_position (user_id, position_id) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET position_id=?`, [
            userID,
            clockPositionID,
            clockPositionID
        ], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    })
}

async function deleteUserClockPosition(userID) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.run(`DELETE FROM user_position WHERE user_id=?`, userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    })
}

async function updateUserClockPosition(userID, clockPositionID) {
    return setUserClockPosition(userID, clockPositionID);
}

module.exports = {
    addUser,
    updateUserUsername,
    updateUserPassword,
    updateUserReportingMethod,
    updateUserFollowerStatus,
    deleteUser,
    deleteUserClockPosition,
    getAllUsers,
    getUserFromID,
    getUserFromName,
    getUserClockPositionInfoFromUserID,
    updateUserClockPosition,
    setUserClockPosition,
}