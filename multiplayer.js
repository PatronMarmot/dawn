// Epic Card Battle - Fixed Multiplayer System (Connection Fixed)
// Socket.io + Local Server Support

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
        this.maxReconnectAttempts = 3;
        this.gameRooms = new Map(); // Local room management
    }

    // Sunucuya bağlan - Socket.io ve Local support
    async connect() {
        try {
            addLog('🌐 Multiplayer sistemi başlatılıyor...', 'info');
            
            // Socket.io server URLs (FIXED ORDER)
            const servers = [
                'http://localhost:8080',                     // Local Socket.io server (PRIMARY)
                'https://dawn-epic-card.onrender.com',       // Render production
                'wss://dawn-epic-card.vercel.app',          // Vercel backup
                'LOCAL_MODE'                                 // Local browser mode (FALLBACK)
            ];
            
            for (const serverUrl of servers) {
                try {
                    addLog(`🔍 Deneniyor: ${serverUrl}`, 'info');
                    
                    if (serverUrl === 'LOCAL_MODE') {
                        await this.enableLocalMode();
                        addLog('✅ Local multiplayer aktif!', 'win');
                        break;
                    } else {
                        await this.trySocketIO(serverUrl);
                        addLog(`✅ Socket.io bağlandı: ${serverUrl}`, 'win');
                        break;
                    }
                } catch (e) {
                    console.log(`❌ ${serverUrl} bağlantısı başarısız:`, e.message);
                    addLog(`❌ ${serverUrl} erişilemez`, 'error');
                    continue;
                }
            }
            
            if (!this.connected) {
                addLog('⚠️ Server bulunamadı, local mode aktif', 'info');
                await this.enableLocalMode();
            }
            
        } catch (error) {
            console.error('🚫 Multiplayer sistem hatası:', error);
            addLog('🔧 Local multiplayer moduna geçiliyor...', 'info');
            await this.enableLocalMode();
        }
    }

    // Socket.io bağlantısı dene
    trySocketIO(serverUrl) {
        return new Promise((resolve, reject) => {
            // Socket.io client kontrolü
            if (typeof io === 'undefined') {
                reject(new Error('Socket.io client not loaded'));
                return;
            }

            console.log('🔌 Socket.io ile bağlanılıyor:', serverUrl);
            
            const timeout = setTimeout(() => {
                if (this.socket) {
                    this.socket.disconnect();
                }
                reject(new Error('Bağlantı timeout (8 saniye)'));
            }, 8000);

            // Socket.io bağlantısı
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 5000,
                forceNew: true,
                reconnection: false,
                autoConnect: true
            });

            this.socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('✅ Socket.io connected to:', serverUrl);
                this.connected = true;
                this.setupSocketIOEvents();
                
                this.playerId = this.socket.id;
                this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
                
                // Register player
                this.socket.emit('register_player', {
                    name: this.playerName
                });
                
                this.updateMultiplayerUI(true);
                console.log('🎮 Socket.io multiplayer ready!');
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.error('❌ Socket.io connection error:', error);
                this.connected = false;
                if (this.socket) {
                    this.socket.disconnect();
                }
                reject(new Error('Socket.io connection failed: ' + error.message));
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 Socket.io disconnected:', reason);
                this.connected = false;
                this.updateMultiplayerUI(false);
                addLog('❌ Server bağlantısı kesildi', 'error');
            });
        });
    }

    // Local mode (browser-only multiplayer)
    async enableLocalMode() {
        this.connected = true;
        this.playerId = this.generateId();
        this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
        
        // Local storage event listener for cross-tab communication
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('epic_game_')) {
                this.handleLocalMessage(e.key, e.newValue);
            }
        });
        
        addLog('🏠 Local multiplayer aktif! (Aynı tarayıcıda tab açın)', 'win');
        this.updateMultiplayerUI(true);
        return Promise.resolve();
    }

    // Socket.io events setup
    setupSocketIOEvents() {
        if (!this.socket) return;

        this.socket.on('player_registered', (data) => {
            console.log('👤 Player registered:', data);
            addLog('🎮 Socket.io server bağlantısı başarılı!', 'win');
        });

        this.socket.on('game_created', (data) => this.onGameCreated(data));
        this.socket.on('player_joined', (data) => this.onPlayerJoined(data));
        this.socket.on('game_started', (data) => this.onGameStarted(data));
        this.socket.on('opponent_card_played', (data) => this.onOpponentCardPlayed(data));
        this.socket.on('opponent_spell_cast', (data) => this.onOpponentSpellCast(data));
        this.socket.on('turn_changed', (data) => this.onTurnChanged(data));
        this.socket.on('game_ended', (data) => this.onGameEnded(data));
        this.socket.on('player_disconnected', (data) => this.onPlayerDisconnected(data));
        this.socket.on('error', (data) => this.onError(data));

        // Connection health check
        this.socket.on('pong', (data) => {
            console.log('💓 Server heartbeat OK');
        });

        // Send periodic ping
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('ping');
            }
        }, 30000); // 30 saniye
    }

    // Local message handler
    handleLocalMessage(key, value) {
        if (!value) return;
        
        try {
            const data = JSON.parse(value);
            
            if (data.type === 'join_game' && data.gameId === this.gameId && data.playerId !== this.playerId) {
                this.onPlayerJoined({
                    opponent: {
                        id: data.playerId,
                        name: data.playerName
                    }
                });
            }
            
            if (data.gameId === this.gameId && data.playerId !== this.playerId) {
                this.handleMessage(data);
            }
        } catch (e) {
            console.warn('Local message parse error:', e);
        }
    }

    // Oyun odası oluştur
    createGame() {
        if (!this.connected) {
            addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            return;
        }

        this.gameId = this.generateId();
        this.isHost = true;
        
        if (this.socket && this.socket.connected) {
            // Socket.io mode
            console.log('🏠 Socket.io ile oyun oluşturuluyor:', this.gameId);
            this.socket.emit('create_game', {
                gameId: this.gameId,
                playerName: this.playerName
            });
        } else {
            // Local mode
            console.log('🏠 Local mode ile oyun oluşturuluyor:', this.gameId);
            localStorage.setItem(`epic_game_${this.gameId}`, JSON.stringify({
                type: 'game_created',
                gameId: this.gameId,
                host: this.playerId,
                hostName: this.playerName,
                timestamp: Date.now()
            }));
            
            this.onGameCreated({
                gameId: this.gameId,
                hostId: this.playerId
            });
        }
        
        addLog('🏠 Oyun odası oluşturuluyor...', 'info');
    }

    // Oyuna katıl
    joinGame(gameId) {
        if (!this.connected) {
            addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            return;
        }

        if (!gameId || gameId.trim().length === 0) {
            addLog('❌ Geçerli bir Oyun ID girin!', 'error');
            return;
        }

        this.gameId = gameId.trim().toUpperCase();
        this.isHost = false;
        
        if (this.socket && this.socket.connected) {
            // Socket.io mode
            console.log('🚪 Socket.io ile oyuna katılınıyor:', this.gameId);
            this.socket.emit('join_game', {
                gameId: this.gameId,
                playerName: this.playerName
            });
        } else {
            // Local mode - Check if game exists
            const gameData = localStorage.getItem(`epic_game_${this.gameId}`);
            if (!gameData) {
                addLog(`❌ Oyun bulunamadı: ${this.gameId}`, 'error');
                return;
            }
            
            // Join local game
            console.log('🚪 Local mode ile oyuna katılınıyor:', this.gameId);
            localStorage.setItem(`epic_game_${this.gameId}_join`, JSON.stringify({
                type: 'join_game',
                gameId: this.gameId,
                playerId: this.playerId,
                playerName: this.playerName,
                timestamp: Date.now()
            }));
            
            addLog(`🚪 ${this.gameId} local odasına katılınıyor...`, 'info');
        }
        
        addLog(`🚪 ${this.gameId} odasına katılınıyor...`, 'info');
    }

    // Mesaj gönder
    sendMessage(message) {
        if (this.socket && this.socket.connected) {
            // Socket.io mode
            this.socket.emit(message.type, message);
            return true;
        } else {
            // Local mode
            localStorage.setItem(`epic_game_${this.gameId}_msg_${Date.now()}`, JSON.stringify({
                ...message,
                playerId: this.playerId,
                timestamp: Date.now()
            }));
            return true;
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
        
        // Otomatik oyun başlatma
        if (this.isHost) {
            addLog('🎮 Oyun 2 saniye içinde başlayacak...', 'info');
            setTimeout(() => {
                this.startGame();
            }, 2000);
        }
    }

    startGame() {
        const gameStartMessage = {
            type: 'game_started',
            gameId: this.gameId,
            firstPlayer: this.playerId,
            players: [this.playerId, this.opponent?.id]
        };
        
        this.sendMessage(gameStartMessage);
        this.onGameStarted(gameStartMessage);
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
            addLog(`⏳ ${this.opponent?.name || 'Rakip'} başlıyor...`, 'info');
        }
    }

    onOpponentCardPlayed(message) {
        addLog(`🃏 ${this.opponent?.name || 'Rakip'} kart oynadı!`, 'info');
        // Handle opponent card in game logic
    }

    onOpponentSpellCast(message) {
        addLog(`🔮 ${this.opponent?.name || 'Rakip'} büyü kullandı!`, 'info');
        // Handle opponent spell in game logic
    }

    onTurnChanged(message) {
        this.isMyTurn = message.currentPlayer === this.playerId;
        this.updateTurnUI();
        
        if (this.isMyTurn) {
            addLog('⏰ Sizin turunuz!', 'win');
        } else {
            addLog(`⏳ ${this.opponent?.name || 'Rakip'} oynuyor...`, 'info');
        }
    }

    onGameEnded(message) {
        const isWinner = message.winner === this.playerId;
        addLog(`🏆 Oyun bitti! ${isWinner ? 'Kazandınız!' : 'Kaybettiniz!'}`, isWinner ? 'win' : 'error');
        this.resetMultiplayerState();
    }

    onPlayerDisconnected(message) {
        addLog(`👋 ${message.playerName || 'Rakip'} oyundan ayrıldı`, 'error');
        this.resetMultiplayerState();
    }

    onError(message) {
        addLog(`❌ Hata: ${message.message}`, 'error');
        console.error('Multiplayer error:', message);
    }

    // UI Fonksiyonları
    showWaitingRoom() {
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
                        <p><small>${this.socket?.connected ? 'Socket.io Server' : 'Local Mode'} - ID\'yi paylaşın!</small></p>
                    </div>
                </div>
                <button onclick="multiplayer.cancelGame()" class="menu-btn secondary-btn">❌ İptal Et</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    closeWaitingRoom() {
        const waitingRoom = document.getElementById('waitingRoom');
        if (waitingRoom) waitingRoom.remove();
    }

    updateMultiplayerUI(connected) {
        const statusElements = document.querySelectorAll('[id*="status"], [class*="status"]');
        statusElements.forEach(el => {
            if (el.textContent.includes('Sunucu') || el.textContent.includes('Bağlantı')) {
                const mode = this.socket?.connected ? 'Socket.io Server' : 'Local Mode';
                el.textContent = connected ? `🟢 ${mode} aktif!` : '🔴 Multiplayer hazırlanıyor...';
                el.style.color = connected ? '#10b981' : '#ef4444';
            }
        });
        
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

    cancelGame() {
        if (this.gameId) {
            if (this.socket && this.socket.connected) {
                this.socket.emit('cancel_game', {
                    gameId: this.gameId
                });
            } else {
                // Local mode cleanup
                localStorage.removeItem(`epic_game_${this.gameId}`);
                localStorage.removeItem(`epic_game_${this.gameId}_join`);
            }
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
        
        if (typeof gameState !== 'undefined') {
            gameState.isMultiplayer = false;
            gameState.multiplayerManager = null;
        }
        
        document.body.classList.remove('my-turn', 'opponent-turn');
    }

    disconnect() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.connected = false;
        this.updateMultiplayerUI(false);
        this.resetMultiplayerState();
    }

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
`;

// CSS'i head'e ekle
if (!document.querySelector('#multiplayer-css')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'multiplayer-css';
    styleElement.textContent = multiplayerCSS;
    document.head.appendChild(styleElement);
}

// Export
window.multiplayer = multiplayer;

console.log('🚀 Epic Card Battle Multiplayer System - Connection Fixed!');
