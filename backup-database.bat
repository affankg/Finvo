@echo off
REM Database backup script for Finvo
REM Run this weekly to create backups

echo Creating database backup...
set BACKUP_FILE=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

fly postgres connect -a finvo-db -c "pg_dump -U postgres finvo_1vyg1q" > backups\%BACKUP_FILE%

if %ERRORLEVEL% EQU 0 (
    echo Backup created successfully: backups\%BACKUP_FILE%
    echo.
    echo To restore this backup later, run:
    echo fly postgres connect -a finvo-db -c "psql -U postgres finvo_1vyg1q" ^< backups\%BACKUP_FILE%
) else (
    echo Backup failed! Error code: %ERRORLEVEL%
)

pause
