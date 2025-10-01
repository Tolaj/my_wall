// Core application state and initialization
let ipcRenderer = null;
let editing = false;
let currentEditingNote = null;

// Make these variables globally accessible
window.ipcRenderer = null;
window.editing = false;
window.currentEditingNote = null;
window.defaultSettings = null;

// Storage keys
const STORAGE_KEY = "freeform_notes";
const SETTINGS_KEY = "global_settings";

// Default settings
function loadSavedSettings() {
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const defaults = {
        fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
        fontSize: "20px",
        textColor: "#ffffff",
        textShadow: true,
        lineHeight: "1.5"
    };
    return { ...defaults, ...savedSettings };
}

let defaultSettings = loadSavedSettings();

// Make functions globally accessible for other modules
window.saveNotes = saveNotes;
window.hideToolbar = hideToolbar;
window.showToolbar = showToolbar;
window.updateToolbarState = updateToolbarState;
window.enterEditMode = enterEditMode;
window.exitEditMode = exitEditMode;
window.exitAllEditModes = exitAllEditModes;
window.createNote = createNote;
window.cleanupEmptyNotes = cleanupEmptyNotes;
window.showEditBoundary = showEditBoundary;
window.hideEditBoundary = hideEditBoundary;
window.clearAllNotes = clearAllNotes;
window.applyNoteStyles = applyNoteStyles;

// Initialize Electron IPC or mock for web demo
function initializeIPC() {
    try {
        const electron = require("electron");
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {
        console.log("Running outside Electron environment - using mock IPC");
        // Mock ipcRenderer for web demo
        ipcRenderer = {
            on: (event, callback) => {
                if (!window.mockCallbacks) window.mockCallbacks = {};
                window.mockCallbacks[event] = callback;
            },
            send: (event, data) => {
                console.log('IPC Send:', event, data);
                if (event === "toggle-edit" && data === false) {
                    setTimeout(() => {
                        if (window.mockCallbacks && window.mockCallbacks["editing-changed"]) {
                            window.mockCallbacks["editing-changed"](null, false);
                        }
                    }, 100);
                }
            }
        };
    }
}

// Initialize the application
function initializeApp() {
    initializeIPC();

    // Update global references
    window.ipcRenderer = ipcRenderer;
    window.editing = editing;
    window.currentEditingNote = currentEditingNote;
    window.defaultSettings = defaultSettings;

    // Load saved notes
    const savedNotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    savedNotes.forEach(n => createNote(n.x, n.y, n.html || n.text, false, n.settings));

    // Set up IPC handlers
    ipcRenderer.on("editing-changed", (_, isEditing) => {
        editing = isEditing;
        window.editing = editing;
        if (isEditing) {
            document.body.classList.add('edit-mode');
            showEditBoundary();
        } else {
            document.body.classList.remove('edit-mode');
            hideToolbar();
            hideEditBoundary();
            cleanupEmptyNotes();
            exitAllEditModes();
        }
    });

    ipcRenderer.on("apply-main-settings", (_, settings) => {

        applyNoteStyles(settings);
    });

    // Set up global event listeners
    setupGlobalEventListeners();

    // For testing outside Electron
    if (!window.require) {
        setupDemoMode();
    }
}



// Apply note styles globally
function applyNoteStyles(settings) {
    return null
}

// Placeholder functions - will be defined in other modules
function showToolbar(note) {
    // Defined in toolbar.js
    if (window.showToolbar && window.showToolbar !== showToolbar) {
        return window.showToolbar(note);
    }
}
function hideToolbar() {
    // Defined in toolbar.js
    if (window.hideToolbar && window.hideToolbar !== hideToolbar) {
        return window.hideToolbar();
    }
}
function updateToolbarState() {
    // Defined in toolbar.js
    if (window.updateToolbarState && window.updateToolbarState !== updateToolbarState) {
        return window.updateToolbarState();
    }
}
function enterEditMode(note) {
    // Defined in notes.js
    if (window.enterEditMode && window.enterEditMode !== enterEditMode) {
        return window.enterEditMode(note);
    }
}
function exitEditMode(note) {
    // Defined in notes.js
    if (window.exitEditMode && window.exitEditMode !== exitEditMode) {
        return window.exitEditMode(note);
    }
}
function exitAllEditModes() {
    // Defined in notes.js
    if (window.exitAllEditModes && window.exitAllEditModes !== exitAllEditModes) {
        return window.exitAllEditModes();
    }
}
function createNote(x, y, content, isNew, noteSettings) {
    // Defined in notes.js
    if (window.createNote && window.createNote !== createNote) {
        return window.createNote(x, y, content, isNew, noteSettings);
    }
}

// Edit boundary functions
function showEditBoundary() {
    hideEditBoundary();
    const notesContainer = document.getElementById("notes-container");

    const boundary = document.createElement('div');
    boundary.className = 'edit-boundary';
    boundary.id = 'edit-boundary';
    notesContainer.appendChild(boundary);

    const indicator = document.createElement('div');
    indicator.className = 'edit-mode-indicator';
    indicator.id = 'edit-indicator';
    indicator.innerHTML = '✏️ EDIT MODE - Double-Click to add • Double-click existing to edit • Drag to move • Esc to exit';
    notesContainer.appendChild(indicator);
}

function hideEditBoundary() {
    const boundary = document.getElementById('edit-boundary');
    const indicator = document.getElementById('edit-indicator');
    if (boundary) boundary.remove();
    if (indicator) indicator.remove();
}

// Global event listeners
function setupGlobalEventListeners() {
    // Double-click to create new note
    document.addEventListener("dblclick", e => {
        if (!window.editing) return;
        if (e.target.classList.contains("note") || e.target.closest('.note')) return;

        e.preventDefault();
        e.stopPropagation();
        window.cleanupEmptyNotes();
        const note = window.createNote(e.clientX, e.clientY, "", true, window.defaultSettings);
        window.enterEditMode(note);
        window.saveNotes();
    });

    // Click outside to exit edit mode
    document.addEventListener('click', (e) => {
        if (window.currentEditingNote &&
            !window.currentEditingNote.contains(e.target) &&
            !document.getElementById('floating-toolbar').contains(e.target)) {
            window.exitEditMode(window.currentEditingNote);
        }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            if (window.currentEditingNote) {
                window.exitEditMode(window.currentEditingNote);
            }
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
            ipcRenderer.send("toggle-edit", false);
        }

        if (e.key === "Delete" && e.ctrlKey && e.shiftKey && window.editing) {
            e.preventDefault();
            if (confirm("Clear all notes? This cannot be undone.")) {
                window.clearAllNotes();
            }
        }
    });

    // Prevent text selection during drag
    document.addEventListener("selectstart", (e) => {
        if (window.isDragging) e.preventDefault();
    });
}

