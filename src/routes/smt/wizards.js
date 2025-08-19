const express = require('express');
const router = express.Router();
const roleDAO = require("../../dao/roleDao");
const wizardDAO = require("../../dao/wizardDao");
const loggingDAO = require("../../dao/loggingDao");
const followerDAO = require("../../dao/followerDao");
const clockFaceDAO = require("../../dao/clockFaceDao");
const wizardController =  require("../../controllers/wizardController");
const {formidable} = require('formidable');
const authenticateToken = require("../../controllers/authController");
const settingsService = require("../../controllers/serverSettingController").default.getInstance();

router.get("/", authenticateToken, async function (req, res, next) {
    const userRole = await roleDAO.getRoleFromUserID(req.userID);
    if (userRole.role !== "admin") {
        return res.redirect("/clock");
    }
    let users = await wizardDAO.getAllUsers();
    for (let user of users) {
        await roleDAO.getRoleFromUserID(user.id).then(role => {user.role = role.role});

        let positionList = []
        await loggingDAO.getUserLocationLog(user.id).then(locations => {positionList = locations});
        user.posistionLog = positionList;

        if (user.isFollower === "true") {
            let leadID = await followerDAO.getLeadIDFromFollowerID(user.id);
            user.lead = await wizardDAO.getUserFromID(leadID.lead_id);
        }

        if (user.reportingMethod === 'manual') {
            let pos = await wizardDAO.getUserClockPositionInfoFromUserID(user.id);
            user.positionID = pos.position_id;
        }
    }

    let clockPositions = await clockFaceDAO.getAllClockPositions();

    const user = await wizardDAO.getUserFromID(req.userID);
    res.render('wizards',{
        title: 'Wizards',
        username: user.username,
        role: userRole.role,
        wizards: users,
        roles: await roleDAO.getAllRoles(),
        locations: clockPositions,
        serverVersion: settingsService.getSettingValue("serverVersion")
    });
});

router.post('/clearUserLog', authenticateToken, async function (req, res, next) {
    await loggingDAO.clearUserLocationLog(req.body.id);
    res.send({success: true});
})

router.post('/manualPositionUpdate', authenticateToken, async function (req, res, next) {
    await wizardController.handleUserPositionUpdate(req.body.userID, req.body.positionID);
    res.send({success: true});
})

router.post('/addUser', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, user) => {
        let isFollower = user.isFollower ? true : false;
        let leadID = isFollower ? (user.leadID ? user.leadID[0] : "") : "";
        let reportingMethod = isFollower ? 'follow' : user.reportingMethod[0];
        await wizardController.addUserInfo(user.username[0], user.password[0], user.role[0], reportingMethod, isFollower, leadID);
        res.send({success: true});
    });
})

router.post('/deleteUser', authenticateToken, async function (req, res, next) {
    await wizardController.deleteUserInfo(req.body.id);
    res.send({success: true});
})

router.post('/updateUser', authenticateToken, async function (req, res, next) {
    req.body.reportingMethod = req.body.isFollower === "true" ? 'follow' : req.body.reportingMethod;
    await wizardController.updateUserInfo(req.body);
    res.send({success: true});
})

module.exports = router;
