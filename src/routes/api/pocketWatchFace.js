const express = require('express');
const router = express.Router();
const clockFaceDAO = require("../../dao/clockFaceDao");
const clockFaceController =  require("../../controllers/clockFaceController");
const authenticateToken = require("../../controllers/authController");

router.get('/', authenticateToken, async function (req, res, next) {
    // Get all Clock Face Postions + Name;
    const clockPositions = await clockFaceDAO.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await clockFaceController.getAllUsersClockFacePositions();

    res.render('pocketWatch', {
        title: 'Pocket Watch',
        clockPositions: clockPositions,
        usersClockPosition:usersClockPosition,
        headerAuth:req.headers['authorization'].slice(6).trim()});
})

router.get('/faceRefresh', authenticateToken, async function (req, res, next) {
    let clockPositions = await clockFaceDAO.getAllClockPositions();
    let usersClockPositions = await clockFaceController.getAllUsersClockFacePositions();
    res.json({clockPositions, usersClockPositions});
})

module.exports = router;