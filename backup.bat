@echo off
REM ============================================================
REM  WealthTrack - Create a full BACKUP from the command line.
REM  Saves a timestamped .db snapshot AND a CSV export of every
REM  table into the  backups\  folder.
REM
REM  (You can also back up from inside the app: click the
REM   cloud/backup icon in the top-right header.)
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo Creating WealthTrack backup...
echo.
call npm run backup

echo.
echo Backups are stored in:  %~dp0backups
echo.
pause
endlocal
