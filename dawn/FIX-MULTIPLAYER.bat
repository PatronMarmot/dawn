@echo off
title Epic Card Battle - SORUN GİDERME
color 0C

echo.
echo  ███████╗██████╗ ██╗ ██████╗    ███████╗██╗██╗  ██╗
echo  ██╔════╝██╔══██╗██║██╔════╝    ██╔════╝██║╚██╗██╔╝
echo  █████╗  ██████╔╝██║██║         █████╗  ██║ ╚███╔╝ 
echo  ██╔══╝  ██╔═══╝ ██║██║         ██╔══╝  ██║ ██╔██╗ 
echo  ███████╗██║     ██║╚██████╗    ██║     ██║██╔╝ ██╗
echo  ╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═╝     ╚═╝╚═╝  ╚═╝
echo.
echo                    🔧 MULTIPLAYER SORUN GİDERME 🔧
echo.

cd /d "C:\Users\enesk\OneDrive\Belgeler\GitHub\dawn"

echo [SORUN TESPİTİ] 📂 Proje dizini: %CD%
echo.

echo [1/5] 📦 Dependencies kontrol...
if not exist node_modules (
    echo ❌ node_modules yok! Installing...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ NPM install BAŞARISIZ!
        echo.
        echo 🔧 ÇÖZÜM:
        echo 1. Node.js kurulu mu? https://nodejs.org
        echo 2. npm --version komutu çalışıyor mu?
        echo 3. Internet bağlantısı var mı?
        pause
        exit /b 1
    )
    echo ✅ Dependencies kuruldu
) else (
    echo ✅ node_modules mevcut
)

echo [2/5] 🔧 Dosya kontrolleri...
if exist server-socketio.js (
    echo ✅ server-socketio.js mevcut
) else (
    echo ❌ server-socketio.js BULUNAMADI!
    echo 🔧 ÇÖZÜM: Claude'dan server-socketio.js dosyasını iste
    pause
    exit /b 1
)

if exist multiplayer.js (
    echo ✅ multiplayer.js mevcut
) else (
    echo ❌ multiplayer.js BULUNAMADI!
    echo 🔧 ÇÖZÜM: Claude'dan multiplayer.js dosyasını iste
    pause
    exit /b 1
)

if exist index.html (
    echo ✅ index.html mevcut
) else (
    echo ❌ index.html BULUNAMADI!
    pause
    exit /b 1
)

echo [3/5] 🔌 Port kontrolü...
netstat -an | find "8080" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 8080 kullanımda! Başka server çalışıyor olabilir.
    echo 🔧 ÇÖZÜM: Diğer server'ı kapat veya port değiştir
) else (
    echo ✅ Port 8080 müsait
)

echo [4/5] 🔥 Firewall kontrolü...
echo ⚠️  Windows Firewall Epic Card Battle'a izin veriyor mu?
echo 🔧 Gerekirse: Windows Defender Firewall → Allow an app

echo [5/5] 🚀 Server başlatılıyor...
echo.
echo ✅ TÜM KONTROLLER TAMAMLANDI!
echo.

rem IP adresini bul
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set ip=%%a
    goto :found
)
:found
set ip=%ip: =%

echo 🌐 SERVER BİLGİLERİ:
echo    Local: http://localhost:8080
echo    Network: http://%ip%:8080
echo    Health: http://localhost:8080/health
echo.
echo 🎮 2 OYUNCU TESTİ NASIL YAPILIR:
echo.
echo    1️⃣ Bu server çalıştıktan sonra...
echo    2️⃣ 2 farklı tarayıcı tab aç:
echo       Tab 1: http://localhost:8080
echo       Tab 2: http://localhost:8080
echo.
echo    3️⃣ Her iki tabda:
echo       "ÇOK OYUNCULU" butonuna tıkla
echo.
echo    4️⃣ Tab 1'de:
echo       "OYUN OLUŞTUR" tıkla
echo       ID'yi not al (örn: ABC123)
echo.
echo    5️⃣ Tab 2'de:
echo       "OYUNA KATIL" tıkla
echo       ID'yi gir (ABC123)
echo       Enter bas
echo.
echo    6️⃣ SONUÇ:
echo       İki tabda da oyun başlamalı
echo       "Multiplayer oyun başlıyor!" mesajı
echo       Artık gerçek zamanlı oynayabilirsiniz!
echo.
echo ⚠️  SORUN ÇIKMALARI:
echo    - Server başlamazsa: npm install yap
echo    - Bağlantı olmazsa: Firewall kontrol et
echo    - Health check yap: /health
echo    - F12 Debug panel aç (tarayıcıda)
echo.
echo 📊 SERVER BAŞLATILIYOR...
echo.

timeout /t 3 /nobreak >nul

rem Health check açmayı dene
start http://localhost:8080 2>nul

echo 🎯 Tarayıcı açılmaya çalışıldı
echo ⏳ Socket.io server başlatılıyor...
echo.
echo 📋 BEKLENEN ÇIKTI:
echo    "Server running on port 8080"
echo    "Ready for multiplayer battles!"
echo.
echo 🔧 SORUN ÇIKARSA:
echo    Ctrl+C ile dur
echo    START-MULTIPLAYER.bat yeniden çalıştır
echo.

rem Socket.io server'ı başlat
node server-socketio.js

echo.
echo ❌ Server kapandı! Hata kontrolü yap.
pause