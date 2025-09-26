const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setDesktopLevel } = require('./editMode');
const { sendToBottom } = require('./windowUtils')


function createWindowHandlers(winName, parentWin, createWindowFn) {
    let childWin = null;

    return {
        open: () => {
            ipcMain.on(`open-${winName}-window`, () => {
                if (!childWin || childWin.isDestroyed()) {
                    childWin = createWindowFn(parentWin, parentWin.getBounds() || { x: 100, y: 100 });
                    childWin.on('closed', () => { childWin = null; });
                } else {
                    childWin.focus();
                }
            });
        },
        resize: () => {
            ipcMain.on(`resize-${winName}`, (evt, size) => {
                if (childWin && !childWin.isDestroyed()) {
                    childWin.setContentSize(size.width, size.height);
                }
            });
        },
        close: () => {
            ipcMain.on(`close-${winName}-window`, () => {
                if (childWin && !childWin.isDestroyed()) {
                    childWin.close();
                }
            });
        }
    };
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
    win.loadFile(path.join(__dirname, '../renderer/windows/main/index.html'));

    win.once('ready-to-show', () => {
        setDesktopLevel(win);
    });



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
    win.loadFile(path.join(__dirname, '../renderer/windows/control/control.html'));
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
    win.loadFile(path.join(__dirname, '../renderer/windows/settings/settings.html'));

    // win.webContents.openDevTools()
    return win;
}

function createCalenderWindow(parent, pos) {
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
    win.loadFile(path.join(__dirname, '../renderer/windows/calender/calender.html'));
    return win;
}

module.exports = { createMainWindow, createControlWindow, createSettingsWindow, setDesktopLevel, createWindowHandlers, createCalenderWindow };
