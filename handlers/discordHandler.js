const webhookUsername = "Dobby";
const webhookAvatar = "https://static.wikia.nocookie.net/harrypotter/images/f/f0/Dobbyelve.jpg";
let startup = true;
notifyServerStartup();

async function notifyServerStartup() {
    let params = {
        username: webhookUsername,
        avatar_url: webhookAvatar,
        content: "Server has started up at " + new Date().toUTCString()
    }
    await sendWebhook(params);
}

async function notifyLocationChange(username, clockPositionName) {
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
                        "inline": true
                    }
                ]
            }
        ],
        content: new Date().toUTCString()
    }
    sendWebhook(params);
}

async function sendWebhook(params) {
    fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(res => {
        if (startup) {
            if (res.status === 204) {
                console.log("Discord Webhooks Enabled.");
            } else if (res.status === 401) {
                console.log("Invalid Discord Webhook URL. Discord Webhooks Disabled.");
            }
        }
        startup = false;
    });
}

module.exports = {
    notifyLocationChange
};