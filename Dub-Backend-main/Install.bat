@echo off
title DUB Backend - Installation
color 0A

echo ==========================================
echo    DUB BACKEND INSTALLATION
echo ==========================================
echo.

echo [STEP 1/4] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

node --version
echo [SUCCESS] Node.js is installed
echo.

echo [STEP 2/4] Checking npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo.
    pause
    exit /b 1
)

npm --version
echo [SUCCESS] npm is installed
echo.

echo [STEP 3/4] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All dependencies installed successfully
echo.

echo [STEP 4/4] Setting up configuration...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env >nul
    echo.
    echo [IMPORTANT] Configuration file created!
    echo Please edit .env file with your settings.
    echo.
) else (
    echo [INFO] .env file already exists
    echo.
)

echo ==========================================
echo    INSTALLATION COMPLETE!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit the .env file with your configuration
echo 2. Make sure MongoDB is running
echo 3. Run Start.bat to launch the backend
echo.
pause