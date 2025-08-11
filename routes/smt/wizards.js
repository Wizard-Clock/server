const express = require('express');
const router = express.Router();
const wizardDAO = require("../../dao/wizardDao");
const loggingDAO = require("../../dao/loggingDao");
const followerDAO = require("../../dao/followerDao");
const roleDAO = require("../../dao/roleDao");
const {formidable} = require('formidable');
const authenticateToken = require("../../handlers/authHandler");

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
            let leadUser = await followerDAO.getLeadFromFollowerID(user.id);
            user.lead = leadUser;
        }
    }
    const user = await wizardDAO.getUserFromID(req.userID);
    res.render('wizards',{title: 'Wizards', username: user.username, role: userRole.role, wizards: users, roles: await roleDAO.getAllRoles()});
});

router.post('/clearUserLog', authenticateToken, async function (req, res, next) {
    await loggingDAO.clearUserLocationLog(req.body.id);
    res.send({success: true});
})

router.post('/addUser', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, user) => {
        let isFollower = user.isFollower ? true : false;
        let leadID = isFollower ? (user.leadID ? user.leadID[0] : "") : "";
        await wizardDAO.addUser(user.username[0], user.password[0], user.role[0], isFollower, leadID);
        res.send({success: true});
    });
})

router.post('/deleteUser', authenticateToken, async function (req, res, next) {
    await wizardDAO.deleteUser(req.body.id);
    res.send({success: true});
})

router.post('/updateUser', authenticateToken, async function (req, res, next) {
    await wizardDAO.updateUser(req.body);
    res.send({success: true});
})

module.exports = router;
