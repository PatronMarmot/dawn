@echo off
title 🔧 VERCEL RUNTIME FIX
color 0A

echo.
echo 🔧 VERCEL RUNTIME HATASI DÜZELTİLİYOR...
echo ❌ Eski: nodejs18.x (deprecated)
echo ✅ Yeni: nodejs20.x (stable)
echo.

cd /d "C:\Users\enesk\OneDrive\Belgeler\GitHub\dawn"

echo [1/3] ➕ Düzeltmeleri ekleniyor...
git add .
git commit -m "🔧 FIX: Vercel runtime nodejs20.x + simplified APIs"

echo [2/3] 📤 GitHub'a push ediliyor...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Push başarısız!
    pause
    exit /b 1
)

echo [3/3] 🚀 Vercel otomatik redeploy başlatacak...
echo.
echo ✅ DÜZELTME TAMAMLANDI!
echo.
echo 📋 YAPILAN DEĞİŞİKLİKLER:
echo    ✅ vercel.json → nodejs20.x
echo    ✅ API'ler basitleştirildi
echo    ✅ WebSocket sorunu çözüldü
echo.
echo ⏳ VERCEl REDEPLOY BEKLENİYOR:
echo    1-2 dakika bekleyin
echo    Vercel otomatik yeniden deploy edecek
echo.
echo 🎮 TEST İÇİN:
echo    URL: https://PROJE-ADI.vercel.app
echo    Health: https://PROJE-ADI.vercel.app/api/health
echo.
pause