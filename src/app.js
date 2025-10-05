

const { app, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

const { createMainWindow, createControlWindow, createSettingsWindow, toggleWindowVisibility, createCalenderWindow } = require('./modules/windows');
const { setupTray } = require('./modules/tray');
const { activateEditMode, activateDesktopMode, isEditMode } = require('./modules/editMode');
const { logMachineConfig } = require('./modules/machineLogger');
const { loadControlPos, saveControlPos } = require('./modules/controlPos');
const { sendToBottom, sendToBottomNative } = require('./modules/windowUtils')
const { ipcHandlers, createWindowHandlers } = require('./modules/ipcMainHandler');
const { loadSettings } = require('./modules/settingsManager');


const settings = loadSettings();

let mainWin, controlWin, settingsWin, calenderWin;

app.whenReady().then(async () => {

    if (process.platform === 'darwin') {
        app.dock.hide(); // Hide the app icon in the Dock
    }

    const primary = screen.getPrimaryDisplay();
    const { width, height } = primary.bounds;

    // Create windows
    mainWin = createMainWindow(width, height);
    controlWin = createControlWindow(mainWin, loadControlPos(width, height));

    // Log system info
    // logMachineConfig(mainWin);

    // Apply initial settings
    toggleWindowVisibility(mainWin, settings.notesSettings.toggleShow);


    // Tray
    setupTray(mainWin, controlWin, app);

    // Persist control window position
    controlWin.on('move', () => {
        const [x, y] = controlWin.getPosition();
        saveControlPos(x, y);
    });

    mainWin.on('focus', () => {
        if (process.platform === 'darwin') {
            // For macOS, set controlWin and settingsWin as children of mainWin
            controlWin.setParentWindow(mainWin);
            const settingsWindowInstance = settingsWin.getWindow();
            if (settingsWindowInstance) {
                settingsWindowInstance.setParentWindow(mainWin);
            }
        } else if (process.platform === 'win32') {
            // For Windows, send mainWin to bottom of the z-order
            sendToBottom(mainWin);
        }
    });

    mainWin.on('blur', () => {
        if (process.platform === 'darwin') {
            // For macOS, remove controlWin and settingsWin as children of mainWin
            controlWin.setParentWindow(null);
            const settingsWindowInstance = settingsWin.getWindow();
            if (settingsWindowInstance) {
                settingsWindowInstance.setParentWindow(null);
            }
        }
    });


    // Global hotkey to toggle edit mode
    globalShortcut.register('CommandOrControl+Alt+N', () => {
        isEditMode() ? activateDesktopMode(mainWin, controlWin) : activateEditMode(mainWin, controlWin);
    });



    // IPC events
    ipcHandlers.toggleEdit(mainWin, controlWin);
    ipcHandlers.closeApp(app);
    ipcHandlers.updateGlobalSettings(mainWin);
    ipcHandlers.updateMainWindowState(mainWin);
    ipcHandlers.resizeControl(controlWin);

    // Handlers for settings window
    settingsWin = createWindowHandlers(
        "settings",
        controlWin,
        createSettingsWindow
    );

    // Register listeners
    settingsWin.open();
    settingsWin.resize();
    settingsWin.close();


    calenderWin = createWindowHandlers(
        "calender",
        controlWin,
        createCalenderWindow
    );

    // Register listeners
    calenderWin.open();
    calenderWin.resize();
    calenderWin.close();





    app.on('will-quit', () => globalShortcut.unregisterAll());
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});