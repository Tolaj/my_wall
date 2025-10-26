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
    },
    wallpaperSettings: {
        toggleShow: true,
        imagePath: null,
        theme: {
            fitMode: 'cover',
            opacity: 100,
            blur: 0
        }
    }
};

const settingSections = document.querySelectorAll('.setting-section');

const notesToggle = document.getElementById('notesToggle');
const calendarToggle = document.getElementById('calendarToggle');
const weatherToggle = document.getElementById('weatherToggle');
const dateToggle = document.getElementById('dateToggle');
const timeToggle = document.getElementById('timeToggle');
const wallpaperToggle = document.getElementById('wallpaperToggle');

const notesSettingsSection = document.getElementById('notesSettingsSection');
const calendarSettingsSection = document.getElementById('calendarSettingsSection');
const dateSettingsSection = document.getElementById('dateSettingsSection');
const timeSettingsSection = document.getElementById('timeSettingsSection');
const wallpaperSettingsSection = document.getElementById('wallpaperSettingsSection');

const resetSettings = document.getElementById('resetSettings');
const closeDialog = document.getElementById('closeDialog');
const toolbarToggles = document.querySelectorAll('.toolbar-icon-toggle');
const timezoneSelect = document.getElementById('timezoneSelect');

// Wallpaper elements
const selectWallpaperBtn = document.getElementById('selectWallpaperBtn');
const removeWallpaperBtn = document.getElementById('removeWallpaperBtn');
const wallpaperPreview = document.getElementById('wallpaperPreview');
const wallpaperPreviewImg = document.getElementById('wallpaperPreviewImg');
const wallpaperFileName = document.getElementById('wallpaperFileName');
const wallpaperFitMode = document.getElementById('wallpaperFitMode');
const wallpaperOpacity = document.getElementById('wallpaperOpacity');
const wallpaperOpacityValue = document.getElementById('wallpaperOpacityValue');
const wallpaperBlur = document.getElementById('wallpaperBlur');
const wallpaperBlurValue = document.getElementById('wallpaperBlurValue');

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

// Wallpaper feedback listeners
ipcRenderer.on('wallpaper-success', (event, message) => {
    console.log('✓ Wallpaper:', message);
    showNotification('Success', message, 'success');
});

ipcRenderer.on('wallpaper-error', (event, message) => {
    console.error('✗ Wallpaper Error:', message);
    showNotification('Error', message, 'error');
});

ipcRenderer.on('wallpaper-removed', (event, message) => {
    console.log('Wallpaper removed:', message);
    showNotification('Info', 'Wallpaper setting cleared', 'info');
});

// Simple notification function
function showNotification(title, message, type) {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    // You can implement a toast notification UI here if needed
}

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

        toggle.addEventListener('change', () => {
            updateArrowVisibility();
        });

        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
            arrow.classList.toggle('rotate-90');
        });
    });
}

