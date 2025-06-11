// Epic Card Battle - Online Multiplayer Sistemi
// WebSocket tabanlı gerçek zamanlı multiplayer

class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.opponent = null;
        this.isMyTurn = false;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Sunucuya bağlan
    async connect() {
        try {
            addLog('🌐 Multiplayer sunucusuna bağlanılıyor...', 'info');
            
            // Güncellenmiş sunucu listesi
            const servers = [
                'ws://localhost:8080',              // Local development
                'wss://api.dawnlighten.com.tr',     // Custom domain (öncelik)
                'wss://dawn-fi92.onrender.com',     // Render direct URL
                'ws://dawn-fi92.onrender.com'       // Fallback
            ];
            
            for (const serverUrl of servers) {
                try {
                    addLog(`🔍 Deneniyor: ${serverUrl}`, 'info');
                    await this.tryConnect(serverUrl);
                    addLog(`✅ Bağlandı: ${serverUrl}`, 'win');
                    break;
                } catch (e) {
                    console.log(`❌ ${serverUrl} bağlantısı başarısız:`, e.message);
                    addLog(`❌ ${serverUrl} erişilemez`, 'error');
                    continue;
                }
            }
            
            if (!this.connected) {
                throw new Error('Hiçbir sunucuya bağlanılamadı');
            }
            
        } catch (error) {
            console.error('🚫 Tüm serverlar erişilemez:', error);
            addLog('🚫 Multiplayer server erişilemez', 'error');
            this.showOfflineMode();
        }
    }

    // Belirli server'a bağlanmayı dene
    tryConnect(serverUrl) {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(serverUrl);
            
            // 15 saniye timeout (Render cold start için)
            const timeout = setTimeout(() => {
                this.socket.close();
                reject(new Error('Timeout (15 saniye)'));
            }, 15000);

            this.socket.onopen = () => {
                clearTimeout(timeout);
                console.log('✅ WebSocket bağlandı:', serverUrl);
                this.connected = true;
                this.reconnectAttempts = 0;
                this.playerId = this.generateId();
                this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
                
                // Sunucuya bağlantı bilgisi gönder
                this.sendMessage({
                    type: 'player_connected',
                    playerId: this.playerId,
                    playerName: this.playerName,
                    version: '2.0',
                    timestamp: Date.now()
                });
                
                addLog('🎮 Online multiplayer aktif!', 'win');
                this.updateMultiplayerUI(true);
                resolve();
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (e) {
                    console.error('📨 Mesaj parse hatası:', e);
                }
            };

            this.socket.onclose = (event) => {
                clearTimeout(timeout);
                console.log('🔌 WebSocket bağlantısı kapandı:', event.code, event.reason);
                this.connected = false;
                this.updateMultiplayerUI(false);
                
                // Otomatik yeniden bağlanma
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    addLog(`🔄 Yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
                    setTimeout(() => this.connect(), 3000 * this.reconnectAttempts);
                } else {
                    addLog('❌ Bağlantı kalıcı olarak koptu', 'error');
                    this.showOfflineMode();
                }
                
                reject(new Error('Connection closed: ' + event.reason));
            };

            this.socket.onerror = (error) => {
                clearTimeout(timeout);
                console.error('🚫 WebSocket hatası:', error);
                reject(error);
            };
        });
    }

    // Mesaj gönder (güvenli)
    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(message));
                console.log('📤 Mesaj gönderildi:', message.type);
                return true;
            } catch (e) {
                console.error('📤 Mesaj gönderim hatası:', e);
                return false;
            }
        } else {
            console.warn('📤 Mesaj gönderilemedi: WebSocket bağlı değil');
            return false;
        }
    }

    // Oyun odası oluştur
    createGame() {
        if (!this.connected) {
            addLog('❌ Önce sunucuya bağlanın!', 'error');
            return;
        }

        this.gameId = this.generateId();
        this.isHost = true;
        
        const success = this.sendMessage({
            type: 'create_game',
            gameId: this.gameId,
            playerId: this.playerId,
            playerName: this.playerName,
            gameMode: '3v3_spells',
            timestamp: Date.now()
        });

        if (success) {
            addLog('🏠 Oyun odası oluşturuluyor...', 'info');
        } else {
            addLog('❌ Oyun oluşturulamadı!', 'error');
        }
    }

    // Oyuna katıl
    joinGame(gameId) {
        if (!this.connected) {
            addLog('❌ Önce sunucuya bağlanın!', 'error');
            return;
        }

        if (!gameId || gameId.trim().length === 0) {
            addLog('❌ Geçerli bir Oyun ID girin!', 'error');
            return;
        }

        this.gameId = gameId.trim().toUpperCase();
        this.isHost = false;
        
        const success = this.sendMessage({
            type: 'join_game',
            gameId: this.gameId,
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });

        if (success) {
            addLog(`🚪 ${this.gameId} odasına katılınıyor...`, 'info');
        } else {
            addLog('❌ Oyuna katılınamadı!', 'error');
        }
    }

    // Mesaj işleyici
    handleMessage(message) {
        console.log('📨 Gelen mesaj:', message.type, message);
        
        switch(message.type) {
            case 'game_created':
                this.onGameCreated(message);
                break;
            case 'player_joined':
                this.onPlayerJoined(message);
                break;
            case 'game_started':
                this.onGameStarted(message);
                break;
            case 'card_played':
                this.onOpponentCardPlayed(message);
                break;
            case 'spell_cast':
                this.onOpponentSpellCast(message);
                break;
            case 'battle_start':
                this.onOpponentBattleStart(message);
                break;
            case 'turn_changed':
                this.onTurnChanged(message);
                break;
            case 'game_ended':
                this.onGameEnded(message);
                break;
            case 'player_disconnected':
                this.onPlayerDisconnected(message);
                break;
            case 'error':
                this.onError(message);
                break;
            default:
                console.warn('🤷 Bilinmeyen mesaj türü:', message.type);
        }
    }

    // Event Handler'lar
    onGameCreated(message) {
        addLog(`🏠 Oyun odası oluşturuldu! ID: ${this.gameId}`, 'win');
        this.showWaitingRoom();
    }

    onPlayerJoined(message) {
        this.opponent = message.opponent;
        addLog(`👥 ${this.opponent.name} oyuna katıldı!`, 'info');
        
        // Host otomatik oyunu başlatır
        if (this.isHost) {
            addLog('🎮 Oyun 3 saniye içinde başlayacak...', 'info');
            setTimeout(() => {
                this.sendMessage({
                    type: 'start_game',
                    gameId: this.gameId,
                    playerId: this.playerId,
                    timestamp: Date.now()
                });
            }, 3000);
        }
    }

    onGameStarted(message) {
        addLog('🎮 Multiplayer oyun başlıyor!', 'win');
        this.closeWaitingRoom();
        
        // Oyun durumunu multiplayer'a çevir
        if (typeof gameState !== 'undefined') {
            gameState.isMultiplayer = true;
            gameState.multiplayerManager = this;
        }
        
        // İlk turu belirle
        this.isMyTurn = message.firstPlayer === this.playerId;
        this.updateTurnUI();
        
        if (this.isMyTurn) {
            addLog('⏰ Sizin ilk turunuz!', 'win');
        } else {
            addLog(`⏳ ${this.opponent.name} başlıyor...`, 'info');
        }
    }

    onError(message) {
        addLog(`❌ Server Hatası: ${message.message}`, 'error');
        console.error('Server error:', message);
    }

    // UI Yardımcı Fonksiyonlar
    showWaitingRoom() {
        // Mevcut waiting room varsa kaldır
        this.closeWaitingRoom();
        
        const modal = document.createElement('div');
        modal.id = 'waitingRoom';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🏠 Oyun Odası Hazır!</h2>
                <div class="waiting-content">
                    <p>Oyun ID'nizi paylaşın:</p>
                    <div class="game-id-container">
                        <strong class="game-id-display">${this.gameId}</strong>
                        <button onclick="navigator.clipboard.writeText('${this.gameId}').then(() => addLog('📋 ID kopyalandı!', 'info'))" class="copy-btn">📋 Kopyala</button>
                    </div>
                    <div class="waiting-spinner">
                        <div class="spinner"></div>
                        <p>İkinci oyuncunun katılması bekleniyor...</p>
                        <p><small>ID'yi arkadaşınıza gönderin!</small></p>
                    </div>
                </div>
                <button onclick="multiplayer.cancelGame()" class="menu-btn secondary-btn">❌ İptal Et</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    closeWaitingRoom() {
        const waitingRoom = document.getElementById('waitingRoom');
        if (waitingRoom) {
            waitingRoom.remove();
        }
    }

    updateMultiplayerUI(connected) {
        // Bağlantı durumu göstergelerini güncelle
        const statusElements = document.querySelectorAll('[id*="status"], [class*="status"]');
        statusElements.forEach(el => {
            if (el.textContent.includes('Sunucu') || el.textContent.includes('Bağlantı')) {
                el.textContent = connected ? '🟢 Bağlantı başarılı!' : '🔴 Sunucu erişilemez';
                el.style.color = connected ? '#10b981' : '#ef4444';
            }
        });
        
        // Multiplayer butonlarını aktif/pasif yap
        const multiplayerButtons = document.querySelectorAll('#createGameBtn, #joinGameBtn');
        multiplayerButtons.forEach(btn => {
            if (btn) {
                btn.disabled = !connected;
                btn.style.opacity = connected ? '1' : '0.5';
            }
        });
    }

    updateTurnUI() {
        const body = document.body;
        
        if (this.isMyTurn) {
            body.classList.add('my-turn');
            body.classList.remove('opponent-turn');
        } else {
            body.classList.add('opponent-turn');
            body.classList.remove('my-turn');
        }
    }

    showOfflineMode() {
        addLog('📡 Offline modda devam ediliyor...', 'info');
        this.updateMultiplayerUI(false);
    }

    cancelGame() {
        if (this.gameId && this.connected) {
            this.sendMessage({
                type: 'cancel_game',
                gameId: this.gameId,
                playerId: this.playerId,
                timestamp: Date.now()
            });
        }
        
        this.resetMultiplayerState();
        this.closeWaitingRoom();
        addLog('❌ Oyun iptal edildi', 'info');
    }

    resetMultiplayerState() {
        this.gameId = null;
        this.opponent = null;
        this.isHost = false;
        this.isMyTurn = false;
        
        // Game state temizle
        if (typeof gameState !== 'undefined') {
            gameState.isMultiplayer = false;
            gameState.multiplayerManager = null;
        }
        
        // UI sınıflarını temizle
        document.body.classList.remove('my-turn', 'opponent-turn');
    }

    // Bağlantıyı tamamen kapat
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'User disconnect');
            this.socket = null;
        }
        
        this.connected = false;
        this.updateMultiplayerUI(false);
        this.resetMultiplayerState();
    }

    // Yardımcı Fonksiyonlar
    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

// Global multiplayer manager
const multiplayer = new MultiplayerManager();

// CSS animasyonları
const multiplayerCSS = `
<style>
.my-turn::before {
    content: "⏰ SİZİN TURUNUZ";
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: bold;
    z-index: 9999;
    animation: turnPulse 2s infinite;
}

.opponent-turn::before {
    content: "⏳ RAKIP TURU";
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: bold;
    z-index: 9999;
    animation: turnPulse 2s infinite;
}

@keyframes turnPulse {
    0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(99, 102, 241, 0.2);
    border-left-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 1rem auto;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.game-id-display {
    font-family: 'Courier New', monospace;
    background: rgba(99, 102, 241, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #6366f1;
    color: #6366f1;
    font-size: 1.2rem;
    letter-spacing: 2px;
    margin: 0.5rem;
}

.copy-btn {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid #6366f1;
    color: #6366f1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    margin: 0.5rem;
    transition: all 0.3s ease;
}

.copy-btn:hover {
    background: #6366f1;
    color: white;
}

.waiting-content {
    text-align: center;
    padding: 2rem;
}

.game-id-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1rem 0;
}
</style>
`;

// CSS'i head'e ekle
document.head.insertAdjacentHTML('beforeend', multiplayerCSS);

// Export
window.multiplayer = multiplayer;
