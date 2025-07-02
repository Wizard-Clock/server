const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");
const {formidable} = require("formidable");

/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
    const user = await db.getUserFromID(req.userID);
    const userRole = await db.getRoleFromUserID(req.userID);

    // Get all Clock Face Postions + Name;
    const clockPositions = await db.getAllClockPositions();

    // Get all User Locations on Clock
    const usersClockPosition= await db.getAllUsersClockFacePositions();

    res.render('clock', {
        title: 'Clock',
        username: user.username,
        role: userRole.role,
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
