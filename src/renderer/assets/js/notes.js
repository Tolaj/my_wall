// Note management functionality

// Variables for drag functionality
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartNoteX = 0;
let dragStartNoteY = 0;
let selectedNote = null;
let dragThreshold = 5;
let mouseDownNote = null;

// Make drag variables globally accessible
window.isDragging = false;

// Expose functions globally
window.createNote = createNote;
window.enterEditMode = enterEditMode;
window.exitEditMode = exitEditMode;
window.exitAllEditModes = exitAllEditModes;

// Create a new note
function createNote(x, y, content, isNew = false, noteSettings = null) {
    const note = document.createElement("div");
    const notesContainer = document.getElementById("notes-container");
    note.className = "note";
    note.contentEditable = false;
    note.style.left = x + "px";
    note.style.top = y + "px";

    // Set content - could be HTML or plain text
    if (content && (content.includes('<') || content.includes('>'))) {
        note.innerHTML = content;
    } else {
        note.textContent = content || "";
    }

    // TODO
    const settings = {};

    note.dataset.settings = JSON.stringify(settings);

    // Attach event listeners
    attachNoteEventListeners(note);

    notesContainer.appendChild(note);
    return note;
}

// Attach event listeners to a note
function attachNoteEventListeners(note) {
    // Double-click to edit
    note.addEventListener("dblclick", (e) => {
        if (window.editing) {
            e.preventDefault();
            e.stopPropagation();

            // Only enter edit mode if not already editing this note
            if (!note.classList.contains('editing')) {
                window.enterEditMode(note);
            }
        }
    });

    // Mouse down for dragging
    note.addEventListener("mousedown", (e) => {
        if (!window.editing || note.classList.contains('editing')) return;

        e.preventDefault();
        mouseDownNote = note;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartNoteX = parseInt(note.style.left);
        dragStartNoteY = parseInt(note.style.top);
        note.classList.add('selected');
    });

    // Shift + double-click to delete
    note.addEventListener("dblclick", (e) => {
        if (window.editing && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            note.remove();
            if (window.currentEditingNote === note) {
                window.hideToolbar();
                window.currentEditingNote = null;
            }
            window.saveNotes();
            return;
        }
    });

    // Right-click to apply current settings
    // note.addEventListener("contextmenu", (e) => {
    //     if (window.editing) {
    //         e.preventDefault();
    //         const settings = window.defaultSettings || {
    //             fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
    //             fontSize: "20px",
    //             textColor: "#ffffff",
    //             textShadow: true,
    //             lineHeight: "1.5"
    //         };
    //         note.style.fontFamily = settings.fontFamily;
    //         note.style.fontSize = settings.fontSize;
    //         note.style.color = settings.textColor;
    //         note.style.lineHeight = settings.lineHeight;
    //         note.style.textShadow = settings.textShadow ? '0 1px 2px rgba(0, 0, 0, 0.6)' : 'none';
    //         note.dataset.settings = JSON.stringify(settings);
    //         window.saveNotes();
    //     }
    // });
}

// Enter edit mode for a note
function enterEditMode(note) {
    // Exit other edit modes
    window.exitAllEditModes();

    note.classList.add('editing');
    note.contentEditable = true;
    window.currentEditingNote = note;

    // Focus the note
    note.focus();

    // Show toolbar
    window.showToolbar(note);

    // Add comprehensive event listeners for toolbar updates
    const updateEvents = ['keyup', 'mouseup', 'click', 'focus', 'input', 'paste', 'cut'];
    updateEvents.forEach(eventType => {
        note.addEventListener(eventType, () => {
            setTimeout(window.updateToolbarState, 10);
        });
    });

    // Special handling for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    note.addEventListener('input', window.saveNotes);

    // Initial toolbar state update
    setTimeout(window.updateToolbarState, 10);
}

// Handle selection changes for toolbar updates
function handleSelectionChange() {
    if (window.currentEditingNote && document.contains(window.currentEditingNote)) {
        const selection = window.getSelection();
        // Only update if selection is within the current editing note
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (window.currentEditingNote.contains(range.commonAncestorContainer) ||
                range.commonAncestorContainer === window.currentEditingNote) {
                setTimeout(window.updateToolbarState, 10);
            }
        }
    }
}

// Exit edit mode for a note
function exitEditMode(note) {
    if (!note) return;

    note.classList.remove('editing');
    note.contentEditable = false;

    // Remove all event listeners by cloning the node (removes all listeners)
    const newNote = note.cloneNode(true);
    note.parentNode.replaceChild(newNote, note);

    // Re-attach essential event listeners
    attachNoteEventListeners(newNote);

    if (window.currentEditingNote === note) {
        window.currentEditingNote = null;
        window.hideToolbar();
    }

    // Remove global selection change listener
    document.removeEventListener('selectionchange', handleSelectionChange);

    window.saveNotes();
}

// Exit all edit modes
function exitAllEditModes() {
    document.querySelectorAll('.note.editing').forEach(note => {
        window.exitEditMode(note);
    });
    window.hideToolbar();
    window.currentEditingNote = null;
}

// Mouse events for dragging
document.addEventListener("mousemove", (e) => {
    if (!mouseDownNote || !window.editing || mouseDownNote.classList.contains('editing')) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!isDragging && distance > dragThreshold) {
        isDragging = true;
    }

    if (!isDragging) return;

    e.preventDefault();
    const newX = Math.max(0, dragStartNoteX + deltaX);
    const newY = Math.max(0, dragStartNoteY + deltaY);

    mouseDownNote.style.left = newX + "px";
    mouseDownNote.style.top = newY + "px";
});

document.addEventListener("mouseup", (e) => {
    if (isDragging) {
        isDragging = false;
        window.isDragging = false;
        window.saveNotes();
    }

    if (mouseDownNote && !mouseDownNote.classList.contains('editing')) {
        mouseDownNote.classList.remove('selected');
    }

    isDragging = false;
    window.isDragging = false;
    mouseDownNote = null;
    selectedNote = null;
});