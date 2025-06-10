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
        this.serverUrl = 'wss://epic-card-battle-server.herokuapp.com'; // Placeholder server
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Sunucuya bağlan
    async connect() {
        try {
            addLog('🌐 Multiplayer sunucusuna bağlanılıyor...', 'info');
            
            // Gerçek sunucu bağlantısı
            const servers = [
                'ws://localhost:8080',
                'wss://epic-card-demo.onrender.com'
            ];
            
            for (const serverUrl of servers) {
                try {
                    await this.tryConnect(serverUrl);
                    break;
                } catch (e) {
                    console.log(`❌ ${serverUrl} bağlantısı başarısız`);
                    continue;
                }
            }
            
        } catch (error) {
            console.error('🚫 Tüm serverlar erişilemez:', error);
            this.showOfflineMode();
        }
    }

    // Belirli server'a bağlanmayı dene
    tryConnect(serverUrl) {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(serverUrl);
            
            const timeout = setTimeout(() => {
                this.socket.close();
                reject(new Error('Timeout'));
            }, 5000);

            this.socket.onopen = () => {
                clearTimeout(timeout);
                console.log('✅ Bağlandı:', serverUrl);
                this.connected = true;
                this.reconnectAttempts = 0;
                this.playerId = this.generateId();
                this.playerName = 'Oyuncu' + Math.floor(Math.random() * 1000);
                
                this.sendMessage({
                    type: 'player_connected',
                    playerId: this.playerId,
                    playerName: this.playerName,
                    version: '2.0'
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

            this.socket.onclose = () => {
                clearTimeout(timeout);
                this.connected = false;
                this.updateMultiplayerUI(false);
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    addLog(`🔄 Yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
                    setTimeout(() => this.connect(), 3000);
                } else {
                    addLog('❌ Bağlantı kalıcı olarak koptu', 'error');
                    this.showOfflineMode();
                }
                
                reject(new Error('Connection closed'));
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
                return true;
            } catch (e) {
                console.error('📤 Mesaj gönderim hatası:', e);
                return false;
            }
        }
        return false;
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
            gameMode: '3v3_spells'
        });

        if (success) {
            addLog('🏠 Oyun odası oluşturuluyor...', 'info');
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
            playerName: this.playerName
        });

        if (success) {
            addLog(`🚪 ${this.gameId} odasına katılınıyor...`, 'info');
        }
    }

    // Kart oyna (multiplayer)
    playCard(cardData, position) {
        if (!this.isMyTurn) {
            addLog('❌ Sizin turunuz değil!', 'error');
            return false;
        }

        return this.sendMessage({
            type: 'card_played',
            gameId: this.gameId,
            playerId: this.playerId,
            cardData: this.sanitizeCardData(cardData),
            position: position,
            timestamp: Date.now()
        });
    }

    // Büyü kullan (multiplayer)
    castSpell(spellData, targetId = null) {
        if (!this.isMyTurn) {
            addLog('❌ Sizin turunuz değil!', 'error');
            return false;
        }

        return this.sendMessage({
            type: 'spell_cast',
            gameId: this.gameId,
            playerId: this.playerId,
            spellData: this.sanitizeCardData(spellData),
            targetId: targetId,
            timestamp: Date.now()
        });
    }

    // Savaş başlat (multiplayer)
    startBattle() {
        if (!this.isMyTurn) {
            addLog('❌ Sizin turunuz değil!', 'error');
            return false;
        }

        return this.sendMessage({
            type: 'battle_start',
            gameId: this.gameId,
            playerId: this.playerId,
            playerCards: gameState.playerBattleCards.map(card => this.sanitizeCardData(card)),
            spellCards: gameState.playerSpellCards.map(card => this.sanitizeCardData(card)),
            timestamp: Date.now()
        });
    }

    // Tur bitir
    endTurn() {
        if (!this.isMyTurn) {
            return false;
        }

        this.isMyTurn = false;
        this.updateTurnUI();
        
        return this.sendMessage({
            type: 'end_turn',
            gameId: this.gameId,
            playerId: this.playerId,
            timestamp: Date.now()
        });
    }

    // Mesaj işleyici
    handleMessage(message) {
        console.log('📨 Gelen mesaj:', message.type);
        
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
        }
    }

    // Event Handler'lar
    onGameCreated(message) {
        addLog(`🏠 Oyun odası oluşturuldu! Paylaş: ${this.gameId}`, 'win');
        this.showWaitingRoom();
    }

    onPlayerJoined(message) {
        this.opponent = message.opponent;
        addLog(`👥 ${this.opponent.name} oyuna katıldı!`, 'info');
        
        // Otomatik başlatma (host)
        if (this.isHost) {
            setTimeout(() => {
                this.sendMessage({
                    type: 'start_game',
                    gameId: this.gameId,
                    playerId: this.playerId
                });
            }, 2000);
        }
    }

    onGameStarted(message) {
        addLog('🎮 Multiplayer oyun başlıyor!', 'win');
        this.closeWaitingRoom();
        
        // Oyunu başlat
        gameState.isMultiplayer = true;
        gameState.multiplayerManager = this;
        
        // İlk tur
        this.isMyTurn = message.firstPlayer === this.playerId;
        this.updateTurnUI();
    }

    onOpponentCardPlayed(message) {
        if (message.playerId === this.playerId) return;
        
        // Rakibin kartını oluştur ve yerleştir
        const opponentCard = this.createCardFromData(message.cardData);
        
        if (message.position === 'battle') {
            gameState.botBattleCards.push(opponentCard);
        } else if (message.position === 'spell') {
            gameState.botSpellCards.push(opponentCard);
        }
        
        addLog(`🎯 ${this.opponent.name}: ${message.cardData.name} oynadı`, 'info');
        updateUI();
    }

    onOpponentSpellCast(message) {
        if (message.playerId === this.playerId) return;
        
        addLog(`🔮 ${this.opponent.name}: ${message.spellData.name} kullandı!`, 'battle');
        
        // Büyü efektini göster
        this.showSpellEffect(message.spellData, message.targetId);
    }

    onTurnChanged(message) {
        this.isMyTurn = message.currentPlayer === this.playerId;
        this.updateTurnUI();
        
        if (this.isMyTurn) {
            addLog('⏰ Sizin turunuz! (30 saniye)', 'win');
            this.startTurnTimer();
        } else {
            addLog(`⏳ ${this.opponent.name}'in turu...`, 'info');
        }
    }

    onGameEnded(message) {
        const won = message.winner === this.playerId;
        const title = won ? '🏆 KAZANDIN!' : '💔 KAYBETTİN!';
        const msg = message.reason || 'Oyun bitti';
        
        addLog(`${title} ${msg}`, won ? 'win' : 'lose');
        
        setTimeout(() => {
            showGameOver(title, msg);
            this.resetMultiplayerState();
        }, 2000);
    }

    onPlayerDisconnected(message) {
        addLog(`❌ ${message.playerName} oyundan ayrıldı`, 'error');
        
        // Kazanma veya ana menüye dönme seçeneği sun
        setTimeout(() => {
            if (confirm('Rakibiniz oyundan ayrıldı. Ana menüye dönmek ister misiniz?')) {
                showMainMenu();
                this.resetMultiplayerState();
            }
        }, 1000);
    }

    onError(message) {
        addLog(`❌ Hata: ${message.message}`, 'error');
        console.error('Server error:', message);
    }

    // UI Yardımcı Fonksiyonlar
    showWaitingRoom() {
        const modal = document.createElement('div');
        modal.id = 'waitingRoom';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🏠 Oyun Odası</h2>
                <div class="waiting-content">
                    <p>Oyun ID: <strong class="game-id-display">${this.gameId}</strong></p>
                    <button onclick="navigator.clipboard.writeText('${this.gameId}')" class="copy-btn">📋 Kopyala</button>
                    <div class="waiting-spinner">
                        <div class="spinner"></div>
                        <p>Başka bir oyuncunun katılması bekleniyor...</p>
                    </div>
                </div>
                <button onclick="multiplayer.cancelGame()" class="menu-btn secondary-btn">❌ İptal</button>
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
        const statusElement = document.getElementById('multiplayerStatus');
        if (statusElement) {
            statusElement.textContent = connected ? '🟢 Online' : '🔴 Offline';
            statusElement.className = connected ? 'online-status' : 'offline-status';
        }
    }

    updateTurnUI() {
        const battleBtn = document.getElementById('battleBtn');
        const playerCards = document.querySelectorAll('#playerCards .card');
        const useSpellBtn = document.getElementById('useSpellBtn');
        
        if (this.isMyTurn) {
            // Benim turum
            document.body.classList.add('my-turn');
            document.body.classList.remove('opponent-turn');
            
            if (playerCards) {
                playerCards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                });
            }
        } else {
            // Rakibin turu
            document.body.classList.add('opponent-turn');
            document.body.classList.remove('my-turn');
            
            if (playerCards) {
                playerCards.forEach(card => {
                    card.style.opacity = '0.5';
                    card.style.pointerEvents = 'none';
                });
            }
            
            if (battleBtn) battleBtn.disabled = true;
            if (useSpellBtn) useSpellBtn.disabled = true;
        }
    }

    startTurnTimer() {
        // 30 saniye tur limiti
        this.turnTimer = setTimeout(() => {
            if (this.isMyTurn) {
                addLog('⏰ Süre doldu! Tur otomatik geçiliyor...', 'warning');
                this.endTurn();
            }
        }, 30000);
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

    sanitizeCardData(card) {
        return {
            id: card.id,
            name: card.name,
            type: card.type,
            attack: card.attack,
            defense: card.defense,
            currentHealth: card.currentHealth,
            maxHealth: card.maxHealth,
            icon: card.icon,
            image: card.image,
            description: card.description,
            cssClass: card.cssClass,
            isSpell: card.isSpell,
            spellType: card.spellType,
            spellValue: card.spellValue
        };
    }

    createCardFromData(cardData) {
        return {
            id: cardData.id + '_opponent',
            name: cardData.name,
            type: cardData.type,
            attack: cardData.attack,
            defense: cardData.defense,
            currentHealth: cardData.currentHealth || cardData.defense,
            maxHealth: cardData.maxHealth || cardData.defense,
            icon: cardData.icon,
            image: cardData.image,
            description: cardData.description,
            cssClass: cardData.cssClass,
            isSpell: cardData.isSpell || false,
            spellType: cardData.spellType,
            spellValue: cardData.spellValue,
            _isOpponent: true
        };
    }

    showSpellEffect(spellData, targetId) {
        // Görsel büyü efekti göster
        const effectElement = document.createElement('div');
        effectElement.className = 'multiplayer-spell-effect';
        effectElement.innerHTML = `
            <div class="spell-animation">
                ${spellData.icon} ${spellData.name}
            </div>
        `;
        effectElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            font-size: 2rem;
            font-weight: bold;
            color: #a855f7;
            text-shadow: 0 0 20px #a855f7;
            animation: spellBurst 2s ease-out forwards;
            pointer-events: none;
        `;
        
        document.body.appendChild(effectElement);
        
        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 2000);
    }

    showOfflineMode() {
        addLog('📡 Offline modda devam ediliyor...', 'info');
        this.updateMultiplayerUI(false);
    }

    cancelGame() {
        if (this.gameId) {
            this.sendMessage({
                type: 'cancel_game',
                gameId: this.gameId,
                playerId: this.playerId
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
        
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
        
        // Game state'i temizle
        if (window.gameState) {
            gameState.isMultiplayer = false;
            gameState.multiplayerManager = null;
        }
        
        document.body.classList.remove('my-turn', 'opponent-turn');
    }

    // Bağlantıyı kapat
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
        this.updateMultiplayerUI(false);
        this.resetMultiplayerState();
    }
}

// Global multiplayer manager
const multiplayer = new MultiplayerManager();

// CSS animasyonları ekle
const multiplayerCSS = `
<style>
.my-turn {
    --primary-glow: #10b981;
}

.opponent-turn {
    --primary-glow: #ef4444;
}

.my-turn .battle-btn {
    animation: myTurnGlow 2s infinite;
}

.opponent-turn .arena {
    animation: opponentTurnPulse 3s infinite;
}

@keyframes myTurnGlow {
    0%, 100% { box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); }
    50% { box-shadow: 0 15px 35px rgba(16, 185, 129, 0.8); }
}

@keyframes opponentTurnPulse {
    0%, 100% { border-color: #ef4444; }
    50% { border-color: #f97316; }
}

@keyframes spellBurst {
    0% {
        transform: translate(-50%, -50%) scale(0.5);
        opacity: 0;
    }
    50% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
    }
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

.online-status {
    color: #10b981;
}

.offline-status {
    color: #ef4444;
}

.waiting-content {
    text-align: center;
    padding: 2rem;
}

.multiplayer-spell-effect {
    z-index: 10000;
}
</style>
`;

// CSS'i head'e ekle
document.head.insertAdjacentHTML('beforeend', multiplayerCSS);

// Export
window.multiplayer = multiplayer;
