const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const wizardDAO = require("../../dao/wizardDao");
const followerDAO = require("../../dao/followerDao");
const roleDAO = require("../../dao/roleDao");
const dobby = require("../../controllers/discordController");
const locationController = require("../../controllers/locationController");
const wizardController = require("../../controllers/wizardController");
const authenticateToken = require("../../controllers/authController");
const passport = require("passport");

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
    await wizardController.handleUserLocationUpdate(req.userID, req.body.location, req.body.heartbeat).then((result) => {
        if (result) {
            return res.status(202).json({ message: 'User location updated.' });
        } else {
            return res.status(500);
        }
    });
});

router.post('/manualUserLocationUpdate', authenticateToken, async function (req, res, next) {
    const userID = req.userID;
    const reportingMethod = req.body.reportingMethod;
    const followers = [];

    await wizardDAO.updateUserReportingMethod(userID, reportingMethod);
    await followerDAO.getFollowerInfoFromLeadID(userID).then(async results => {
        for (let followInfo of results) {
            followers.push(followInfo.follower_id);
            await wizardDAO.updateUserReportingMethod(followInfo.follower_id, reportingMethod);
        }
    });

    if (reportingMethod === "manual") {
        await locationUpdateController(req.userID, req.body.location, false).then((result) => {
            if (!result) {
                return res.status(500);
            }
        });
    }

    let reportingUser = await wizardDAO.getUserFromID(userID);
    if (reportingUser.reportingMethod !== reportingMethod) {
        await dobby.notifyReportingMethodChange(reportingUser.username, reportingMethod, false);
        for (let followerID of  followers) {
            await wizardDAO.getUserFromID(followerID).then(async results => {
                await dobby.notifyReportingMethodChange(results.username, reportingMethod, true);
            })
        }
    }
    
    res.send({success: true});
})

module.exports = router;
