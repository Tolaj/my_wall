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

ipcRenderer.send("open-calendar-window");
ipcRenderer.send("open-weather-window");