// Save notes to localStorage
function saveNotes() {
    const notes = Array.from(document.querySelectorAll(".note")).map(n => ({
        x: parseInt(n.style.left),
        y: parseInt(n.style.top),
        html: n.innerHTML,
        text: n.textContent,
        settings: JSON.parse(n.dataset.settings || JSON.stringify(defaultSettings))
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Clean up empty notes
function cleanupEmptyNotes() {
    document.querySelectorAll(".note").forEach(note => {
        if (note.textContent.trim() === "" && !note.classList.contains('editing')) {
            note.remove();
        }
    });
    saveNotes();
}

// Clear all notes
function clearAllNotes() {
    document.querySelectorAll(".note").forEach(n => n.remove());
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.defaultSettings));

    window.isDragging = false;
    window.currentEditingNote = null;
    window.hideToolbar();

    if (window.getSelection) window.getSelection().removeAllRanges();
    ipcRenderer.send("toggle-edit", true);
}

// Demo mode for testing outside Electron
function setupDemoMode() {
    editing = true;
    window.editing = true;
    document.body.classList.add('edit-mode');
    showEditBoundary();

    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = 'Toggle Edit Mode';
    toggleButton.style.cssText = 'position:fixed;top:10px;right:10px;z-index:10002;padding:8px 16px;background:rgba(0,0,0,0.8);color:white;border:1px solid white;border-radius:4px;cursor:pointer;';
    toggleButton.addEventListener('click', () => {
        editing = !editing;
        window.editing = editing;
        if (window.mockCallbacks && window.mockCallbacks["editing-changed"]) {
            window.mockCallbacks["editing-changed"](null, editing);
        } else {
            // Direct toggle for demo
            if (editing) {
                document.body.classList.add('edit-mode');
                showEditBoundary();
            } else {
                document.body.classList.remove('edit-mode');
                window.hideToolbar();
                hideEditBoundary();
                window.cleanupEmptyNotes();
                window.exitAllEditModes();
            }
        }
    });
    document.body.appendChild(toggleButton);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);