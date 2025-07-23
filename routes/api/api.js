const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const authenticateToken = require("../../handlers/authHandler");
const passport = require("passport");
const pocketWatchHandler = require("../../handlers/pocketWatchHandler");
const path = require("path");

router.all('/health', async function (req, res, next) {
    return res.status(200).json({ message: 'API up and running.' });
});

router.post('/login', async function (req, res, next) {
    passport.authenticate('local', (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        req.login(user, {session: false}, err => {
            if (err) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            const token = jwt.sign(user.id, process.env.JWT_SECRET);
            return res.json({ token })
        })
    })
    (req, res);
});

router.post('/updateUserLocation', authenticateToken, async function (req, res, next) {
    console.log("User location update received.");
    const userID = req.userID;
    const userLoc = req.body.location;
    const locations = await db.getAllLocations();
    await db.updateUserLocationLog(userID, userLoc.latitude, userLoc.longitude);

    for (let location of locations) {
        if (isUserWithinLocation(userLoc.latitude, userLoc.longitude, location.latitude, location.longitude, location.radius)) {
            await db.updateUserLocation(userID, location.id).catch(() =>{
                return res.status(500);
            });
            return res.status(202).json({ message: 'User location updated.' });
        }
    }

    const defaultLocation = await db.getDefaultLocation();
    await db.updateUserLocation(userID, defaultLocation.id).catch(() =>{
        return res.status(500);
    });
    return res.status(202).json({ message: 'User location updated.' });
});

router.get('/createPocketWatch', authenticateToken, async function (req, res, next) {
    await pocketWatchHandler.createPocketWatchImage();
    res.status(200)
        .sendFile(path.join(__dirname, '../../public/images/GENERATED-pocket-watch-clock-face.png'));
})

function isUserWithinLocation(userLat, userLong, locationLat, locationLong, radius) {
    return getDistanceFromLatLonInM(userLat, userLong, locationLat, locationLong) <= radius;
}

// From https://stackoverflow.com/a/27943
function getDistanceFromLatLonInM(userLat, userLong, locationLat, locationLong) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(locationLat-userLat);  // deg2rad below
    var dLon = deg2rad(locationLong-userLong);
    var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(locationLat)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d * 1000; // Convert to m
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

module.exports = router;
