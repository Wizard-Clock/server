const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../../handlers/dbHandler");
const dobby = require("../../handlers/discordHandler");
const authenticateToken = require("../../handlers/authHandler");
const passport = require("passport");
const pocketWatchHandler = require("../../handlers/pocketWatchHandler");
const path = require("path");
const settingsService = require("../../handlers/serverSettingHandler").default.getInstance();

router.all('/health', async function (req, res, next) {
    return res.status(200).json({ message: 'API up and running.' });
});

router.post('/login', async function (req, res, next) {
    passport.authenticate('local', (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        req.login(user, {session: false}, async err => {
            if (err) {
                return res.status(400).json({message: 'Invalid credentials.'});
            }

            let userRole = await db.getRoleFromUserID(user.id);
            if (userRole.role === 'child') {
                return res.status(401).json({message: 'Underage magic detected, unable to login child.'});
            }
            
            const token = jwt.sign(user.id, process.env.JWT_SECRET);
            return res.json({token})
        })
    })
    (req, res);
});

router.post('/updateUserLocation', authenticateToken, async function (req, res, next) {
    console.log("User location update received.");
    const userID = req.userID;
    const userLoc = req.body.location;
    const followers = [];
    const locations = await db.getAllLocations();

    await db.getFollowerInfoFromLeadID(userID).then(results => {
        for (let followInfo of results) {
            followers.push(followInfo.follower_id);
        }
    });
    await db.updateUserLocationLog(userID, userLoc.latitude, userLoc.longitude);
    if (followers.length > 0) {
        for (let idx = 0; idx < followers.length; idx++) {
            await db.updateUserLocationLog(followers[idx], userLoc.latitude, userLoc.longitude);
        }
    }

    for (let location of locations) {
        if (isUserWithinLocation(userLoc.latitude, userLoc.longitude, location.latitude, location.longitude, location.radius)) {
            await fireLocationUpdate(userID, location.id);
            await db.updateUserLocation(userID, location.id).catch(() =>{
                return res.status(500);
            });
            if (followers.length > 0) {
                await updateFollowersLocations(followers, location.id);
            }
            return res.status(202).json({ message: 'User location updated.' });
        }
    }

    const defaultLocation = await db.getDefaultLocation();
    await fireLocationUpdate(userID, defaultLocation.id);
    await db.updateUserLocation(userID, defaultLocation.id).catch(() =>{
        return res.status(500);
    });
    if (followers.length > 0) {
        await updateFollowersLocations(followers, defaultLocation.id);
    }
    return res.status(202).json({ message: 'User location updated.' });
});

router.get('/createPocketWatch', authenticateToken, async function (req, res, next) {
    await pocketWatchHandler.createPocketWatchImage().then(() => {
        let clockCheck = setInterval(() => {
            if (pocketWatchHandler.isPocketWatchFinished()) {
                res.status(200)
                    .sendFile(path.join(__dirname, '../../public/images/GENERATED-pocket-watch-clock-face.png'));
                clearInterval(clockCheck);
            }
        }, 2000);
    });
})

async function updateFollowersLocations(followers, locationID) {
    for (let idx = 0; idx < followers.length; idx++) {
        await fireLocationUpdate(followers[idx], locationID);
        await db.updateUserLocation(followers[idx], locationID);
    }
}

async function fireLocationUpdate(userID, locationID) {
    let clockPosition = await db.getClockPositionFromLocationID(locationID);
    await db.getClockPositionFromUserID(userID).then((result) => {
        if (settingsService.getSettingValue("notifyEveryPositionUpdate") === "true") {
            db.getUserFromID(userID).then((result) => {
                dobby.notifyLocationChange(result.username, clockPosition.name)
            })
        } else {
            if (result.face_position !== clockPosition.face_position) {
                db.getUserFromID(userID).then((result) => {
                    dobby.notifyLocationChange(result.username, clockPosition.name)
                })
            }
        }
    });
}

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
