const { spawn } = require('child_process');

// Enhanced constants for better Windows API control
const WIN32_COMMAND = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    public const int HWND_BOTTOM = 1;
    public const int HWND_TOPMOST = -1;
    public const int HWND_NOTOPMOST = -2;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOACTIVATE = 0x0010;
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const uint SWP_NOOWNERZORDER = 0x0200;
    public const uint SWP_NOSENDCHANGING = 0x0400;
    
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, int hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    
    [DllImport("user32.dll")]
    public static extern IntPtr SetFocus(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@;
`;

const IS_WINDOWS = process.platform === 'win32';
const IS_MACOS = process.platform === 'darwin';

// Store active intervals for cleanup
const bottomWindows = new Map();

async function sendToBottomPersistent(window, options = {}) {
    const {
        timeout = 5000,
        silent = false,
        persistent = true,
        interval = 100,
        stopOnDestroy = true
    } = options;

    // Validate input
    if (!window || typeof window.isDestroyed !== 'function' || window.isDestroyed()) {
        if (!silent) console.warn('sendToBottomPersistent: Invalid or destroyed window');
        return false;
    }

    const windowId = window.id || window.webContents?.id || Math.random();

    // Clear any existing interval for this window
    if (bottomWindows.has(windowId)) {
        clearInterval(bottomWindows.get(windowId));
        bottomWindows.delete(windowId);
    }

    // Initial send to bottom
    const initialResult = await sendToBottomOnce(window, { timeout, silent });

    if (persistent) {
        // Set up persistent monitoring
        const persistentInterval = setInterval(async () => {
            if (window.isDestroyed()) {
                if (stopOnDestroy) {
                    clearInterval(persistentInterval);
                    bottomWindows.delete(windowId);
                    return;
                }
            }

            try {
                await sendToBottomOnce(window, { timeout: 1000, silent: true });
            } catch (error) {
                if (!silent) console.warn('Persistent bottom check failed:', error.message);
            }
        }, interval);

        bottomWindows.set(windowId, persistentInterval);

        // Cleanup on window close
        if (stopOnDestroy) {
            window.on('closed', () => {
                if (bottomWindows.has(windowId)) {
                    clearInterval(bottomWindows.get(windowId));
                    bottomWindows.delete(windowId);
                }
            });
        }
    }

    return initialResult;
}

async function sendToBottomOnce(window, options = {}) {
    const { timeout = 5000, silent = false } = options;

    // Validate input
    if (!window || typeof window.isDestroyed !== 'function' || window.isDestroyed()) {
        if (!silent) console.warn('sendToBottomOnce: Invalid or destroyed window');
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

            // Enhanced PowerShell command for more reliable bottom positioning
            return new Promise((resolve) => {
                const powershellArgs = [
                    '-NoProfile',
                    '-ExecutionPolicy', 'Bypass',
                    '-WindowStyle', 'Hidden',
                    '-Command',
                    `${WIN32_COMMAND}
                    $hwnd = [IntPtr]${hwnd};
                    # First, ensure window is not topmost
                    [Win32]::SetWindowPos($hwnd, [Win32]::HWND_NOTOPMOST, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOACTIVATE -bor [Win32]::SWP_NOSENDCHANGING);
                    # Then send to bottom
                    [Win32]::SetWindowPos($hwnd, [Win32]::HWND_BOTTOM, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOACTIVATE -bor [Win32]::SWP_NOSENDCHANGING);`
                ];

                const child = spawn('powershell', powershellArgs, {
                    stdio: 'ignore',
                    windowsHide: true
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
        if (!silent) console.error('sendToBottomOnce failed:', error.message);
        return fallbackMethod(window);
    }
}

function fallbackMethod(window, isMacOS = false) {
    try {
        if (isMacOS) {
            // macOS specific approach
            window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
            window.blur();
            window.setAlwaysOnTop(false);
            return true;
        } else {
            // General fallback
            window.blur();
            window.setAlwaysOnTop(false);
            window.moveTop(); // This might seem counterintuitive but can help reset z-order
            setTimeout(() => {
                if (!window.isDestroyed()) {
                    window.blur();
                }
            }, 10);
            return true;
        }
    } catch (error) {
        console.warn('Fallback method failed:', error.message);
        return false;
    }
}

// Function to stop persistent bottom positioning for a window
function stopPersistentBottom(window) {
    const windowId = window.id || window.webContents?.id;
    if (windowId && bottomWindows.has(windowId)) {
        clearInterval(bottomWindows.get(windowId));
        bottomWindows.delete(windowId);
        return true;
    }
    return false;
}

// Function to stop all persistent bottom positioning
function stopAllPersistentBottom() {
    bottomWindows.forEach((interval) => {
        clearInterval(interval);
    });
    bottomWindows.clear();
}

module.exports = {
    sendToBottomPersistent,
    sendToBottomOnce,
    stopPersistentBottom,
    stopAllPersistentBottom,
    // Keep the old function name for compatibility
    sendToBottom: sendToBottomOnce
};