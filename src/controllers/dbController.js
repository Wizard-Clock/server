const sqlite = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const migrationsDir = path.normalize(appRoot + '/migrations/');
let dbConnector;

createDB();

async function createDB() {
    const dbDir = path.normalize(appRoot + '/db/');
    if (!fs.existsSync(dbDir)){
        fs.mkdirSync(dbDir);
    }

    const dbName = (process.env.DATABASE_NAME === ":memory:" ? "" : dbDir) + process.env.DATABASE_NAME;
    dbConnector = new sqlite.Database(dbName, (err) => {
        if (err) {
            return console.error(err.message);
        }  console.log('Connected to the SQLite database.');
    });
    await initializeDB();
}

async function initializeDB() {
    let files = fs.readdirSync(migrationsDir);
    files.sort((a, b) => {
        a = parseInt(a.slice(1, a.indexOf("_")));
        b = parseInt(b.slice(1, b.indexOf("_")));
        return +a - +b;
    });

    dbConnector.serialize(() => {
        dbConnector.run("BEGIN TRANSACTION");
        files.forEach((file) => {
            const sqlArray = fs.readFileSync(migrationsDir + file)
                .toString()
                .split("**");
            sqlArray.forEach((query) => {
                dbConnector.run(query, (err) => {
                    if(err) throw err;
                });
            })
        });

        let salt = crypto.randomBytes(16);
        dbConnector.run(`INSERT OR IGNORE INTO users (id,username, hashed_password, salt, isFollower)VALUES (?, ?, ?, ?, ?)`, [
            1,
            'admin',
            crypto.pbkdf2Sync('admin', salt, 310000, 32, 'sha256'),
            salt,
            'false'
        ]);
        dbConnector.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id)VALUES (1, 1)`);
        dbConnector.run(`INSERT OR IGNORE INTO user_location (user_id, location_id)VALUES (1, 1)`);
        dbConnector.run(`DELETE FROM user_location_log`);
        dbConnector.run("COMMIT");
    });

    setInterval(async () => {
        dbConnector.run(`DELETE FROM user_location_log`);
    }, 86400000);
}

module.exports = {
    dbConnector,
    createDB
};
