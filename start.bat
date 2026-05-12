@echo off
echo ========================================
echo   Starting Goods Management System
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "pushd "%~dp0backend" && call "%~dp0..\venv\Scripts\activate.bat" && python main.py"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend Server...
start "Frontend Server" powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev"

echo.
echo ========================================
echo   Both servers are starting...
echo   Backend: http://localhost:8088
echo   Frontend: http://localhost:3000
echo ========================================
