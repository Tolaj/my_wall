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
    weatherSettings: {
        toggleShow: false
    },
    dateSettings: {
        toggleShow: false,
        timezone: 'America/New_York',
        theme: {
            bgColor: '#ffd868',
            bgOpacity: 98,
            borderColor: '#ffd868',
            borderOpacity: 100,
            textColor: '#ffd868',
            fontFamily: 'Lato',
            bgCoverEnabled: true,
            fontSize: 30,
            dateFormat: 'long',

        }
    },
    timeSettings: {
        toggleShow: false,
        timezone: 'America/New_York',
        theme: {
            bgColor: '#ffd868',
            bgOpacity: 100,
            borderColor: '#ffd868',
            borderOpacity: 100,
            textColor: '#ffd868',
            fontFamily: 'Lato',
            bgCoverEnabled: true,
            fontSize: 50,
            showSeconds: true,
        }
    }
};


const settingSections = document.querySelectorAll('.setting-section');

const notesToggle = document.getElementById('notesToggle');
const calendarToggle = document.getElementById('calendarToggle');
const weatherToggle = document.getElementById('weatherToggle');
const dateToggle = document.getElementById('dateToggle');
const timeToggle = document.getElementById('timeToggle');
const notesSettingsSection = document.getElementById('notesSettingsSection');
const calendarSettingsSection = document.getElementById('calendarSettingsSection');
const dateSettingsSection = document.getElementById('dateSettingsSection');
const timeSettingsSection = document.getElementById('timeSettingsSection');
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

// Date elements
const dateTimezoneSelect = document.getElementById('dateTimezoneSelect');
const dateBgColor = document.getElementById('dateBgColor');
const dateBgOpacity = document.getElementById('dateBgOpacity');
const dateBorderColor = document.getElementById('dateBorderColor');
const dateBorderOpacity = document.getElementById('dateBorderOpacity');
const dateTextColor = document.getElementById('dateTextColor');
const dateFontSelect = document.getElementById('dateFontSelect');
const dateBgCoverToggle = document.getElementById('dateBgCoverToggle');
const dateFontSize = document.getElementById('dateFontSize');
const dateFormatSelect = document.getElementById('dateFormatSelect');

// Time elements
const timeTimezoneSelect = document.getElementById('timeTimezoneSelect');
const timeBgColor = document.getElementById('timeBgColor');
const timeBgOpacity = document.getElementById('timeBgOpacity');
const timeBorderColor = document.getElementById('timeBorderColor');
const timeBorderOpacity = document.getElementById('timeBorderOpacity');
const timeTextColor = document.getElementById('timeTextColor');
const timeFontSelect = document.getElementById('timeFontSelect');
const timeBgCoverToggle = document.getElementById('timeBgCoverToggle');
const timeFontSize = document.getElementById('timeFontSize');
const timeShowSeconds = document.getElementById('timeShowSeconds');


function updateArrowVisibility() {
    settingSections.forEach(section => {
        const toggle = section.querySelector('.window-toggle');
        const arrow = section.querySelector('.arrow-icon');
        const dropdown = section.querySelector('.dropdown-content');

        if (!toggle || !arrow) return;

        if (toggle.checked) {
            arrow.classList.remove('hidden');
        } else {
            arrow.classList.add('hidden');
            if (dropdown) {
                dropdown.classList.remove('open');
                arrow.classList.remove('rotate-90');
            }
        }
    });
}

