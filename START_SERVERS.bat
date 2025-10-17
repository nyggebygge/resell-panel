@echo off
cls
title Resell Panel - Server Starter
color 0A

echo.
echo ========================================
echo    RESELL PANEL - STARTING SERVERS
echo ========================================
echo.

echo [STEP 1] Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
echo ✓ Killed existing Node.js processes

echo.
echo [STEP 2] Starting Backend Server (Port 3001)...
cd /d "C:\Users\inneb\Desktop\resell panel\backend"
start "Backend Server" cmd /k "echo Backend Server Starting... && node server.js"
echo ✓ Backend server window opened

echo.
echo [STEP 3] Waiting for backend to initialize...
echo Please wait 10 seconds for database setup...
timeout /t 10 /nobreak >nul
echo ✓ Backend initialization complete

echo.
echo [STEP 4] Starting Frontend Server (Port 3000)...
cd /d "C:\Users\inneb\Desktop\resell panel"
start "Frontend Server" cmd /k "echo Frontend Server Starting... && node server.js"
echo ✓ Frontend server window opened

echo.
echo ========================================
echo    SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3001
echo.
echo 📝 Login Credentials:
echo    Email: Check your database for existing users
echo    Password: Or register a new account
echo.
echo Opening your browser...
start http://localhost:3000

echo.
echo ✅ Both servers are now running in separate windows!
echo ✅ Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause >nul
