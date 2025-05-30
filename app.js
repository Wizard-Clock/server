import express from 'express';
import sqlite from 'sqlite3';
const app = express();
const db = new sqlite.Database(":memory:"); //remembrall.db
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
