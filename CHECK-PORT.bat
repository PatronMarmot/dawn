@echo off
title PORT KONTROL
color 0E

echo 🔍 PORT 8080 KONTROLÜ:
echo.

netstat -an | find "8080"
if %errorlevel% equ 0 (
    echo ✅ Port 8080 kullanımda - Server çalışıyor olabilir
) else (
    echo ❌ Port 8080 boş - Server çalışmıyor!
    echo.
    echo 🔧 ÇÖZÜM:
    echo 1. START-MULTIPLAYER.bat çalıştır
    echo 2. node server-socketio.js komutu
    pause
    exit
)

echo.
echo 🌐 LOCALHOST TEST:
curl -s http://localhost:8080/health
if %errorlevel% equ 0 (
    echo ✅ HTTP Server yanıt veriyor
) else (
    echo ❌ HTTP Server yanıt vermiyor
)

echo.
echo 🔧 Manuel test için:
echo Browser console'da çalıştır:
echo.
echo const testSocket = io('http://localhost:8080');
echo testSocket.on('connect', () => console.log('BAĞLANTI OK'));
echo testSocket.on('connect_error', (err) => console.log('HATA:', err));
echo.
pause