function initializeDropdownBehavior() {
    settingSections.forEach(section => {
        const toggle = section.querySelector('.window-toggle');
        const arrow = section.querySelector('.arrow-icon');
        const dropdown = section.querySelector('.dropdown-content');

        if (!toggle || !arrow || !dropdown) return;

        // Show/hide arrow when toggle changes
        toggle.addEventListener('change', () => {
            updateArrowVisibility();
        });

        // Expand/collapse dropdown on arrow click
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
            arrow.classList.toggle('rotate-90');
        });
    });

}


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
        settings.weatherSettings = {
            ...settings.weatherSettings,
            ...saved.weatherSettings
        };
    }

    // Load Date Settings
    if (saved.dateSettings) {
        dateToggle.checked = saved.dateSettings.toggleShow ?? false;
        settings.dateSettings.timezone = saved.dateSettings.timezone ?? 'America/New_York';

        if (dateTimezoneSelect) {
            dateTimezoneSelect.value = settings.dateSettings.timezone;
        }

        if (saved.dateSettings.theme) {
            settings.dateSettings.theme = {
                ...settings.dateSettings.theme,
                ...saved.dateSettings.theme
            };

            if (dateBgColor) dateBgColor.value = settings.dateSettings.theme.bgColor;
            if (dateBgOpacity) dateBgOpacity.value = settings.dateSettings.theme.bgOpacity;
            if (dateBorderColor) dateBorderColor.value = settings.dateSettings.theme.borderColor;
            if (dateBorderOpacity) dateBorderOpacity.value = settings.dateSettings.theme.borderOpacity ?? 100;
            if (dateTextColor) dateTextColor.value = settings.dateSettings.theme.textColor;
            if (dateFontSelect) dateFontSelect.value = settings.dateSettings.theme.fontFamily ?? 'Lato';
            if (dateBgCoverToggle) dateBgCoverToggle.checked = settings.dateSettings.theme.bgCoverEnabled ?? true;
            if (dateFontSize) dateFontSize.value = settings.dateSettings.theme.fontSize ?? 30;
            if (dateFormatSelect) dateFormatSelect.value = settings.dateSettings.dateFormat;


        }
    }

    // Load Time Settings
    if (saved.timeSettings) {
        timeToggle.checked = saved.timeSettings.toggleShow ?? false;
        settings.timeSettings.timezone = saved.timeSettings.timezone ?? 'America/New_York';

        if (timeTimezoneSelect) {
            timeTimezoneSelect.value = settings.timeSettings.timezone;
        }

        if (saved.timeSettings.theme) {
            settings.timeSettings.theme = {
                ...settings.timeSettings.theme,
                ...saved.timeSettings.theme
            };

            if (timeBgColor) timeBgColor.value = settings.timeSettings.theme.bgColor;
            if (timeBgOpacity) timeBgOpacity.value = settings.timeSettings.theme.bgOpacity;
            if (timeBorderColor) timeBorderColor.value = settings.timeSettings.theme.borderColor;
            if (timeBorderOpacity) timeBorderOpacity.value = settings.timeSettings.theme.borderOpacity ?? 100;
            if (timeTextColor) timeTextColor.value = settings.timeSettings.theme.textColor;
            if (timeFontSelect) timeFontSelect.value = settings.timeSettings.theme.fontFamily ?? 'Lato';
            if (timeBgCoverToggle) timeBgCoverToggle.checked = settings.timeSettings.theme.bgCoverEnabled ?? true;
            if (timeFontSize) timeFontSize.value = settings.timeSettings.theme.fontSize ?? 50;
            if (timeShowSeconds) timeShowSeconds.checked = settings.timeSettings.showSeconds;

        }
    }

    updateUIVisibility();
    updateToolbarToggles();

    updateArrowVisibility();
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
    dateSettingsSection.style.display = dateToggle.checked ? 'block' : 'none';
    timeSettingsSection.style.display = timeToggle.checked ? 'block' : 'none';
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

    if (settings.dateSettings.toggleShow) {
        ipcRenderer.send('open-date-window')
    } else {
        ipcRenderer.send('close-date-window')
    }

    if (settings.timeSettings.toggleShow) {
        ipcRenderer.send('open-time-window')
    } else {
        ipcRenderer.send('close-time-window')
    }
}

// Apply settings immediately
function applySettingsImmediately() {
    settings.notesSettings.toggleShow = notesToggle.checked;
    settings.calendarSettings.toggleShow = calendarToggle.checked;
    settings.weatherSettings.toggleShow = weatherToggle.checked;
    settings.dateSettings.toggleShow = dateToggle.checked;
    settings.timeSettings.toggleShow = timeToggle.checked;

    localStorage.setItem('global_settings', JSON.stringify(settings));
    ipcRenderer.send('update-global-settings', settings);
    ipcRenderer.send('update-main-Window-state', settings);
    ipcRenderer.send('update-calendar-settings', settings);
    ipcRenderer.send('update-weather-settings', settings);
    ipcRenderer.send('update-date-settings', settings);
    ipcRenderer.send('update-time-settings', settings);

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

// Handle calendar timezone change
if (timezoneSelect) {
    timezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.calendarSettings.timezone = selectedTimezone;
        applySettingsImmediately();
    });
}

