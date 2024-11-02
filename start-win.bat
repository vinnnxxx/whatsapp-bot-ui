@echo off
:start
echo Starting the Node.js server...
node app.js
echo Server stopped. Restarting ...
timeout /t 1 /nobreak >nul
goto start
