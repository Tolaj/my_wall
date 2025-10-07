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
    calendarSettings: {
        toggleShow: false,
        timezone: 'UTC',
        theme: {
            calendarBgColor: '#ffffff',
            calendarBgOpacity: 80,
            eventBgColor: '#ffffff',
            eventBgOpacity: 90,
            calendarTextColor: '#000000',
            eventTextColor: '#000000',
            insightColor: '#4f46e5',
            insightTextColor: '#ffffff'
        }
    },
    weatherSettings: { toggleShow: false }
};

const notesToggle = document.getElementById('notesToggle');
const calendarToggle = document.getElementById('calendarToggle');
const weatherToggle = document.getElementById('weatherToggle');
const notesSettingsSection = document.getElementById('notesSettingsSection');
const calendarSettingsSection = document.getElementById('calendarSettingsSection');
const resetSettings = document.getElementById('resetSettings');
const closeDialog = document.getElementById('closeDialog');
const toolbarToggles = document.querySelectorAll('.toolbar-icon-toggle');
const timezoneSelect = document.getElementById('timezoneSelect');

// Calendar theme elements
const calendarBgColor = document.getElementById('calendarBgColor');
const calendarBgOpacity = document.getElementById('calendarBgOpacity');
const eventBgColor = document.getElementById('eventBgColor');
const eventBgOpacity = document.getElementById('eventBgOpacity');
const calendarTextColor = document.getElementById('calendarTextColor');
const eventTextColor = document.getElementById('eventTextColor');
const insightColor = document.getElementById('insightColor');
const insightTextColor = document.getElementById('insightTextColor');

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
        settings.calendarSettings.timezone = saved.calendarSettings.timezone ?? 'UTC';

        if (timezoneSelect) {
            timezoneSelect.value = settings.calendarSettings.timezone;
        }

        // Load theme settings
        if (saved.calendarSettings.theme) {
            settings.calendarSettings.theme = {
                ...settings.calendarSettings.theme,
                ...saved.calendarSettings.theme
            };

            // Apply theme values to inputs
            if (calendarBgColor) calendarBgColor.value = settings.calendarSettings.theme.calendarBgColor;
            if (calendarBgOpacity) calendarBgOpacity.value = settings.calendarSettings.theme.calendarBgOpacity;
            if (eventBgColor) eventBgColor.value = settings.calendarSettings.theme.eventBgColor;
            if (eventBgOpacity) eventBgOpacity.value = settings.calendarSettings.theme.eventBgOpacity;
            if (calendarTextColor) calendarTextColor.value = settings.calendarSettings.theme.calendarTextColor;
            if (eventTextColor) eventTextColor.value = settings.calendarSettings.theme.eventTextColor;
            if (insightColor) insightColor.value = settings.calendarSettings.theme.insightColor;
            if (insightTextColor) insightTextColor.value = settings.calendarSettings.theme.insightTextColor;
        }
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

// Update settings sections visibility
function updateUIVisibility() {
    notesSettingsSection.style.display = notesToggle.checked ? 'block' : 'none';
    calendarSettingsSection.style.display = calendarToggle.checked ? 'block' : 'none';
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
    ipcRenderer.send('update-calendar-settings', settings);

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

// Handle timezone change
if (timezoneSelect) {
    timezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.calendarSettings.timezone = selectedTimezone;
        applySettingsImmediately();

    });
}

// Handle calendar theme changes


if (calendarBgColor) {
    calendarBgColor.addEventListener('input', (e) => {
        settings.calendarSettings.theme.calendarBgColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (calendarBgOpacity) {
    calendarBgOpacity.addEventListener('input', (e) => {
        settings.calendarSettings.theme.calendarBgOpacity = parseInt(e.target.value);
        applySettingsImmediately();
    });
}

if (eventBgColor) {
    eventBgColor.addEventListener('input', (e) => {
        settings.calendarSettings.theme.eventBgColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (eventBgOpacity) {
    eventBgOpacity.addEventListener('input', (e) => {
        settings.calendarSettings.theme.eventBgOpacity = parseInt(e.target.value);
        applySettingsImmediately();
    });
}

if (calendarTextColor) {
    calendarTextColor.addEventListener('input', (e) => {
        settings.calendarSettings.theme.calendarTextColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (eventTextColor) {
    eventTextColor.addEventListener('input', (e) => {
        settings.calendarSettings.theme.eventTextColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (insightColor) {
    insightColor.addEventListener('input', (e) => {
        settings.calendarSettings.theme.insightColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (insightTextColor) {
    insightTextColor.addEventListener('input', (e) => {
        settings.calendarSettings.theme.insightTextColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

// Event listeners
notesToggle.addEventListener('change', applySettingsImmediately);
calendarToggle.addEventListener('change', () => {
    applySettingsImmediately()
    updateSubWindowState()
});
weatherToggle.addEventListener('change', applySettingsImmediately);

resetSettings.addEventListener('click', () => {
    notesToggle.checked = true;
    calendarToggle.checked = false;
    weatherToggle.checked = false;
    settings.notesSettings.toolbarConfig = { ...defaultToolbarConfig };
    settings.calendarSettings.timezone = 'UTC';
    settings.calendarSettings.theme = {
        calendarBgColor: '#ffffff',
        calendarBgOpacity: 80,
        eventBgColor: '#ffffff',
        eventBgOpacity: 90,
        calendarTextColor: '#000000',
        eventTextColor: '#000000',
        insightColor: '#4f46e5',
        insightTextColor: '#ffffff'
    };

    if (timezoneSelect) {
        timezoneSelect.value = 'UTC';
    }

    // Reset theme inputs
    if (calendarBgColor) calendarBgColor.value = '#ffffff';
    if (calendarBgOpacity) calendarBgOpacity.value = 80;
    if (eventBgColor) eventBgColor.value = '#ffffff';
    if (eventBgOpacity) eventBgOpacity.value = 90;
    if (calendarTextColor) calendarTextColor.value = '#000000';
    if (eventTextColor) eventTextColor.value = '#000000';
    if (insightColor) insightColor.value = '#4f46e5';
    if (insightTextColor) insightTextColor.value = '#ffffff';

    updateToolbarToggles();
    applySettingsImmediately();

    // Send timezone reset to calendar
    ipcRenderer.send('set-setting', 'timezone', 'UTC');
});

closeDialog.addEventListener('click', () => {
    ipcRenderer.send('close-settings-window');
});

function sendCurrentSize() {
    let settingsDialog = document.getElementById("settingsDialog")
    const rect = settingsDialog.getBoundingClientRect();
    ipcRenderer.send('resize-settings', { width: Math.floor(rect.width), height: Math.floor(rect.height) });
}

const colorInputs = document.querySelectorAll('input[type="color"]');

colorInputs.forEach(input => {
    updateInputStyles(input, input.value);
    input.addEventListener('input', (e) => {
        updateInputStyles(e.target, e.target.value);
    });
});

function updateInputStyles(input, color) {
    input.style.backgroundColor = color;
    input.style.border = `2px solid ${color}`;
    input.style.boxShadow = `0 0 0 1px ${color}`;

    // Contrast-based text color
    const rgb = hexToRgb(color);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    input.style.color = brightness > 125 ? 'black' : 'white';
}

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

sendCurrentSize();
loadSettings();