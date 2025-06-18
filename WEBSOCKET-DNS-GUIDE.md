# Epic Card Battle - WebSocket Server Deploy Guide

## 🎯 HIZLI DEPLOY - 3 ADIM

### 1. 🚀 Render.com Deploy
```bash
# GitHub'a push et
git add .
git commit -m "WebSocket server for dawnlighten.com.tr"
git push origin main

# Render.com'da yeni Web Service oluştur:
- Repository: Bu GitHub repo
- Name: dawn-websocket
- Environment: Node
- Build Command: npm install
- Start Command: node websocket-server.js
- Auto-Deploy: Yes
```

### 2. 🌐 DNS Ayarları (Domain Panel)
```dns
# Domain sağlayıcısında (Türk.net, GoDaddy vb.)
Type: CNAME
Host: ws
Target: dawn-websocket.onrender.com
TTL: 300

# Alternatif A Record (IP ile):
Type: A
Host: ws  
Value: [Render Server IP]
TTL: 300
```

### 3. ✅ Test
```bash
# WebSocket server test
curl https://dawn-websocket.onrender.com/health

# DNS test (5-10 dakika sonra)
nslookup ws.dawnlighten.com.tr

# Client test
# dawnlighten.com.tr'ye gidip multiplayer test et
```

## 🔧 Dosya Değişiklikleri

### ✅ Eklenen Dosyalar:
- `websocket-server.js` - Özel WebSocket server
- `package-websocket.json` - Dependencies
- `socket-io-client.js` - Client library
- `WEBSOCKET-DEPLOY.bat` - Deploy script

### ✅ Güncellenen Dosyalar:
- `multiplayer-render.js` - Socket.io entegrasyonu
- `index.html` - Socket.io CDN eklendi

## 🎮 Yeni WebSocket Sistem

### Server URLs (Öncelik Sırası):
1. `wss://ws.dawnlighten.com.tr` - DNS subdomain (Optimum)
2. `wss://dawnlighten.com.tr` - Ana domain fallback
3. `wss://dawn-websocket.onrender.com` - Direct Render
4. `wss://dawn-epic-card.vercel.app` - Vercel backup

### Özellikler:
- ✅ Socket.io real-time multiplayer
- ✅ DNS subdomain optimize
- ✅ Multiple server fallback
- ✅ Local mode backup
- ✅ Auto-reconnection
- ✅ Heartbeat system

## 🚨 Sonraki Adımlar

1. **GitHub Push**: Tüm değişiklikleri push et
2. **Render Deploy**: WebSocket server'ı deploy et
3. **DNS Update**: Domain panelde CNAME ekle
4. **Test**: Multiplayer bağlantıyı test et

Deploy sonrası WebSocket URL'leri otomatik çalışacak!
