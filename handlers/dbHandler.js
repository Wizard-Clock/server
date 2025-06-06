const sqlite = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const { dirname } = require('path');
const migrationsDir = dirname(require.main.filename) + '/migrations/';

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

async function getRoleNameFromUserID(user_id) {
    return await new Promise((resolve, reject) => {
        sqlite_inst.all('SELECT role FROM roles where id=(SELECT role_id FROM user_roles where user_id=?)', user_id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

module.exports = {
    getRoleNameFromUserID,
    sqlite_inst
};