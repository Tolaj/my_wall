// windowUtils.js
const { spawn } = require('child_process');
const path = require('path');

// Cache for platform detection
const IS_WINDOWS = process.platform === 'win32';
const IS_MACOS = process.platform === 'darwin';

// Pre-compiled PowerShell command for better performance
const WIN32_COMMAND = `Add-Type -TypeDefinition '
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, 
                                         int X, int Y, int cx, int cy, uint uFlags);
    public static readonly IntPtr HWND_BOTTOM = new IntPtr(1);
    public static readonly uint SWP_NOMOVE = 0x0002;
    public static readonly uint SWP_NOSIZE = 0x0001;
    public static readonly uint SWP_NOACTIVATE = 0x0010;
}
';`;

/**
 * Sends a window to the bottom of the z-order stack
 * @param {Electron.BrowserWindow} window - The Electron window to send to bottom
 * @param {Object} options - Optional configuration
 * @param {number} options.timeout - Timeout for Windows PowerShell command (ms)
 * @param {boolean} options.silent - Suppress error logging
 * @returns {Promise<boolean>} - Success status
 */
async function sendToBottom(window, options = {}) {
    const { timeout = 5000, silent = false } = options;

    // Validate input
    if (!window || typeof window.isDestroyed !== 'function' || window.isDestroyed()) {
        if (!silent) console.warn('sendToBottom: Invalid or destroyed window');
        return false;
    }

    try {
        if (IS_WINDOWS) {
            // Get window handle with better error handling
            let hwnd;
            try {
                const handle = window.getNativeWindowHandle();
                if (!handle || handle.length === 0) {
                    throw new Error('No native window handle available');
                }
                hwnd = handle.readBigUInt64LE();
            } catch (handleError) {
                if (!silent) console.warn('Failed to get window handle:', handleError.message);
                return fallbackMethod(window);
            }

            // Use Promise-based approach for better control
            return new Promise((resolve) => {
                const powershellArgs = [
                    '-NoProfile',
                    '-ExecutionPolicy', 'Bypass',
                    '-Command',
                    `${WIN32_COMMAND}[Win32]::SetWindowPos(${hwnd}, [Win32]::HWND_BOTTOM, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOACTIVATE)`
                ];

                const child = spawn('powershell', powershellArgs, {
                    stdio: 'ignore',
                    windowsHide: true // Hide PowerShell window
                });

                const timer = setTimeout(() => {
                    child.kill();
                    if (!silent) console.warn('PowerShell command timed out, using fallback');
                    resolve(fallbackMethod(window));
                }, timeout);

                child.on('exit', (code) => {
                    clearTimeout(timer);
                    if (code === 0) {
                        resolve(true);
                    } else {
                        if (!silent) console.warn(`PowerShell exited with code ${code}, using fallback`);
                        resolve(fallbackMethod(window));
                    }
                });

                child.on('error', (err) => {
                    clearTimeout(timer);
                    if (!silent) console.warn('PowerShell spawn error:', err.message);
                    resolve(fallbackMethod(window));
                });
            });

        } else {
            // Enhanced cross-platform fallback
            return fallbackMethod(window, IS_MACOS);
        }

    } catch (error) {
        if (!silent) console.error('sendToBottom failed:', error.message);
        return fallbackMethod(window);
    }
}

function sendToBottomNative(mainWin) {
    if (!mainWin || mainWin.isDestroyed()) return;

    if (process.platform === 'win32') {
        try {
            const hwndBuffer = mainWin.getNativeWindowHandle();
            const hwndHex = '0x' + [...hwndBuffer].reverse().map(b => b.toString(16).padStart(2, '0')).join('');

            // Build absolute path to addon.exe
            const exePath = path.resolve(__dirname, '../native/addon.exe');

            const child = spawn(exePath, [hwndHex], {
                stdio: 'ignore',
                windowsHide: true,
            });

            child.on('error', (err) => {
                console.error('addon.exe error:', err);
            });
        } catch (e) {
            console.error('sendToBottom native failed:', e);
            mainWin.setAlwaysOnTop(false);
            mainWin.blur();
        }
    } else {
        mainWin.setAlwaysOnTop(false);
        mainWin.blur();
    }
}



/**
 * Fallback method for sending window to bottom
 * @param {Electron.BrowserWindow} window 
 * @param {boolean} isMacOS 
 * @returns {boolean}
 */
function fallbackMethod(window, isMacOS = false) {
    try {
        // More aggressive approach for different platforms
        window.setAlwaysOnTop(false);

        if (isMacOS) {
            // macOS specific: minimize and restore can help with z-order
            const wasMinimized = window.isMinimized();
            if (!wasMinimized) {
                window.minimize();
                setTimeout(() => {
                    if (!window.isDestroyed()) {
                        window.restore();
                        window.blur();
                    }
                }, 100);
            } else {
                window.blur();
            }
        } else {
            window.blur();
            // Additional method: try to focus another window if available
            const allWindows = require('electron').BrowserWindow.getAllWindows();
            const otherWindow = allWindows.find(w => w !== window && !w.isDestroyed() && w.isVisible());
            if (otherWindow) {
                otherWindow.focus();
            }
        }

        return true;
    } catch (fallbackError) {
        console.error('Fallback method failed:', fallbackError.message);
        return false;
    }
}

/**
 * Synchronous version of sendToBottom for compatibility
 * @param {Electron.BrowserWindow} window 
 * @param {Object} options 
 */
function sendToBottomSync(window, options = {}) {
    const { silent = false } = options;

    if (!window || typeof window.isDestroyed !== 'function' || window.isDestroyed()) {
        if (!silent) console.warn('sendToBottomSync: Invalid or destroyed window');
        return false;
    }

    if (IS_WINDOWS) {
        try {
            const handle = window.getNativeWindowHandle();
            const hwnd = handle.readBigUInt64LE();

            // Fire and forget approach
            spawn('powershell', [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-Command',
                `${WIN32_COMMAND}[Win32]::SetWindowPos(${hwnd}, [Win32]::HWND_BOTTOM, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOACTIVATE)`
            ], {
                stdio: 'ignore',
                detached: true,
                windowsHide: true
            }).unref();

        } catch (e) {
            if (!silent) console.warn('Windows method failed, using fallback:', e.message);
            return fallbackMethod(window);
        }
    } else {
        return fallbackMethod(window, IS_MACOS);
    }

    return true;
}

module.exports = {
    sendToBottom,
    sendToBottomNative,
    sendToBottomSync,
    // Export for testing
    _fallbackMethod: fallbackMethod
};