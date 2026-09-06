@echo off
title SonicStream Launcher
echo ==============================================
echo   Starting SonicStream Backend & Frontend
echo ==============================================

echo [1/2] Launching Python FastAPI Backend on port 8000...
start "SonicStream Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe run.py"

echo [2/2] Launching React Vite Frontend on port 5173...
start "SonicStream Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application started!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo Docs:     http://127.0.0.1:8000/docs
echo ==============================================
pause
