    // Bağlantı durumu gösterici
    showConnectionStatus(connected, mode) {
        let statusDiv = document.getElementById('connectionStatus');
        
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'connectionStatus';
            statusDiv.className = 'connection-status';
            document.body.appendChild(statusDiv);
        }
        
        const statusText = connected ? `✅ ${mode}` : '❌ Bağlantı Yok';
        statusDiv.textContent = statusText;
        
        // CSS class'ı güncelle
        statusDiv.className = 'connection-status ' + 
            (connected ? 
                (this.socket?.connected ? 'connected' : 'connected') : 
                'disconnected'
            );
        
        // Bağlantı başarılıysa 5 saniye sonra gizle
        if (connected) {
            setTimeout(() => {
                if (statusDiv && this.connected) {
                    statusDiv.style.opacity = '0.3';
                    setTimeout(() => {
                        if (statusDiv && statusDiv.style.opacity === '0.3') {
                            statusDiv.style.display = 'none';
                        }
                    }, 2000);
                }
            }, 5000);
        } else {
            statusDiv.style.opacity = '1';
            statusDiv.style.display = 'block';
        }
    }    // Hata gösterme fonksiyonu
    showJoinError(message) {
        const errorModal = document.createElement('div');
        errorModal.className = 'modal';
        errorModal.style.display = 'flex';
        errorModal.innerHTML = `
            <div class="modal-content">
                <h2>❌ Bağlantı Hatası</h2>
                <div class="error-content">
                    <p><strong>Hata:</strong> ${message}</p>
                    <div class="error-suggestions">
                        <h3>💡 Çözüm Önerileri:</h3>
                        <ul>
                            <li>🔄 Oyun ID'sini kontrol edin</li>
                            <li>🏠 Yeni oyun oluşturmayı deneyin</li>
                            <li>🌐 İnternet bağlantınızı kontrol edin</li>
                            <li>⏳ Birkaç saniye bekleyip tekrar deneyin</li>
                        </ul>
                    </div>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="menu-btn primary-btn">
                        ✅ Anladım
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorModal);
        
        // 10 saniye sonra otomatik kapat
        setTimeout(() => {
            if (errorModal.parentElement) {
                errorModal.remove();
            }
        }, 10000);
    }    handleDisconnect(reason) {
        this.connected = false;
        this.updateMultiplayerUI(false);
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        // Detaylı bağlantı kesilme mesajları
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
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
            if (!this.connected) {
                addLog('🔄 Yeniden bağlanmaya çalışılıyor...', 'info');
                addLog('⏳ Lütfen bekleyin, alternatif serverlar deneniyor', 'info');
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
                    
                    // Bağlantı başarılı bildirimi
                    addLog(`✅ Server bağlantısı başarılı: ${wsUrl}`, 'win');
                    addLog(`🎮 Oyuncu ID: ${this.playerId}`, 'info');
                    addLog(`👤 Oyuncu Adı: ${this.playerName}`, 'info');
                    
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
                    addLog(`❌ Server bağlantı hatası: ${wsUrl}`, 'error');
                    addLog(`🔍 Hata detayı: ${error.message || 'Bilinmeyen hata'}`, 'error');
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
            addLog('🔗 Server ile bağlantı kuruldu ve oyuncu kaydedildi', 'win');
        });
        
        this.socket.on('game_created', (data) => {
            addLog(`🏠 Oyun odası başarıyla oluşturuldu!`, 'win');
            addLog(`🎯 Oda ID: ${data.gameId}`, 'info');
            this.onGameCreated(data);
        });
        
        this.socket.on('player_joined', (data) => {
            addLog(`👥 Oyuncu odaya katıldı: ${data.player?.name || 'Anonim'}`, 'win');
            addLog(`🎮 Toplam oyuncu: ${data.players?.length || 2}`, 'info');
            this.onPlayerJoined(data);
        });
        
        this.socket.on('game_started', (data) => {
            addLog('🚀 Multiplayer oyun başlıyor!', 'win');
            addLog('⚔️ Savaş arenasına hoş geldiniz!', 'win');
            this.onGameStarted(data);
        });
        
        this.socket.on('match_found', (data) => {
            addLog(`⚡ Hızlı eşleşme bulundu!`, 'win');
            addLog(`🆚 Rakip: ${data.opponent?.name || 'Anonim'}`, 'info');
            this.onMatchFound(data);
        });
        
        this.socket.on('searching_match', (data) => {
            addLog('🔍 Rakip aranıyor...', 'info');
            addLog('⏳ Lütfen bekleyin, eşleşme bulunuyor', 'info');
        });
        
        // Hata durumları
        this.socket.on('join_error', (data) => {
            addLog(`❌ Odaya katılma hatası: ${data.message}`, 'error');
            this.showJoinError(data.message);
        });
        
        this.socket.on('game_error', (data) => {
            addLog(`🚫 Oyun hatası: ${data.message}`, 'error');
        });
        
        this.socket.on('pong', (data) => {
            // Heartbeat response - sessiz
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
            addLog('🏠 Server üzerinde oyun odası oluşturuluyor...', 'info');
            this.socket.emit('create_game', {
                playerName: this.playerName
            });
        } else {
            // Local mode fallback
            addLog('🏠 Local mode: Oyun odası oluşturuluyor...', 'info');
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
            addLog(`🚪 Server üzerinde ${gameId} odasına katılınıyor...`, 'info');
            this.gameId = gameId.trim().toUpperCase();
            this.socket.emit('join_game', {
                gameId: this.gameId,
                playerName: this.playerName
            });
        } else {
            // Local mode fallback
            addLog(`🏠 Local mode: ${gameId} odasına katılınıyor...`, 'info');
            this.gameId = gameId.trim().toUpperCase();
            this.isHost = false;
            
            const gameKey = `epic_game_${this.gameId}`;
            const gameData = localStorage.getItem(gameKey);
            
            if (!gameData) {
                addLog(`❌ Oyun bulunamadı: ${this.gameId}`, 'error');
                addLog('💡 ID'yi kontrol edin veya yeni oyun oluşturun', 'info');
                return;
            }
            
            try {
                const game = JSON.parse(gameData);
                
                if (game.status !== 'waiting') {
                    addLog(`❌ Oyun zaten başlamış: ${this.gameId}`, 'error');
                    addLog('🔄 Yeni oyun oluşturabilir veya başka ID deneyebilirsiniz', 'info');
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
                addLog('🔧 Local storage hatası, sayfa yenilenebilir', 'info');
                return;
            }
        }
        
        addLog(`🚪 ${this.gameId} odasına katılınıyor...`, 'info');
    }

    findQuickMatch() {
        if (this.socket && this.socket.connected) {
            // Socket.io server quick match
            addLog('⚡ Hızlı eşleşme başlatılıyor...', 'info');
            addLog('🔍 Uygun rakip aranıyor...', 'info');
            this.socket.emit('find_quick_match', {
                playerName: this.playerName
            });
        } else {
            // Local mode fallback
            addLog('🏠 Local mode: Otomatik oda oluşturuluyor...', 'info');
            addLog('💡 Aynı tarayıcıda yeni sekme açarak test edin', 'info');
            this.createGame();
        }
    }

    onGameCreated(data) {
        addLog(`🏠 Oyun odası başarıyla oluşturuldu!`, 'win');
        addLog(`🎯 Oda ID: ${this.gameId}`, 'win');
        addLog('📋 Bu ID'yi arkadaşlarınızla paylaşın', 'info');
        this.showWaitingRoom();
    }

    onPlayerJoined(data) {
        this.opponent = data.opponent;
        addLog(`👥 ${this.opponent.name} oyuna katıldı!`, 'win');
        addLog('🎮 Oyun kısa süre içinde başlayacak...', 'info');
        
        if (this.isHost) {
            addLog('🏠 Siz ev sahibisiniz, oyunu başlatıyorsunuz', 'info');
            setTimeout(() => {
                this.startGame();
            }, 2000);
        } else {
            addLog('🚪 Ev sahibi oyunu başlatmayı bekliyor', 'info');
        }
    }

    startGame() {
        addLog('🚀 Multiplayer oyun başlatılıyor...', 'win');
        addLog('⚔️ Kart savaşına hazır olun!', 'win');
        
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
        addLog('🎮 Multiplayer oyun başladı!', 'win');
        addLog('⚡ Gerçek zamanlı senkronizasyon aktif', 'win');
        this.closeWaitingRoom();
        
        if (typeof gameState !== 'undefined') {
            gameState.isMultiplayer = true;
            gameState.multiplayerManager = this;
        }
        
        this.isMyTurn = data.firstPlayer === this.playerId;
        
        if (this.isMyTurn) {
            addLog('⏰ İlk tur sizin! Kartlarınızı yerleştirin', 'win');
        } else {
            addLog(`⏳ ${this.opponent?.name || 'Rakip'} başlıyor, sıranızı bekleyin`, 'info');
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
        
        // Sağ üst köşede bağlantı durumu göster
        this.showConnectionStatus(connected, mode);
        
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
        
        addLog('❌ Oyun iptal edildi', 'error');
        addLog('🏠 Ana menüye döndünüz', 'info');
        
        this.resetMultiplayerState();
        this.closeWaitingRoom();
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

// Error Modal ve Connection Status için ek CSS
const additionalCSS = `
.error-content {
    text-align: center;
    padding: 1rem;
}

.error-suggestions {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    text-align: left;
}

.error-suggestions h3 {
    margin: 0 0 0.5rem 0;
    color: #ef4444;
}

.error-suggestions ul {
    margin: 0;
    padding-left: 1.5rem;
}

.error-suggestions li {
    margin: 0.25rem 0;
    color: #374151;
}

.connection-status {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    z-index: 1000;
    transition: all 0.3s ease;
}

.connection-status.connected {
    background: rgba(16, 185, 129, 0.9);
}

.connection-status.disconnected {
    background: rgba(239, 68, 68, 0.9);
}

.connection-status.connecting {
    background: rgba(245, 158, 11, 0.9);
}
`;

if (!document.querySelector('#additional-multiplayer-css')) {
    const additionalStyleElement = document.createElement('style');
    additionalStyleElement.id = 'additional-multiplayer-css';
    additionalStyleElement.textContent = additionalCSS;
    document.head.appendChild(additionalStyleElement);
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
