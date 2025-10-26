import { Tray, Menu } from 'electron';
import path from 'path';
import { activateEditMode, activateDesktopMode, isEditMode } from './editMode.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function setupTray(mainWin, controlWin, app) {
    const tray = new Tray(path.join(__dirname, '../renderer/assets/images/logo.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Notes', click: () => mainWin.show() },
        {
            label: 'Toggle Edit Mode', click: () => {
                isEditMode() ? activateDesktopMode(mainWin, controlWin) : activateEditMode(mainWin, controlWin);
            }
        },
        { label: 'Exit', click: () => app.quit() }
    ]);
    tray.setToolTip('My Electron Notes');
    tray.setContextMenu(contextMenu);
}

export { setupTray };
