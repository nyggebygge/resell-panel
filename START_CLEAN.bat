@echo off
echo Starting Resell Panel - Clean Version
echo.

REM Kill any existing Node.js processes
taskkill /f /im node.exe >nul 2>&1
echo Killed existing processes

REM Start backend server
echo Starting backend server...
cd backend
start "Backend Server" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

REM Start frontend server
echo Starting frontend server...
cd ..
start "Frontend Server" cmd /k "python -m http.server 8080"
timeout /t 2 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:8080

echo.
echo ✅ Servers started successfully!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo.
pause
