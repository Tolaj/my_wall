// windowUtils.js
const { spawn } = require('child_process');

function sendToBottom(window) {
    if (!window || window.isDestroyed()) return;

    if (process.platform === 'win32') {
        try {
            const hwnd = window.getNativeWindowHandle().readBigUInt64LE();
            spawn('powershell', [
                '-Command',
                `Add-Type -TypeDefinition '
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
                ';
                [Win32]::SetWindowPos(${hwnd}, [Win32]::HWND_BOTTOM, 0, 0, 0, 0, 
                                      [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOACTIVATE)`
            ], { stdio: 'ignore' });
        } catch (e) {
            console.log('sendToBottom failed:', e);
            window.setAlwaysOnTop(false);
            window.blur();
        }
    } else {
        // macOS/Linux fallback
        window.setAlwaysOnTop(false);
        window.blur();
    }
}

module.exports = { sendToBottom };
