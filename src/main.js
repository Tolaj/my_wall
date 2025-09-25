// main.js - Pure Electron Desktop Widget Solution
const { app, BrowserWindow,systemPreferences, ipcMain, screen, globalShortcut, Tray, Menu } = require('electron');
const os = require('os');
 
const AutoLaunch = require('auto-launch');

const path = require('path');
const fs = require('fs');

const CONTROL_POS_FILE = path.join(app.getPath('userData'), 'control-pos.json');
let tray = null;

function loadControlPos(displayWidth, displayHeight) {
    try {
        const raw = fs.readFileSync(CONTROL_POS_FILE, 'utf8');
        const p = JSON.parse(raw);
        return { x: p.x, y: p.y };
    } catch (e) {
        // default bottom-right
        return { x: Math.max(20, displayWidth - 180), y: Math.max(20, displayHeight - 120) };
    }
}

function saveControlPos(x, y) {
    try {
        fs.writeFileSync(CONTROL_POS_FILE, JSON.stringify({ x, y }));
    } catch (e) { /* ignore save errors */ }
}

let mainWin = null;
let controlWin = null;
let settingsWin = null;
let calenderWin = null;
let isEditMode = false;

// Function to keep window at desktop level
function setDesktopLevel(window) {
    if (!window || window.isDestroyed()) return;

    // Remove from taskbar and set to lowest level
    window.setSkipTaskbar(true);
    window.setAlwaysOnTop(false);
    window.blur();

    // Set window to be non-focusable when not editing
    if (!isEditMode) {
        // On Windows, we can manipulate window properties
        if (process.platform === 'win32') {
            try {
                // Use setIgnoreMouseEvents to make it desktop-like
                window.setIgnoreMouseEvents(true, { forward: true });
            } catch (e) {
                console.log('Could not set mouse ignore:', e);
            }
        }
    }
}



