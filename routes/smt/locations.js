const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");

/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await db.getUserFromID(req.userID);
    const userRole = await db.getRoleFromUserID(req.userID);
    res.render('locations', {title: 'Locations', username: user.username, role: userRole.role});
});

module.exports = router;
