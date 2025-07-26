// Render WebSocket Test
const WebSocket = require('ws');

console.log('🧪 Render Server Test...\n');

async function testRenderServer() {
    const testUrls = [
        'wss://dawn-fi92.onrender.com',
        'ws://dawn-fi92.onrender.com',
        'wss://dawn-fi92.onrender.com:10000',
        'wss://dawn-fi92.onrender.com:18000'
    ];
    
    for (const url of testUrls) {
        console.log(`\n🔍 Test: ${url}`);
        
        try {
            await testConnection(url);
        } catch (error) {
            console.log(`❌ Başarısız: ${error.message}`);
        }
    }
}

function testConnection(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Timeout (10 saniye)'));
        }, 10000);
        
        const ws = new WebSocket(url);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log(`✅ Bağlandı!`);
            
            // Test mesajı
            ws.send(JSON.stringify({
                type: 'player_connected',
                playerId: 'TEST_123',
                playerName: 'Test Player'
            }));
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 2000);
        });
        
        ws.on('message', (data) => {
            console.log(`📨 Yanıt:`, data.toString());
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        
        ws.on('close', () => {
            console.log(`🔌 Bağlantı kapandı`);
            resolve();
        });
    });
}

testRenderServer().then(() => {
    console.log('\n🏁 Test tamamlandı!');
});
