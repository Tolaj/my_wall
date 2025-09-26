const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const CONTROL_POS_FILE = path.join(app.getPath('userData'), 'control-pos.json');

function loadControlPos(displayWidth, displayHeight) {
    try {
        const raw = fs.readFileSync(CONTROL_POS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return { x: Math.max(20, displayWidth - 180), y: Math.max(20, displayHeight - 120) };
    }
}

function saveControlPos(x, y) {
    try {
        fs.writeFileSync(CONTROL_POS_FILE, JSON.stringify({ x, y }));
    } catch (e) {}
}

module.exports = { loadControlPos, saveControlPos };
