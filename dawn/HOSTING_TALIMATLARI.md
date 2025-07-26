# 🌐 Epic Card Battle - Hosting Kurulum Talimatları 
 
## 📋 Bu klasördeki dosyalar: 
 
### 🎮 Oyun Dosyaları: 
- index.html (Ana oyun sayfası) 
- script.js (Oyun mantığı) 
- multiplayer.js (Çok oyunculu sistem) 
- style.css (Görsel tasarım) 
- images/ (Kart görselleri) 
 
### 🖥️ Server Dosyaları: 
- server.js (Node.js WebSocket server) 
- package.json (NPM bağımlılıkları) 
 
### ⚙️ Hosting Ayarları: 
- .htaccess (Apache ayarları) 
- nginx.conf (Nginx ayarları) 
 
## 🚀 Kurulum Adımları: 
 
### cPanel + Node.js: 
1. Bu klasördeki tüm dosyaları public_html/epic-card-battle/ yükleyin 
2. cPanel Node.js App oluşturun 
3. Application Root: epic-card-battle 
4. Startup File: server.js 
5. npm install çalıştırın 
 
### VPS/Dedicated: 
1. SSH ile bağlanın 
2. /var/www/epic-card-battle/ oluşturun 
3. Bu dosyaları upload edin 
4. npm install çalıştırın 
5. PM2 ile başlatın: pm2 start server.js 
6. Nginx proxy ayarını yapın 
