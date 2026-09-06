# SonicStream PowerShell Launcher
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   Starting SonicStream Backend & Frontend    " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\venv\Scripts\python.exe run.py"

# Start Frontend
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "Application launched!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
