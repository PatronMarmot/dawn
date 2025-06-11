@echo off
title Epic Card Battle - Multiplayer Test
color 0A

echo.
echo  ███████╗██████╗ ██╗ ██████╗     ███╗   ███╗██╗   ██╗██╗  ████████╗██╗██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗ 
echo  ██╔════╝██╔══██╗██║██╔════╝     ████╗ ████║██║   ██║██║  ╚══██╔══╝██║██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
echo  █████╗  ██████╔╝██║██║          ██╔████╔██║██║   ██║██║     ██║   ██║██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
echo  ██╔══╝  ██╔═══╝ ██║██║          ██║╚██╔╝██║██║   ██║██║     ██║   ██║██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
echo  ███████╗██║     ██║╚██████╗     ██║ ╚═╝ ██║╚██████╔╝███████╗██║   ██║██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║
echo  ╚══════╝╚═╝     ╚═╝ ╚═════╝     ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
echo.
echo                                        🚀 MULTIPLAYER TEST BAŞLATILIYOR 🚀
echo.

cd /d "C:\Users\enesk\OneDrive\Belgeler\GitHub\dawn"

echo [1/4] 📂 Proje dizinine geçiliyor...
echo 📍 Konum: %CD%
echo.

echo [2/4] 📦 Dependencies kontrol ediliyor...
if not exist node_modules (
    echo 📥 Dependencies kuruluyor...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ NPM install başarısız!
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies mevcut
)

echo [3/4] 🔧 Multiplayer sistemi kontrol ediliyor...
if exist multiplayer.js (
    echo ✅ Multiplayer.js güncellendi
) else (
    echo ❌ multiplayer.js bulunamadı!
    pause
    exit /b 1
)

if exist server-socketio.js (
    echo ✅ Socket.io server hazır
) else (
    echo ❌ server-socketio.js bulunamadı!
    pause
    exit /b 1
)

echo [4/4] 🚀 Socket.io server başlatılıyor...
echo.
echo ✅ MULTIPLAYER HAZIR!
echo.

rem IP adresini otomatik bul
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set ip=%%a
    goto :found
)
:found
set ip=%ip: =%

echo 🌐 SERVER ADRESLERI:
echo    Local: http://localhost:8080
echo    Network: http://%ip%:8080
echo.
echo 🎮 MULTIPLAYER TEST NASIL YAPILIR:
echo.
echo    1️⃣ Bu server çalıştıktan sonra
echo    2️⃣ Tarayıcıda 2 tab aç:
echo       Tab 1: http://localhost:8080
echo       Tab 2: http://localhost:8080
echo.
echo    3️⃣ Her iki tabda "ÇOK OYUNCULU" tıkla
echo    4️⃣ Tab 1'de "OYUN OLUŞTUR" → ID'yi not al
echo    5️⃣ Tab 2'de "OYUNA KATIL" → ID'yi gir
echo    6️⃣ MULTIPLAYER SAVAŞ BAŞLAR! ⚔️
echo.
echo 👥 ARKADAŞLARLA TEST:
echo    Arkadaşların: http://%ip%:8080
echo    (Aynı Wi-Fi'da olmanız gerekli)
echo.
echo 🔧 SORUN GİDERME:
echo    - Server çalışmazsa: npm install yap
echo    - Bağlantı sorunu: Firewall kontrol et
echo    - Health check: http://localhost:8080/health
echo.
echo 📊 SERVER BAŞLATILIYOR...
echo    Tarayıcıda yukarıdaki adresleri açın!
echo.

rem Health check URL'ini otomatik aç
timeout /t 3 /nobreak >nul
start http://localhost:8080

echo 🎯 Server başlatıldı! Tarayıcı açıldı.
echo ⏳ Şimdi Socket.io server başlıyor...
echo.

rem Socket.io server'ı başlat
node server-socketio.js

pause