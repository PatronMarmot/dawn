// Epic Card Battle - Fixed Multiplayer System
// FIXED: Connection issues, CORS errors, and room management

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
        this.isLocalMode = false;
        this.connectionTimeout = null;
    }

    // Ana bağlantı fonksiyonu - DÜZELTİLDİ
    async connect() {
        try {
            addLog('🌐 Multiplayer sistemi başlatılıyor...', 'info');
            
            // İlk olarak Socket.io'yu test et, sonra local mode'a geç
            const socketIOWorked = await this.trySocketIOConnection();
            
            if (!socketIOWorked) {
                addLog('⚠️ Socket.io bağlantısı kurulamadı, local mode aktif', 'info');
                await this.enableLocalMode();
            }
            
        } catch (error) {
            console.error('🚫 Multiplayer sistem hatası:', error);
            addLog('🔧 Local mode aktif...', 'info');
            await this.enableLocalMode();
        }
    }

    // Socket.io bağlantısını test et - DÜZELTİLDİ
    async trySocketIOConnection() {
        // Socket.io kontrolü
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.io library yüklenmemiş');
            return false;
        }

        // ✅ GÜNCEL SERVER URL'LERİ - Özel Domain
        const servers = [
            'https://dawn-fi92.onrender.com',         // Ana Render server
            'https://dawn-epic-card.onrender.com',    // Alternatif URL
            'https://socket.io',                      // Socket.io demo server
            'https://epic-card-battle.vercel.app'     // Vercel backup
        ];

        for (const serverUrl of servers) {
            try {
                addLog(`🔍 Test ediliyor: ${serverUrl} (15 saniye timeout)`, 'info');
                const success = await this.testSingleConnection(serverUrl);
                
                if (success) {
                    addLog(`✅ Socket.io bağlantısı başarılı: ${serverUrl}`, 'win');
                    return true;
                }
            } catch (error) {
                console.log(`❌ ${serverUrl} bağlantı başarısız:`, error.message);
                continue;
            }
        }
        
        return false;
    }

    // Tek bir bağlantıyı test et - YENİ
    testSingleConnection(serverUrl) {
        return new Promise((resolve) => {
            console.log('🔌 Socket.io bağlantısı test ediliyor:', serverUrl);
            
            const connectionTimeout = setTimeout(() => {
                if (this.socket) {
                    this.socket.disconnect();
                    this.socket = null;
                }
                resolve(false);
            }, 15000); // 15 saniye timeout (Render için uzatıldı)

            try {
                this.socket = io(serverUrl, {
                    transports: ['polling'], // Sadece polling - CORS için
                    timeout: 10000,
                    forceNew: true,
                    reconnection: false,
                    autoConnect: true,
                    upgrade: false, // WebSocket upgrade yapma
                    withCredentials: false // CORS için
                });

                this.socket.on('connect', () => {
                    clearTimeout(connectionTimeout);
                    console.log('✅ Socket.io test bağlantısı başarılı:', serverUrl);
                    
                    this.connected = true;
                    this.setupSocketIOEvents();
                    this.playerId = this.socket.id;
                    this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
                    
                    // Oyuncuyu kaydet
                    this.socket.emit('register_player', {
                        name: this.playerName
                    });
                    
                    this.updateMultiplayerUI(true);
                    resolve(true);
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('❌ Socket.io bağlantı hatası:', error.message);
                    
                    if (this.socket) {
                        this.socket.disconnect();
                        this.socket = null;
                    }
                    resolve(false);
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('🔌 Socket.io bağlantısı kesildi:', reason);
                    this.handleDisconnect();
                });

            } catch (error) {
                clearTimeout(connectionTimeout);
                console.error('❌ Socket.io oluşturma hatası:', error);
                resolve(false);
            }
        });
    }

    // Socket.io event handler'larını kur - DÜZELTİLDİ
    setupSocketIOEvents() {
        if (!this.socket) return;

        // Oyuncu kaydı onayı
        this.socket.on('player_registered', (data) => {
            console.log('👤 Oyuncu kaydedildi:', data);
            addLog('🎮 Multiplayer sistem hazır!', 'win');
        });

        // Oyun events
        this.socket.on('game_created', (data) => this.onGameCreated(data));
        this.socket.on('player_joined', (data) => this.onPlayerJoined(data));
        this.socket.on('game_started', (data) => this.onGameStarted(data));
        this.socket.on('opponent_card_played', (data) => this.onOpponentCardPlayed(data));
        this.socket.on('opponent_spell_cast', (data) => this.onOpponentSpellCast(data));
        this.socket.on('turn_changed', (data) => this.onTurnChanged(data));
        this.socket.on('game_ended', (data) => this.onGameEnded(data));
        this.socket.on('player_disconnected', (data) => this.onPlayerDisconnected(data));
        this.socket.on('error', (data) => this.onError(data));
        
        // 🏠 LOBI SISTEM EVENTS
        this.socket.on('players_list', (data) => this.onPlayersListUpdate(data));
        this.socket.on('lobby_list', (data) => this.onLobbyListUpdate(data));
        this.socket.on('quick_match_searching', (data) => this.onQuickMatchSearching(data));
        this.socket.on('quick_match_found', (data) => this.onQuickMatchFound(data));
        this.socket.on('player_challenge', (data) => this.onPlayerChallenge(data));
        this.socket.on('challenge_sent', (data) => this.onChallengeSent(data));
        this.socket.on('challenge_accepted', (data) => this.onChallengeAccepted(data));
        this.socket.on('challenge_declined', (data) => this.onChallengeDeclined(data));

        // Connection health check
        this.socket.on('pong', () => {
            console.log('💓 Server heartbeat OK');
        });

        // Reconnection handling - DÜZELTİLDİ
        this.socket.io.on('reconnect', () => {
            console.log('🔄 Socket.io yeniden bağlandı');
            addLog('✅ Bağlantı yeniden kuruldu!', 'win');
            this.reconnectAttempts = 0;
        });

        this.socket.io.on('reconnect_attempt', () => {
            console.log('🔄 Yeniden bağlanmaya çalışılıyor...');
            this.reconnectAttempts++;
        });

        this.socket.io.on('reconnect_failed', () => {
            console.log('❌ Yeniden bağlantı başarısız');
            addLog('❌ Sunucu bağlantısı kesildi, local mode aktif', 'error');
            this.enableLocalMode();
        });
    }

    // Local mode etkinleştir - DÜZELTİLDİ
    async enableLocalMode() {
        this.isLocalMode = true;
        this.connected = true;
        this.playerId = this.generateId();
        this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
        
        // Local storage temizle
        this.clearOldLocalGames();
        
        // Storage event listener
        this.setupLocalStorageListener();
        
        addLog('🏠 Local multiplayer aktif! Aynı tarayıcıda yeni sekme açarak test edin.', 'win');
        this.updateMultiplayerUI(true);
        return Promise.resolve();
    }

    // Local storage listener - YENİ
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

    // Eski local oyunları temizle - YENİ
    clearOldLocalGames() {
        const keys = Object.keys(localStorage);
        const cutoff = Date.now() - (60 * 60 * 1000); // 1 saat
        
        keys.forEach(key => {
            if (key.startsWith('epic_game_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < cutoff) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key); // Bozuk data'yı temizle
                }
            }
        });
    }

    // Hızlı eşleşme fonksiyonu - YENİ
    findQuickMatch() {
        if (!this.connected) {
            addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            return;
        }

        addLog('⚡ Hızlı eşleşme başlatılıyor...', 'info');
        
        if (this.socket && this.socket.connected) {
            // Socket.io mode
            this.socket.emit('find_quick_match', {
                playerName: this.playerName,
                playerId: this.playerId
            });
        } else {
            // Local mode - otomatik oda oluştur
            addLog('🏠 Local mode: Otomatik oda oluşturuluyor...', 'info');
            this.createGame();
        }
    }

    // Lobi listesi iste - YENİ
    requestLobbyList() {
        if (!this.connected) {
            addLog('❌ Multiplayer sistemi henüz hazır değil!', 'error');
            return;
        }

        addLog('📋 Lobi listesi isteniyor...', 'info');
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('get_lobby_list', {
                playerId: this.playerId
            });
        } else {
            // Local mode - boş liste göster
            if (typeof showLobbyListModal === 'function') {
                showLobbyListModal([]);
            }
    }

    // Oyun odası oluştur - DÜZELTİLDİ
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

    // Oyuna katıl - DÜZELTİLDİ
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
            // Local mode
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
                
                console.log('🚪 Local mode ile oyuna katılınıyor:', this.gameId);
                
                // Katılım mesajını gönder
                const joinData = {
                    type: 'player_joined',
                    gameId: this.gameId,
                    playerId: this.playerId,
                    playerName: this.playerName,
                    timestamp: Date.now()
                };
                
                localStorage.setItem(`epic_game_${this.gameId}_join`, JSON.stringify(joinData));
                
                // Host'a opponent bilgisi ver
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

    // Local mesaj işleyici - DÜZELTİLDİ
    handleLocalMessage(key, value) {
        if (!value) return;
        
        try {
            const data = JSON.parse(value);
            
            // Kendi mesajlarını görmezden gel
            if (data.playerId === this.playerId) return;
            
            // Oyun ID eşleşmesi kontrol et
            if (data.gameId && data.gameId !== this.gameId) return;
            
            console.log('📨 Local mesaj alındı:', data.type, data);
            
            // Mesaj türüne göre işle
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
                    
                case 'card_played':
                    this.onOpponentCardPlayed(data);
                    break;
                    
                case 'spell_cast':
                    this.onOpponentSpellCast(data);
                    break;
                    
                case 'turn_changed':
                    this.onTurnChanged(data);
                    break;
                    
                case 'game_ended':
                    this.onGameEnded(data);
                    break;
            }
            
        } catch (e) {
            console.warn('Local message parse error:', e);
        }
    }

    // Mesaj gönder - DÜZELTİLDİ
    sendMessage(message) {
        if (!this.gameId) return false;
        
        if (this.socket && this.socket.connected) {
            // Socket.io mode
            this.socket.emit(message.type, message);
            return true;
        } else if (this.isLocalMode) {
            // Local mode
            const messageData = {
                ...message,
                playerId: this.playerId,
                timestamp: Date.now()
            };
            
            const messageKey = `epic_game_${this.gameId}_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(messageKey, JSON.stringify(messageData));
            
            // Mesajı bir süre sonra temizle
            setTimeout(() => {
                localStorage.removeItem(messageKey);
            }, 10000);
            
            return true;
        }
        
        return false;
    }

    // Bağlantı kesilme işleyici - YENİ
    handleDisconnect() {
        this.connected = false;
        this.updateMultiplayerUI(false);
        
        if (this.gameId && !this.isLocalMode) {
            addLog('❌ Sunucu bağlantısı kesildi', 'error');
            
            // Local mode'a geç
            setTimeout(() => {
                this.enableLocalMode();
            }, 2000);
        }
    }

    // Event Handler'lar - AYNI
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
        // TODO: Implement in main game logic
    }

    onOpponentSpellCast(message) {
        addLog(`🔮 ${this.opponent?.name || 'Rakip'} büyü kullandı!`, 'info');
        // TODO: Implement in main game logic
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

    // 🏠 LOBI SISTEM EVENT HANDLERS
    
    onPlayersListUpdate(data) {
        console.log('👥 Players list updated:', data.count, 'online');
        
        // Online oyuncu listesini güncelle
        if (typeof updatePlayersList === 'function') {
            updatePlayersList(data.players);
        } else {
            console.log('Online players updated:', data.count);
        }
    }
    
    onLobbyListUpdate(data) {
        console.log('📋 Lobby list updated:', data.total, 'lobbies');
        
        // Lobi listesi modalını güncelle
        if (typeof showLobbyListModal === 'function') {
            showLobbyListModal(data.lobbies);
        }
    }
    
    onQuickMatchSearching(data) {
        addLog('⚡ Rakip aranıyor... Kuyruk pozisyonu: ' + data.queuePosition, 'info');
        
        // Bekleme modalı göster
        this.showQuickMatchWaiting(data);
    }
    
    onQuickMatchFound(data) {
        addLog('✅ Rakip bulundu! Oyun başlatılıyor...', 'win');
        
        this.closeWaitingRoom();
        
        // Rakip bilgisini ayarla
        const opponent = data.players.find(p => p.id !== this.playerId);
        if (opponent) {
            this.opponent = {
                id: opponent.id,
                name: opponent.name
            };
        }
        
        addLog(`⚡ Hızlı eşleşme: ${this.opponent?.name || 'Rakip'} ile oyun başlıyor!`, 'win');
    }
    
    onPlayerChallenge(data) {
        // Davet popup'u göster
        this.showChallengePopup(data);
        addLog(`⚔️ ${data.challengerName} sizi düelloya davet etti!`, 'info');
    }
    
    onChallengeSent(data) {
        addLog(`⚔️ ${data.targetName} oyuncusuna davet gönderildi!`, 'info');
    }
    
    onChallengeAccepted(data) {
        addLog('✅ Davet kabul edildi! Oyun başlıyor...', 'win');
        
        // Oyunu başlat
        const opponent = data.players.find(p => p.id !== this.playerId);
        if (opponent) {
            this.opponent = {
                id: opponent.id,
                name: opponent.name
            };
        }
    }
    
    onChallengeDeclined(data) {
        addLog(`❌ ${data.declinerName} daveti reddetti.`, 'error');
    }
    
    // Hızlı eşleşme bekleme modalı
    showQuickMatchWaiting(data) {
        this.closeWaitingRoom();
        
        const modal = document.createElement('div');
        modal.id = 'quickMatchWaiting';
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>⚡ Hızlı Eşleşme</h2>
                <div class="waiting-content">
                    <div class="waiting-spinner">
                        <div class="spinner"></div>
                        <p>Rakip aranıyor...</p>
                        <p><small>Kuyruk pozisyonu: ${data.queuePosition}</small></p>
                        <p><small>Ortalama bekleme süresi: 30 saniye</small></p>
                    </div>
                </div>
                <button onclick="multiplayer.cancelQuickMatch()" class="menu-btn secondary-btn">❌ İptal Et</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Davet popup'ı
    showChallengePopup(data) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>⚔️ Düello Daveti</h2>
                <div class="challenge-content">
                    <p><strong>${data.challengerName}</strong> sizi düelloya davet ediyor!</p>
                    <p>Bu daveti kabul ediyor musunuz?</p>
                </div>
                <div class="challenge-buttons">
                    <button onclick="multiplayer.acceptChallenge('${data.challengerId}'); this.parentElement.parentElement.parentElement.remove();" class="menu-btn primary-btn">
                        ✅ Kabul Et
                    </button>
                    <button onclick="multiplayer.declineChallenge('${data.challengerId}'); this.parentElement.parentElement.parentElement.remove();" class="menu-btn secondary-btn">
                        ❌ Reddet
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 30 saniye sonra otomatik kapat
        setTimeout(() => {
            if (document.body.contains(modal)) {
                this.declineChallenge(data.challengerId);
                modal.remove();
            }
        }, 30000);
    }
    
    // Hızlı eşleşme iptal
    cancelQuickMatch() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('cancel_quick_match', {
                playerId: this.playerId
            });
        }
        
        this.closeWaitingRoom();
        addLog('❌ Hızlı eşleşme iptal edildi', 'info');
    }
    
    // Daveti kabul et
    acceptChallenge(challengerId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('accept_challenge', {
                challengerId: challengerId
            });
        }
        
        addLog('✅ Davet kabul edildi!', 'win');
        hideMainMenu();
        initGame();
    }
    
    // Daveti reddet
    declineChallenge(challengerId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('decline_challenge', {
                challengerId: challengerId
            });
        }
        
        addLog('❌ Davet reddedildi', 'info');
    }

    // UI Fonksiyonları - DÜZELTİLDİ
    showWaitingRoom() {
        this.closeWaitingRoom();
        
        const modal = document.createElement('div');
        modal.id = 'waitingRoom';
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        const connectionMode = this.socket?.connected ? 'Socket.io' : 'Local Mode';
        const instruction = this.isLocalMode ? 'Aynı tarayıcıda yeni sekme açın ve oyun ID\'sini girin!' : 'ID\'yi paylaşın!';
        
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
                        <p><small>${connectionMode} - ${instruction}</small></p>
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
        const mode = this.socket?.connected ? 'Socket.io' : (this.isLocalMode ? 'Local Mode' : 'Bağlanıyor...');
        
        // Status elementlerini güncelle
        const statusElements = document.querySelectorAll('[id*="status"], [class*="status"]');
        statusElements.forEach(el => {
            if (el.textContent.includes('Sunucu') || el.textContent.includes('Bağlantı')) {
                el.textContent = connected ? `🟢 ${mode} aktif!` : '🔴 Multiplayer hazırlanıyor...';
                el.style.color = connected ? '#10b981' : '#ef4444';
            }
        });
        
        // Multiplayer butonlarını güncelle
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
            } else if (this.isLocalMode) {
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
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        if (this.storageListener) {
            window.removeEventListener('storage', this.storageListener);
            this.storageListener = null;
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

console.log('🚀 Epic Card Battle Multiplayer System - FIXED VERSION!');