@echo off
chcp 65001 >nul
echo Starting ARIS Development Environment...

cd /d "C:\ARIS"

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: Kill any existing processes on ports 3000 and 5173
echo Cleaning up existing processes...
for /f "tokens=1,2" %%a in ('netstat -ano ^| findstr :3000 ^| findstr :5173') do (
    for /f "tokens=1,2" %%b in ("%%a") do (
        set "pid=%%b"
    )
)
if defined pid (
    echo Stopping process on port %%a with PID: !pid!
    taskkill /F /PID !pid! >nul 2>&1
)

:: Start Backend
echo [1/2] Starting Backend Server...
start "ARIS Backend" /c "cd server && npm run dev" /D title="ARIS Backend"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend  
echo [2/2] Starting Frontend...
start "ARIS Frontend" /c "npm run dev" /D title="ARIS Frontend"

echo.
echo ========================================
echo   Development Environment Started!
echo ========================================
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:5173
echo   Use Ctrl+C in this window to stop all services
echo ========================================
echo.
pause