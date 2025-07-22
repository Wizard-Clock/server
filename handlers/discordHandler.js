const webhookUsername = "Dobby";
const webhookAvatar = "https://static.wikia.nocookie.net/harrypotter/images/f/f0/Dobbyelve.jpg";
let startup = true;
let isValidWebhook = true;
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
    if  (!isValidWebhook) {return}
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
            } else {
                console.log("Invalid Discord Webhook URL or Parameters. Discord Webhooks Disabled.");
            }
        }
        startup = false;
    }).catch(() => {
        console.log("Invalid Discord Webhook URL or Parameters. Discord Webhooks Disabled.");
        isValidWebhook = false;
    });
}

module.exports = {
    notifyLocationChange
};