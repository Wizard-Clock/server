const express = require('express');
const router = express.Router();
const db = require("../handlers/dbHandler");
const authenticateToken = require("../handlers/authHandler");


/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await db.getUserFromID(req.userID);
    const userRole = await db.getRoleFromUserID(req.userID);
    res.render('index', {title: 'Home', username: user.username, role: userRole.role});
});

router.get("/wizards", authenticateToken, async function (req, res, next) {
    res.render('wizards',{wizards: await db.getAllUsers()});
});

module.exports = router;
