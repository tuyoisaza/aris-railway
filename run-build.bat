@echo off
echo ========================================
echo   ARIS Build & Deploy Script
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo [1/5] Node.js detected

:: Install dependencies if needed
if not exist "node_modules" (
    echo [2/5] Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

:: Build frontend
echo [3/5] Building frontend...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

:: Check if server dependencies exist
if not exist "server\node_modules" (
    echo [4/5] Installing server dependencies...
    cd server
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
    cd ..
)

:: Build is complete, show summary
echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Frontend built: dist\
echo Server ready: server\
echo.
echo Next steps:
echo   1. Start backend: cd server ^&^& npm start
echo   2. Start frontend: npm run dev
echo   3. Or use: run_dev.bat for both
echo ========================================
echo.
pause