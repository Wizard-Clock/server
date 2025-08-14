require('dotenv').config()
process.env.DATABASE_NAME = ":memory:"

exports.mochaHooks = {
    beforeAll(done) {
        require("../src/controllers/dbController");
        done();
    }
};
