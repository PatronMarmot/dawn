#!/bin/bash

echo "🚀 Epic Card Battle - WebSocket Server Deploy"
echo "=================================="

# Render.com için WebSocket server deploy scripti
echo "📦 Installing dependencies..."
npm install express socket.io cors --save

echo "🔧 Creating package.json for websocket server..."
cp package-websocket.json package-websocket-deploy.json

echo "🌐 Setting up Render configuration..."
echo "
# Render WebSocket Server Deploy

## 1. GitHub'a push et:
git add .
git commit -m 'WebSocket server added for dawnlighten.com.tr'
git push origin main

## 2. Render.com'da yeni service oluştur:
- Name: dawn-websocket
- Environment: Node
- Build Command: npm install
- Start Command: node websocket-server.js
- Auto-Deploy: Yes

## 3. Domain panel DNS ayarları:
Type: CNAME
Host: ws
Target: dawn-websocket.onrender.com
TTL: 300

## 4. Test:
- https://dawn-websocket.onrender.com/health
- wss://dawn-websocket.onrender.com (WebSocket)
"

echo "✅ WebSocket server hazır! Render.com'a deploy edebilirsiniz."
echo "🔗 DNS: ws.dawnlighten.com.tr -> Render WebSocket Server"
