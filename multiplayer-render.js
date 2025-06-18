    handleDisconnect(reason) {
        this.connected = false;
        this.updateMultiplayerUI(false);
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        addLog(`🔌 Bağlantı kesildi: ${reason || 'Bilinmeyen sebep'}`, 'error');
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
            if (!this.connected) {
                addLog('🔄 Yeniden bağlanmaya çalışılıyor...', 'info');
                this.connect();
            }
        }, 5000);
    }// Epic Card Battle - Render + WebSocket Multiplayer System
// SOCKET.IO YERİNE RENDER + WEBSOCKET KULLANIMI

class RenderMultiplayerManager {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.opponent = null;
        this.isMyTurn = false;
        this.connected = false;
        this.isLocalMode = false;
        this.heartbeatInterval = null;
    }

    async connect() {
        try {
            addLog('🌐 Multiplayer sistemi başlatılıyor...', 'info');
            const serverWorked = await this.tryServerConnection();
            
            if (!serverWorked) {
                addLog('⚠️ Server bağlantısı kurulamadı, local mode aktif', 'info');
                await this.enableLocalMode();
            }
        } catch (error) {
            console.error('🚫 Multiplayer sistem hatası:', error);
            addLog('🔧 Local mode aktif...', 'info');
            await this.enableLocalMode();
        }
    }

    async tryServerConnection() {
        // 🌐 WEBSOCKET SERVERS - DNS OPTIMIZED
        const servers = [
            'wss://ws.dawnlighten.com.tr',          // 🎯 WebSocket subdomain (DNS)
            'wss://dawnlighten.com.tr',             // 🏠 Ana domain fallback
            'wss://dawn-websocket.onrender.com',    // 🔄 Dedicated WebSocket server
            'wss://dawn-epic-card.vercel.app'       // 🔄 Vercel backup
        ];

        for (const wsUrl of servers) {
            try {
                addLog(`🔍 WebSocket test: ${wsUrl}...`, 'info');
                const success = await this.testWebSocketConnection(wsUrl);
                
                if (success) {
                    addLog(`✅ WebSocket bağlantı başarılı: ${wsUrl}`, 'win');
                    return true;
                }
            } catch (error) {
                console.log(`❌ ${wsUrl} WebSocket başarısız:`, error.message);
                continue;
            }
        }
        return false;
    }

    testWebSocketConnection(wsUrl) {
        return new Promise((resolve) => {
            const connectionTimeout = setTimeout(() => {
                if (this.socket) {
                    this.socket.close();
                    this.socket = null;
                }
                resolve(false);
            }, 10000); // 10 saniye timeout

            try {
                // Socket.io client connection
                this.socket = io(wsUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    forceNew: true
                });

                this.socket.on('connect', () => {
                    clearTimeout(connectionTimeout);
                    this.connected = true;
                    this.setupSocketEvents();
                    this.playerId = this.generateId();
                    this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
                    
                    this.socket.emit('register_player', {
                        name: this.playerName,
                        id: this.playerId
                    });
                    
                    this.updateMultiplayerUI(true);
                    this.startHeartbeat();
                    resolve(true);
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(connectionTimeout);
                    if (this.socket) {
                        this.socket.disconnect();
                        this.socket = null;
                    }
                    resolve(false);
                });

                this.socket.on('disconnect', (reason) => {
                    this.handleDisconnect(reason);
                });

            } catch (error) {
                clearTimeout(connectionTimeout);
                resolve(false);
            }
        });
    }

    setupSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('player_registered', (data) => {
            addLog('🎮 Socket.io multiplayer sistem hazır!', 'win');
        });
        
        this.socket.on('game_created', (data) => {
            this.onGameCreated(data);
        });
        
        this.socket.on('player_joined', (data) => {
            this.onPlayerJoined(data);
        });
        
        this.socket.on('game_started', (data) => {
            this.onGameStarted(data);
        });
        
        this.socket.on('match_found', (data) => {
            this.onMatchFound(data);
        });
        
        this.socket.on('searching_match', (data) => {
            addLog('⚡ Rakip aranıyor...', 'info');
        });
        
        this.socket.on('pong', (data) => {
            // Heartbeat response
        });
    }

    onMatchFound(data) {
        this.opponent = data.opponent;
        this.isHost = data.isHost;
        this.gameId = data.gameId;
        
        addLog(`⚡ Rakip bulundu: ${this.opponent.name}!`, 'win');
        addLog('🎮 Oyun 3 saniye içinde başlayacak...', 'info');
    }

    sendSocketMessage(event, data) {
        if (!this.socket || !this.socket.connected) {
            return false;
        }
        
        try {
            this.socket.emit(event, data);
            return true;
        } catch (error) {
            console.error('❌ Socket mesaj gönderme hatası:', error);
            return false;
        }
    }

    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.connected && this.socket) {
                this.socket.emit('ping', {
                    timestamp: Date.now()
                });
            }
        }, 25000);
    }

    async enableLocalMode() {
        this.isLocalMode = true;
        this.connected = true;
        this.playerId = this.generateId();
        this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
        
        this.clearOldLocalGames();
        this.setupLocalStorageListener();
        
        addLog('🏠 Local multiplayer aktif! Aynı tarayıcıda yeni sekme açarak test edin.', 'win');
        this.updateMultiplayerUI(true);
        return Promise.resolve();
    }

    createGame() {
        if (!this.connected) {
            addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            return;
        }

        if (this.socket && this.socket.connected) {
            // Socket.io server mode
            this.socket.emit('create_game', {
                playerName: this.playerName
            });
        } else {
            // Local mode fallback
            this.gameId = this.generateId();
            this.isHost = true;
            
            const gameData = {
                type: 'game_created',
                gameId: this.gameId,
                host: this.playerId,
                hostName: this.playerName,
                timestamp: Date.now(),
                status: 'waiting'
            };
            
            localStorage.setItem(`epic_game_${this.gameId}`, JSON.stringify(gameData));
            
            setTimeout(() => {
                this.onGameCreated({
                    gameId: this.gameId,
                    hostId: this.playerId
                });
            }, 100);
        }
        
        addLog('🏠 Oyun odası oluşturuluyor...', 'info');
    }

    joinGame(gameId) {
        if (!this.connected) {
            addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            return;
        }

        if (!gameId || gameId.trim().length === 0) {
            addLog('❌ Geçerli bir Oyun ID girin!', 'error');
            return;
        }

        if (this.socket && this.socket.connected) {
            // Socket.io server mode
            this.gameId = gameId.trim().toUpperCase();
            this.socket.emit('join_game', {
                gameId: this.gameId,
                playerName: this.playerName
            });
        } else {
            // Local mode fallback
            this.gameId = gameId.trim().toUpperCase();
            this.isHost = false;
            
            const gameKey = `epic_game_${this.gameId}`;
            const gameData = localStorage.getItem(gameKey);
            
            if (!gameData) {
                addLog(`❌ Oyun bulunamadı: ${this.gameId}`, 'error');
                return;
            }
            
            try {
                const game = JSON.parse(gameData);
                
                if (game.status !== 'waiting') {
                    addLog(`❌ Oyun zaten başlamış: ${this.gameId}`, 'error');
                    return;
                }
                
                const joinData = {
                    type: 'player_joined',
                    gameId: this.gameId,
                    playerId: this.playerId,
                    playerName: this.playerName,
                    timestamp: Date.now()
                };
                
                localStorage.setItem(`epic_game_${this.gameId}_join`, JSON.stringify(joinData));
                
                setTimeout(() => {
                    this.onPlayerJoined({
                        gameId: this.gameId,
                        opponent: {
                            id: game.host,
                            name: game.hostName
                        }
                    });
                }, 100);
                
            } catch (error) {
                addLog(`❌ Oyun data'sı okunamadı: ${this.gameId}`, 'error');
                return;
            }
        }
        
        addLog(`🚪 ${this.gameId} odasına katılınıyor...`, 'info');
    }

    findQuickMatch() {
        if (this.socket && this.socket.connected) {
            // Socket.io server quick match
            addLog('⚡ Hızlı eşleşme aranıyor...', 'info');
            this.socket.emit('find_quick_match', {
                playerName: this.playerName
            });
        } else {
            // Local mode fallback
            addLog('🏠 Local mode: Otomatik oda oluşturuluyor...', 'info');
            this.createGame();
        }
    }

    onGameCreated(data) {
        addLog(`🏠 Oyun odası oluşturuldu! ID: ${this.gameId}`, 'win');
        this.showWaitingRoom();
    }

    onPlayerJoined(data) {
        this.opponent = data.opponent;
        addLog(`👥 ${this.opponent.name} oyuna katıldı!`, 'info');
        
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
            data: {
                gameId: this.gameId,
                firstPlayer: this.playerId,
                players: [this.playerId, this.opponent?.id]
            }
        };
        
        this.onGameStarted(gameStartMessage.data);
    }

    onGameStarted(data) {
        addLog('🎮 Multiplayer oyun başlıyor!', 'win');
        this.closeWaitingRoom();
        
        if (typeof gameState !== 'undefined') {
            gameState.isMultiplayer = true;
            gameState.multiplayerManager = this;
        }
        
        this.isMyTurn = data.firstPlayer === this.playerId;
        
        if (this.isMyTurn) {
            addLog('⏰ Sizin ilk turunuz!', 'win');
        } else {
            addLog(`⏳ ${this.opponent?.name || 'Rakip'} başlıyor...`, 'info');
        }
        
        if (typeof hideMainMenu === 'function') {
            hideMainMenu();
        }
        if (typeof initGame === 'function') {
            initGame();
        }
    }

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
                        <p><small>Local Mode - Aynı tarayıcıda yeni sekme açın!</small></p>
                    </div>
                </div>
                <button onclick="renderMultiplayer.cancelGame()" class="menu-btn secondary-btn">❌ İptal Et</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    closeWaitingRoom() {
        const waitingRoom = document.getElementById('waitingRoom');
        if (waitingRoom) waitingRoom.remove();
    }

    updateMultiplayerUI(connected) {
        const mode = (this.socket?.connected) ? '🌐 Socket.io Server' : (this.isLocalMode ? '🏠 Local Mode' : '🔄 Bağlanıyor...');
        
        const statusElement = document.getElementById('multiplayerStatus');
        if (statusElement) {
            const statusText = connected ? `🟢 ${mode} aktif!` : '🔴 Multiplayer hazırlanıyor...';
            statusElement.innerHTML = `<p>${statusText}</p>`;
            statusElement.style.color = connected ? '#10b981' : '#ef4444';
        }
        
        const multiplayerButtons = document.querySelectorAll('#createGameBtn, #joinGameBtn, #quickMatchBtn');
        multiplayerButtons.forEach(btn => {
            if (btn) {
                btn.disabled = !connected;
                btn.style.opacity = connected ? '1' : '0.5';
            }
        });
    }

    cancelGame() {
        if (this.gameId && this.isLocalMode) {
            localStorage.removeItem(`epic_game_${this.gameId}`);
            localStorage.removeItem(`epic_game_${this.gameId}_join`);
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
    }

    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    clearOldLocalGames() {
        const keys = Object.keys(localStorage);
        const cutoff = Date.now() - (60 * 60 * 1000);
        
        keys.forEach(key => {
            if (key.startsWith('epic_game_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < cutoff) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    setupLocalStorageListener() {
        if (this.storageListener) {
            window.removeEventListener('storage', this.storageListener);
        }
        
        this.storageListener = (e) => {
            if (e.key && e.key.startsWith('epic_game_')) {
                this.handleLocalMessage(e.key, e.newValue);
            }
        };
        
        window.addEventListener('storage', this.storageListener);
    }

    handleLocalMessage(key, value) {
        if (!value) return;
        
        try {
            const data = JSON.parse(value);
            
            if (data.playerId === this.playerId) return;
            if (data.gameId && data.gameId !== this.gameId) return;
            
            switch (data.type) {
                case 'player_joined':
                    if (this.isHost) {
                        this.onPlayerJoined({
                            opponent: {
                                id: data.playerId,
                                name: data.playerName
                            }
                        });
                    }
                    break;
                case 'game_started':
                    this.onGameStarted(data);
                    break;
            }
        } catch (e) {
            console.warn('Local message parse error:', e);
        }
    }
}

// Global multiplayer manager
const renderMultiplayer = new RenderMultiplayerManager();

// Menü event fonksiyonları
function setupMultiplayerMenuEvents() {
    const multiplayerBtn = document.getElementById('multiplayerBtn');
    const multiplayerSubmenu = document.getElementById('multiplayerSubmenu');
    
    if (multiplayerBtn && multiplayerSubmenu) {
        multiplayerBtn.addEventListener('click', () => {
            const isVisible = multiplayerSubmenu.style.display !== 'none';
            multiplayerSubmenu.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible && !renderMultiplayer.connected) {
                renderMultiplayer.connect();
            }
        });
    }
    
    const createGameBtn = document.getElementById('createGameBtn');
    if (createGameBtn) {
        createGameBtn.addEventListener('click', () => {
            if (multiplayerSubmenu) multiplayerSubmenu.style.display = 'none';
            renderMultiplayer.createGame();
        });
    }
    
    const joinGameBtn = document.getElementById('joinGameBtn');
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', () => {
            if (multiplayerSubmenu) multiplayerSubmenu.style.display = 'none';
            showJoinGameModal();
        });
    }
    
    const quickMatchBtn = document.getElementById('quickMatchBtn');
    if (quickMatchBtn) {
        quickMatchBtn.addEventListener('click', () => {
            if (multiplayerSubmenu) multiplayerSubmenu.style.display = 'none';
            renderMultiplayer.findQuickMatch();
        });
    }
    
    setupJoinGameModalEvents();
}

