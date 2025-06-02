const sqlite = require('sqlite3');
const crypto = require('crypto');
const db = new sqlite.Database(":memory:");//change for permanent db

db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, email TEXT, hashed_password BLOB, salt BLOB)`);

    let salt = crypto.randomBytes(16);
    db.run(`INSERT INTO users (username, email, hashed_password, salt) VALUES (?, ?, ?, ?)`, [
        'admin',
        'admin@owl.post',
        crypto.pbkdf2Sync('admin', salt, 310000, 32, 'sha256'),
        salt
    ]);
    db.run("COMMIT");
});

module.exports = db;