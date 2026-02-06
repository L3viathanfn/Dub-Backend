@echo off
title DUB Backend - Server
color 0B

echo ==========================================
echo    DUB BACKEND SERVER
echo ==========================================
echo.

echo [CHECK 1/3] Verifying configuration file...
if not exist .env (
    echo [ERROR] Configuration file not found!
    echo Please run Install.bat first.
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] Configuration file found
echo.

echo [CHECK 2/3] Verifying dependencies...
if not exist node_modules (
    echo [ERROR] Dependencies not installed!
    echo Please run Install.bat first.
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies found
echo.

echo [CHECK 3/3] Verifying source files...
if not exist src\index.js (
    echo [ERROR] Source files not found!
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] Source files found
echo.

echo ==========================================
echo    STARTING DUB BACKEND...
echo ==========================================
echo.

node src/index.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server crashed or failed to start!
    echo.
    pause
    exit /b 1
)

pause