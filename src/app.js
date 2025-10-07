

const { app, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

const { createMainWindow, createControlWindow, createSettingsWindow, toggleWindowVisibility, createCalendarWindow, createWeatherWindow } = require('./modules/windows');
const { setupTray } = require('./modules/tray');
const { activateEditMode, activateDesktopMode, isEditMode } = require('./modules/editMode');
const { logMachineConfig } = require('./modules/machineLogger');
const { loadWindowPos, saveWindowPos, getDisplaySize } = require('./modules/windowPositionManager');
const { sendToBottom, sendToBottomNative } = require('./modules/windowUtils')
const { ipcHandlers, createWindowHandlers } = require('./modules/ipcMainHandler');
const { loadSettings } = require('./modules/settingsManager');


const settings = loadSettings();

let mainWin, controlWin, settingsWin, settingsWinIPCConfig, calendarWin, calendarWinIPCConfig, weatherWin, weatherWinIPCConfig;

app.whenReady().then(async () => {

    if (process.platform === 'darwin') {
        app.dock.hide(); // Hide the app icon in the Dock
    }

    const { width, height } = getDisplaySize(); // Get screen size

    //Windows positions
    let controlPos = loadWindowPos('controlWin', width, height);
    let settingsPos = loadWindowPos('settingsWin', width, height);
    let calendarPos = loadWindowPos('calendarWin', width, height);
    let weatherPos = loadWindowPos('weatherWin', width, height);


    // Create windows
    mainWin = createMainWindow(width, height);
    controlWin = createControlWindow(mainWin, controlPos);



    // Log system info
    // logMachineConfig(mainWin);

    // Apply initial settings
    toggleWindowVisibility(mainWin, settings.notesSettings.toggleShow);


    // Tray
    setupTray(mainWin, controlWin, app);

    // Persist control window position
    controlWin.on('move', () => {
        const [x, y] = controlWin.getPosition();
        saveWindowPos('controlWin', x, y);
    });

    mainWin.on('focus', () => {
        if (process.platform === 'darwin') {
            controlWin.setParentWindow(mainWin);
            settingsWin?.setParentWindow(mainWin);
        } else if (process.platform === 'win32') {
            sendToBottom(mainWin);
        }
    });

    mainWin.on('blur', () => {
        if (process.platform === 'darwin') {
            controlWin?.setParentWindow(null);
            settingsWin?.setParentWindow(null);
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

    // --------------------------------------------------------------------

    // Handlers for settings window
    settingsWinIPCConfig = createWindowHandlers(
        "settings",
        controlWin,
        createSettingsWindow,
        { useDesktopLevel: false },
        (childWin) => {
            settingsWin = childWin
            settingsWin.on('move', () => {
                const [x, y] = settingsWin.getPosition();
                saveWindowPos('settingsWin', x, y);
            });
        }
    );

    // Register listeners
    settingsWinIPCConfig.open();
    settingsWinIPCConfig.resize();
    settingsWinIPCConfig.close();



    // --------------------------------------------------------------------

    calendarWinIPCConfig = createWindowHandlers(
        "calendar",
        mainWin,
        createCalendarWindow,
        {},
        (childWin) => {
            calendarWin = childWin
            calendarWin.on('move', () => {
                const [x, y] = calendarWin.getPosition();
                saveWindowPos('calendarWin', x, y);
            });
        }
    );

    // Register listeners
    calendarWinIPCConfig.open();
    calendarWinIPCConfig.resize();
    calendarWinIPCConfig.close();
    calendarWinIPCConfig.toggleEdit();
    calendarWinIPCConfig.updateSettings();

    // --------------------------------------------------------------------

    weatherWinIPCConfig = createWindowHandlers(
        "weather",
        mainWin,
        createWeatherWindow,
        {},
        (childWin) => {
            weatherWin = childWin
            weatherWin.on('move', () => {
                const [x, y] = weatherWin.getPosition();
                saveWindowPos('weatherWin', x, y);
            });
        }
    );

    // Register listeners
    weatherWinIPCConfig.open();
    weatherWinIPCConfig.resize();
    weatherWinIPCConfig.close();
    weatherWinIPCConfig.toggleEdit();
    // --------------------------------------------------------------------




    app.on('will-quit', () => globalShortcut.unregisterAll());
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});