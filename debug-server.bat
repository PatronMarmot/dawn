@echo off
echo 🔧 Node.js ve NPM Versiyonları
node --version
npm --version
echo.

echo 📁 Dosya Kontrol
dir server.js
dir package.json
echo.

echo 🧪 Server Test
echo Sunucu başlatılıyor... (Ctrl+C ile durdurun)
node server.js
pause
