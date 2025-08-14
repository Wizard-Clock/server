import ssDAO from "../dao/serverSettingDao.js";

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
        this._loadApplicationSettings().then(() => {
            this.set('serverVersion', '0.1.0');
            console.log("[settingService] Server Settings Successfully Loaded.");
        });
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
        if (this.serverSettings[name] && this.serverSettings[name] === value) {
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
            console.log("[settingService] Server Settings found.");
            let state = {};
            value.forEach((setting) => {
                state[setting.setting_name] = setting.value;
            });
            this.serverSettings = state;
        });
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
        ssDAO.updateAllServerSettings(dbFormatedServerSettings).then(() => console.log("[settingService] Server Settings Saved."));
    }
}
