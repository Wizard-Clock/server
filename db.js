const sqlite = require('sqlite3');
const crypto = require('crypto');
const db = new sqlite.Database(":memory:");//change for permanent db

db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, hashed_password BLOB, salt BLOB)`);

    let salt = crypto.randomBytes(16);
    db.run(`INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)`, [
        'admin',
        crypto.pbkdf2Sync('admin', salt, 310000, 32, 'sha256'),
        salt
    ]);
    db.run("COMMIT");
});

module.exports = db;