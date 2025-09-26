#include <windows.h>
#include <iostream>
#include <cstdlib> // For std::strtoull

int main(int argc, char *argv[])
{
    if (argc < 2)
    {
        std::cerr << "Usage: sendToBottom <hwnd in hex>" << std::endl;
        return 1;
    }

    // Convert hex string to HWND
    HWND hwnd = (HWND)std::strtoull(argv[1], nullptr, 16);

    if (!IsWindow(hwnd))
    {
        std::cerr << "Invalid window handle." << std::endl;
        return 2;
    }

    BOOL res = SetWindowPos(
        hwnd,
        HWND_BOTTOM,
        0, 0, 0, 0,
        SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);

    if (!res)
    {
        std::cerr << "SetWindowPos failed with error: " << GetLastError() << std::endl;
        return 3;
    }

    return 0;
}
