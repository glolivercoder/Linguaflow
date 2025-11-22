@echo off
title Anki Basic - Starting on Port 3002
color 0B

echo ========================================
echo   Starting Anki Basic Application
echo ========================================
echo.
echo Port: 3002
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting Anki Basic on port 3002...
set PORT=3002
npm start

pause
