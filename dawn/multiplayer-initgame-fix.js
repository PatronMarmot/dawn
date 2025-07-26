// MULTIPLAYER-AWARE initGame Function
function initGame() {
    console.log('🎮 initGame çağırıldı');
    console.log('🔍 Multiplayer kontrol: multiplayer obje var mı?', !!window.multiplayer);
    console.log('🔍 Multiplayer bağlı mı?', window.multiplayer?.connected);
    console.log('🔍 Multiplayer gameId var mı?', window.multiplayer?.gameId);
    
    // 🚀 MULTIPLAYER DETECTION
    const isMultiplayerGame = window.multiplayer?.connected && window.multiplayer?.gameId;
    
    console.log('🎯 Oyun türü belirlendi:', isMultiplayerGame ? 'MULTIPLAYER' : 'SINGLEPLAYER');
    
    // Oyun durumunu sıfırla
    gameState = {
        gold: 100,
        health: 100,
        maxHealth: 100,
        score: 0,
        playerCards: [],
        botCards: [],
        playerBattleCards: [],
        botBattleCards: [],
        playerSpellCards: [],
        botSpellCards: [],
        battleInProgress: false,
        spellPhase: false,
        spellTimer: 0,
        targetingMode: false,
        selectedSpell: null,
        gameStarted: true,
        // 🚀 MULTIPLAYER STATE
        isMultiplayer: isMultiplayerGame,
        multiplayerManager: isMultiplayerGame ? window.multiplayer : null,
        opponentName: isMultiplayerGame ? (window.multiplayer.opponent?.name || 'Rakip') : null,
        isMyTurn: isMultiplayerGame ? window.multiplayer.isMyTurn : true
    };
    
    // 🎮 MULTIPLAYER vs SINGLEPLAYER INITIALIZATION
    if (gameState.isMultiplayer) {
        console.log('🌐 MULTIPLAYER GAME BAŞLATILIYOR');
        addLog('🌐 Multiplayer oyun başladı!', 'win');
        addLog(`👥 Rakip: ${gameState.opponentName}`, 'info');
        addLog(`⏰ İlk tur: ${gameState.isMyTurn ? 'Sizin' : 'Rakip'}`, 'info');
        
        // Multiplayer için başlangıç kartları
        for (let i = 0; i < 6; i++) {
            gameState.playerCards.push(createRandomCard());
            // Multiplayer'da bot kartları yok, rakip kartları multiplayer manager halleder
        }
        
        // UI'yi multiplayer moduna çevir
        updateUIForMultiplayer();
        
        // Multiplayer manager'a game state'i bildir
        if (gameState.multiplayerManager) {
            gameState.multiplayerManager.gameState = gameState;
        }
        
    } else {
        console.log('🤖 SINGLEPLAYER (BOT) GAME BAŞLATILIYOR');
        addLog('🎮 Singleplayer oyun başladı!', 'info');
        
        // Singleplayer için başlangıç kartları
        for (let i = 0; i < 6; i++) {
            gameState.playerCards.push(createRandomCard());
            gameState.botCards.push(createRandomCard()); // Bot kartları sadece singleplayer'da
        }
    }
    
    updateUI();
    logContent.innerHTML = '';
    addLog('📋 STRATEJİ: İlk önce 3 birim + 1 büyü kartını arena alanına hazırla!', 'info');
    
    if (gameState.isMultiplayer) {
        addLog('⚡ Sonra sıranız geldiğinde savaşa başlayın!', 'win');
        addLog('🌐 Gerçek zamanlı multiplayer aktif!', 'win');
    } else {
        addLog('⚡ Sonra bot ile savaşmaya başlayın!', 'win');
    }
}

// UI'yi multiplayer için güncelle
function updateUIForMultiplayer() {
    // Bot alanını rakip alanı yap
    const botArea = document.querySelector('.bot-area h3');
    if (botArea && gameState.isMultiplayer) {
        botArea.textContent = `👥 ${gameState.opponentName} Kartları`;
    }
    
    // Bot battle cards alanını rakip alanı yap
    const botBattleArea = document.querySelector('.arena-section.bot-section h3');
    if (botBattleArea && gameState.isMultiplayer) {
        botBattleArea.textContent = `👥 ${gameState.opponentName} Kartları`;
    }
    
    // Bot büyü alanını rakip büyü alanı yap
    const botSpellArea = document.querySelector('.arena-section.bot-section .spell-area h4');
    if (botSpellArea && gameState.isMultiplayer) {
        botSpellArea.textContent = `🔮 ${gameState.opponentName} Büyüleri`;
    }
}

// Multiplayer kart senkronizasyonu
function syncCardWithMultiplayer(cardData, action) {
    if (!gameState.isMultiplayer || !gameState.multiplayerManager) return;
    
    console.log('🔄 Multiplayer kart senkronizasyonu:', action, cardData.name);
    
    // Multiplayer manager'a kart hareketini bildir
    gameState.multiplayerManager.sendMessage({
        type: 'card_played',
        card: cardData,
        action: action,
        playerId: gameState.multiplayerManager.playerId,
        timestamp: Date.now()
    });
}