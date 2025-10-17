@echo off
echo 🚀 Uploading Resell Panel to GitHub...
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first:
    echo    https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo ✅ Git is installed
echo.

REM Initialize git repository
echo 📁 Initializing Git repository...
git init

REM Add all files
echo 📤 Adding files to Git...
git add .

REM Create commit
echo 💾 Creating initial commit...
git commit -m "Initial commit: Resell Panel with MySQL backend"

echo.
echo 🎉 Git repository initialized!
echo.
echo 📋 Next steps:
echo 1. Go to https://github.com and create a new repository
echo 2. Copy the repository URL
echo 3. Run these commands:
echo    git remote add origin YOUR_REPOSITORY_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo 📝 Replace YOUR_REPOSITORY_URL with your GitHub repository URL
echo    Example: https://github.com/yourusername/resell-panel.git
echo.
pause
