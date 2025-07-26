@echo off
echo 🎮 Epic Card Battle - WebSocket Server Başlatılıyor...
echo.

REM Node.js kontrolü
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js bulunamadı! nodejs.org'dan Node.js indirin.
    pause
    exit /b 1
)

echo ✅ Node.js bulundu!

REM NPM dependencies kontrolü
if not exist node_modules (
    echo 📦 Dependencies yükleniyor...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install başarısız!
        pause
        exit /b 1
    )
)

echo ✅ Dependencies hazır!
echo.
echo 🚀 Server başlatılıyor...
echo 📍 http://localhost:8080
echo 🌐 WebSocket: ws://localhost:8080
echo.
echo ⚠️  Server'ı durdurmak için Ctrl+C kullanın
echo.

node server.js
pause