app.whenReady().then(() => {

    // Auto-launch setup (Windows only)
    if (process.platform === 'win32') {
        const myAppAutoLauncher = new AutoLaunch({
            name: 'MyWall',
            path: app.getPath('exe'),
        });

        myAppAutoLauncher.isEnabled()
            .then((isEnabled) => {
                if (!isEnabled) myAppAutoLauncher.enable();
            })
            .catch(err => console.error('AutoLaunch error:', err));
    }

    // --- Tray setup ---
    tray = new Tray(path.join(__dirname, 'renderer/assets/images/logo.png')); // replace with your icon path
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Notes', click: () => mainWin.show() },
        {
            label: 'Toggle Edit Mode', click: () => {
                isEditMode ? activateDesktopMode() : activateEditMode();
            }
        },
        { label: 'Exit', click: () => app.quit() }
    ]);
    tray.setToolTip('My Electron Notes');
    tray.setContextMenu(contextMenu);

    const primary = screen.getPrimaryDisplay();
    const { width, height } = primary.bounds;

    // Main window - Desktop notes overlay
    mainWin = new BrowserWindow({
        x: 0, y: 0,
        width,
        height,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        focusable: false, // Start as non-focusable
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWin.loadFile(path.join(__dirname, 'renderer/windows/main/index.html'));

    // Start in desktop mode
    mainWin.once('ready-to-show', () => {
        logMachineConfig(mainWin)
        mainWin.setSkipTaskbar(true);
        setDesktopLevel(mainWin);
        console.log('Notes attached to desktop level');
    });

    // Control window - always accessible floating button
    const controlPos = loadControlPos(width, height);
    controlWin = new BrowserWindow({
        x: controlPos.x,
        y: controlPos.y,
        width: 129,
        height: 64,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    controlWin.loadFile(path.join(__dirname, 'renderer/windows/control/control.html'));

    // Persist control window position
    controlWin.on('move', () => {
        try {
            const [x, y] = controlWin.getPosition();
            saveControlPos(x, y);
        } catch (e) { /* ignore */ }
    });

    // Global hotkey to toggle edit mode (Ctrl+Alt+N)
    globalShortcut.register('CommandOrControl+Alt+N', () => {
        const newEditMode = !isEditMode;
        isEditMode = newEditMode;

        if (newEditMode) {
            activateEditMode();
        } else {
            activateDesktopMode();
        }
    });

    // Function to activate edit mode
    function activateEditMode() {
        try {
            isEditMode = true;

            // Make main window interactive
            mainWin.setIgnoreMouseEvents(false);
            mainWin.setFocusable(true);
            mainWin.setAlwaysOnTop(true);

            mainWin.setSkipTaskbar(true);
            console.log('Edit Mode: ON');

            // Update UI
            mainWin.webContents.send('editing-changed', true);
            controlWin.webContents.send('editing-changed', true);
        } catch (error) {
            console.error('Error activating edit mode:', error);
        }
    }

    // Function to activate desktop mode
    function activateDesktopMode() {
        try {
            isEditMode = false;

            // Send window back to desktop level
            mainWin.setAlwaysOnTop(false);
            mainWin.setFocusable(false);
            setDesktopLevel(mainWin);
            controlWin.focus();

            console.log('Desktop Mode: ON');

            // Update UI
            mainWin.webContents.send('editing-changed', false);
            controlWin.webContents.send('editing-changed', false);
        } catch (error) {
            console.error('Error activating desktop mode:', error);
        }
    }

    // IPC: toggle edit mode from control window
    ipcMain.on('toggle-edit', (evt, editing) => {
        isEditMode = editing;

        if (editing) {
            activateEditMode();
        } else {
            activateDesktopMode();
        }
    });

    ipcMain.on('close-app', () => {
        app.quit();
    });

    ipcMain.on('update-note-styles', (evt, settings) => {
        mainWin.webContents.send('apply-note-styles', settings);
    });

    ipcMain.on('resize-control', (evt, size) => {
        if (controlWin && !controlWin.isDestroyed()) {
            controlWin.setContentSize(size.width, size.height);
        }
    });

    // Settings window handlers
    ipcMain.on('open-settings-window', () => {
        if (settingsWin && !settingsWin.isDestroyed()) {
            settingsWin.focus();
            return;
        }
        const selectPos = loadControlPos(width, height);

        settingsWin = new BrowserWindow({
            x: selectPos.x,
            y: selectPos.y + 100,
            frame: false,
            transparent: true,
            resizable: false,
            skipTaskbar: true,
            alwaysOnTop: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        });

        settingsWin.loadFile(path.join(__dirname, 'renderer/windows/settings/settings.html'));

        settingsWin.on('closed', () => {
            settingsWin = null;
        });
    });

    ipcMain.on('resize-settings', (evt, size) => {
        if (settingsWin && !settingsWin.isDestroyed()) {
            settingsWin.setContentSize(size.width, size.height);
        }
    });

    ipcMain.on('close-settings-window', () => {
        if (settingsWin && !settingsWin.isDestroyed()) {
            settingsWin.close();
        }
    });


    // ----------------------------------------------

    // Calender window handlers
    ipcMain.on('open-calender-window', () => {

        if (calenderWin && !calenderWin.isDestroyed()) {
            calenderWin.focus();
            return;
        }
        const calenderWinPos = loadControlPos(width, height);

        calenderWin = new BrowserWindow({
            x: calenderWinPos.x - 100,
            y: calenderWinPos.y + 200,
            frame: false,
            transparent: true,
            resizable: false,
            skipTaskbar: true,
            alwaysOnTop: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        });

        calenderWin.loadFile(path.join(__dirname, 'renderer/windows/calender/calender.html'));

        calenderWin.on('closed', () => {
            calenderWin = null;
        });
    });

    ipcMain.on('resize-calender', (evt, size) => {
        if (calenderWin && !calenderWin.isDestroyed()) {
            calenderWin.setContentSize(size.width, size.height);
        }
    });

    ipcMain.on('close-calender-window', () => {
        console.log('closed calender window');

        if (calenderWin && !calenderWin.isDestroyed()) {
            calenderWin.close();
        }
    });

    // ----------------------------------------------


    // Keep main window at desktop level when other windows get focus
    app.on('browser-window-focus', (event, win) => {
        if (!isEditMode && win !== controlWin) {
            setTimeout(() => {
                setDesktopLevel(mainWin);
            }, 100);
        }
    });

    // Handle window blur - return to desktop level if not in edit mode
    mainWin.on('blur', () => {
        if (!isEditMode) {
            setTimeout(() => {
                setDesktopLevel(mainWin);
            }, 50);
        }
    });

    // Periodic check to maintain desktop level
    setInterval(() => {
        if (!isEditMode && mainWin && !mainWin.isDestroyed()) {
            if (mainWin.isFocused() || mainWin.isAlwaysOnTop()) {
                setDesktopLevel(mainWin);
            }
        }
    }, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            // Recreation logic if needed
        }
    });

    // Cleanup
    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

function logMachineConfig(mainWin) {

    try{
        
    console.log("=== MACHINE CONFIG DEBUG ===");

    // OS + Electron environment
    console.log("Platform:", process.platform, os.release());
    console.log("Electron version:", process.versions.electron);
    console.log("Chrome version:", process.versions.chrome);
    console.log("Node version:", process.versions.node);

    // GPU & acceleration info
    mainWin.webContents.getGPUInfo('complete').then(info => {
        console.log("GPU Info:", JSON.stringify(info, null, 2));
    }).catch(err => console.error("GPU info error:", err));

    // Display info
    const displays = screen.getAllDisplays();
    displays.forEach((d, i) => {
        console.log(`Display ${i}:`, {
            id: d.id,
            bounds: d.bounds,
            scaleFactor: d.scaleFactor,
            rotation: d.rotation,
            touchSupport: d.touchSupport
        });
    });

    // Window flags
    console.log("Window flags:", {
        focusable: mainWin.isFocusable(),
        alwaysOnTop: mainWin.isAlwaysOnTop(),
        visible: mainWin.isVisible(),
        minimized: mainWin.isMinimized(),
        skipTaskbar: mainWin.isSkipTaskbar()
    });

    // Focus assist state (Windows only)
    if (process.platform === 'win32' && systemPreferences.getUserDefault) {
        try {
            // Focus Assist might affect z-ordering
            const quietHours = systemPreferences.getUserDefault('UserActivityPresence', 'string');
            console.log("Focus Assist (UserActivityPresence):", quietHours);
        } catch (e) {
            console.log("Focus Assist info not available:", e.message);
        }
    }
    }catch(e){
        console.error(e)
    }

    console.log("=== END CONFIG ===");
}