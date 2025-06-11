@echo off
echo 🚀 Epic Card Battle - Vercel Deploy
echo.

cd /d "C:\Users\enesk\OneDrive\Belgeler\GitHub\dawn"

echo 📂 Proje dizinine geçiliyor...
echo Current directory: %CD%
echo.

echo 📋 Git durumu kontrol ediliyor...
git status
echo.

echo ➕ Tüm dosyaları staging'e ekleniyor...
git add .
echo.

echo 💾 Commit oluşturuluyor...
git commit -m "🚀 Vercel deployment optimization - WebSocket API updated"
echo.

echo 📤 GitHub'a push ediliyor...
git push origin main
echo.

echo ✅ Deploy tamamlandı!
echo.
echo 🌐 Şimdi Vercel'de deploy et:
echo 1. https://vercel.com adresine git
echo 2. GitHub ile giriş yap
echo 3. "New Project" → dawn repo'sunu seç
echo 4. "Deploy" butonuna bas
echo 5. 2-3 dakika bekle
echo.
echo 🎮 Deploy sonrası test için:
echo - Ana sayfa: https://PROJE-ADI.vercel.app
echo - Health Check: https://PROJE-ADI.vercel.app/api/health
echo.
pause