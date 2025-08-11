const db = require("../handlers/dbHandler");
const roleDAO = require("../dao/roleDao");
const crypto = require("crypto");

async function addUser(username, password, role, isFollower, leadID) {
    let salt = crypto.randomBytes(16);
    await db.sqlite_inst.run(`INSERT INTO users (username, hashed_password, salt, isFollower) VALUES (?, ?, ?, ?)`, [
        username,
        crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
        salt,
        isFollower.toString()
    ]);

    let userID;
    await getUserFromName(username).then(value => userID = value.id);
    await roleDAO.addUserToRole(userID, role);

    const defaultLocation = await getDefaultLocation();
    await setUserLocation(userID, defaultLocation.id);

    if (isFollower) {
        await applyFollowLink(userID, leadID);
    }
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

    await updateUserFollowStatus(user);
    await roleDAO.updateUserRole(user.name, user.role);
}

async function deleteUser(userID) {
    await roleDAO.removeUserFromRole(userID);
    await removeFollowLink(userID);
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.run(`DELETE FROM users WHERE id=?`, userID, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getAllUsers() {
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.all('SELECT * FROM users', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getUserFromID(user_id) {
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.all('SELECT * FROM users WHERE id=?', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getUserFromName(name) {
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.all('SELECT * FROM users WHERE username=?', name, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

module.exports = {
    addUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserFromID,
    getUserFromName
}