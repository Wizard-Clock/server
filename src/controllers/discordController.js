const settingsService = require("./serverSettingController").default.getInstance();

const webhookUsername = "Dobby";
const webhookAvatar = "https://static.wikia.nocookie.net/harrypotter/images/f/f0/Dobbyelve.jpg";
let attemptStartup = true;
let isValidWebhook = true;

async function notifyServerStartup() {
    let params = {
        username: webhookUsername,
        avatar_url: webhookAvatar,
        content: "Server has started up at " + new Date().toUTCString()
    }
    await sendWebhook(params);
}

async function enableDiscordPlugin() {
    attemptStartup = true;
    isValidWebhook = true;
    let params = {
        username: webhookUsername,
        avatar_url: webhookAvatar,
        embeds: [
            {
                "title": "Discord plugin for Wizarding Clock Enabled/Updated.",
                "fields": [
                    {
                        "name": "Notify Every Position Update",
                        "value": "Value:  " + settingsService.getSettingValue("notifyEveryPositionUpdate"),
                        "inline": true
                    }
                ]
            }
        ],
        content: new Date().toUTCString()
    }
    await sendWebhook(params);
}

async function notifyLocationChange(username, clockPositionName, isHearbeat) {
    let params = {
        username: webhookUsername,
        avatar_url: webhookAvatar,
        embeds: [
            {
                "title": "Wizard has Moved!",
                "fields": [
                    {
                        "name": "Wizard",
                        "value": "Master " + username,
                        "inline": true
                    },
                    {
                        "name": "Location",
                        "value": clockPositionName,
                        "inline": false
                    },
                    {
                        "name": "Heartbeat",
                        "value": isHearbeat,
                        "inline": false
                    }
                ]
            }
        ],
        content: new Date().toUTCString()
    }
    sendWebhook(params);
}

async function notifyFollowerLocationChange(username, leadUsername, clockPositionName) {
    let params = {
        username: webhookUsername,
        avatar_url: webhookAvatar,
        embeds: [
            {
                "title": "Wizard Followed!",
                "fields": [
                    {
                        "name": "Wizard",
                        "value": "Master " + username,
                        "inline": true
                    },
                    {
                        "name": "Is Following",
                        "value": "Master " + leadUsername,
                        "inline": true
                    },
                    {
                        "name": "Location",
                        "value": clockPositionName,
                        "inline": false
                    }
                ]
            }
        ],
        content: new Date().toUTCString()
    }
    sendWebhook(params);
}

async function sendWebhook(params) {
    if (!settingsService.getSettingValue("enableDiscord") || !isValidWebhook) {return}
    fetch(settingsService.getSettingValue("discordWebhook"), {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(res => {
        if (attemptStartup) {
            if (res.status === 204) {
                console.log("Discord Webhooks Enabled.");
            } else {
                console.log("Invalid Discord Webhook URL or Parameters. Discord Webhooks Disabled.");
            }
        }
        attemptStartup = false;
    }).catch(() => {
        console.log("Invalid Discord Webhook URL or Parameters. Discord Webhooks Disabled.");
        isValidWebhook = false;
    });
}

module.exports = {
    notifyServerStartup,
    enableDiscordPlugin,
    notifyLocationChange,
    notifyFollowerLocationChange
};