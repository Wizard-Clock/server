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
    salt = crypto.randomBytes(16);
    sqlite_inst.run(`INSERT OR IGNORE INTO users (id,username, hashed_password, salt) VALUES (?, ?, ?, ?)`, [
        2,
        'user',
        crypto.pbkdf2Sync('user', salt, 310000, 32, 'sha256'),
        salt
    ]);
    sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(1,1)`);
    sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(2,2)`);
    sqlite_inst.run("COMMIT");
});

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
    return await new Promise((resolve, reject) => {
        sqlite_inst.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES(?, ?)`, [userID, roleID], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    })
}

async function deleteUser(userID) {
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

module.exports = {
    getUserFromID,
    addUser,
    deleteUser,
    getAllUsers,
    getAllRoles,
    getRoleFromUserID,
    sqlite_inst
};