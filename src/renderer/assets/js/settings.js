const { ipcRenderer } = require("electron");

const defaultToolbarConfig = {
    fontSelect: true,
    sizeSelect: true,
    bold: true,
    italic: true,
    underline: true,
    strikeThrough: true,
    textColor: true,
    bgColor: true,
    insertOrderedList: true,
    insertUnorderedList: true,
    outdent: true,
    indent: true,
    justifyLeft: true,
    justifyCenter: true,
    justifyRight: true,
    clearFormat: true
};

const settings = {
    notesSettings: {
        toggleShow: true,
        toolbarConfig: { ...defaultToolbarConfig }
    },
    calendarSettings: { toggleShow: false },
    weatherSettings: { toggleShow: false }
};

const notesToggle = document.getElementById('notesToggle');
const calendarToggle = document.getElementById('calendarToggle');
const weatherToggle = document.getElementById('weatherToggle');
const notesSettingsSection = document.getElementById('notesSettingsSection');
const resetSettings = document.getElementById('resetSettings');
const closeDialog = document.getElementById('closeDialog');
const toolbarToggles = document.querySelectorAll('.toolbar-icon-toggle');

// Load saved settings
function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('global_settings') || '{}');

    if (saved.notesSettings) {
        notesToggle.checked = saved.notesSettings.toggleShow ?? true;

        // Load toolbar config
        if (saved.notesSettings.toolbarConfig) {
            settings.notesSettings.toolbarConfig = {
                ...defaultToolbarConfig,
                ...saved.notesSettings.toolbarConfig
            };
        }
    }
    if (saved.calendarSettings) {
        calendarToggle.checked = saved.calendarSettings.toggleShow ?? false;
    }
    if (saved.weatherSettings) {
        weatherToggle.checked = saved.weatherSettings.toggleShow ?? false;
    }

    updateUIVisibility();
    updateToolbarToggles();
}

// Update toolbar toggle buttons appearance
function updateToolbarToggles() {
    toolbarToggles.forEach(toggle => {
        const item = toggle.dataset.toolbarItem;
        if (settings.notesSettings.toolbarConfig[item]) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    });
}

// Update Notes settings section visibility
function updateUIVisibility() {
    notesSettingsSection.style.display = notesToggle.checked ? 'block' : 'none';
}

function updateSubWindowState() {
    if (settings.calendarSettings.toggleShow) {
        ipcRenderer.send('open-calendar-window')
    } else {
        ipcRenderer.send('close-calendar-window')
    }

    if (settings.weatherSettings.toggleShow) {
        ipcRenderer.send('open-weather-window')
    } else {
        ipcRenderer.send('close-weather-window')
    }

}

// Apply settings immediately
function applySettingsImmediately() {
    settings.notesSettings.toggleShow = notesToggle.checked;
    settings.calendarSettings.toggleShow = calendarToggle.checked;
    settings.weatherSettings.toggleShow = weatherToggle.checked;

    localStorage.setItem('global_settings', JSON.stringify(settings));
    ipcRenderer.send('update-global-settings', settings);
    ipcRenderer.send('update-main-Window-state', settings);

    updateSubWindowState()
    updateUIVisibility();
}

// Handle toolbar toggle clicks
toolbarToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const item = toggle.dataset.toolbarItem;
        settings.notesSettings.toolbarConfig[item] = !settings.notesSettings.toolbarConfig[item];

        toggle.classList.toggle('active');

        localStorage.setItem('global_settings', JSON.stringify(settings));
        ipcRenderer.send('update-global-settings', settings);
    });
});

// Event listeners
notesToggle.addEventListener('change', applySettingsImmediately);
calendarToggle.addEventListener('change', applySettingsImmediately);
weatherToggle.addEventListener('change', applySettingsImmediately);

resetSettings.addEventListener('click', () => {
    notesToggle.checked = true;
    calendarToggle.checked = false;
    weatherToggle.checked = false;
    settings.notesSettings.toolbarConfig = { ...defaultToolbarConfig };

    updateToolbarToggles();
    applySettingsImmediately();
});

closeDialog.addEventListener('click', () => {
    ipcRenderer.send('close-settings-window');
});

function sendCurrentSize() {
    const rect = settingsDialog.getBoundingClientRect();
    ipcRenderer.send('resize-settings', { width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
}

sendCurrentSize();
loadSettings()
