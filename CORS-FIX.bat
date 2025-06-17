@echo off
title Epic Card Battle - CORS Fix Deploy
color 0A

echo ================================================================
echo              EPIC CARD BATTLE - CORS HATASI DUZELTME
echo ================================================================
echo.

echo [1] CORS hatasi duzeltmeleri yapildi:
echo     - Server CORS: origin: true 
echo     - Socket.io: credentials: false
echo     - Client: polling only transport
echo     - Preflight OPTIONS handler eklendi
echo.

echo [2] Test sayfasi aciliyor...
start "" "%~dp0cors-test.html"
echo.

echo [3] Git commit ve push...
cd /d "%~dp0"
git add .
git commit -m "Fix CORS issues: ultra aggressive CORS, polling transport, no credentials"
git push
echo.

echo [4] Render auto-deploy beklemede...
echo     Manuel deploy icin: https://dashboard.render.com/
echo.

echo [5] Test adimalari:
echo     A) cors-test.html acildi - baglanti test edin
echo     B) 2-3 dakika bekleyin (Render deploy)
echo     C) Ana oyunu test edin: index.html
echo.

echo [6] Eger hala calismiyorsa:
echo     - Render logs kontrol edin
echo     - Manual deploy yapin
echo     - Alternatif server deneyin
echo.

echo ================================================================
echo                      CORS TEST SONUCLARI
echo ================================================================
echo.
echo Test sayfasinda su sonuclari kontrol edin:
echo - Socket.io library: YESIL (yuklendi)
echo - Server connection: YESIL (baglandi)
echo - CORS errors: YOK (temizlendi)
echo.

pause
echo.
echo CORS duzeltme tamamlandi!
echo Browser'da F12 Console kontrol edin.
pause
