@echo off
cd /d "%~dp0"
echo Opening http://localhost:3000
echo Close this window to stop the server.
python -m http.server 3000
pause
