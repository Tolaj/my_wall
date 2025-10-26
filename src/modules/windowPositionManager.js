import fs from 'fs';
import path from 'path';
import { app, screen } from 'electron';

// Function to get the file path for window position
function getWindowPosFile(windowName) {
    return path.join(app.getPath('userData'), `${windowName}-pos.json`);
}

// Function to load window position
function loadWindowPos(windowName, displayWidth, displayHeight) {
    const posFile = getWindowPosFile(windowName);
    try {
        const raw = fs.readFileSync(posFile, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        // If file does not exist, center the window on the screen
        return {
            x: Math.max(20, (displayWidth - 800) / 2),  // Default width (e.g., 800px)
            y: Math.max(20, (displayHeight - 600) / 2), // Default height (e.g., 600px)
        };
    }
}

// Function to save window position
function saveWindowPos(windowName, x, y) {
    const posFile = getWindowPosFile(windowName);
    try {
        fs.writeFileSync(posFile, JSON.stringify({ x, y }));
    } catch (e) {
        console.error(`Error saving position for ${windowName}:`, e);
    }
}

// Get the display size for the main screen
function getDisplaySize() {
    const primaryDisplay = screen.getPrimaryDisplay();
    return primaryDisplay.workAreaSize; // workAreaSize gives you the usable screen area
}

export { loadWindowPos, saveWindowPos, getDisplaySize };
