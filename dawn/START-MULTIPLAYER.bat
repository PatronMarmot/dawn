@echo off
echo ========================================
echo   EPIC CARD BATTLE - MULTIPLAYER SERVER
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js bulunamadi!
    echo Lutfen Node.js yukleyin: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version: 
node --version
echo.

:: Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json bulunamadi!
    echo Bu dosyayi proje klasorunun icinde calistirin.
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Dependencies yuklenemedi!
        pause
        exit /b 1
    )
    echo.
)

:: Check if server file exists
if not exist "server-socketio.js" (
    echo ERROR: server-socketio.js bulunamadi!
    pause
    exit /b 1
)

echo Starting Epic Card Battle Multiplayer Server...
echo.
echo Server Info:
echo - URL: http://localhost:8080
echo - Health Check: http://localhost:8080/health
echo - Socket.io endpoint ready
echo - CORS enabled for all origins
echo.
echo TESTING INSTRUCTIONS:
echo 1. Server calistiktan sonra tarayicida: http://localhost:8080
echo 2. Ana menuye git ve "COK OYUNCULU" tikla
echo 3. Birinci tab: "OYUN OLUSTUR"
echo 4. Ikinci tab ac ve ayni ID ile "OYUNA KATIL"
echo 5. Otomatik oyun baslayacak!
echo.
echo Press Ctrl+C to stop server
echo ========================================
echo.

:: Start the Socket.io server
node server-socketio.js

:: If server stops, pause to see any error messages
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server durdu! Hata kodu: %errorlevel%
    echo.
    echo Common solutions:
    echo - Port 8080 zaten kullaniliyor olabilir
    echo - Windows Defender/Firewall engelleme
    echo - Dependencies eksik: npm install
    echo.
)

pause