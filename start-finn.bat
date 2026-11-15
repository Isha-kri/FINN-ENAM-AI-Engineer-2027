@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 20.19+ or 22.12+ from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing FINN dependencies...
  call npm ci --include=dev
  if errorlevel 1 exit /b 1
)

echo Building FINN...
call npm run build
if errorlevel 1 exit /b 1

echo.
echo FINN is starting. Open http://localhost:8000 in your browser.
echo Keep this window open while using FINN. Press Ctrl+C to stop it.
call npm start
