@echo off
chcp 65001 >nul
echo ========================================
echo   ARIS Production Build
echo ========================================
echo.

:: Check prerequisites
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not found
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm not found
    pause
    exit /b 1
)

echo ✅ Prerequisites checked

:: Clean previous builds
if exist "dist" (
    echo 🗑️ Cleaning previous build...
    rmdir /s /q "dist"
)

if exist "server\public" (
    echo 🗑️ Cleaning previous server build...
    rmdir /s /q "server\public"
)

:: Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Dependency installation failed
    pause
    exit /b 1
)

:: Build frontend
echo 🔨 Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Frontend build failed
    pause
    exit /b 1
)

:: Copy frontend to server
echo 📋 Copying build to server...
if not exist "server\public" mkdir "server\public"
xcopy "dist\*" "server\public\" /E /I /Y
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to copy build to server
    pause
    exit /b 1
)

echo ✅ Build complete!
echo.
echo 📦 Frontend: server\public\
echo 🌐 Backend: server\
echo.
echo 🚀 Ready for deployment!
echo.
pause