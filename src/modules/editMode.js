
const { sendToBottom } = require('./windowUtils')

let editMode = false;

function isEditMode() {
    return editMode;
}

function activateEditMode(mainWin, controlWin) {
    editMode = true;
    mainWin.setIgnoreMouseEvents(false);
    mainWin.setFocusable(true);
    mainWin.setAlwaysOnTop(false);
    setTimeout(() => {
        sendToBottom(mainWin);
    }, 10);

    mainWin.webContents.send('editing-changed', true);
    controlWin.webContents.send('editing-changed', true);
    mainWin.setSkipTaskbar(true);
}

function activateDesktopMode(mainWin, controlWin) {
    editMode = false;
    mainWin.setFocusable(false);
    mainWin.setAlwaysOnTop(false);
    mainWin.setIgnoreMouseEvents(true, { forward: true });
    mainWin.webContents.send('editing-changed', false);
    controlWin.webContents.send('editing-changed', false);
}

function setDesktopLevel(win) {
    if (!win || win.isDestroyed()) return;
    win.setSkipTaskbar(true);
    win.setAlwaysOnTop(false);
    win.blur();
    if (!editMode) win.setIgnoreMouseEvents(true, { forward: true });
}

module.exports = { isEditMode, activateEditMode, activateDesktopMode, setDesktopLevel };
