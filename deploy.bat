@echo off
echo ========================================
echo    Resell Panel - Simple Deployment
echo ========================================
echo.

echo [1/3] Logging into Railway...
npx @railway/cli login

echo.
echo [2/3] Creating new project...
npx @railway/cli init

echo.
echo [3/3] Deploying to Railway...
npx @railway/cli up

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Your app is now deployed!
echo Get your URL with: npx @railway/cli domain
echo.
pause
