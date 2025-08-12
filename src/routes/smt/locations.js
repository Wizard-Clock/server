const express = require('express');
const router = express.Router();
const wizardDAO = require("../../dao/wizardDao");
const locationDAO = require("../../dao/locationDAO");
const clockFaceDAO = require("../../dao/clockFaceDao");
const roleDAO = require("../../dao/roleDao");
const locationController =  require("../../controllers/locationController");
const authenticateToken = require("../../controllers/authController");
const settingsService = require("../../controllers/serverSettingController").default.getInstance();
const {formidable} = require("formidable");
const LATITUDE_REGEX = "^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$";
const LONGITUDE_REGEX = "^(\\+|-)?(?:180(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\\.[0-9]{1,6})?))$";

/* GET home page. 
* website: https://www.freemaptools.com/radius-around-point.htm
* */

router.get('/', authenticateToken, async function (req, res, next) {
    const userRole = await roleDAO.getRoleFromUserID(req.userID);
    if (userRole.role !== "admin") {
        return res.redirect("/clock");
    }
    const user = await wizardDAO.getUserFromID(req.userID);
    let locations = await locationDAO.getAllLocations();
    for (let location of locations) {
        const clockPosition = await clockFaceDAO.getClockPositionFromLocationID(location.id);
        if (clockPosition) {
            location.clockPosition = clockPosition.face_position;
            location.clockPositionName = clockPosition.name;
        }
    }
    res.render('locations', {
        title: 'Locations',
        username: user.username,
        role: userRole.role,
        locations: locations,
        positions: await clockFaceDAO.getAllClockPositions(),
        serverVersion: settingsService.getSettingValue("serverVersion")
    });
});

router.post('/addLocation', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, location) => {
        const locationObj = {
            name: location.name[0],
            clockPosition: location.clockPosition ? location.clockPosition[0] : "",
            latitude: location.latitude[0],
            longitude: location.longitude[0],
            radius: location.radius[0],
            description: location.description ? location.description[0] : "",
        }
        await locationController.addLocationInfo(locationObj);
        res.send({success: true});
    });
})

router.post('/editLocation', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, location) => {
        const locationObj = {
            id: location.id[0],
            name: location.name[0],
            clockPosition: location.clockPosition ?  location.clockPosition[0] : "",
            latitude: location.latitude ? location.latitude[0] : "0",
            longitude: location.longitude ? location.longitude[0] : "0",
            radius: location.radius ? location.radius[0] : 0,
            description: location.description ? location.description[0] : "",
        }
        await locationController.updateLocationInfo(locationObj);
        res.send({success: true});
    });
})

router.post('/deleteLocation', authenticateToken, async function (req, res, next) {
    await locationController.deleteLocationInfo(req.body.id);
    res.send({success: true});
})

module.exports = router;
