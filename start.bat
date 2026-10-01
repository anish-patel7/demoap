@echo off
REM ============================================================
REM  WealthTrack - START the app (backend + frontend)
REM  Double-click to launch. Close this window to stop the app.
REM ============================================================
setlocal
cd /d "%~dp0"

REM --- Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Run setup.bat first.
    echo         Download it from https://nodejs.org
    pause
    exit /b 1
)

REM --- Make sure dependencies exist; if not, run setup ---
if not exist "backend\node_modules" (
    echo Dependencies not found. Running setup first...
    call "%~dp0setup.bat"
)

echo.
echo ==========================================================
echo   Starting WealthTrack...
echo   Backend : http://localhost:4000
echo   App     : http://localhost:3000
echo.
echo   Your browser will open automatically in a few seconds.
echo   Keep this window OPEN while using the app.
echo   Close it (or press Ctrl+C) to stop.
echo ==========================================================
echo.

REM Open the browser after the servers have had a few seconds to boot.
start "" cmd /c "timeout /t 6 >nul & start http://localhost:3000"

REM Run both servers (blocks here, showing logs).
call npm run dev

endlocal
