const { BrowserWindow } = require('electron');
const path = require('path');
const { setDesktopLevel } = require('./editMode');
const { sendToBottom } = require('./windowUtils')

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
        width: 129,
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

function createSettingsWindow(parent,pos) {
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
    win.loadFile(path.join(__dirname, '../renderer/windows/settings/settings.html'));
    return win;
}

module.exports = { createMainWindow, createControlWindow, createSettingsWindow, setDesktopLevel };
