const express = require('express');
const router = express.Router();
const authenticateToken = require("../../controllers/authController");
const wizardDAO = require("../../dao/wizardDao");
const roleDAO = require("../../dao/roleDao");
const dobby = require("../../controllers/discordController");
const settingsService = require("../../controllers/serverSettingController").default.getInstance();


router.get('/', authenticateToken, async function (req, res, next) {
    const userRole = await roleDAO.getRoleFromUserID(req.userID);
    if (userRole.role !== "admin") {
        return res.redirect("/clock");
    }
    const user = await wizardDAO.getUserFromID(req.userID);
    const serverSettings = await settingsService.getAllSettings();

    res.render('serverSettings', {
        title: 'Server Settings',
        username: user.username,
        role: userRole.role,
        settings: serverSettings,
        serverVersion: settingsService.getSettingValue("serverVersion")
    });
});

router.post('/updateDiscordSettings', authenticateToken, async function (req, res, next) {
    let discordSettings = [
        { name: "discordWebhook", value: req.body.discordWebhook},
        { name: "enableDiscord", value: req.body.enableDiscord},
        { name: "notifyEveryPositionUpdate", value: req.body.notifyEveryPositionUpdate},
    ];

    for (let discordSetting of discordSettings) {
        await settingsService.set(discordSetting.name, discordSetting.value);
    }

    if (req.body.enableDiscord === "true") {
        dobby.enableDiscordPlugin();
    }
    res.send({success: true});
})

module.exports = router;
