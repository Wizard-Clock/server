const express = require('express');
const router = express.Router();
const db = require("../handlers/dbHandler");
const authenticateToken = require("../handlers/authHandler");


/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const userName = await db.getUserNameFromUserID(req.userID);
    const userRole = await db.getRoleNameFromUserID(req.userID);
    res.render('index', {title: 'Home', username: userName[0].username, role: userRole[0].role});
});

module.exports = router;
