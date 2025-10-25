const { ipcRenderer } = require("electron");

const btn = document.getElementById("btn");
const closeBtn = document.getElementById("closeBtn");
const settBtn = document.getElementById("settBtn");

let editing = false;

// Toggle editing mode
btn.addEventListener("click", () => {
    editing = !editing;
    ipcRenderer.send("toggle-edit", editing);
    updateUI();
});

// Sync editing state from main process
ipcRenderer.on("editing-changed", (event, isEditing) => {
    editing = isEditing;
    updateUI();
});

// Update button UI
function updateUI() {
    btn.textContent = editing ? "Stop" : "Start";
}

// Close app
closeBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to close the application?")) {
        ipcRenderer.send("close-app");
    }
});

// Open settings window
settBtn.addEventListener("click", () => {
    ipcRenderer.send("open-settings-window");
});

// Define default settings
const defaultSettings = {
    calendarSettings: { toggleShow: false },
    weatherSettings: { toggleShow: false },
    timeSettings: { toggleShow: false },
    dateSettings: { toggleShow: false }

};

// Load saved settings or use defaults
const savedSettings = JSON.parse(localStorage.getItem('global_settings') || '{}');

// Merge saved settings with defaults
const settings = {
    calendarSettings: {
        ...defaultSettings.calendarSettings,
        ...savedSettings.calendarSettings
    },
    weatherSettings: {
        ...defaultSettings.weatherSettings,
        ...savedSettings.weatherSettings
    },
    timeSettings: {
        ...defaultSettings.timeSettings,
        ...savedSettings.timeSettings
    },
    dateSettings: {
        ...defaultSettings.dateSettings,
        ...savedSettings.dateSettings
    }
};

// Open calendar window if enabled
if (settings.calendarSettings.toggleShow) {
    ipcRenderer.send("open-calendar-window");
}

// Open weather window if enabled
if (settings.weatherSettings.toggleShow) {
    ipcRenderer.send("open-weather-window");
}

// Open time window if enabled
if (settings.timeSettings.toggleShow) {
    ipcRenderer.send("open-time-window");
}

// Open date window if enabled
if (settings.dateSettings.toggleShow) {
    ipcRenderer.send("open-date-window");
}