// Handle date timezone change
if (dateTimezoneSelect) {
    dateTimezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.dateSettings.timezone = selectedTimezone;
        applySettingsImmediately();
    });
}

// Handle time timezone change
if (timeTimezoneSelect) {
    timeTimezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.timeSettings.timezone = selectedTimezone;
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

// Handle date theme changes
if (dateBgColor) {
    dateBgColor.addEventListener('input', (e) => {
        settings.dateSettings.theme.bgColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (dateBgOpacity) {
    dateBgOpacity.addEventListener('input', (e) => {
        settings.dateSettings.theme.bgOpacity = parseInt(e.target.value);
        applySettingsImmediately();
    });
}

if (dateBorderColor) {
    dateBorderColor.addEventListener('input', (e) => {
        settings.dateSettings.theme.borderColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (dateBorderOpacity) {
    dateBorderOpacity.addEventListener('input', (e) => {
        settings.dateSettings.theme.borderOpacity = parseInt(e.target.value);
        applySettingsImmediately();
    });
}

if (dateTextColor) {
    dateTextColor.addEventListener('input', (e) => {
        settings.dateSettings.theme.textColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (dateFontSelect) {
    dateFontSelect.addEventListener('change', (e) => {
        settings.dateSettings.theme.fontFamily = e.target.value;
        applySettingsImmediately();
    });
}

if (dateFontSize) {
    dateFontSize.addEventListener('input', (e) => {
        settings.dateSettings.theme.fontSize = parseFloat(e.target.value);
        applySettingsImmediately();
    });
}

// Date format change
if (dateFormatSelect) {
    dateFormatSelect.addEventListener('change', (e) => {
        settings.dateSettings.dateFormat = e.target.value;
        applySettingsImmediately();
    });
}



if (dateBgCoverToggle) {
    dateBgCoverToggle.addEventListener('change', (e) => {
        settings.dateSettings.theme.bgCoverEnabled = e.target.checked;
        applySettingsImmediately();
    });
}

// Handle time theme changes
if (timeBgColor) {
    timeBgColor.addEventListener('input', (e) => {
        settings.timeSettings.theme.bgColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (timeBgOpacity) {
    timeBgOpacity.addEventListener('input', (e) => {
        settings.timeSettings.theme.bgOpacity = parseInt(e.target.value);
        applySettingsImmediately();
    });
}

if (timeBorderColor) {
    timeBorderColor.addEventListener('input', (e) => {
        settings.timeSettings.theme.borderColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (timeBorderOpacity) {
    timeBorderOpacity.addEventListener('input', (e) => {
        settings.timeSettings.theme.borderOpacity = parseInt(e.target.value);
        applySettingsImmediately();
    });
}

if (timeTextColor) {
    timeTextColor.addEventListener('input', (e) => {
        settings.timeSettings.theme.textColor = e.target.value;
        updateInputStyles(e.target, e.target.value);
        applySettingsImmediately();
    });
}

if (timeFontSelect) {
    timeFontSelect.addEventListener('change', (e) => {
        settings.timeSettings.theme.fontFamily = e.target.value;
        applySettingsImmediately();
    });
}

if (timeFontSize) {
    timeFontSize.addEventListener('input', (e) => {
        settings.timeSettings.theme.fontSize = parseFloat(e.target.value);
        applySettingsImmediately();
    });
}

// Time show seconds toggle
if (timeShowSeconds) {
    timeShowSeconds.addEventListener('change', (e) => {
        settings.timeSettings.showSeconds = e.target.checked;
        applySettingsImmediately();
    });
}

if (timeBgCoverToggle) {
    timeBgCoverToggle.addEventListener('change', (e) => {
        settings.timeSettings.theme.bgCoverEnabled = e.target.checked;
        applySettingsImmediately();
    });
}

// Event listeners
notesToggle.addEventListener('change', applySettingsImmediately);
calendarToggle.addEventListener('change', () => {
    applySettingsImmediately()
    updateSubWindowState()
});
weatherToggle.addEventListener('change', () => {
    applySettingsImmediately();
    updateSubWindowState();
});
dateToggle.addEventListener('change', () => {
    applySettingsImmediately();
    updateSubWindowState();
});
timeToggle.addEventListener('change', () => {
    applySettingsImmediately();
    updateSubWindowState();
});

resetSettings.addEventListener('click', () => {
    notesToggle.checked = true;
    calendarToggle.checked = false;
    weatherToggle.checked = false;
    dateToggle.checked = false;
    timeToggle.checked = false;
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
    settings.weatherSettings.toggleShow = false;
    settings.dateSettings.timezone = 'America/New_York';
    settings.dateSettings.theme = {
        bgColor: '#ffd868',
        bgOpacity: 98,
        borderColor: '#ffd868',
        borderOpacity: 100,
        textColor: '#ffd868',
        fontFamily: 'Lato',
        fontSize: 30,
        dateFormat: 'long',

        bgCoverEnabled: true
    };
    settings.timeSettings.timezone = 'America/New_York';
    settings.timeSettings.theme = {
        bgColor: '#ffd868',
        bgOpacity: 100,
        borderColor: '#ffd868',
        borderOpacity: 100,
        textColor: '#ffd868',
        fontFamily: 'Lato',
        fontSize: 50,
        showSeconds: true,
        bgCoverEnabled: true
    };

    if (timezoneSelect) {
        timezoneSelect.value = 'UTC';
    }

    // Reset calendar theme inputs
    if (calendarBgColor) calendarBgColor.value = '#ffffff';
    if (calendarBgOpacity) calendarBgOpacity.value = 80;
    if (eventBgColor) eventBgColor.value = '#ffffff';
    if (eventBgOpacity) eventBgOpacity.value = 90;
    if (calendarTextColor) calendarTextColor.value = '#000000';
    if (eventTextColor) eventTextColor.value = '#000000';
    if (insightColor) insightColor.value = '#4f46e5';
    if (insightTextColor) insightTextColor.value = '#ffffff';

    // Reset date inputs
    if (dateTimezoneSelect) dateTimezoneSelect.value = 'America/New_York';
    if (dateBgColor) dateBgColor.value = '#ffd868';
    if (dateBgOpacity) dateBgOpacity.value = 98;
    if (dateBorderColor) dateBorderColor.value = '#ffd868';
    if (dateBorderOpacity) dateBorderOpacity.value = 100;
    if (dateTextColor) dateTextColor.value = '#ffd868';
    if (dateFontSelect) dateFontSelect.value = 'Lato';
    if (dateBgCoverToggle) dateBgCoverToggle.checked = true;
    if (dateFontSize) dateFontSize.value = 30;
    if (dateFormatSelect) dateFormatSelect.value = 'long';

    // Reset time inputs
    if (timeTimezoneSelect) timeTimezoneSelect.value = 'America/New_York';
    if (timeBgColor) timeBgColor.value = '#ffd868';
    if (timeBgOpacity) timeBgOpacity.value = 100;
    if (timeBorderColor) timeBorderColor.value = '#ffd868';
    if (timeBorderOpacity) timeBorderOpacity.value = 100;
    if (timeTextColor) timeTextColor.value = '#ffd868';
    if (timeFontSelect) timeFontSelect.value = 'Lato';
    if (timeBgCoverToggle) timeBgCoverToggle.checked = true;
    if (timeFontSize) timeFontSize.value = 50;
    if (timeShowSeconds) timeShowSeconds.checked = true;

    updateToolbarToggles();
    applySettingsImmediately();
    updateSubWindowState();
    updateArrowVisibility();

    // Send timezone resets
    ipcRenderer.send('set-setting', 'timezone', 'UTC');
    ipcRenderer.send('set-setting', 'date-timezone', 'America/New_York');
    ipcRenderer.send('set-setting', 'time-timezone', 'America/New_York');
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







initializeDropdownBehavior()
sendCurrentSize();
loadSettings();