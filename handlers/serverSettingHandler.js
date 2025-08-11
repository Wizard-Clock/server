import ssDAO from "../dao/serverSettingDao.js";

const DEFAULT_SERVER_SETTINGS = [
    {name: 'discordWebhook', group: 'discord', dataType: 'string', defaultValue: 'https://discord.com/api/webhooks/'},
    {name: 'enableDiscord', group: 'discord', dataType: 'boolean', defaultValue: false},
    {name: 'notifyEveryPositionUpdate', group: 'discord', dataType: 'boolean', defaultValue: false},
]

let instance;

export default class ServerSettingsService {
    static getInstance() {
        if (!instance) {
            instance = new ServerSettingsService();
        }
        return instance;
    }

    serverSettings = null;

    constructor() {
        this._loadApplicationSettings().then(() => console.log("Server Settings Successfully Loaded."));
    }

    /**
     * Gets a single server setting
     */
    getSettingValue(name) {
        return this.serverSettings[name];
    }

    /**
     * Gets a single server setting
     */
    getAllSettings() {
        return this.serverSettings;
    }

    /**
     * Sets and persists a single server setting
     */
    set(name, value) {
        if (this.serverSettings[name] === value) {
            // No change.  Ignore
            return;
        }
        this.serverSettings[name] = value;
        this._saveSettings();
    }

    /**
     * Load the server-settings from db
     */
    async _loadApplicationSettings() {
        await ssDAO.getAllServerSettings().then((value) => {
            if (value.length <= 0) {
                console.log("Server Settings not found, initializing with default settings.");
                this.serverSettings = this._getDefaultSettings();
                this._saveSettings();
            } else {
                console.log("Server Settings found.");
                let state = {};
                value.forEach((setting) => {
                    state[setting.setting_name] = setting.value;
                });
                this.serverSettings = state
            }
        });
    }

    /**
     * Returns the default server-settings
     */
    _getDefaultSettings() {
        let state = {};
        const items = [].concat(DEFAULT_SERVER_SETTINGS);
        items.forEach((setting) => {
            state[setting.name] = setting.defaultValue;
        });
        return state;
    }

    /**
     * Persist the application settings to db
     */
    _saveSettings() {
        let dbFormatedServerSettings = [];
        for (const key in this.serverSettings) {
            if (this.serverSettings.hasOwnProperty(key)) {
                dbFormatedServerSettings.push({name: key, value: this.serverSettings[key]});
            }
        }
        ssDAO.updateAllServerSettings(dbFormatedServerSettings).then(() => console.log("Server Settings Saved."));
    }
}
