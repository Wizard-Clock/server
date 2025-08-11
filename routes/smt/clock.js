const express = require('express');
const router = express.Router();
const wizardDAO = require("../../dao/wizardDao");
const locationDAO = require("../../dao/locationDAO");
const clockFaceDAO = require("../../dao/clockFaceDao");
const roleDAO = require("../../dao/roleDao");
const settingsService = require("../../handlers/serverSettingHandler").default.getInstance();
const authenticateToken = require("../../handlers/authHandler");
const {formidable} = require("formidable");

/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await wizardDAO.getUserFromID(req.userID);
    const userRole = await roleDAO.getRoleFromUserID(req.userID);

    // Get all Clock Face Postions + Name;
    const clockPositions = await clockFaceDAO.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await wizardDAO.getAllUsersClockFacePositions();

    const clockPositionsWithLocation = [];
    for (let cPosition of clockPositions) {
        let locationsPerPosition = await locationDAO.getAllLocationsForClockPosition(cPosition.id);
        let locationString = "";
        for (let location of locationsPerPosition) {
            locationString += location + ", ";
        }
        locationString = locationString.substring(0, locationString.length - 2);

        clockPositionsWithLocation.push({
            positionName: cPosition.name,
            locations: locationString.length === 0 ? "None" : locationString,
        });
    }

    res.render('clock', {
        title: 'Clock',
        username: user.username,
        role: userRole.role,
        clockPositions: clockPositions,
        usersClockPosition:usersClockPosition,
        clockPositionLocations: clockPositionsWithLocation,
        serverVersion: settingsService.getSettingValue("serverVersion")
    });
});

router.get('/standalone', authenticateToken, async function (req, res, next) {
    // Get all Clock Face Postions + Name;
    const clockPositions = await clockFaceDAO.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await wizardDAO.getAllUsersClockFacePositions();

    res.render('standaloneClock', {
        title: 'Clock',
        clockPositions: clockPositions,
        usersClockPosition:usersClockPosition});
});

router.get('/updateToClock', authenticateToken, async function (req, res, next) {
    let clockPositions = await clockFaceDAO.getAllClockPositions();
    let usersClockPositions = await wizardDAO.getAllUsersClockFacePositions();
    res.json({clockPositions, usersClockPositions});
})

router.post('/editClockPosition', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, clockPosition) => {
        const clockPositionObj = {
            id: clockPosition.id[0],
            name: clockPosition.name[0].toUpperCase()
        }
        await clockFaceDAO.updateClockPosition(clockPositionObj);
        res.send({success: true});
    });
})

module.exports = router;
