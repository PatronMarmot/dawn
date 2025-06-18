// Epic Card Battle - Render + WebSocket Multiplayer System - FIXED VERSION
// Socket.io tabanlı multiplayer sistem

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
            if (typeof addLog === 'function') {
                addLog('🌐 Multiplayer sistemi başlatılıyor...', 'info');
            }
            const serverWorked = await this.tryServerConnection();
            
            if (!serverWorked) {
                if (typeof addLog === 'function') {
                    addLog('⚠️ Server bağlantısı kurulamadı, local mode aktif', 'info');
                }
                await this.enableLocalMode();
            }
        } catch (error) {
            console.error('🚫 Multiplayer sistem hatası:', error);
            if (typeof addLog === 'function') {
                addLog('🔧 Local mode aktif...', 'info');
            }
            await this.enableLocalMode();
        }
    }

    async tryServerConnection() {
        // 🌐 WEBSOCKET SERVERS - DNS OPTIMIZED
        const servers = [
            'https://ws.dawnlighten.com.tr',          // 🎯 WebSocket subdomain (DNS)
            'https://dawnlighten.com.tr',             // 🏠 Ana domain fallback
            'https://dawn-websocket.onrender.com',    // 🔄 Dedicated WebSocket server
            'https://dawn-epic-card.vercel.app'       // 🔄 Vercel backup
        ];

        for (const serverUrl of servers) {
            try {
                if (typeof addLog === 'function') {
                    addLog(`🔍 WebSocket test: ${serverUrl}...`, 'info');
                }
                const success = await this.testWebSocketConnection(serverUrl);
                
                if (success) {
                    if (typeof addLog === 'function') {
                        addLog(`✅ WebSocket bağlantı başarılı: ${serverUrl}`, 'win');
                    }
                    return true;
                }
            } catch (error) {
                console.log(`❌ ${serverUrl} WebSocket başarısız:`, error.message);
                continue;
            }
        }
        return false;
    }

    testWebSocketConnection(serverUrl) {
        return new Promise((resolve) => {
            const connectionTimeout = setTimeout(() => {
                if (this.socket) {
                    this.socket.disconnect();
                    this.socket = null;
                }
                resolve(false);
            }, 10000); // 10 saniye timeout

            try {
                // Socket.io client connection check
                if (typeof io === 'undefined') {
                    console.error('❌ Socket.io client library not loaded!');
                    resolve(false);
                    return;
                }

                this.socket = io(serverUrl, {
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
                    
                    // Bağlantı başarılı bildirimi
                    if (typeof addLog === 'function') {
                        addLog(`✅ Server bağlantısı başarılı: ${serverUrl}`, 'win');
                        addLog(`🎮 Oyuncu ID: ${this.playerId}`, 'info');
                        addLog(`👤 Oyuncu Adı: ${this.playerName}`, 'info');
                    }
                    
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
                    if (typeof addLog === 'function') {
                        addLog(`❌ Server bağlantı hatası: ${serverUrl}`, 'error');
                        addLog(`🔍 Hata detayı: ${error.message || 'Bilinmeyen hata'}`, 'error');
                    }
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
            if (typeof addLog === 'function') {
                addLog('🎮 Socket.io multiplayer sistem hazır!', 'win');
                addLog('🔗 Server ile bağlantı kuruldu ve oyuncu kaydedildi', 'win');
            }
        });
        
        this.socket.on('game_created', (data) => {
            if (typeof addLog === 'function') {
                addLog(`🏠 Oyun odası başarıyla oluşturuldu!`, 'win');
                addLog(`🎯 Oda ID: ${data.gameId}`, 'info');
            }
            this.onGameCreated(data);
        });
        
        this.socket.on('player_joined', (data) => {
            if (typeof addLog === 'function') {
                addLog(`👥 Oyuncu odaya katıldı: ${data.player?.name || 'Anonim'}`, 'win');
                addLog(`🎮 Toplam oyuncu: ${data.players?.length || 2}`, 'info');
            }
            this.onPlayerJoined(data);
        });
        
        this.socket.on('game_started', (data) => {
            if (typeof addLog === 'function') {
                addLog('🚀 Multiplayer oyun başlıyor!', 'win');
                addLog('⚔️ Savaş arenasına hoş geldiniz!', 'win');
            }
            this.onGameStarted(data);
        });
        
        this.socket.on('match_found', (data) => {
            if (typeof addLog === 'function') {
                addLog(`⚡ Hızlı eşleşme bulundu!`, 'win');
                addLog(`🆚 Rakip: ${data.opponent?.name || 'Anonim'}`, 'info');
            }
            this.onMatchFound(data);
        });
        
        this.socket.on('searching_match', (data) => {
            if (typeof addLog === 'function') {
                addLog('🔍 Rakip aranıyor...', 'info');
                addLog('⏳ Lütfen bekleyin, eşleşme bulunuyor', 'info');
            }
        });
        
        // Hata durumları
        this.socket.on('join_error', (data) => {
            if (typeof addLog === 'function') {
                addLog(`❌ Odaya katılma hatası: ${data.message}`, 'error');
            }
            this.showJoinError(data.message);
        });
        
        this.socket.on('game_error', (data) => {
            if (typeof addLog === 'function') {
                addLog(`🚫 Oyun hatası: ${data.message}`, 'error');
            }
        });
        
        this.socket.on('pong', (data) => {
            // Heartbeat response - sessiz
        });
    }

    handleDisconnect(reason) {
        this.connected = false;
        this.updateMultiplayerUI(false);
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        // Detaylı bağlantı kesilme mesajları
        if (typeof addLog === 'function') {
            switch(reason) {
                case 'transport close':
                    addLog('🔌 Server bağlantısı kesildi', 'error');
                    addLog('🔄 Ağ bağlantınızı kontrol edin', 'info');
                    break;
                case 'ping timeout':
                    addLog('⏰ Server yanıt vermiyor (timeout)', 'error');
                    addLog('🌐 İnternet bağlantınız yavaş olabilir', 'info');
                    break;
                case 'transport error':
                    addLog('❌ Bağlantı hatası oluştu', 'error');
                    addLog('🔧 Server geçici olarak erişilemez olabilir', 'info');
                    break;
                default:
                    addLog(`🔌 Bağlantı kesildi: ${reason || 'Bilinmeyen sebep'}`, 'error');
            }
        }
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
            if (!this.connected && typeof addLog === 'function') {
                addLog('🔄 Yeniden bağlanmaya çalışılıyor...', 'info');
                addLog('⏳ Lütfen bekleyin, alternatif serverlar deneniyor', 'info');
                this.connect();
            }
        }, 5000);
    }

    // Diğer metodlar...
    onMatchFound(data) {
        this.opponent = data.opponent;
        this.isHost = data.isHost;
        this.gameId = data.gameId;
        
        if (typeof addLog === 'function') {
            addLog(`⚡ Rakip bulundu: ${this.opponent.name}!`, 'win');
            addLog('🎮 Oyun 3 saniye içinde başlayacak...', 'info');
        }
    }

    createGame() {
        if (!this.connected) {
            if (typeof addLog === 'function') {
                addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            }
            return;
        }

        if (this.socket && this.socket.connected) {
            this.socket.emit('create_game', {
                playerName: this.playerName
            });
        } else {
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
    }

    onGameCreated(data) {
        if (typeof addLog === 'function') {
            addLog(`🏠 Oyun odası başarıyla oluşturuldu!`, 'win');
            addLog(`🎯 Oda ID: ${this.gameId}`, 'win');
        }
        this.showWaitingRoom();
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
                        <button onclick="navigator.clipboard.writeText('${this.gameId}')" class="copy-btn">📋 Kopyala</button>
                    </div>
                    <div class="waiting-spinner">
                        <div class="spinner"></div>
                        <p>İkinci oyuncunun katılması bekleniyor...</p>
                    </div>
                </div>
                <button onclick="window.renderMultiplayer.cancelGame()" class="menu-btn secondary-btn">❌ İptal Et</button>
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

    // Utility methods
    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async enableLocalMode() {
        this.isLocalMode = true;
        this.connected = true;
        this.playerId = this.generateId();
        this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
        
        if (typeof addLog === 'function') {
            addLog('🏠 Local multiplayer aktif!', 'win');
        }
        this.updateMultiplayerUI(true);
        return Promise.resolve();
    }

    cancelGame() {
        if (this.gameId && this.isLocalMode) {
            localStorage.removeItem(`epic_game_${this.gameId}`);
        }
        
        if (typeof addLog === 'function') {
            addLog('❌ Oyun iptal edildi', 'error');
        }
        
        this.closeWaitingRoom();
        this.gameId = null;
        this.isHost = false;
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

    // Placeholder methods for functionality
    joinGame() { console.log('joinGame method needs implementation'); }
    findQuickMatch() { console.log('findQuickMatch method needs implementation'); }
    onPlayerJoined() { console.log('onPlayerJoined method needs implementation'); }
    startGame() { console.log('startGame method needs implementation'); }
    onGameStarted() { console.log('onGameStarted method needs implementation'); }
    showJoinError() { console.log('showJoinError method needs implementation'); }
}

// Global multiplayer manager
const renderMultiplayer = new RenderMultiplayerManager();

// Menü event fonksiyonları
function setupMultiplayerMenuEvents() {
    console.log('🔧 Multiplayer menu events setup starting...');
    
    const multiplayerBtn = document.getElementById('multiplayerBtn');
    const multiplayerSubmenu = document.getElementById('multiplayerSubmenu');
    
    if (multiplayerBtn && multiplayerSubmenu) {
        multiplayerBtn.addEventListener('click', () => {
            console.log('🎮 Multiplayer button clicked!');
            const isVisible = multiplayerSubmenu.style.display !== 'none' && multiplayerSubmenu.style.display !== '';
            multiplayerSubmenu.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible && !renderMultiplayer.connected) {
                renderMultiplayer.connect();
            }
        });
    } else {
        console.warn('⚠️ Multiplayer button or submenu not found!');
    }
    
    const createGameBtn = document.getElementById('createGameBtn');
    if (createGameBtn) {
        createGameBtn.addEventListener('click', () => {
            console.log('🏠 Create game button clicked!');
            if (multiplayerSubmenu) multiplayerSubmenu.style.display = 'none';
            renderMultiplayer.createGame();
        });
    }
    
    const joinGameBtn = document.getElementById('joinGameBtn');
    if (joinGameBtn) {
        joinGameBtn.addEventListener('click', () => {
            console.log('🚪 Join game button clicked!');
            if (multiplayerSubmenu) multiplayerSubmenu.style.display = 'none';
            // showJoinGameModal implementation needed
        });
    }
    
    const quickMatchBtn = document.getElementById('quickMatchBtn');
    if (quickMatchBtn) {
        quickMatchBtn.addEventListener('click', () => {
            console.log('⚡ Quick match button clicked!');
            if (multiplayerSubmenu) multiplayerSubmenu.style.display = 'none';
            renderMultiplayer.findQuickMatch();
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

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
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

console.log('🚀 Epic Card Battle - Multiplayer System Ready!');
