// Toolbar functionality

// Expose functions globally
window.showToolbar = showToolbar;
window.hideToolbar = hideToolbar;
window.updateToolbarState = updateToolbarState;

// Show floating toolbar
function showToolbar(note) {
    const toolbar = document.getElementById('floating-toolbar');

    // If toolbar is already visible for this note, don't reposition
    if (toolbar.classList.contains('visible') && window.currentEditingNote === note) {
        window.updateToolbarState();
        return;
    }

    const rect = note.getBoundingClientRect();

    let left = rect.left;
    let top = rect.top - 60;

    // Keep toolbar in viewport
    if (left + 400 > window.innerWidth) left = window.innerWidth - 420;
    if (left < 10) left = 10;
    if (top < 10) top = rect.bottom + 10;

    toolbar.style.left = left + 'px';
    toolbar.style.top = top + 'px';
    toolbar.classList.add('visible');

    window.updateToolbarState();
}

// Hide floating toolbar
function hideToolbar() {
    document.getElementById('floating-toolbar').classList.remove('visible');
}

// Update toolbar state based on current selection
function updateToolbarState() {
    if (!window.currentEditingNote) return;

    try {
        // Update button states based on current selection
        const buttons = document.querySelectorAll('.toolbar-btn[data-command]');
        buttons.forEach(btn => {
            const command = btn.dataset.command;
            try {
                btn.classList.toggle('active', document.queryCommandState(command));
            } catch (e) {
                btn.classList.remove('active');
            }
        });

        // Update font family dropdown
        updateFontFamilyDropdown();

        // Update font size dropdown
        updateFontSizeDropdown();

        // Update color pickers
        updateColorPickers();

    } catch (error) {
        console.warn('Toolbar state update failed:', error);
    }
}

// Update font family dropdown based on selection
function updateFontFamilyDropdown() {
    try {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const node = selection.anchorNode;
        const element = node.nodeType === 3 ? node.parentNode : node;
        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily.replace(/"/g, "'").toLowerCase();

        // Try to match with dropdown options
        const fontSelect = document.getElementById('fontSelect');
        let matched = false;

        Array.from(fontSelect.options).forEach(option => {
            const optionValue = option.value.replace(/"/g, "'").toLowerCase();
            if (optionValue && fontFamily.includes(optionValue.split(',')[0].trim())) {
                fontSelect.value = option.value;
                matched = true;
            }
        });

        if (!matched) {
            fontSelect.value = "";
        }
    } catch (error) {
        document.getElementById('fontSelect').value = "";
    }
}

// Update font size dropdown based on selection
function updateFontSizeDropdown() {
    try {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const node = selection.anchorNode;
        const element = node.nodeType === 3 ? node.parentNode : node;
        const computedStyle = window.getComputedStyle(element);
        const fontSize = computedStyle.fontSize;

        // Try to match with dropdown options
        const sizeSelect = document.getElementById('sizeSelect');
        const options = Array.from(sizeSelect.options);

        let matched = false;
        options.forEach(option => {
            if (option.value === fontSize) {
                sizeSelect.value = option.value;
                matched = true;
            }
        });

        // If no exact match, try to find closest
        if (!matched) {
            const currentSize = parseFloat(fontSize);
            let closestOption = null;
            let closestDiff = Infinity;

            options.forEach(option => {
                if (option.value) {
                    const optionSize = parseFloat(option.value);
                    const diff = Math.abs(currentSize - optionSize);
                    if (diff < closestDiff) {
                        closestDiff = diff;
                        closestOption = option;
                    }
                }
            });

            sizeSelect.value = closestOption ? closestOption.value : "";
        }
    } catch (error) {
        document.getElementById('sizeSelect').value = "";
    }
}

// Update color pickers based on selection
function updateColorPickers() {
    try {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const node = selection.anchorNode;
        const element = node.nodeType === 3 ? node.parentNode : node;
        const computedStyle = window.getComputedStyle(element);

        // Update text color
        const textColor = rgbToHex(computedStyle.color);
        if (textColor) document.getElementById('textColor').value = textColor;

        // Update background color
        const bgColor = computedStyle.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const bgColorHex = rgbToHex(bgColor);
            if (bgColorHex) document.getElementById('bgColor').value = bgColorHex;
        }
    } catch (e) { }
}

// Convert RGB to hex color
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return null;
    const result = rgb.match(/\d+/g);
    if (!result) return null;
    return "#" + ((1 << 24) + (parseInt(result[0]) << 16) +
        (parseInt(result[1]) << 8) + parseInt(result[2]))
        .toString(16).slice(1);
}

// Wrap selection with style
function wrapSelectionWithStyle(styleProperty, value) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style[styleProperty] = value;

    try {
        // Try to surround the contents first
        range.surroundContents(span);
    } catch (error) {
        // If that fails, extract and wrap
        try {
            span.appendChild(range.extractContents());
            range.insertNode(span);
            range.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (ex) {
            console.warn('Style wrapping failed:', ex);
        }
    }
}

