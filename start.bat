@echo off
setlocal
set "START_SCRIPT=%~dp03d-model-platform\scripts\start-dev.ps1"
if not exist "%START_SCRIPT%" (
  echo Startup script not found: "%START_SCRIPT%"
  pause
  exit /b 1
)
start "3D Platform - Backend" powershell.exe -NoProfile -NoExit -ExecutionPolicy Bypass -File "%START_SCRIPT%" -Service backend
start "3D Platform - Frontend" powershell.exe -NoProfile -NoExit -ExecutionPolicy Bypass -File "%START_SCRIPT%" -Service frontend
endlocal
