const { Webhook, MessageBuilder} = require('discord-webhook-node');
const discordHook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

discordHook.setUsername('Dobby');
discordHook.setAvatar('https://static.wikia.nocookie.net/harrypotter/images/f/f0/Dobbyelve.jpg');

const startupDate = new Date(Date.now());
discordHook.send("Server has started up at " + startupDate.toUTCString());

async function notifyLocationChange(username, clockPositionName) {
    const messageBuilder = new MessageBuilder()
        .setTitle('Wizard has Moved!')
        .addField("Wizard", "Master " + username, true)
        .addField("", "", true)
        .addField("Location", clockPositionName, true)
        .setTimestamp();
    discordHook.send(messageBuilder);
}

module.exports = {
    notifyLocationChange
};