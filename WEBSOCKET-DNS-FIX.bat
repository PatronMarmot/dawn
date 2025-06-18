@echo off
echo 🚀 Epic Card Battle - WebSocket DNS Fix
echo =====================================

echo.
echo 📋 WebSocket DNS yapılandırması tamamlandı!
echo.
echo ✅ YAPILAN DEĞİŞİKLİKLER:
echo    - websocket-server.js (Özel WebSocket server)
echo    - multiplayer-render.js (Socket.io entegrasyonu)
echo    - index.html (Socket.io CDN eklendi)
echo    - DNS için hazır konfigürasyon
echo.
echo 🔄 SONRAKI ADIMLAR:
echo.
echo 1. GitHub'a push et:
echo    git add .
echo    git commit -m "WebSocket DNS fix for dawnlighten.com.tr"
echo    git push origin main
echo.
echo 2. Render.com'da yeni Web Service oluştur:
echo    - Repository: Bu GitHub repo
echo    - Name: dawn-websocket
echo    - Start Command: node websocket-server.js
echo.
echo 3. Domain panelde DNS ayarı ekle:
echo    Type: CNAME
echo    Host: ws
echo    Target: dawn-websocket.onrender.com
echo.
echo 4. Test (5-10 dakika sonra):
echo    https://ws.dawnlighten.com.tr/health
echo.
echo ⚡ WebSocket URL öncelik sırası:
echo    1. wss://ws.dawnlighten.com.tr (DNS subdomain)
echo    2. wss://dawnlighten.com.tr (Ana domain)
echo    3. wss://dawn-websocket.onrender.com (Direct)
echo    4. Local fallback mode
echo.

pause
