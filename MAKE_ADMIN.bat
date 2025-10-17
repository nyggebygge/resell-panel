@echo off
echo Making User Admin...
echo.

cd backend
node make-admin.js

echo.
echo Press any key to continue...
pause > nul
