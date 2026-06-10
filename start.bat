@echo off
REM =========================================
REM Compensation System Startup Script
REM Run both Frontend and Backend
REM =========================================

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   🎯 COMPENSATION SYSTEM STARTUP                   ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ❌ Error: backend folder not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: frontend folder not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📋 Checking prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)
echo ✅ npm is installed
echo.

echo 🔄 Starting Backend Server...
start cmd /k "cd backend && npm start"
timeout /t 3

echo 🔄 Starting Frontend Server...
start cmd /k "cd frontend && npm start"
timeout /t 3

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   ✅ STARTUP COMPLETE!                             ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📍 Backend:  http://localhost:5000
echo 📍 Frontend: http://localhost:3000
echo.
echo 🔐 Login with:
echo    Username: admin
echo    Password: police123
echo.
echo Press any key to exit this window...
pause
