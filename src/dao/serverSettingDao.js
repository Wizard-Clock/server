const db = require("../controllers/dbController");

async function getAllServerSettings() {
    return await new Promise((resolve, reject) => {
        db.all('SELECT * FROM server_settings', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

async function updateServerSetting(serverSetting) {
    await db.run(`INSERT INTO server_settings (setting_name, value) VALUES (?, ?) ON CONFLICT(setting_name) DO UPDATE SET value=?`, [
        serverSetting.name,
        serverSetting.value,
        serverSetting.value
    ]);
}


async function updateAllServerSettings(serverSettingsList) {
    for (let serverSetting of serverSettingsList) {
        await updateServerSetting(serverSetting);
    }
}

module.exports = {
    getAllServerSettings,
    updateAllServerSettings,
    updateServerSetting,
}
