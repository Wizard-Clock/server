const db = require("../handlers/dbHandler");
const roleDAO = require("../dao/roleDao");
const followerDAO = require("../dao/followerDao");
const clockFaceDAO = require("../dao/clockFaceDao");
const locationDAO = require("../dao/locationDAO");
const crypto = require("crypto");

async function addUser(username, password, role, isFollower, leadID) {
    let salt = crypto.randomBytes(16);
    await db.run(`INSERT INTO users (username, hashed_password, salt, isFollower) VALUES (?, ?, ?, ?)`, [
        username,
        crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
        salt,
        isFollower.toString()
    ]);

    let userID;
    await getUserFromName(username).then(value => userID = value.id);
    await roleDAO.addUserToRole(userID, role);

    const defaultLocation = await locationDAO.getDefaultLocation();
    await setUserLocation(userID, defaultLocation.id);

    if (isFollower) {
        await followerDAO.applyFollowLink(userID, leadID);
    }
}

async function updateUser(user) {
    const oldUser = await getUserFromID(user.id);

    if (oldUser.username !== user.username) {
        await db.run(`UPDATE users SET username=? WHERE id=?`, [user.username, user.id], (err, rows) => {})
    }

    if (user.password !== "") {
        let salt = crypto.randomBytes(16);
        await db.run(`UPDATE users SET hashed_password=?, salt=? WHERE id=?`, [
            crypto.pbkdf2Sync(user.password, salt, 310000, 32, 'sha256'),
            salt,
            user.id
        ], (err, rows) => {})
    }

    if (user.isFollower === "true") {
        await followerDAO.applyFollowLink(user.id, user.leadID);
    } else {
        await followerDAO.removeFollowLink(user.id);
    }
    await db.run(`UPDATE users SET isFollower=? WHERE id=?`,
        [user.isFollower, user.id], () => {});

    await roleDAO.updateUserRole(user.name, user.role);
}

async function deleteUser(userID) {
    await roleDAO.removeUserFromRole(userID);
    await followerDAO.removeFollowLink(userID);
    return await new Promise((resolve, reject) => {
        db.run(`DELETE FROM users WHERE id=?`, userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllUsers() {
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getUserFromID(user_id) {
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users WHERE id=?', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getUserFromName(name) {
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users WHERE username=?', name, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getUserLocationFromUserID(userID) {
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM user_location WHERE user_id=?', userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function setUserLocation(userID, locationID) {
    return await new Promise((resolve, reject) => {
        db.all(`INSERT INTO user_location (user_id, location_id) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET location_id=?`, [
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

async function getAllUsersClockFacePositions() {
    const users = await getAllUsers();
    let usersClockPosition = [];
    for (let user of users) {
        let userLocation = await getUserLocationFromUserID(user.id);
        let position = await clockFaceDAO.getClockPositionFromUserLocation(userLocation);
        let wizard= {name: user.username, position: position};
        usersClockPosition.push(wizard);
    }
    return usersClockPosition;
}

module.exports = {
    addUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserFromID,
    getUserFromName,
    getUserLocationFromUserID,
    updateUserLocation,
    getAllUsersClockFacePositions
}