@echo off
echo ===================================================
echo   Upgrade Platform - Development Environment Setup
echo ===================================================

echo.
echo [1/3] Killing zombie processes on ports 8080 and 5173...

:: Kill process on port 8080 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo Killing PID %%a on port 8080...
    taskkill /f /pid %%a
)

:: Kill process on port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo Killing PID %%a on port 5173...
    taskkill /f /pid %%a
)

echo.
echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm.cmd start"

echo.
echo [3/3] Starting Frontend Server...
start "Frontend Client" cmd /k "cd client && npm.cmd run dev"

echo.
echo ===================================================
echo   Development environment started!
echo   Backend: http://localhost:8080
echo   Frontend: http://localhost:5173
echo ===================================================
pause
