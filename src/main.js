

const { app, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

const { createMainWindow, createControlWindow, createSettingsWindow, setDesktopLevel } = require('./modules/windows');
const { setupTray } = require('./modules/tray');
const { activateEditMode, activateDesktopMode, isEditMode } = require('./modules/editMode');
const { logMachineConfig } = require('./modules/machineLogger');
const { loadControlPos, saveControlPos } = require('./modules/controlPos');
const { sendToBottom } = require('./modules/windowUtils')

let mainWin, controlWin, settingsWin;

app.whenReady().then(async () => {
    const primary = screen.getPrimaryDisplay();
    const { width, height } = primary.bounds;

    // Create windows
    mainWin = createMainWindow(width, height);
    controlWin = createControlWindow(mainWin, loadControlPos(width, height));

    // Log system info
    // logMachineConfig(mainWin);

    // Tray
    setupTray(mainWin, controlWin, app);

    // Persist control window position
    controlWin.on('move', () => {
        const [x, y] = controlWin.getPosition();
        saveControlPos(x, y);
     });

    mainWin.on('focus', () => {
        sendToBottom(mainWin)
    });

    // Global hotkey to toggle edit mode
    globalShortcut.register('CommandOrControl+Alt+N', () => {
        isEditMode() ? activateDesktopMode(mainWin, controlWin) : activateEditMode(mainWin, controlWin);
    });

    // IPC events
    ipcMain.on('toggle-edit', (_, editing) => {
        editing ? activateEditMode(mainWin, controlWin) : activateDesktopMode(mainWin, controlWin);
    });

    ipcMain.on('close-app', () => app.quit());
    ipcMain.on('update-note-styles', (_, settings) => mainWin.webContents.send('apply-note-styles', settings));

    ipcMain.on('open-settings-window', () => {
        if (!settingsWin || settingsWin.isDestroyed()) {
            settingsWin = createSettingsWindow(mainWin,controlWin.getBounds());
            settingsWin.on('closed', () => { settingsWin = null; });
        } else settingsWin.focus();
    });

    
        ipcMain.on('close-settings-window', () => {
            if (settingsWin && !settingsWin.isDestroyed()) {
                settingsWin.close();
            }
        });

    
    app.on('browser-window-focus', (event, win) => {
            if (!isEditMode && win !== controlWin) {
                setTimeout(() => {
                    setDesktopLevel(mainWin);
                }, 100);
            }
        });
        
    app.on('will-quit', () => globalShortcut.unregisterAll());
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});