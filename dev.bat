@echo off
echo ========================================
echo   ARIS Development Environment Startup
echo ========================================
echo.

:: Kill processes on port 3000 (Backend)
echo [1/4] Killing processes on port 3000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo       Done.

:: Kill processes on port 5173 (Frontend - Vite)
echo [2/4] Killing processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo       Done.

:: Small delay to ensure ports are freed
timeout /t 2 /nobreak >nul

:: Start Backend in a new window
echo [3/4] Starting Backend Server...
start "ARIS Backend" cmd /k "cd /d %~dp0server && npm run dev"

:: Small delay before starting frontend
timeout /t 3 /nobreak >nul

:: Start Frontend in a new window
echo [4/4] Starting Frontend Dev Server...
start "ARIS Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo   (Check the new terminal windows for logs)
echo ========================================
pause
