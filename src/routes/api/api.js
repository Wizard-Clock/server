const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const wizardDAO = require("../../dao/wizardDao");
const locationDAO = require("../../dao/locationDAO");
const clockFaceDAO = require("../../dao/clockFaceDao");
const followerDAO = require("../../dao/followerDao");
const loggingDAO = require("../../dao/loggingDao");
const roleDAO = require("../../dao/roleDao");
const dobby = require("../../controllers/discordController");
const authenticateToken = require("../../controllers/authController");
const passport = require("passport");
const settingsService = require("../../controllers/serverSettingController").default.getInstance();

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

            let userRole = await roleDAO.getRoleFromUserID(user.id);
            if (userRole.role === 'child') {
                return res.status(401).json({message: 'Underage magic detected, unable to login child.'});
            }
            
            const token = jwt.sign(user.id, process.env.JWT_SECRET);
            return res.json({token})
        })
    })
    (req, res);
});

router.post('/credentialCheck', authenticateToken, async function (req, res, next) {
    const reqUsername = req.body.username;
    const credUsername = await wizardDAO.getUserFromID(req.userID);

    if  (credUsername && credUsername === reqUsername) {
        return res.status(200).json({ message: 'Credentials are Valid.'});
    } else {
        return res.status(400).json({message: 'Invalid credentials.'});
    }
})

router.post('/updateUserLocation', authenticateToken, async function (req, res, next) {
    console.log("User location update received.");
    const userID = req.userID;
    const userLoc = req.body.location;
    const followers = [];
    const locations = await locationDAO.getAllLocations();

    await followerDAO.getFollowerInfoFromLeadID(userID).then(results => {
        for (let followInfo of results) {
            followers.push(followInfo.follower_id);
        }
    });
    await loggingDAO.updateUserLocationLog(userID, userLoc.latitude, userLoc.longitude);
    if (followers.length > 0) {
        for (let idx = 0; idx < followers.length; idx++) {
            await loggingDAO.updateUserLocationLog(followers[idx], userLoc.latitude, userLoc.longitude);
        }
    }

    for (let location of locations) {
        if (isUserWithinLocation(userLoc.latitude, userLoc.longitude, location.latitude, location.longitude, location.radius)) {
            await fireLocationUpdate(userID, location.id, req.body.heartbeat);
            await wizardDAO.updateUserLocation(userID, location.id).catch(() =>{
                return res.status(500);
            });
            if (followers.length > 0) {
                await updateFollowersLocations(followers, location.id);
            }
            return res.status(202).json({ message: 'User location updated.' });
        }
    }

    const defaultLocation = await locationDAO.getDefaultLocation();
    await fireLocationUpdate(userID, defaultLocation.id, req.body.heartbeat);
    await wizardDAO.updateUserLocation(userID, defaultLocation.id).catch(() =>{
        return res.status(500);
    });
    if (followers.length > 0) {
        await updateFollowersLocations(followers, defaultLocation.id);
    }
    return res.status(202).json({ message: 'User location updated.' });
});

async function updateFollowersLocations(followers, locationID) {
    for (let idx = 0; idx < followers.length; idx++) {
        await fireLocationUpdate(followers[idx], locationID);
        await wizardDAO.updateUserLocation(followers[idx], locationID);
    }
}

async function fireLocationUpdate(userID, locationID, isHearbeat) {
    let clockPosition = await clockFaceDAO.getClockPositionFromLocationID(locationID);
    await clockFaceDAO.getClockPositionFromUserID(userID).then((result) => {
        if (settingsService.getSettingValue("notifyEveryPositionUpdate") === "true") {
            wizardDAO.getUserFromID(userID).then(async (result) => {
                if (result.isFollower === "false") {
                    await dobby.notifyLocationChange(result.username, clockPosition.name, isHearbeat);
                } else {
                    let lead = await followerDAO.getLeadFromFollowerID(result.id);
                    await dobby.notifyFollowerLocationChange(result.username, lead.username, clockPosition.name);
                }

            })
        } else {
            if (result.face_position !== clockPosition.face_position) {
                wizardDAO.getUserFromID(userID).then(async (result) => {
                    if (result.isFollower === "false") {
                        await dobby.notifyLocationChange(result.username, clockPosition.name, isHearbeat);
                    } else {
                        let lead = await followerDAO.getLeadFromFollowerID(result.id);
                        await dobby.notifyFollowerLocationChange(result.username, lead.username, clockPosition.name);
                    }
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
