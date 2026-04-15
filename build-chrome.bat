@echo off
setlocal

REM Working directory (folder of this script)
set "WORK_DIR=%~dp0"
set "SOURCE_DIR=%WORK_DIR%chrome"
set "OUTPUT_FILE=%WORK_DIR%allegro-classic-view-chrome.zip"

REM Locate 7-Zip
set "SEVEN_ZIP=%ProgramFiles%\7-Zip\7z.exe"
if not exist "%SEVEN_ZIP%" set "SEVEN_ZIP=%ProgramFiles(x86)%\7-Zip\7z.exe"

if not exist "%SEVEN_ZIP%" (
    echo ERROR: 7-Zip not found. Install 7-Zip first.
    exit /b 1
)

if not exist "%SOURCE_DIR%\manifest.json" (
    echo ERROR: Missing source folder or manifest: "%SOURCE_DIR%"
    exit /b 1
)

REM Remove old package
if exist "%OUTPUT_FILE%" (
    echo Removing old package: "%OUTPUT_FILE%"
    del "%OUTPUT_FILE%"
)

REM Build ZIP for Chrome Web Store
echo Packing Chrome extension...
"%SEVEN_ZIP%" a -tzip "%OUTPUT_FILE%" "%SOURCE_DIR%\*" ^
    -x!web-ext-artifacts -x!signed -x!node_modules -x!.git -x!.idea

if errorlevel 1 (
    echo ERROR: Packaging failed.
    exit /b 1
)

echo Done: "%OUTPUT_FILE%"
endlocal
