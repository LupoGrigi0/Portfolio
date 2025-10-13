@echo off
REM Frontend Cache Cleanup Script (Windows)
REM This script clears the Next.js cache and restarts the development server

echo Starting frontend cache cleanup...

REM Paths
set FRONTEND_DIR=D:\Lupo\Source\Portfolio\worktrees\frontend-core\src\frontend
set NEXT_CACHE_DIR=%FRONTEND_DIR%\.next

REM Step 1: Use admin restart endpoint
echo.
echo Step 1: Calling admin restart endpoint...
curl -X POST http://localhost:3000/api/admin/restart -H "Content-Type: application/json" 2>&1 || echo Restart endpoint failed or not available

REM Step 2: Wait for shutdown
echo.
echo Step 2: Waiting 2 seconds for shutdown...
timeout /t 2 /nobreak >nul

REM Step 3: Remove .next cache directory
echo.
echo Step 3: Removing .next cache directory...
if exist "%NEXT_CACHE_DIR%" (
    rmdir /s /q "%NEXT_CACHE_DIR%"
    echo [SUCCESS] Cache directory removed
) else (
    echo [SUCCESS] Cache directory already clean
)

REM Step 4: Restart the server
echo.
echo Step 4: Ready to restart development server...
echo [SUCCESS] Cleanup complete!
echo.
echo To start the server, run:
echo   cd %FRONTEND_DIR%
echo   npm run dev
echo.
echo Or uncomment the last lines in this script to auto-start.

REM Uncomment the lines below to auto-start the server
REM cd /d "%FRONTEND_DIR%"
REM npm run dev

pause
