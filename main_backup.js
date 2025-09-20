// main.js - Pure Electron Desktop Widget Solution
const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const CONTROL_POS_FILE = path.join(app.getPath('userData'), 'control-pos.json');

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
let isEditMode = false;

// ✅ Function to keep window at desktop level
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
    const primary = screen.getPrimaryDisplay();
    const { width, height } = primary.bounds;

    // ✅ Main window - Desktop notes overlay
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

    mainWin.loadFile(path.join(__dirname, 'index.html'));

    // Start in desktop mode
    mainWin.once('ready-to-show', () => {
        setDesktopLevel(mainWin);
        console.log('🖥️  Notes attached to desktop level');
    });

    // ✅ Control window - always accessible floating button
    const controlPos = loadControlPos(width, height);
    controlWin = new BrowserWindow({
        x: controlPos.x,
        y: controlPos.y,
        width: 150,
        height: 64,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    controlWin.loadFile(path.join(__dirname, 'control.html'));

    // Persist control window position
    controlWin.on('move', () => {
        try {
            const [x, y] = controlWin.getPosition();
            saveControlPos(x, y);
        } catch (e) { /* ignore */ }
    });

    // ✅ Global hotkey to toggle edit mode (Ctrl+Alt+N)
    globalShortcut.register('CommandOrControl+Alt+N', () => {
        const newEditMode = !isEditMode;
        isEditMode = newEditMode;

        if (newEditMode) {
            activateEditMode();
        } else {
            activateDesktopMode();
        }
    });

    // ✅ Function to activate edit mode
    function activateEditMode() {
        try {
            isEditMode = true;

            // Make main window interactive
            mainWin.setIgnoreMouseEvents(false);
            mainWin.setFocusable(true);
            mainWin.setAlwaysOnTop(true);
            mainWin.show();
            mainWin.focus();

            console.log('📝 Edit Mode: ON');

            // Update UI
            mainWin.webContents.send('editing-changed', true);
            controlWin.webContents.send('editing-changed', true);
        } catch (error) {
            console.error('Error activating edit mode:', error);
        }
    }

    // ✅ Function to activate desktop mode
    function activateDesktopMode() {
        try {
            isEditMode = false;

            // Send window back to desktop level
            mainWin.setAlwaysOnTop(false);
            mainWin.setFocusable(false);
            setDesktopLevel(mainWin);
            controlWin.focus();

            console.log('🖥️  Desktop Mode: ON');

            // Update UI
            mainWin.webContents.send('editing-changed', false);
            controlWin.webContents.send('editing-changed', false);
        } catch (error) {
            console.error('Error activating desktop mode:', error);
        }
    }

    // ✅ IPC: toggle edit mode from control window
    ipcMain.on('toggle-edit', (evt, editing) => {
        isEditMode = editing;

        if (editing) {
            activateEditMode();
        } else {
            activateDesktopMode();
        }
    });

    // ✅ Keep main window at desktop level when other windows get focus
    app.on('browser-window-focus', (event, win) => {
        if (!isEditMode && win !== controlWin) {
            setTimeout(() => {
                setDesktopLevel(mainWin);
            }, 100);
        }
    });

    // ✅ Handle window blur - return to desktop level if not in edit mode
    mainWin.on('blur', () => {
        if (!isEditMode) {
            setTimeout(() => {
                setDesktopLevel(mainWin);
            }, 50);
        }
    });

    // ✅ Periodic check to maintain desktop level
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

// ✅ Additional Windows-specific tweaks
if (process.platform === 'win32') {
    app.on('ready', () => {
        // Hide from Alt+Tab switcher
        if (mainWin) {
            mainWin.setSkipTaskbar(true);
        }
    });
}