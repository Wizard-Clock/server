const db = require("../handlers/dbHandler");

async function addUserToRole(userID, role) {
    let roleID
    await getRoleFromRoleName(role).then(value => roleID = value.id);
    await db.sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(?, ?)`, [
        userID,
        roleID
    ]);
}

async function getAllRoles() {
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.all('SELECT * FROM roles', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function getRoleFromUserID(user_id) {
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.all('SELECT * FROM roles WHERE id=(SELECT role_id FROM user_roles WHERE user_id=?)', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

async function getRoleFromRoleName(roleName) {
    return await new Promise((resolve, reject) => {
        db.sqlite_inst.all('SELECT * FROM roles WHERE role=?', roleName, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

module.exports = {
    addUserToRole,
    getAllRoles,
    getRoleFromRoleName,
    getRoleFromUserID
}