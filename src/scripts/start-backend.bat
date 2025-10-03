@echo off
REM Backend Server Startup Script (Windows)
REM Starts the Modern Art Portfolio backend API server
REM
REM Usage from project root:
REM   scripts\start-backend.bat

setlocal

REM Get script directory and project root
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Backend location
set BACKEND_DIR=%PROJECT_ROOT%\worktrees\backend-api\src\backend

echo ================================================
echo Modern Art Portfolio - Backend Server
echo ================================================
echo Project Root: %PROJECT_ROOT%
echo Backend Dir:  %BACKEND_DIR%
echo.

REM Check if backend directory exists
if not exist "%BACKEND_DIR%" (
    echo Error: Backend directory not found at %BACKEND_DIR%
    exit /b 1
)

REM Navigate to backend directory
cd /d "%BACKEND_DIR%"

REM Check if .env exists
if not exist ".env" (
    echo Warning: .env file not found. Using defaults.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the dev server
echo Starting backend server...
echo.
call npm run dev
