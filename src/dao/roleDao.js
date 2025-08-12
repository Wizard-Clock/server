const db = require("../controllers/dbController");

async function addUserToRole(userID, role) {
    let roleID
    await getRoleFromRoleName(role).then(value => roleID = value.id);
    await db.dbConnector.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(?, ?)`, [
        userID,
        roleID
    ]);
}

async function getAllRoles() {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM roles', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getRoleFromUserID(user_id) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM roles WHERE id=(SELECT role_id FROM user_roles WHERE user_id=?)', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getRoleFromRoleName(roleName) {
    return await new Promise((resolve, reject) => {
        db.dbConnector.all('SELECT * FROM roles WHERE role=?', roleName, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function updateUserRole(userID, roleToAssign) {
    let prevRole = await getRoleFromUserID(userID);
    if (roleToAssign !== prevRole) {
        let roleID;
        await getRoleFromRoleName(roleToAssign).then(value => roleID = value.id);

        return await new Promise((resolve, reject) => {
            db.dbConnector.run(`UPDATE user_roles SET role_id=? WHERE user_id=?`, [roleID, userID], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
}

async function removeUserFromRole(userID) {
    await db.dbConnector.run(`DELETE FROM user_roles WHERE user_id=?`, userID,
        (err, rows) => {});
}

module.exports = {
    addUserToRole,
    updateUserRole,
    removeUserFromRole,
    getAllRoles,
    getRoleFromRoleName,
    getRoleFromUserID
}