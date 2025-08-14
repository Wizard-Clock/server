require('dotenv').config()
process.env.DATABASE_NAME = ":memory:"
const db = require("../src/controllers/dbController");

exports.mochaHooks = {
    beforeAll(done) {
        done();
    }
};
