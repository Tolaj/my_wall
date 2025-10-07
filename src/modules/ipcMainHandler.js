const { ipcMain } = require('electron');
const { activateEditMode, activateDesktopMode, isEditMode, setDesktopLevel } = require('./editMode');
const { saveSettings } = require('./settingsManager');
const { toggleWindowVisibility } = require('./windows');
const { loadWindowPos, getDisplaySize } = require('./windowPositionManager');

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

const createWindowHandlers = (winName, parentWin, createWindowFn, options = {}, onWindowCreated = () => { }) => {
    let childWin = null;
    const { useDesktopLevel = true } = options; // default to true

    return {
        open: () => {
            ipcMain.on(`open-${winName}-window`, () => {
                const { width, height } = getDisplaySize(); // Get screen size

                let pos = loadWindowPos(`${winName}Win`, width, height)


                if (!childWin || childWin.isDestroyed()) {

                    childWin = createWindowFn(parentWin, pos);
                    if (useDesktopLevel) {
                        setDesktopLevel(childWin);
                    }
                    childWin.on('closed', () => { childWin = null; });
                    onWindowCreated(childWin);

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
        updateSettings: () => {
            ipcMain.on(`update-${winName}-settings`, (_, newSettings) => {
                childWin?.webContents.send(`apply-${winName}-settings`, newSettings);
            })
        },
        getWindow: () => childWin,
        toggleEdit: () => {
            ipcMain.on('toggle-edit', (_, editing) => {
                editing
                    ? childWin?.setIgnoreMouseEvents(false)
                    : childWin?.setIgnoreMouseEvents(true, { forward: true })

            });
        },

    };
}



module.exports = { ipcHandlers, createWindowHandlers };