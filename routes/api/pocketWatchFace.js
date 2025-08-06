const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");

router.get('/', authenticateToken, async function (req, res, next) {
    // Get all Clock Face Postions + Name;
    const clockPositions = await db.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await db.getAllUsersClockFacePositions();

    res.render('pocketWatch', {
        title: 'Pocket Watch',
        clockPositions: clockPositions,
        usersClockPosition:usersClockPosition});
})

router.get('/faceRefresh', authenticateToken, async function (req, res, next) {
    let clockPositions = await db.getAllClockPositions();
    let usersClockPositions = await db.getAllUsersClockFacePositions();
    res.json({clockPositions, usersClockPositions});
})

module.exports = router;