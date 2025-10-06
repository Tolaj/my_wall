const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setDesktopLevel } = require('./editMode');
const { sendToBottom } = require('./windowUtils')


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
        y: pos.y + 100,
        width: 300,
        height: 500,
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
        y: pos.y + 100,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    win.customTittle = "calendarWin";

    win.loadFile(path.join(__dirname, '../renderer/windows/calendar/calendar.html'));
    return win;
}

function createWeatherWindow(parent, pos) {
    const win = new BrowserWindow({

        x: pos.x,
        y: pos.y + 100,
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

module.exports = { createMainWindow, createControlWindow, createSettingsWindow, setDesktopLevel, createCalendarWindow, toggleWindowVisibility, createWeatherWindow };
