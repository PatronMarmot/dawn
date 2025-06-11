@echo off
title Epic Card Battle - Git Push to Vercel
color 0A

echo.
echo  ███████╗██████╗ ██╗ ██████╗    ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗
echo  ██╔════╝██╔══██╗██║██╔════╝    ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝
echo  █████╗  ██████╔╝██║██║         ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ 
echo  ██╔══╝  ██╔═══╝ ██║██║         ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  
echo  ███████╗██║     ██║╚██████╗    ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   
echo  ╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   
echo.
echo                           🚀 VERCEL DEPLOY BASLIYOR 🚀
echo.

cd /d "C:\Users\enesk\OneDrive\Belgeler\GitHub\dawn"

echo [1/5] 📂 Proje dizinine geçiliyor...
echo 📍 Konum: %CD%
echo.

echo [2/5] 📋 Git durumu kontrol ediliyor...
git status --short
echo.

echo [3/5] ➕ Tüm dosyaları ekleniyor...
git add .
if %errorlevel% neq 0 (
    echo ❌ Git add başarısız!
    pause
    exit /b 1
)

echo [4/5] 💾 Commit oluşturuluyor...
git commit -m "🚀 VERCEL READY: Multiplayer WebSocket fixed + API optimized"
if %errorlevel% neq 0 (
    echo ⚠️  Commit atlandı (değişiklik yok)
)

echo [5/5] 📤 GitHub'a push ediliyor...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Push başarısız! İnternet bağlantısını kontrol edin.
    pause
    exit /b 1
)

echo.
echo ✅ GİT PUSH BAŞARILI!
echo.
echo 🌐 ŞİMDİ VERCEL'DE DEPLOY ET:
echo.
echo    1. https://vercel.com 👈 BU LİNKE GİT
echo    2. "Import Git Repository" seç
echo    3. "dawn" repo'sunu bul ve seç  
echo    4. "Deploy" butonuna bas
echo    5. 2-3 dakika bekle
echo.
echo 🎯 DEPLOY SONRASI:
echo    URL: https://dawn-RASTGELE.vercel.app
echo    Test: /api/health endpoint'ini kontrol et
echo.
echo 🎮 ARKADAŞLARLA TEST:
echo    Aynı URL'ye girin, "ÇOK OYUNCULU" seçin!
echo.

timeout /t 10 /nobreak >nul
start https://vercel.com/new

echo 🚀 Vercel açıldı! Deploy etmeye hazır!
echo.
pause