const sqlite = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');

const db = new sqlite.Database(process.env.DATABASE_NAME, (err) => {
    if (err) {
        return console.error(err.message);
    }  console.log('Connected to the SQLite database.');
});

let files = fs.readdirSync(__dirname + '/migrations/');
files.sort((a, b) => {
    a = parseInt(a.slice(1, a.indexOf("_")));
    b = parseInt(b.slice(1, b.indexOf("_")));
    return +a - +b;
});


db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    // files.forEach((file) => {
    //     const sqlArray = fs.readFileSync("/migrations/" + file)
    //         .toString()
    //         .split("**");
    //     sqlArray.forEach((query) => {
    //         db.run(query, (err) => {
    //             if(err) throw err;
    //         });
    //     })
    // });
    // db.run("COMMIT");

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