@echo off
echo Creating Admin User...
echo.

cd backend
node create-admin.js

echo.
echo Press any key to continue...
pause > nul
