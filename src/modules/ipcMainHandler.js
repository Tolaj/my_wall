const { ipcMain } = require('electron');
const { activateEditMode, activateDesktopMode, isEditMode } = require('./editMode');
const { saveSettings } = require('./settingsManager');
const { toggleWindowVisibility } = require('./windows');

const ipcHandlers = {
    toggleEdit: (mainWin, controlWin) => {
        ipcMain.on('toggle-edit', (_, editing) => {
            editing
                ? activateEditMode(mainWin, controlWin)
                : activateDesktopMode(mainWin, controlWin);
        });
    },

    closeApp: (app) => {
        ipcMain.on('close-app', () => {
            app.quit();
        });
    },

    updateGlobalSettings: (mainWin) => {
        ipcMain.on('update-global-settings', (_, newSettings) => {
            mainWin.webContents.send('apply-main-settings', newSettings);
        });
    },

    updateMainWindowState: (mainWin) => {
        ipcMain.on('update-main-Window-state', (_, settings) => {
            saveSettings(settings);
            if (mainWin) toggleWindowVisibility(mainWin, settings.notesSettings.toggleShow);
        })
    },

    resizeControl: (controlWin) => {
        ipcMain.on('resize-control', (_, size) => {
            if (controlWin && !controlWin.isDestroyed()) {
                controlWin.setContentSize(size.width, size.height);
            }
        });
    }
};

const createWindowHandlers = (winName, parentWin, createWindowFn) => {
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
        },
        getWindow: () => childWin
    };
}



module.exports = { ipcHandlers, createWindowHandlers };