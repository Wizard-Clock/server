const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const wizardDAO = require("../../dao/wizardDao");
const roleDAO = require("../../dao/roleDao");
const authenticateToken = require("../../handlers/authHandler");
const {formidable} = require("formidable");

/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await wizardDAO.getUserFromID(req.userID);
    const userRole = await roleDAO.getRoleFromUserID(req.userID);

    // Get all Clock Face Postions + Name;
    const clockPositions = await db.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await db.getAllUsersClockFacePositions();

    const clockPositionsWithLocation = [];
    for (let cPosition of clockPositions) {
        let locationsPerPosition = await db.getAllLocationsForClockPosition(cPosition.id);
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
        clockPositionLocations: clockPositionsWithLocation
    });
});

router.get('/standalone', authenticateToken, async function (req, res, next) {
    // Get all Clock Face Postions + Name;
    const clockPositions = await db.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await db.getAllUsersClockFacePositions();

    res.render('standaloneClock', {
        title: 'Clock',
        clockPositions: clockPositions,
        usersClockPosition:usersClockPosition});
});

router.get('/updateToClock', authenticateToken, async function (req, res, next) {
    let clockPositions = await db.getAllClockPositions();
    let usersClockPositions = await db.getAllUsersClockFacePositions();
    res.json({clockPositions, usersClockPositions});
})

router.post('/editClockPosition', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, clockPosition) => {
        const clockPositionObj = {
            id: clockPosition.id[0],
            name: clockPosition.name[0].toUpperCase()
        }
        await db.updateClockPosition(clockPositionObj);
        res.send({success: true});
    });
})

module.exports = router;
