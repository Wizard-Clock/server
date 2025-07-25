const express = require('express');
const router = express.Router();
const authenticateToken = require("../../handlers/authHandler");
const db = require("../../handlers/dbHandler");
const serverSettingsService = require("../../handlers/serverSettingHandler");
const {formidable} = require("formidable");
const settingsService = serverSettingsService.default.getInstance();


router.get('/', authenticateToken, async function (req, res, next) {

    const userRole = await db.getRoleFromUserID(req.userID);
    if (userRole.role !== "admin") {
        return res.redirect("/clock");
    }
    const user = await db.getUserFromID(req.userID);
    const sdf = settingsService.getAllSettings();

    res.render('serverSettings', {
        title: 'Server Settings',
        username: user.username,
        role: userRole.role,
        settings: settingsService.getAllSettings()
    });
});

router.post('/updateSettings', authenticateToken, async function (req, res, next) {
    const form = formidable({ multiples: true });
    await form.parse(req, async (err, settings) => {
        console.log(settings);
    });
})

module.exports = router;
