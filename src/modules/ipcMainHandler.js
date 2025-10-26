import { ipcMain, shell, dialog } from 'electron';
import { activateEditMode, activateDesktopMode, isEditMode, setDesktopLevel } from './editMode.js';
import { saveSettings } from './settingsManager.js';
import { toggleWindowVisibility } from './windows.js';
import { loadWindowPos, getDisplaySize } from './windowPositionManager.js';
import {
    initializeWallpaper,
    getCurrentWallpaper,
    applyWallpaper,
    restoreOriginalWallpaper
} from './wallpaperUtil.js';
import fs from 'fs';

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
    const { useDesktopLevel = true } = options;

    return {
        open: () => {
            ipcMain.on(`open-${winName}-window`, () => {
                const { width, height } = getDisplaySize();
                let pos = loadWindowPos(`${winName}Win`, width, height);

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

        openExternalUrl: () => {
            ipcMain.on('open-external-url', (event, url) => {
                shell.openExternal(url);
            });
        },

        wallpaperHandler: () => {
            // Initialize wallpaper on startup
            initializeWallpaper();

            // Handle wallpaper file selection
            ipcMain.on('select-wallpaper-file', async (event) => {
                try {
                    const result = await dialog.showOpenDialog({
                        properties: ['openFile'],
                        filters: [
                            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }
                        ],
                        title: 'Select Wallpaper Image'
                    });

                    if (!result.canceled && result.filePaths.length > 0) {
                        const filePath = result.filePaths[0];
                        event.reply('wallpaper-file-selected', filePath);
                    }
                } catch (error) {
                    console.error('Error selecting wallpaper file:', error);
                    event.reply('wallpaper-error', 'Failed to select file');
                }
            });

            // Handle setting the wallpaper
            ipcMain.on('update-wallpaper-settings', async (event, settings) => {
                if (!settings.wallpaperSettings) {
                    return;
                }

                const { toggleShow, imagePath, theme } = settings.wallpaperSettings;

                // If toggle is off, restore original wallpaper
                if (!toggleShow) {
                    // console.log('Wallpaper toggle is off, restoring original wallpaper');
                    try {
                        const restored = await restoreOriginalWallpaper();
                        // if (restored) {
                        //     event.reply('wallpaper-success', 'Original wallpaper restored');
                        // } else {
                        //     event.reply('wallpaper-error', 'No original wallpaper to restore');
                        // }
                    } catch (error) {
                        console.error('✗ Error restoring original wallpaper:', error);
                        event.reply('wallpaper-error', 'Failed to restore wallpaper');
                    }
                    return;
                }

                // If no image path, skip
                if (!imagePath) {
                    // console.log('No wallpaper image selected');
                    return;
                }

                try {
                    await applyWallpaper(imagePath, theme);
                    // event.reply('wallpaper-success', 'Wallpaper applied successfully');
                } catch (error) {
                    event.reply('wallpaper-error', error.message || 'Failed to set wallpaper');
                }
            });

            // Get current system wallpaper
            ipcMain.handle('get-current-wallpaper', async () => {
                return await getCurrentWallpaper();
            });

            // Handle wallpaper removal - restore original
            ipcMain.on('remove-wallpaper', async (event) => {
                try {
                    const restored = await restoreOriginalWallpaper();
                    // if (restored) {
                    //     event.reply('wallpaper-removed', 'Original wallpaper restored');
                    // } else {
                    //     event.reply('wallpaper-removed', 'Wallpaper setting cleared');
                    // }
                } catch (error) {
                    console.error('Error restoring wallpaper:', error);
                    event.reply('wallpaper-error', error.message);
                }
            });
        }
    };
}

export { ipcHandlers, createWindowHandlers };