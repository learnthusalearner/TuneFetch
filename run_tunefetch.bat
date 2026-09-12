@echo off
setlocal
title TuneFetch - Spotify Playlist & Audio Downloader

echo ======================================================================
echo                    TuneFetch Desktop Launcher                         
echo ======================================================================

if exist "%~dp0backend\dist\TuneFetch\TuneFetch.exe" (
    echo [*] Starting TuneFetch Standalone Application...
    start "" "%~dp0backend\dist\TuneFetch\TuneFetch.exe"
    exit /b 0
)

if exist "%~dp0backend\launcher.py" (
    echo [*] Launching TuneFetch Engine via Python...
    cd /d "%~dp0backend"
    python launcher.py
    pause
    exit /b 0
)

echo [!] Could not locate TuneFetch entrypoint. Please ensure files are present.
pause
