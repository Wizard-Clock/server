const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");

/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await db.getUserFromID(req.userID);
    const userRole = await db.getRoleFromUserID(req.userID);
    const clockPositions = await db.getAllClockPositions();

    const positionNames = [];
    for (let position of clockPositions) {
        positionNames.push(position.name);
    }

    res.render('clock', {
        title: 'Clock',
        username: user.username,
        role: userRole.role,
        positionNames: positionNames});
});

module.exports = router;
