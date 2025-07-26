@echo off
title Epic Card Battle - Multiplayer Connection Fix
color 0A

echo ================================================================
echo                 EPIC CARD BATTLE - MULTIPLAYER FIX
echo ================================================================
echo.

echo [1] Testing current server status...
curl -s https://dawn-fi92.onrender.com/health
echo.

echo [2] Waking up Render server...
echo Please wait 30 seconds for Render to wake up...
curl -s https://dawn-fi92.onrender.com/ > nul
timeout /t 5 /nobreak > nul

echo [3] Testing Socket.io connection...
echo Opening browser test page...
start "" "%~dp0quick-connection-test.html"

echo.
echo [4] Available options:
echo.
echo A) Local Server Test:
echo    - Run START-MULTIPLAYER.bat
echo    - Open http://localhost:8080
echo.
echo B) Render Server Test:
echo    - Wait 30 seconds for wake-up
echo    - Test https://dawn-fi92.onrender.com
echo.
echo C) Alternative: Deploy to new server
echo    - Vercel: https://vercel.com/new
echo    - Railway: https://railway.app/
echo.

echo ================================================================
echo                        CONNECTION GUIDE
echo ================================================================
echo.
echo PROBLEM: Server is probably sleeping (Render free tier)
echo.
echo SOLUTIONS:
echo 1. Wait 30-60 seconds for Render to wake up
echo 2. Use local server: START-MULTIPLAYER.bat
echo 3. Deploy to new hosting service
echo.
echo Press any key to open connection test page...
pause > nul

start "" "https://dawn-fi92.onrender.com/health"
start "" "%~dp0index.html"

echo.
echo Connection test completed!
echo Check browser console (F12) for detailed logs.
echo.
pause
