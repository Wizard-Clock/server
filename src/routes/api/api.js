const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const wizardDAO = require("../../dao/wizardDao");
const roleDAO = require("../../dao/roleDao");
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
    const userCreds = await wizardDAO.getUserFromID(req.userID);
    if  (userCreds && userCreds.username === reqUsername) {
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

router.post('/updateUserReporting', authenticateToken, async function (req, res, next) {
    await wizardController.updateUserReportingMethod(req.userID, req.body.reportingMethod);
    res.send({success: true});
});

module.exports = router;
