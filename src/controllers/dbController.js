const sqlite = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const migrationsDir = path.normalize(appRoot + '/migrations/');
let dbConnector;

createDB().then(() => dbConnector.run(`DELETE FROM user_location_log`));

async function createDB() {
    const dbDir = path.normalize(appRoot + '/db/');
    if (!fs.existsSync(dbDir)){
        fs.mkdirSync(dbDir);
    }

    const dbName = (process.env.DATABASE_NAME === ":memory:" ? "" : dbDir) + process.env.DATABASE_NAME;
    dbConnector = new sqlite.Database(dbName, (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('[db] Connected to the SQLite database.');
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

    await dbConnector.serialize(() => {
        console.log('[db] Running migrations...');
        dbConnector.run("BEGIN TRANSACTION");
        files.forEach((file) => {
            console.log('[db] Migration: ', file);
            const sqlArray = fs.readFileSync(migrationsDir + file)
                .toString()
                .split("**");
            sqlArray.forEach((query) => {
                dbConnector.run(query, (err) => {
                    if(err) throw err;
                });
            })
        });
        dbConnector.run("COMMIT");
    });

    await dbConnector.all(`SELECT * FROM server_settings WHERE setting_name='adminInitialized'`, async (err, rows) => {
        if (rows && rows[0].value === 'false') {
            await initializeAdminUser();
        }
    });

    setInterval(async () => {
        dbConnector.run(`DELETE FROM user_location_log`);
    }, 86400000);
}

async function initializeAdminUser() {
    console.log('[db] Initialize default admin user.');
    await dbConnector.serialize(() => {
        dbConnector.run("BEGIN TRANSACTION");
        let salt = crypto.randomBytes(16);
        dbConnector.run(`INSERT OR IGNORE INTO users (id, username, hashed_password, salt, isFollower, reportingMethod) VALUES (?, ?, ?, ?, ?, ?)`, [
            1,
            'admin',
            crypto.pbkdf2Sync('admin', salt, 310000, 32, 'sha256'),
            salt,
            'false',
            'auto'
        ]);
        dbConnector.run(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1)`);
        dbConnector.run(`INSERT OR IGNORE INTO user_position (user_id, position_id) VALUES (1, 13)`);
        dbConnector.run(`UPDATE server_settings SET value='true' WHERE setting_name='adminInitialized'`);
        dbConnector.run("COMMIT");
    });
}

module.exports = {
    dbConnector
};
