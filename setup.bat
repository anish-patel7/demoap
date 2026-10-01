@echo off
REM ============================================================
REM  WealthTrack - One-time SETUP for a new computer
REM  Installs dependencies and initializes the database.
REM  Just double-click this file after copying the project folder.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo ==========================================================
echo   WealthTrack Setup
echo ==========================================================
echo.

REM --- Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo         Download the LTS version from https://nodejs.org
    echo         then run this setup again.
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do echo Using Node.js %%v
echo.

echo [1/4] Installing root dependencies...
call npm install
if errorlevel 1 goto :failed

echo.
echo [2/4] Installing backend dependencies...
call npm --prefix backend install
if errorlevel 1 goto :failed

echo.
echo [3/4] Installing frontend dependencies...
call npm --prefix frontend install
if errorlevel 1 goto :failed

echo.
echo [4/4] Initializing database (migrate + seed)...
call npm run migrate
call npm run seed

echo.
echo ==========================================================
echo   Setup complete!  Run start.bat to launch WealthTrack.
echo ==========================================================
echo.
pause
exit /b 0

:failed
echo.
echo [ERROR] Setup failed. Scroll up to see what went wrong.
echo.
pause
exit /b 1
