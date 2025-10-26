import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const SETTINGS_FILE = path.join(app.getPath('userData'), 'global_settings.json');

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE));
        }
    } catch (err) {
        console.error("Failed to load settings:", err);
    }

    // Default settings
    return {
        notesSettings: { toggle: true, toolbarMode: true },
        calendarSettings: { toggle: false },
        weatherSettings: { toggle: false }
    };
}

function saveSettings(settings) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export { loadSettings, saveSettings };
