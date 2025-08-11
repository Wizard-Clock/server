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

module.exports = sqlite_inst;
