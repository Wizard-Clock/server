const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const clockFaceDAO = require("../../dao/clockFaceDao");
const authenticateToken = require("../../handlers/authHandler");

router.get('/', authenticateToken, async function (req, res, next) {
    // Get all Clock Face Postions + Name;
    const clockPositions = await clockFaceDAO.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await db.getAllUsersClockFacePositions();

    res.render('pocketWatch', {
        title: 'Pocket Watch',
        clockPositions: clockPositions,
        usersClockPosition:usersClockPosition,
        headerAuth:req.headers['authorization'].slice(6).trim()});
})

router.get('/faceRefresh', authenticateToken, async function (req, res, next) {
    let usersClockPositions = await db.getAllUsersClockFacePositions();
    let clockPositions = await clockFaceDAO.getAllClockPositions();
    res.json({clockPositions, usersClockPositions});
})

module.exports = router;