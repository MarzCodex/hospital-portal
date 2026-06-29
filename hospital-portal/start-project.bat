@echo off
color 0a
title Hospital Portal Server
echo ========================================
echo    Runing Hospital Portal Server
echo ========================================
echo.

:: Navigate to the correct directory
cd /d "D:\STORE\Store\PROGRAMS & PROJECTS\About Projects\The Projects\NHIF\hospital-portal"

:: Start Python server in a new window
start "Hospital Portal Server" /min cmd /k "python -m http.server 2526 --bind 0.0.0.0"

:: Wait for server to initialize
timeout /t 2 /nobreak > nul

:: Open login page in browser
start http://localhost:2526/login.html
echo.
echo Server Status: Online
echo Listening Port: 2526
echo.
echo Login page opened in your browser
echo System Credentials (Demo)
echo username: admin
echo password: admin123
echo.
echo Perhaps Phill is indeed a Genius!
echo.
echo CLOSE the "Hospital Portal Server" window to stop the server OR
echo.

pause