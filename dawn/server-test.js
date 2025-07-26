// Minimal Test Server - Render için
const WebSocket = require('ws');
const http = require('http');

console.log('🚀 Minimal Test Server başlıyor...');

const port = process.env.PORT || 8080;
const server = http.createServer();

// Health check
server.on('request', (req, res) => {
    res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
    });
    res.end(JSON.stringify({
        status: 'OK',
        message: 'Test Server Running',
        timestamp: new Date().toISOString(),
        port: port,
        url: 'wss://dawn-fi92.onrender.com'
    }));
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('✅ WebSocket bağlantısı!');
    
    ws.on('message', (data) => {
        console.log('📨 Mesaj:', data.toString());
        ws.send('Echo: ' + data);
    });
    
    ws.send('Hoş geldiniz!');
});

server.listen(port, () => {
    console.log(`🎮 Test Server çalışıyor: ${port}`);
    console.log('🌐 Health: /health');
    console.log('⚡ WebSocket ready');
});
