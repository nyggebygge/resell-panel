@echo off
title Resell Panel
echo Starting Resell Panel Servers...

echo Killing existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im cmd.exe >nul 2>&1

echo Starting Backend Server...
start "Backend" cmd /k "cd /d C:\Users\inneb\Desktop\resell panel\backend && node server.js"

echo Waiting for backend...
timeout /t 8 /nobreak >nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d C:\Users\inneb\Desktop\resell panel && node server.js"

echo.
echo Servers started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo.
echo Login: test@example.com / password123
echo.
start http://localhost:3000
echo.
pause
