@echo off
echo Building React Frontend for Production...
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build production version
echo.
echo Building production version...
call npm run build

echo.
echo Build complete! The 'build' folder contains your production-ready frontend.
echo.
echo Next steps:
echo 1. Compress the build folder to a zip file
echo 2. Upload it to your EC2 instance
echo.
pause