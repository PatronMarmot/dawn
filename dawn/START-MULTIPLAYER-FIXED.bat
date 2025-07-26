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
echo 1. Server baslatildi (bu pencere)
echo 2. Tarayicida http://localhost:8080 ac
echo 3. F12 Debug Panel icin F12 bas
echo 4. COK OYUNCULU butonuna bas
echo 5. OYUN OLUSTUR veya OYUNA KATIL
echo 6. Test icin ikinci sekme ac
echo.
echo Server durdurmak icin Ctrl+C basin
echo ========================================
echo.

:: Set environment variables
set NODE_ENV=development
set PORT=8080

:: Start the server
echo Starting server-socketio.js...
node server-socketio.js

:: If server exits, show error
echo.
echo ========================================
echo SERVER DURDURULDU!
echo.
echo Hata varsa kontrol edin:
echo - Port 8080 kullaniliyor mu?
echo - Dependencies yuklu mu? (npm install)
echo - server-socketio.js dosyasi mevcut mu?
echo ========================================
pause