// Load saved settings
async function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('global_settings') || '{}');

    if (saved.notesSettings) {
        notesToggle.checked = saved.notesSettings.toggleShow ?? true;

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

        if (saved.calendarSettings.theme) {
            settings.calendarSettings.theme = {
                ...settings.calendarSettings.theme,
                ...saved.calendarSettings.theme
            };

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

    if (saved.wallpaperSettings) {
        wallpaperToggle.checked = saved.wallpaperSettings.toggleShow ?? true;
        settings.wallpaperSettings.imagePath = saved.wallpaperSettings.imagePath;

        if (saved.wallpaperSettings.theme) {
            settings.wallpaperSettings.theme = {
                ...settings.wallpaperSettings.theme,
                ...saved.wallpaperSettings.theme
            };

            if (wallpaperFitMode) wallpaperFitMode.value = settings.wallpaperSettings.theme.fitMode ?? 'cover';
            if (wallpaperOpacity) wallpaperOpacity.value = settings.wallpaperSettings.theme.opacity ?? 100;
            if (wallpaperBlur) wallpaperBlur.value = settings.wallpaperSettings.theme.blur ?? 0;

            updateWallpaperValueDisplays();
        }

        // Show preview if image exists
        if (settings.wallpaperSettings.imagePath) {
            showWallpaperPreview(settings.wallpaperSettings.imagePath);
        } else {
            // Try to get current system wallpaper
            try {
                const currentWallpaper = await ipcRenderer.invoke('get-current-wallpaper');
                if (currentWallpaper) {
                    settings.wallpaperSettings.imagePath = currentWallpaper;
                    showWallpaperPreview(currentWallpaper);
                }
            } catch (error) {
                console.log('Could not get current wallpaper:', error);
            }
        }
    }

    updateUIVisibility();
    updateToolbarToggles();
    updateArrowVisibility();
}

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

function updateUIVisibility() {
    notesSettingsSection.style.display = notesToggle.checked ? 'block' : 'none';
    calendarSettingsSection.style.display = calendarToggle.checked ? 'block' : 'none';
    dateSettingsSection.style.display = dateToggle.checked ? 'block' : 'none';
    timeSettingsSection.style.display = timeToggle.checked ? 'block' : 'none';
    wallpaperSettingsSection.style.display = wallpaperToggle.checked ? 'block' : 'none';
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

function applySettingsImmediately() {
    settings.notesSettings.toggleShow = notesToggle.checked;
    settings.calendarSettings.toggleShow = calendarToggle.checked;
    settings.weatherSettings.toggleShow = weatherToggle.checked;
    settings.dateSettings.toggleShow = dateToggle.checked;
    settings.timeSettings.toggleShow = timeToggle.checked;
    settings.wallpaperSettings.toggleShow = wallpaperToggle.checked;

    localStorage.setItem('global_settings', JSON.stringify(settings));
    ipcRenderer.send('update-global-settings', settings);
    ipcRenderer.send('update-main-Window-state', settings);
    ipcRenderer.send('update-calendar-settings', settings);
    ipcRenderer.send('update-weather-settings', settings);
    ipcRenderer.send('update-date-settings', settings);
    ipcRenderer.send('update-time-settings', settings);
    ipcRenderer.send('update-wallpaper-settings', settings);

    updateUIVisibility();
}

// Wallpaper functions
function showWallpaperPreview(filePath) {
    if (wallpaperPreview && wallpaperPreviewImg && wallpaperFileName) {
        wallpaperPreview.classList.remove('hidden');
        wallpaperPreviewImg.src = filePath;
        wallpaperFileName.textContent = filePath.split(/[\\/]/).pop();
    }
}

function hideWallpaperPreview() {
    if (wallpaperPreview) {
        wallpaperPreview.classList.add('hidden');
        wallpaperPreviewImg.src = '';
        wallpaperFileName.textContent = '';
    }
}

function updateWallpaperValueDisplays() {
    if (wallpaperOpacityValue) {
        wallpaperOpacityValue.textContent = `${wallpaperOpacity.value}%`;
    }
    if (wallpaperBlurValue) {
        wallpaperBlurValue.textContent = `${wallpaperBlur.value}px`;
    }
}

// Wallpaper event listeners
if (selectWallpaperBtn) {
    selectWallpaperBtn.addEventListener('click', () => {
        ipcRenderer.send('select-wallpaper-file');
    });
}

if (removeWallpaperBtn) {
    removeWallpaperBtn.addEventListener('click', () => {
        settings.wallpaperSettings.imagePath = null;
        hideWallpaperPreview();

        // Notify main process to remove wallpaper
        ipcRenderer.send('remove-wallpaper');

        applySettingsImmediately();
    });
}

if (wallpaperFitMode) {
    wallpaperFitMode.addEventListener('change', (e) => {
        settings.wallpaperSettings.theme.fitMode = e.target.value;
        applySettingsImmediately();
    });
}

if (wallpaperOpacity) {
    wallpaperOpacity.addEventListener('input', (e) => {
        settings.wallpaperSettings.theme.opacity = parseInt(e.target.value);
        updateWallpaperValueDisplays();
        applySettingsImmediately();
    });
}

if (wallpaperBlur) {
    wallpaperBlur.addEventListener('input', (e) => {
        settings.wallpaperSettings.theme.blur = parseInt(e.target.value);
        updateWallpaperValueDisplays();
        applySettingsImmediately();
    });
}

// Listen for wallpaper file selection response
ipcRenderer.on('wallpaper-file-selected', (event, filePath) => {
    if (filePath) {
        settings.wallpaperSettings.imagePath = filePath;
        showWallpaperPreview(filePath);
        applySettingsImmediately();
    }
});

toolbarToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const item = toggle.dataset.toolbarItem;
        settings.notesSettings.toolbarConfig[item] = !settings.notesSettings.toolbarConfig[item];

        toggle.classList.toggle('active');

        localStorage.setItem('global_settings', JSON.stringify(settings));
        ipcRenderer.send('update-global-settings', settings);
    });
});

if (timezoneSelect) {
    timezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.calendarSettings.timezone = selectedTimezone;
        applySettingsImmediately();
    });
}

if (dateTimezoneSelect) {
    dateTimezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.dateSettings.timezone = selectedTimezone;
        applySettingsImmediately();
    });
}

if (timeTimezoneSelect) {
    timeTimezoneSelect.addEventListener('change', (e) => {
        const selectedTimezone = e.target.value === 'local'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : e.target.value;

        settings.timeSettings.timezone = selectedTimezone;
        applySettingsImmediately();
    });
}

// Calendar theme listeners
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

// Date theme listeners
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

// Time theme listeners
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

// Main toggle listeners
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
wallpaperToggle.addEventListener('change', applySettingsImmediately);

resetSettings.addEventListener('click', () => {
    notesToggle.checked = true;
    calendarToggle.checked = false;
    weatherToggle.checked = false;
    dateToggle.checked = false;
    timeToggle.checked = false;
    wallpaperToggle.checked = true;

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
    settings.wallpaperSettings.imagePath = null;
    settings.wallpaperSettings.theme = {
        fitMode: 'cover',
        opacity: 100,
        blur: 0
    };

    if (timezoneSelect) timezoneSelect.value = 'UTC';
    if (calendarBgColor) calendarBgColor.value = '#ffffff';
    if (calendarBgOpacity) calendarBgOpacity.value = 80;
    if (eventBgColor) eventBgColor.value = '#ffffff';
    if (eventBgOpacity) eventBgOpacity.value = 90;
    if (calendarTextColor) calendarTextColor.value = '#000000';
    if (eventTextColor) eventTextColor.value = '#000000';
    if (insightColor) insightColor.value = '#4f46e5';
    if (insightTextColor) insightTextColor.value = '#ffffff';

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

    if (wallpaperFitMode) wallpaperFitMode.value = 'cover';
    if (wallpaperOpacity) wallpaperOpacity.value = 100;
    if (wallpaperBlur) wallpaperBlur.value = 0;
    hideWallpaperPreview();
    updateWallpaperValueDisplays();

    updateToolbarToggles();
    applySettingsImmediately();
    updateSubWindowState();
    updateArrowVisibility();

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

initializeDropdownBehavior();
sendCurrentSize();
loadSettings();