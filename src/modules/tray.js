const { Tray, Menu } = require('electron');
const path = require('path');
const { activateEditMode, activateDesktopMode, isEditMode } = require('./editMode');

function setupTray(mainWin, controlWin, app) {
    const tray = new Tray(path.join(__dirname, '../renderer/assets/images/logo.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Notes', click: () => mainWin.show() },
        { label: 'Toggle Edit Mode', click: () => {
            isEditMode() ? activateDesktopMode(mainWin, controlWin) : activateEditMode(mainWin, controlWin);
        }},
        { label: 'Exit', click: () => app.quit() }
    ]);
    tray.setToolTip('My Electron Notes');
    tray.setContextMenu(contextMenu);
}

module.exports = { setupTray };