function showJoinGameModal() {
    const modal = document.getElementById('joinGameModal');
    if (modal) {
        modal.style.display = 'flex';
        const input = document.getElementById('gameIdInput');
        if (input) {
            input.focus();
            input.value = '';
        }
    }
}

function hideJoinGameModal() {
    const modal = document.getElementById('joinGameModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupJoinGameModalEvents() {
    const closeBtn = document.getElementById('closeJoinGame');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideJoinGameModal);
    }
    
    const cancelBtn = document.getElementById('cancelJoinBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideJoinGameModal);
    }
    
    const confirmBtn = document.getElementById('joinGameConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const input = document.getElementById('gameIdInput');
            if (input && input.value.trim()) {
                const gameId = input.value.trim().toUpperCase();
                hideJoinGameModal();
                renderMultiplayer.joinGame(gameId);
            } else {
                addLog('❌ Geçerli bir Oyun ID girin!', 'error');
            }
        });
    }
    
    const gameIdInput = document.getElementById('gameIdInput');
    if (gameIdInput) {
        gameIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const confirmBtn = document.getElementById('joinGameConfirmBtn');
                if (confirmBtn) confirmBtn.click();
            }
        });
        
        gameIdInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }
    
    const modal = document.getElementById('joinGameModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideJoinGameModal();
            }
        });
    }
}

// CSS Styles
const renderMultiplayerCSS = `
.multiplayer-submenu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    animation: slideDown 0.3s ease-out;
}

.multiplayer-sub-btn {
    font-size: 0.9rem !important;
    padding: 0.75rem 1.5rem !important;
    min-height: auto !important;
}

.multiplayer-sub-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.multiplayer-status {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0,0,0,0.1);
    border-radius: 8px;
    text-align: center;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
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

.join-game-content {
    text-align: center;
    padding: 1rem;
}

.modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}
`;

// CSS'i head'e ekle
if (!document.querySelector('#render-multiplayer-css')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'render-multiplayer-css';
    styleElement.textContent = renderMultiplayerCSS;
    document.head.appendChild(styleElement);
}

// DOMContentLoaded event'inde menü event'lerini kur
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMultiplayerMenuEvents);
} else {
    setupMultiplayerMenuEvents();
}

// Global export
window.renderMultiplayer = renderMultiplayer;
window.showJoinGameModal = showJoinGameModal;
window.hideJoinGameModal = hideJoinGameModal;

console.log('🚀 Epic Card Battle - Render + WebSocket Multiplayer System Ready!');
