@echo off
color 0A
echo ========================================================
echo       Laptop Performance Optimizer (Developer Edition)
echo ========================================================
echo.

echo [1/5] Clearing Windows User Temporary Files...
del /s /f /q "%TEMP%\*.*" >nul 2>&1
rd /s /q "%TEMP%" >nul 2>&1
mkdir "%TEMP%" >nul 2>&1
echo Done!
echo.

echo [2/5] Clearing Windows System Temporary Files...
del /s /f /q "C:\Windows\Temp\*.*" >nul 2>&1
echo Done!
echo.

echo [3/5] Flushing DNS Cache for faster internet...
ipconfig /flushdns >nul
echo Done!
echo.

echo [4/5] Clearing Next.js Project Caches (This fixes slow dev servers)...
cd /d "%~dp0"
if exist ".next" (
    echo   - Cleaning root .next cache...
    rd /s /q ".next"
)
if exist "student-app\.next" (
    echo   - Cleaning student-app .next cache...
    rd /s /q "student-app\.next"
)
echo Done!
echo.

echo [5/5] Clearing NPM Cache...
call npm cache clean --force >nul 2>&1
echo Done!
echo.

echo ========================================================
echo All temporary files and heavy project caches are cleared!
echo.
echo NOTE: If you are running Local AI models (like Ollama or LMStudio),
echo make sure to close them from your taskbar to free up RAM.
echo.
echo Press any key to exit...
echo ========================================================
pause >nul
