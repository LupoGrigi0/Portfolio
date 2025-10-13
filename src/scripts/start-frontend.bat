@echo off
REM Frontend Server Startup Script (Windows)
REM Starts the Modern Art Portfolio frontend Next.js server
REM
REM Usage from project root:
REM   scripts\start-frontend.bat

setlocal

REM Get script directory and project root
set SCRIPT_DIR=%~dp0
REM Go up two levels from scripts/: src/scripts -> src -> Portfolio (repo root)
set PROJECT_ROOT=%SCRIPT_DIR%..\..

REM Frontend location (worktrees are at repo root level)
set FRONTEND_DIR=%PROJECT_ROOT%\worktrees\frontend-core\src\frontend

echo ================================================
echo Modern Art Portfolio - Frontend Server
echo ================================================
echo Project Root: %PROJECT_ROOT%
echo Frontend Dir: %FRONTEND_DIR%
echo.

REM Check if frontend directory exists
if not exist "%FRONTEND_DIR%" (
    echo Error: Frontend directory not found at %FRONTEND_DIR%
    exit /b 1
)

REM Navigate to frontend directory
cd /d "%FRONTEND_DIR%"

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
echo Starting frontend server...
echo.
call npm run dev
