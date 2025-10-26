import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setDesktopLevel } from './editMode.js';
import { sendToBottom } from './windowUtils.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function toggleWindowVisibility(win, shouldShow) {
    if (!win) return;

    if (shouldShow) {
        win.show();
    } else {
        win.hide();
    }

}

function createMainWindow(width, height) {
    const win = new BrowserWindow({
        x: 0, y: 0,
        width, height,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        focusable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    win.customTittle = "mainWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/main/index.html'));

    win.once('ready-to-show', () => {
        setDesktopLevel(win);
    });

    // win.webContents.openDevTools()

    return win;
}

function createControlWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y,
        width: 128,
        height: 64,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "controlWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/control/index.html'));
    return win;
}

function createSettingsWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y,

        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "settingsWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/settings/index.html'));

    // win.webContents.openDevTools()

    return win;
}

function createCalendarWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "calendarWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/calendar/index.html'));

    // win.webContents.openDevTools()

    return win;
}

function createWeatherWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "weatherWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/weather/index.html'));
    return win;
}

function createTimeWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "timeWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/time/index.html'));
    return win;
}

function createDateWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "dateWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/date/index.html'));
    return win;
}

export { createMainWindow, createControlWindow, createSettingsWindow, setDesktopLevel, createCalendarWindow, toggleWindowVisibility, createWeatherWindow, createTimeWindow, createDateWindow };
