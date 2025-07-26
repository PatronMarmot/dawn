// WebSocket Test Script
// Bu dosyayı çalıştırarak server'ınızı test edebilirsiniz

const WebSocket = require('ws');

console.log('🧪 WebSocket Server Test Başlıyor...\n');

async function testServer() {
    const testCases = [
        'ws://localhost:8080',
        'wss://dawn-fi92.onrender.com'
    ];
    
    for (const serverUrl of testCases) {
        console.log(`\n🔍 Test ediliyor: ${serverUrl}`);
        
        try {
            await testConnection(serverUrl);
        } catch (error) {
            console.log(`❌ ${serverUrl} - Bağlantı başarısız:`, error.message);
        }
    }
}

function testConnection(serverUrl) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Timeout - 5 saniye içinde yanıt alınamadı'));
        }, 5000);
        
        const ws = new WebSocket(serverUrl);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('✅ Bağlantı başarılı!');
            
            // Test mesajı gönder
            const testMessage = {
                type: 'player_connected',
                playerId: 'TEST_PLAYER_123',
                playerName: 'Test Oyuncu',
                version: '2.0'
            };
            
            console.log('📤 Test mesajı gönderiliyor:', testMessage.type);
            ws.send(JSON.stringify(testMessage));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log('📨 Sunucudan yanıt:', message);
            } catch (e) {
                console.log('📨 Ham veri:', data.toString());
            }
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 1000);
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        
        ws.on('close', () => {
            console.log('🔌 Bağlantı kapatıldı');
            resolve();
        });
    });
}

// Test başlat
testServer().then(() => {
    console.log('\n🏁 Test tamamlandı!');
    console.log('\n📋 Sonraki Adımlar:');
    console.log('1. node server.js - Local server\'ı başlat');
    console.log('2. GitHub Pages\'te index.html\'i aç');
    console.log('3. Multiplayer butonuna tıkla');
    console.log('4. İki farklı tarayıcıda test et\n');
});
