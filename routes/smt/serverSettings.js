const express = require('express');
const router = express.Router();
const authenticateToken = require("../../handlers/authHandler");
const db = require("../../handlers/dbHandler");
const dobby = require("../../handlers/discordHandler");
const settingsService = require("../../handlers/serverSettingHandler").default.getInstance();


router.get('/', authenticateToken, async function (req, res, next) {
    const userRole = await db.getRoleFromUserID(req.userID);
    if (userRole.role !== "admin") {
        return res.redirect("/clock");
    }
    const user = await db.getUserFromID(req.userID);

    res.render('serverSettings', {
        title: 'Server Settings',
        username: user.username,
        role: userRole.role,
        settings: settingsService.getAllSettings()
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

    if (req.body.enableDiscord) {
        dobby.enableDiscordPlugin();
    }
    res.send({success: true});
})

module.exports = router;
