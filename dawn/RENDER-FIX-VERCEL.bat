@echo off
title 🚀 RENDER SORUNU - VERCEL'E GEÇİŞ
color 0C

echo.
echo ❌ RENDER SORUNU TESPİT EDİLDİ!
echo 📋 dawn-fi92.onrender.com → 404 Not Found
echo.
echo 🔄 ÇÖZÜM: VERCEL'E GEÇİYORUZ
echo ✅ Vercel daha stabil ve hızlı!
echo.

cd /d "C:\Users\enesk\OneDrive\Belgeler\GitHub\dawn"

echo [1/4] 📂 Proje dizinine geçiliyor...
echo 📍 Konum: %CD%
echo.

echo [2/4] ➕ Son değişiklikleri ekleniyor...
git add .
git commit -m "🔥 RENDER 404 FIX → VERCEL DEPLOY"
echo.

echo [3/4] 📤 GitHub'a push ediliyor...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Push başarısız!
    pause
    exit /b 1
)

echo [4/4] 🌐 Vercel'i açıyor...
timeout /t 2 /nobreak >nul
start https://vercel.com/new

echo.
echo ✅ GİT PUSH BAŞARILI!
echo.
echo 🎯 ŞİMDİ VERCEL'DE YAPA:
echo.
echo    1. ✅ Vercel açıldı
echo    2. 🔑 GitHub ile giriş yap
echo    3. 📁 "dawn" repo'sunu seç
echo    4. 🚀 "Deploy" butonuna bas
echo    5. ⏳ 2-3 dakika bekle
echo.
echo 🎮 SONUÇ:
echo    URL: https://dawn-RASTGELE.vercel.app
echo    Bu URL ile arkadaşlarınla test et!
echo.
echo 💡 NEDEN VERCEL?
echo    ✅ Daha stabil
echo    ✅ Daha hızlı
echo    ✅ WebSocket desteği iyi
echo    ❌ Render'da sorunlar var
echo.
pause