// Apply font family to selection
function applyFontFamilyToSelection(fontFamily) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Handle full note selection or large selections more reliably
    if (range.startContainer === window.currentEditingNote ||
        (range.startOffset === 0 && range.endOffset === range.endContainer.textContent?.length)) {

        // For full or large selections, apply to the entire note content
        const content = range.extractContents();
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;
        span.appendChild(content);
        range.insertNode(span);

        // Restore selection
        range.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // For partial selections, use the wrap method
        wrapSelectionWithStyle('fontFamily', fontFamily);
    }
}

function applyToolbarSettings(config) {
    const toolbarConfig = config ? config : {
        "fontSelect": true,
        "sizeSelect": true,
        "bold": true,
        "italic": true,
        "underline": true,
        "strikeThrough": true,
        "textColor": true,
        "bgColor": true,
        "insertOrderedList": true,
        "insertUnorderedList": true,
        "outdent": true,
        "indent": true,
        "justifyLeft": true,
        "justifyCenter": true,
        "justifyRight": true,
        "clearFormat": true
    };

    // Loop through config keys
    for (const key in toolbarConfig) {
        const el = document.getElementById(key);
        if (el) {
            // Show or hide based on config
            el.style.display = toolbarConfig[key] ? "" : "none";
        }
    }
}

// Initialize toolbar event listeners
function initializeToolbarEventListeners() {

    const electronToolbar = require("electron");
    let ipcRendererToolbar = electronToolbar.ipcRenderer;


    ipcRenderer.on("apply-main-settings", (_, settings) => {

        applyToolbarSettings(settings?.notesSettings?.toolbarConfig ? settings?.notesSettings?.toolbarConfig : {})

    });



    // Toolbar button events
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.currentEditingNote) {
                document.execCommand(btn.dataset.command, false, null);
                window.currentEditingNote.focus();
                window.updateToolbarState();
                window.saveNotes();
            }
        });
    });

    // Font selector
    document.getElementById('fontSelect').addEventListener('change', (e) => {
        e.stopPropagation();
        if (window.currentEditingNote) {
            const font = e.target.value;
            if (!font) return;

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            if (range.collapsed) {
                // Create span for typing at cursor position
                const span = document.createElement("span");
                span.style.fontFamily = font;
                span.innerHTML = "&nbsp;";

                range.insertNode(span);
                range.setStartAfter(span);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // For selections, use direct span wrapping instead of execCommand
                applyFontFamilyToSelection(font);
            }

            window.currentEditingNote.focus();
            setTimeout(window.updateToolbarState, 50);
            window.saveNotes();
        }
    });

    // Size selector
    document.getElementById('sizeSelect').addEventListener('change', (e) => {
        e.stopPropagation();
        if (window.currentEditingNote) {
            const size = e.target.value;
            if (!size) return;

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            if (range.collapsed) {
                // Create span for typing at cursor position
                const span = document.createElement("span");
                span.style.fontSize = size;
                span.innerHTML = "&nbsp;";

                range.insertNode(span);
                range.setStartAfter(span);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Apply to selected text using execCommand first, then fix with exact size
                try {
                    document.execCommand('fontSize', false, '7'); // Use largest font size marker

                    // Find all font elements with size="7" and replace with exact size
                    setTimeout(() => {
                        const fontElements = window.currentEditingNote.querySelectorAll('font[size="7"]');
                        fontElements.forEach(el => {
                            const span = document.createElement('span');
                            span.style.fontSize = size;
                            span.innerHTML = el.innerHTML;
                            el.parentNode.replaceChild(span, el);
                        });
                        window.updateToolbarState();
                    }, 10);
                } catch (error) {
                    // Fallback method - wrap selection directly
                    const span = document.createElement('span');
                    span.style.fontSize = size;
                    try {
                        range.surroundContents(span);
                    } catch (ex) {
                        span.appendChild(range.extractContents());
                        range.insertNode(span);
                    }
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }

            window.currentEditingNote.focus();
            setTimeout(window.updateToolbarState, 50);
            window.saveNotes();
        }
    });

    // Text color picker
    document.getElementById('textColor').addEventListener('change', (e) => {
        e.stopPropagation();
        if (window.currentEditingNote) {
            const selection = window.getSelection();
            if (selection.rangeCount && selection.isCollapsed) {
                wrapSelectionWithStyle('color', e.target.value);
            } else {
                document.execCommand('foreColor', false, e.target.value);
            }
            window.currentEditingNote.focus();
            window.saveNotes();
        }
    });

    // Background color picker
    document.getElementById('bgColor').addEventListener('change', (e) => {
        e.stopPropagation();
        if (window.currentEditingNote) {
            const selection = window.getSelection();
            if (selection.rangeCount && selection.isCollapsed) {
                wrapSelectionWithStyle('backgroundColor', e.target.value);
            } else {
                document.execCommand('backColor', false, e.target.value);
            }
            window.currentEditingNote.focus();
            window.saveNotes();
        }
    });

    // Clear formatting
    document.getElementById('clearFormat').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.currentEditingNote) {
            document.execCommand('removeFormat', false, null);
            window.currentEditingNote.focus();
            window.saveNotes();
        }
    });
}

// Initialize toolbar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeToolbarEventListeners();
});