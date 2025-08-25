@echo off
echo ========================================
echo    StartLinker Frontend Build Script
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Building production version...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Creating zip file...
if exist frontend-build.zip del frontend-build.zip
powershell -command "Compress-Archive -Path build\* -DestinationPath frontend-build.zip"

echo.
echo ========================================
echo    BUILD COMPLETE!
echo ========================================
echo.
echo frontend-build.zip has been created.
echo.
echo Next steps:
echo 1. Upload frontend-build.zip to your EC2 instance
echo 2. Use AWS Console > EC2 > Connect > Upload file
echo.
pause