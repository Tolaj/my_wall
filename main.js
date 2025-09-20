// main.js
const { app, BrowserWindow, ipcMain, screen } = require('electron');
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

app.whenReady().then(() => {
    const primary = screen.getPrimaryDisplay();
    const { width, height } = primary.bounds;

    // Fullscreen transparent overlay window (note)
    const mainWin = new BrowserWindow({
        x: 0, y: 0,
        width,
        height,
        frame: false,
        transparent: true,
        resizable: true,
        movable: false,
        focusable: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // quick prototype: prefer preload + contextIsolation in production
        }
    });

    // start in pass-through (clicks go to desktop)
    mainWin.setIgnoreMouseEvents(true, { forward: true });
    // put above wallpaper; 'screen-saver' tends to work for staying on desktop layer
    mainWin.setAlwaysOnTop(true, 'screen-saver');
    mainWin.loadFile(path.join(__dirname, 'index.html'));

    // Small control window that contains the Add button (always interactive)
    const controlPos = loadControlPos(width, height);
    const controlWin = new BrowserWindow({
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

    // Persist control window position on move
    controlWin.on('move', () => {
        try {
            const [x, y] = controlWin.getPosition();
            saveControlPos(x, y);
        } catch (e) { /* ignore */ }
    });

    // IPC: toggle edit mode (sent from control window)
    ipcMain.on('toggle-edit', (evt, editing) => {
        if (editing) {
            // stop passing clicks through -> accept pointer & keyboard
            mainWin.setIgnoreMouseEvents(false);
            // ensure keyboard goes to the main overlay
            mainWin.focus();
        } else {
            // restore passthrough so desktop/apps receive click where not interacting
            mainWin.setIgnoreMouseEvents(true, { forward: true });
            // focus control so user can continue moving the button if needed
            controlWin.focus();
        }

        // inform both windows so they can update UI
        mainWin.webContents.send('editing-changed', editing);
        controlWin.webContents.send('editing-changed', editing);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            // not implemented re-creation here — on most OSes the windows persist
        }
    });
});

// tidy quit behavior
app.on('window-all-closed', () => {
    // keep app running on mac if you want; we'll quit for simplicity
    if (process.platform !== 'darwin') app.quit();
});
