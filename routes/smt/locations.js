const express = require('express');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");

/* GET home page. 
* website: https://www.freemaptools.com/radius-around-point.htm
* */

router.get('/', authenticateToken, async function (req, res, next) {
    const user = await db.getUserFromID(req.userID);
    const userRole = await db.getRoleFromUserID(req.userID);
    let locations = await db.getAllLocations();
    for (let location of locations) {
        const clockPosition = await db.getClockPositionFromLocationID(location.id);
        location.clockPosition = clockPosition.positions;
    }
    res.render('locations', {
        title: 'Locations',
        username: user.username,
        role: userRole.role,
        locations: locations,
        positions: await db.getAllClockPositions()});
});

module.exports = router;
