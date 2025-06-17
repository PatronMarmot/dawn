// Oyun durumu - MULTIPLAYER SUPPORT ADDED
let gameState = {
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
    gameStarted: false,
    // 🚀 MULTIPLAYER SUPPORT
    isMultiplayer: false,
    multiplayerManager: null,
    opponentName: null,
    isMyTurn: false
};

// Ayarlar
let settings = {
    soundEnabled: true,
    animationSpeed: 1,
    theme: 'default'
};

// Performans kontrolü
let animationFrameId = null;
let isAnimating = false;

// SADECE GERÇEK GÖRSELİ OLAN KARTLAR - PNG DOSYALARINA GÖRE
const unitCards = [
    { 
        name: 'Antik Golem', 
        type: '🗿', 
        attack: 15, 
        defense: 35, 
        icon: '🗿', 
        image: 'antik_golem.png',
        description: 'Antik güçlerle korunur', 
        cssClass: 'golem-type' 
    },
    { 
        name: 'Ateş Lordu', 
        type: '🔥', 
        attack: 40, 
        defense: 12, 
        icon: '🔥', 
        image: 'ates_lordu.png',
        description: 'Alev büyüleri ustası', 
        cssClass: 'fire-type' 
    },
    { 
        name: 'Ejder Savaşçı', 
        type: '🐲', 
        attack: 35, 
        defense: 22, 
        icon: '🐲', 
        image: 'ejder_savasci.png',
        description: 'Ejder gücüyle savaşır', 
        cssClass: 'dragon-type' 
    },
    { 
        name: 'Elf Büyücü', 
        type: '🧚', 
        attack: 25, 
        defense: 18, 
        icon: '🧝‍♂️', 
        image: 'elf_buyucu.png',
        description: 'Doğa büyüleri yapar', 
        cssClass: 'elf-type' 
    },
    { 
        name: 'Kristal Koruyucu', 
        type: '💎', 
        attack: 20, 
        defense: 30, 
        icon: '💎', 
        image: 'kristal_koruyucu.png',
        description: 'Kristal kalkanla korunur', 
        cssClass: 'crystal-type' 
    },
    { 
        name: 'Elit Okçu', 
        type: '🏹', 
        attack: 30, 
        defense: 15, 
        icon: '🏹', 
        image: 'okcu.png',
        description: 'Mükemmel nişancı', 
        cssClass: 'archer-type' 
    },
    { 
        name: 'Org Şampiyon', 
        type: '⚔️', 
        attack: 38, 
        defense: 20, 
        icon: '👹', 
        image: 'org_sampiyon.png',
        description: 'Org kabilesinin lideri', 
        cssClass: 'orc-type' 
    }
];

// BÜYÜ KARTLARI
const spellCards = [
    {
        name: 'Büyü Asası',
        type: '🔮',
        spellType: 'damage',
        spellValue: 10,
        icon: '🔮',
        image: 'BuyuAsasi.png',
        description: 'Seçtiğin düşmana 10 hasar verir',
        cssClass: 'spell-type',
        isSpell: true
    }
];

// DOM elementleri
const mainMenu = document.getElementById('mainMenu');
const gameArea = document.getElementById('gameArea');
const goldElement = document.getElementById('gold');
const healthElement = document.getElementById('health');
const scoreElement = document.getElementById('score');
const healthBar = document.getElementById('healthBar');
const playerCardsContainer = document.getElementById('playerCards');
const botCardsContainer = document.getElementById('botCards');
const playerBattleCardsContainer = document.getElementById('playerBattleCards');
const botBattleCardsContainer = document.getElementById('botBattleCards');
const playerSpellCardsContainer = document.getElementById('playerSpellCards');
const botSpellCardsContainer = document.getElementById('botSpellCards');
const useSpellBtn = document.getElementById('useSpellBtn');
const battleBtn = document.getElementById('battleBtn');
const buyCardBtn = document.getElementById('buyCardBtn');
const arena = document.getElementById('arena');
const logContent = document.getElementById('logContent');
const gameOverPopup = document.getElementById('gameOverPopup');

// Menü eventleri
document.addEventListener('DOMContentLoaded', () => {
    setupMenuEvents();
    setupGameEvents();
    loadSettings();
});

// Menü event'lerini kur
function setupMenuEvents() {
    // Ana menü butonları
    document.getElementById('startGameBtn').addEventListener('click', startNewGame);
    document.getElementById('howToPlayBtn').addEventListener('click', showHowToPlay);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    
    // Modal kapatma
    document.getElementById('closeHowToPlay').addEventListener('click', closeHowToPlay);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    
    // Üst bar butonları
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('menuBtn').addEventListener('click', showMainMenu);
    
    // Resume butonu
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    
    // Ayarlar
    document.getElementById('soundToggle').addEventListener('change', updateSoundSetting);
    document.getElementById('animationSpeed').addEventListener('input', updateAnimationSpeed);
    document.getElementById('themeSelect').addEventListener('change', updateTheme);
    
    // Modal dışına tıklama ile kapatma
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // ESC tuşu ile hedef seçimi iptal etme
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameState.targetingMode) {
            cancelTargeting();
        }
    });
}

// Oyun event'lerini kur
function setupGameEvents() {
    // Arena drop zone
    arena.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        // BÜYÜ AŞAMASI SİRASİNDA FARKLI GÖRSEL FEEDBACK
        if (gameState.spellPhase) {
            arena.classList.add('spell-phase-drag');
            arena.classList.remove('drag-over');
        } else {
            arena.classList.add('drag-over');
            arena.classList.remove('spell-phase-drag');
        }
    });
    
    arena.addEventListener('dragleave', () => {
        arena.classList.remove('drag-over', 'spell-phase-drag');
    });
    
    arena.addEventListener('drop', (e) => {
        e.preventDefault();
        arena.classList.remove('drag-over', 'spell-phase-drag');
        
        // Hedef seçim modundaysa drag&drop engelle
        if (gameState.targetingMode) {
            addLog('❌ Önce hedef seçimini tamamlayın!', 'error');
            return;
        }
        
        const cardId = e.dataTransfer.getData('text/plain');
        console.log('🎯 KART SÜRÜKLENDI:', cardId);
        
        // YENİ RANDOMİZE SİSTEMİ KULLAN
        handlePlayerCardDrop(cardId);
    });
    
    // Büyü butonu event listener
    if (useSpellBtn) {
        useSpellBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Büyü butonu tıklandı! Spell phase:', gameState.spellPhase, 'Battle progress:', gameState.battleInProgress);
            addLog('🔮 Büyü butonu tıklandı!', 'info');
            
            if (!gameState.spellPhase) {
                addLog('❌ Büyü aşaması değil!', 'error');
                return;
            }
            
            if (gameState.battleInProgress) {
                addLog('❌ Savaş ortasında büyü kullanılamaz!', 'error');
                return;
            }
            
            if (gameState.targetingMode) {
                addLog('❌ Zaten hedef seçim modundasiniz! Bot kartına tıklayın!', 'error');
                return;
            }
            
            if (gameState.playerSpellCards.length > 0) {
                const spell = gameState.playerSpellCards[0];
                addLog(`🔮 ${spell.name} kullanılıyor!`, 'info');
                useSpellSafely(spell);
            } else {
                addLog('❌ Büyü kartı yok!', 'error');
            }
        });
    }
    
    // Savaş butonu
    battleBtn.addEventListener('click', handleBattleButtonClick);
    
    // Kart satın alma
    buyCardBtn.addEventListener('click', buyCard);
}

// Battle butonu click handler
function handleBattleButtonClick() {
    // Hedef seçim modundaysa işlem yapma
    if (gameState.targetingMode) {
        return;
    }
    
    if (gameState.spellPhase) {
        // Büyü aşamasındaysa, büyü aşamasını bitir
        endSpellPhase();
    } else {
        // Normal savaş başlatma
        startBattle();
    }
}

// Yeni oyun başlat
function startNewGame() {
    hideMainMenu();
    initGame();
    playSound('gameStart');
}

// Ana menüyü göster
function showMainMenu() {
    gameState.gameStarted = false;
    mainMenu.style.display = 'flex';
    gameArea.style.display = 'none';
    document.getElementById('pauseModal').style.display = 'none';
}

// Ana menüyü gizle
function hideMainMenu() {
    mainMenu.style.display = 'none';
    gameArea.style.display = 'block';
    gameState.gameStarted = true;
}

// Modal fonksiyonları
function showHowToPlay() {
    document.getElementById('howToPlayModal').style.display = 'flex';
}

function closeHowToPlay() {
    document.getElementById('howToPlayModal').style.display = 'none';
}

function showSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    saveSettings();
}

function pauseGame() {
    if (gameState.gameStarted && !gameState.battleInProgress) {
        document.getElementById('pauseModal').style.display = 'flex';
    }
}

function resumeGame() {
    document.getElementById('pauseModal').style.display = 'none';
}

// Ayarlar
function updateSoundSetting() {
    settings.soundEnabled = document.getElementById('soundToggle').checked;
}

function updateAnimationSpeed() {
    settings.animationSpeed = parseFloat(document.getElementById('animationSpeed').value);
    document.documentElement.style.setProperty('--animation-speed', settings.animationSpeed);
}

function updateTheme() {
    settings.theme = document.getElementById('themeSelect').value;
    applyTheme(settings.theme);
}

function applyTheme(theme) {
    document.body.classList.remove('theme-default', 'theme-dark', 'theme-neon');
    document.body.classList.add(`theme-${theme}`);
}

function saveSettings() {
    console.log('Settings would be saved:', settings);
}

function loadSettings() {
    console.log('Settings loaded from defaults');
}

// Optimize edilmiş ses efektleri
function playSound(type) {
    if (!settings.soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'cardPlace':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'battle':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                break;
            case 'win':
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(783, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                break;
            case 'lose':
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                break;
            case 'gameStart':
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                break;
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
    } catch (e) {
        console.log('Audio context not available');
    }
}

// Oyunu başlat
function initGame() {
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
        gameStarted: true
    };
    
    // Başlangıç kartları - her seferinde farklı kartlar (3'lü savaş için daha fazla)
    for (let i = 0; i < 6; i++) {
        gameState.playerCards.push(createRandomCard());
        gameState.botCards.push(createRandomCard());
    }
    
    updateUI();
    logContent.innerHTML = '';
    addLog('🎮 Oyun başladı!', 'info');
    addLog('📋 STRATEJİ: İlk önce 3 birim + 1 büyü kartını arena alanına hazırla!', 'info');
    addLog('⚡ Sonra savaş sırasında büyü kullanıp kullanmama kararını vereceksin!', 'win');
}

// Rastgele birim kartı oluştur - TAM DERİN KOPYA SİSTEMİ
function createRandomUnitCard() {
    const cardType = unitCards[Math.floor(Math.random() * unitCards.length)];
    
    // SABİT CAN SİSTEMİ - Her kart türünün canı sabit!
    const baseHealth = cardType.defense; // Sadece defense değeri = can
    
    // TAM DERİN KOPYA - HER KART TAMAMEN AYRI OBJE!
    const newCard = {
        id: Math.random().toString(36).substr(2, 9) + Date.now(), // DAHA GÜVENLİ ID
        name: cardType.name + '', // String kopyala
        type: cardType.type + '', // String kopyala 
        attack: Number(cardType.attack), // Sayı kopyala
        defense: Number(cardType.defense), // Sayı kopyala
        icon: cardType.icon + '', // String kopyala
        image: cardType.image + '', // String kopyala
        description: cardType.description + '', // String kopyala
        cssClass: cardType.cssClass + '', // String kopyala
        currentHealth: Number(baseHealth), // Sayı kopyala - SABİT CAN
        maxHealth: Number(baseHealth),     // Sayı kopyala - SABİT CAN
        isSpell: false,
        _created: Date.now() // Benzersizlik için
    };
    
    console.log('YENİ KART OLUŞTURULDU (TAM DERİN KOPYA):', newCard.name, 'ID:', newCard.id, 'CAN:', newCard.currentHealth, 'Created:', newCard._created);
    
    return newCard;
}

// Rastgele büyü kartı oluştur
function createRandomSpellCard() {
    const spellType = spellCards[Math.floor(Math.random() * spellCards.length)];
    
    // DERİN KOPYA - Büyü kartları için de!
    const newSpell = {
        id: Math.random().toString(36).substr(2, 9), // Benzersiz ID
        name: spellType.name,
        type: spellType.type,
        spellType: spellType.spellType,
        spellValue: spellType.spellValue,
        icon: spellType.icon,
        image: spellType.image,
        description: spellType.description,
        cssClass: spellType.cssClass,
        isSpell: true
    };
    
    console.log('YENİ BÜYÜ KARTI OLUŞTURULDU:', newSpell.name, 'ID:', newSpell.id);
    return newSpell;
}

// Genel rastgele kart oluştur (70% birim, 30% büyü)
function createRandomCard() {
    return Math.random() < 0.7 ? createRandomUnitCard() : createRandomSpellCard();
}

// Optimize edilmiş UI güncelleme
function updateUI() {
    // Performans için requestAnimationFrame kullan
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
        goldElement.textContent = gameState.gold;
        healthElement.textContent = gameState.health;
        scoreElement.textContent = gameState.score;
        
        // Can barını güncelle
        const healthPercentage = (gameState.health / gameState.maxHealth) * 100;
        if (healthBar) {
            healthBar.style.width = `${healthPercentage}%`;
        }
        
        renderCards(gameState.playerCards, playerCardsContainer, true);
        renderCards(gameState.botCards, botCardsContainer, false);
        renderBotCardsWithTargeting();
        renderBattleCards();
        renderSpellCards(); // TEK FONKSİYON KULLAN
        
        // Buton durumları
        if (gameState.targetingMode) {
            battleBtn.textContent = `HEDEF SEÇİN: ${gameState.selectedSpell.name}`;
            battleBtn.disabled = true;
        } else if (gameState.spellPhase) {
            battleBtn.textContent = `BÜYÜ KULLAN VEYA SAVAŞI BAŞLAT! (${gameState.spellTimer}s)`;
            battleBtn.disabled = false;
        } else {
            battleBtn.innerHTML = '<span class="btn-icon">⚡</span>SAVAŞ!';
            // YENİ KURAL: 3 birim + EN AZ 1 büyü kartı gerekli (HAZIRLANMASI ZORUNLU)
            const hasRequiredUnits = gameState.playerBattleCards.length === 3;
            const hasRequiredSpells = gameState.playerSpellCards.length >= 1;
            battleBtn.disabled = !hasRequiredUnits || !hasRequiredSpells || gameState.battleInProgress;
            
            // Kullanıcıya bilgi ver
            if (!hasRequiredUnits && !hasRequiredSpells) {
                battleBtn.textContent = '❌ 3 BİRİM + 1 BÜYÜ HAZIRLA!';
            } else if (!hasRequiredUnits) {
                battleBtn.textContent = '❌ 3 BİRİM KART GEREK!';
            } else if (!hasRequiredSpells) {
                battleBtn.textContent = '❌ 1 BÜYÜ KART HAZIRLA!';
            } else {
                battleBtn.innerHTML = '<span class="btn-icon">⚡</span>SAVAŞ!';
            }
        }
        buyCardBtn.disabled = gameState.gold < 10;
        
        // Büyü butonu kontrolü - SADECE BÜYÜ AŞAMASINDA GÖSTER
        if (useSpellBtn) {
            if (gameState.spellPhase && !gameState.battleInProgress && gameState.playerSpellCards.length > 0) {
                useSpellBtn.style.display = 'flex';
                useSpellBtn.disabled = false;
                useSpellBtn.textContent = `🔮 ${gameState.playerSpellCards[0].name} KULLAN?`;
            } else {
                useSpellBtn.style.display = 'none';
                useSpellBtn.disabled = true;
            }
        }
        
        // Bot kartı kontrol et - bot kartları biterse oyunu kazan
        if (gameState.botCards.length === 0 && gameState.botBattleCards.length === 0) {
            setTimeout(() => {
                showGameOver('🏆 OYUNU KAZANDIN!', 'Tüm bot kartlarını yendin! Mükemmel!');
            }, 1000);
        }
    });
}

// Optimize edilmiş kart rendering
function renderCards(cards, container, isDraggable) {
    // Fragment kullanarak DOM manipülasyonunu optimize et
    const fragment = document.createDocumentFragment();
    
    // Sadece değişiklik varsa render et
    if (container.children.length !== cards.length) {
        container.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = createCardElement(card, isDraggable);
            fragment.appendChild(cardElement);
        });
        
        container.appendChild(fragment);
    }
}

// Bot kartlarına targeting feedback ekle
function renderBotCardsWithTargeting() {
    if (gameState.targetingMode) {
        // Bot battle cards için targeting sınıfı ekle
        document.querySelectorAll('#botBattleCards .card').forEach(cardElement => {
            cardElement.classList.add('targeting-available');
            cardElement.style.cursor = 'crosshair';
        });
    } else {
        // Targeting sınıfını kaldır
        document.querySelectorAll('#botBattleCards .card').forEach(cardElement => {
            cardElement.classList.remove('targeting-available');
            cardElement.style.cursor = 'default';
        });
    }
}

// GELİŞTİRİLMİŞ GÖRSEL SİSTEMİ - SADECE PNG DESTEĞI
function createCardElement(card, isDraggable) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${card.cssClass} ${!isDraggable ? 'bot-card' : ''}`;
    cardDiv.draggable = isDraggable;
    cardDiv.dataset.cardId = card.id;
    
    // Kartın can durumuna göre görsel durum (sadece birim kartlar için)
    let healthClass = '';
    if (!card.isSpell && card.currentHealth && card.maxHealth) {
        const healthPercentage = (card.currentHealth / card.maxHealth) * 100;
        if (healthPercentage <= 25) healthClass = 'critical-health';
        else if (healthPercentage <= 50) healthClass = 'low-health';
    }
    
    // GÖRSEL TAM OTURTMA SİSTEMİ - PNG VE SVG DESTEĞİ
    const imagePath = `images/${card.image}`;
    const isImage = card.image && (card.image.endsWith('.png') || card.image.endsWith('.jpg'));
    const isSvg = card.image && card.image.endsWith('.svg');
    
    let cardImageContent;
    if (isImage) {
        cardImageContent = `<img src="${imagePath}" alt="${card.name}" class="card-img" style="display:block;" onload="this.style.display='block'; this.nextElementSibling.style.display='none';" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                           <div class="fallback-icon" style="display:none;">${card.icon}</div>`;
    } else if (isSvg) {
        cardImageContent = `<object data="${imagePath}" type="image/svg+xml" class="card-img card-svg" style="display:block;" onload="this.style.display='block'; this.nextElementSibling.style.display='none';" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"></object>
                           <div class="fallback-icon" style="display:none;">${card.icon}</div>`;
    } else {
        cardImageContent = `<div class="fallback-icon">${card.icon}</div>`;
    }
    
    cardDiv.innerHTML = `
        <div class="card-type">${card.type}</div>
        <div class="card-image ${healthClass}">
            ${cardImageContent}
        </div>
        <div class="card-name">${card.name}</div>
        <div class="card-stats">
            ${card.isSpell ? 
                `<span class="spell-stat">🔮 ${card.spellValue} Hasar</span>` :
                `<span class="attack-stat">⚔️${card.attack}</span>
                 <span class="defense-stat">🛡️${card.defense}</span>
                 <span class="health-stat ${healthClass}">❤️${card.currentHealth}/${card.maxHealth}</span>`
            }
        </div>
        <div class="card-description">${card.description}</div>
    `;
    
    if (isDraggable) {
        setupDragAndDrop(cardDiv);
    }
    
    // Bot kartları için hedef seçim event (sadece targeting mode'da ve savaş ortasında değil)
    if (!isDraggable && !card.isSpell) {
        cardDiv.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Bot kartına tıklandı:', card.name, 'Targeting:', gameState.targetingMode);
            
            if (gameState.targetingMode && !gameState.battleInProgress) {
                addLog(`🎯 ${card.name} hedef seçildi!`, 'win');
                applySpellToTarget(card);
            } else if (!gameState.targetingMode) {
                addLog('❌ Önce büyü kartınıza tıklayın!', 'error');
            } else if (gameState.battleInProgress) {
                addLog('❌ Savaş ortasında hedef seçilemez!', 'error');
            }
        });
    }
    
    return cardDiv;
}

// Savaş kartlarını render et
function renderBattleCards() {
    const playerFragment = document.createDocumentFragment();
    const botFragment = document.createDocumentFragment();
    
    playerBattleCardsContainer.innerHTML = '';
    botBattleCardsContainer.innerHTML = '';
    
    gameState.playerBattleCards.forEach(card => {
        const cardElement = createCardElement(card, false);
        playerFragment.appendChild(cardElement);
    });
    
    gameState.botBattleCards.forEach(card => {
        const cardElement = createCardElement(card, false);
        botFragment.appendChild(cardElement);
    });
    
    playerBattleCardsContainer.appendChild(playerFragment);
    botBattleCardsContainer.appendChild(botFragment);
}

// Büyü kartlarını render et - SIFIRDAN YENİ SİSTEM
function renderSpellCards() {
    const playerSpellFragment = document.createDocumentFragment();
    const botSpellFragment = document.createDocumentFragment();
    
    playerSpellCardsContainer.innerHTML = '';
    botSpellCardsContainer.innerHTML = '';
    
    gameState.playerSpellCards.forEach(card => {
        const cardElement = createCardElement(card, true);
        cardElement.classList.add('spell-in-area');
        
        // YENİ BÜYÜ SİSTEMİ - Basit ve çalışır
        cardElement.onclick = function() {
            useSpellOnRandomEnemy(card);
        };
        
        // Görsel
        cardElement.style.cursor = 'pointer';
        cardElement.style.border = '5px solid #00ff00';
        cardElement.title = 'Tıkla = 10 hasar!';
        
        playerSpellFragment.appendChild(cardElement);
    });
    
    gameState.botSpellCards.forEach(card => {
        const cardElement = createCardElement(card, false);
        cardElement.classList.add('spell-in-area');
        botSpellFragment.appendChild(cardElement);
    });
    
    playerSpellCardsContainer.appendChild(playerSpellFragment);
    botSpellCardsContainer.appendChild(botSpellFragment);
}

// YENİ BÜYÜ FONKSİYONU - Her şey burada
function useSpellOnRandomEnemy(spellCard) {
    console.log('BÜYÜ KULLANIMI BAŞLADI - Kart ID:', spellCard.id);
    
    // 1. Düşman kontrolü
    if (!gameState.botBattleCards || gameState.botBattleCards.length === 0) {
        alert('Düşman kartı yok!');
        return;
    }
    
    // 2. Rastgele düşman seç
    const enemyIndex = Math.floor(Math.random() * gameState.botBattleCards.length);
    const targetEnemy = gameState.botBattleCards[enemyIndex];
    
    console.log('Hedef düşman:', targetEnemy.name, 'ID:', targetEnemy.id, 'Can:', targetEnemy.currentHealth);
    
    // 3. Hasar uygula
    const damage = 10;
    const oldHealth = targetEnemy.currentHealth;
    targetEnemy.currentHealth = targetEnemy.currentHealth - damage;
    
    console.log('Hasar uygulandı:', oldHealth, '->', targetEnemy.currentHealth);
    
    // 4. Alert
    alert(`Büyü kullanıldı!\n${targetEnemy.name} ${damage} hasar aldı!\nYeni can: ${targetEnemy.currentHealth}`);
    
    // 5. Ölü kart kontrolü
    if (targetEnemy.currentHealth <= 0) {
        alert(targetEnemy.name + ' öldü!');
        // Sadece ID ile kaldır
        const beforeCount = gameState.botBattleCards.length;
        gameState.botBattleCards = gameState.botBattleCards.filter(c => c.id !== targetEnemy.id);
        console.log('Kart kaldırıldı. Önceki sayı:', beforeCount, 'Yeni sayı:', gameState.botBattleCards.length);
    }
    
    // 6. Büyü kartını kaldır - EN ÖNEMLİ KİSIM!
    console.log('Büyü kartı kaldırılıyor. ID:', spellCard.id);
    const beforeSpellCount = gameState.playerSpellCards.length;
    gameState.playerSpellCards = gameState.playerSpellCards.filter(c => c.id !== spellCard.id);
    const afterSpellCount = gameState.playerSpellCards.length;
    console.log('Büyü kart sayısı:', beforeSpellCount, '->', afterSpellCount);
    
    // 7. UI güncelle
    updateUI();
    
    console.log('BÜYÜ KULLANIMI TAMAM');
}

// Drag and Drop kurulumu
function setupDragAndDrop(cardElement) {
    cardElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', cardElement.dataset.cardId);
        cardElement.classList.add('dragging');
    });
    
    cardElement.addEventListener('dragend', () => {
        cardElement.classList.remove('dragging');
    });
}

// KART SAVAŞ ALANINA YERLEŞTİRME - YENİ RANDOMİZE SİSTEM
function placeCardInBattlefield(originalCard, isBotCard = false) {
    console.log('📋 KART SAVAŞ ALANINA YERLEŞTİRİLİYOR:', originalCard.name, 'OrijinalID:', originalCard.id);
    
    // TAM YENİ KART OLUŞTUR - SIFIRDAN!
    const battlefieldCard = {
        // YENİ BENZERSİZ SAVAŞ ALANI ID'Sİ
        id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${isBotCard ? 'bot' : 'player'}`,
        
        // ORİJİNAL VERİLERİ KOPYALA (DEĞİŞMEZ)
        name: String(originalCard.name),
        type: String(originalCard.type),
        attack: Number(originalCard.attack),
        defense: Number(originalCard.defense),
        icon: String(originalCard.icon),
        image: String(originalCard.image),
        description: String(originalCard.description),
        cssClass: String(originalCard.cssClass),
        isSpell: Boolean(originalCard.isSpell),
        spellType: originalCard.spellType ? String(originalCard.spellType) : undefined,
        spellValue: originalCard.spellValue ? Number(originalCard.spellValue) : undefined,
        
        // CAN SİSTEMİ - SAVAŞ ALANINA ÖZEL
        currentHealth: Number(originalCard.currentHealth || originalCard.defense),
        maxHealth: Number(originalCard.maxHealth || originalCard.defense),
        
        // SAVAŞ ALANI ÖZEL VERİLER
        _battlefieldStamp: `${Date.now()}_${Math.random()}_battlefield`,
        _originalId: originalCard.id, // Referans için sakla
        _placedAt: Date.now(),
        _battlePosition: isBotCard ? 'bot-side' : 'player-side'
    };
    
    console.log('⚔️ YENİ SAVAŞ KARTI OLUŞTURULDU:', {
        name: battlefieldCard.name,
        battleId: battlefieldCard.id,
        originalId: battlefieldCard._originalId,
        health: battlefieldCard.currentHealth,
        battleStamp: battlefieldCard._battlefieldStamp
    });
    
    return battlefieldCard;
}

// OYUNCU KART YERLEŞTİRME SİSTEMİ - BÜYÜ AŞAMASI KORUMASI
function handlePlayerCardDrop(cardId) {
    const originalCard = gameState.playerCards.find(c => c.id === cardId);
    if (!originalCard) {
        addLog('❌ Kart bulunamadı!', 'error');
        return;
    }
    
    if (originalCard.isSpell) {
        // BÜYÜ AŞAMASI KORUMASI - YENİ BÜYÜ YERLEŞTIRME ENGELİ
        if (gameState.spellPhase) {
            addLog('❌ Büyü aşamasında yeni büyü kartı yerleştirilemez!', 'error');
            addLog('⚡ Sadece önceden hazırladığın büyüleri kullanabilirsin!', 'info');
            return;
        }
        
        // BÜYÜ KARTI - ÖN HAZIRLIK ALANI (Sadece normal zamanda)
        if (gameState.playerSpellCards.length < 1) {
            // Orijinal kartı elden kaldır
            gameState.playerCards = gameState.playerCards.filter(c => c.id !== cardId);
            
            // YENİ REFERANSLA BÜYÜ ALANINA EKLE
            const spellCard = placeCardInBattlefield(originalCard, false);
            gameState.playerSpellCards.push(spellCard);
            
            playSound('cardPlace');
            addLog(`✨ ${spellCard.name} ön hazırlık alanına yerleştirildi!`, 'info');
            addLog(`🆔 Yeni Battle ID: ${spellCard.id.substr(0, 15)}...`, 'info');
        } else {
            addLog('❌ Sadece 1 büyü kartı hazırlayabilirsin!', 'error');
        }
    } else {
        // BİRİM KARTI KORUMASI - Savaş başladıysa yerleştirme engelli
        if (gameState.battleInProgress) {
            addLog('❌ Savaş başladıktan sonra yeni birim kartı yerleştirilemez!', 'error');
            return;
        }
        
        // BİRİM KARTI - SAVAŞ ALANI (Sadece savaş öncesi)
        if (gameState.playerBattleCards.length < 3) {
            // Orijinal kartı elden kaldır
            gameState.playerCards = gameState.playerCards.filter(c => c.id !== cardId);
            
            // YENİ REFERANSLA SAVAŞ ALANINA EKLE
            const battleCard = placeCardInBattlefield(originalCard, false);
            gameState.playerBattleCards.push(battleCard);
            
            playSound('cardPlace');
            addLog(`✨ ${battleCard.name} arena alanına yerleştirildi!`, 'info');
            addLog(`🆔 Yeni Battle ID: ${battleCard.id.substr(0, 15)}...`, 'info');
        } else {
            addLog('❌ Sadece 3 birim kartı yerleştirebilirsin!', 'error');
        }
    }
    
    updateUI();
}
function startBattle() {
    // GÜNCELLENEN KONTROLLER - 3 birim + 1 büyü ön hazırlık ZORUNLU
    if (gameState.playerBattleCards.length !== 3) {
        addLog('❌ 3 birim kartını arena alanına sürüklemelisin!', 'error');
        return;
    }
    
    if (gameState.playerSpellCards.length < 1) {
        addLog('❌ En az 1 büyü kartını ön hazırlık olarak sürüklemelisin!', 'error');
        return;
    }
    
    if (gameState.botCards.length === 0) {
        addLog('🏆 Bot kartları bitti! Oyunu kazandın!', 'win');
        setTimeout(() => {
            showGameOver('🏆 OYUNU KAZANDIN!', 'Tüm bot kartlarını yendin!');
        }, 1000);
        return;
    }
    
    gameState.battleInProgress = true;
    arena.classList.add('battle-active');
    
    // Bot kartları seç (sadece mevcut kartlardan)
    prepareBotCards();
    
    updateUI();
    playSound('battle');
    addLog('⚔️ Kartlar hazırlandı! Büyü aşaması başlıyor...', 'battle');
    addLog('🔮 ÖNCEDENKİ STRATEJİN: Hazırladığın büyüyü şimdi kullanacak mısın?', 'info');
    addLog('💡 İpucu: Büyü kullanmak zorunda değilsin, stratejik karar ver!', 'win');
    
    // Büyü aşamasını başlat
    setTimeout(() => {
        startSpellPhase();
    }, 1000);
}

// Bot kartlarını hazırla - YENİ RANDOMİZE SİSTEM
function prepareBotCards() {
    console.log('🤖 BOT KARTLARI HAZIRLANIRKEN YENİ REF VERİLİYOR...');
    
    // Bot birim kartları seç ve SAVAŞ ALANINA YENİ REF İLE YERLEŞTİR
    const botUnitCards = gameState.botCards.filter(card => !card.isSpell);
    for (let i = 0; i < 3 && botUnitCards.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * botUnitCards.length);
        const originalBotCard = botUnitCards[randomIndex];
        
        // Orijinal kartı bot elinden kaldır
        gameState.botCards = gameState.botCards.filter(c => c.id !== originalBotCard.id);
        
        // YENİ REFERANSLA SAVAŞ ALANINA EKLE
        const battleBotCard = placeCardInBattlefield(originalBotCard, true);
        gameState.botBattleCards.push(battleBotCard);
        
        console.log(`🤖 Bot kart ${i+1}:`, {
            name: battleBotCard.name,
            originalId: originalBotCard.id.substr(0, 8),
            battleId: battleBotCard.id.substr(0, 8),
            health: battleBotCard.currentHealth
        });
        
        // Kullanılan kartı listeden çıkar
        botUnitCards.splice(randomIndex, 1);
    }
    
    // Bot büyü kartı seç (varsa) ve YENİ REF VER
    const botSpellCards = gameState.botCards.filter(card => card.isSpell);
    if (botSpellCards.length > 0 && Math.random() < 0.7) {
        const originalSpell = botSpellCards[Math.floor(Math.random() * botSpellCards.length)];
        
        // Orijinal büyü kartını bot elinden kaldır
        gameState.botCards = gameState.botCards.filter(c => c.id !== originalSpell.id);
        
        // YENİ REFERANSLA BÜYÜ ALANINA EKLE
        const battleSpell = placeCardInBattlefield(originalSpell, true);
        gameState.botSpellCards.push(battleSpell);
        
        console.log('🤖 Bot büyü:', {
            name: battleSpell.name,
            originalId: originalSpell.id.substr(0, 8),
            battleId: battleSpell.id.substr(0, 8),
            spellValue: battleSpell.spellValue
        });
    }
    
    console.log('✅ BOT KARTLARI HAZIR - TÜMÜ YENİ REF İLE!');
}

// Büyü aşamasını başlat
function startSpellPhase() {
    gameState.spellPhase = true;
    gameState.spellTimer = 20;
    
    // Büyü aşaması görsel efektini aktifleştir
    document.body.classList.add('spell-phase');
    
    addLog('🔮 BÜYÜ AŞAMASI! Önceden hazırladığınız büyüleri kullanma zamanı!', 'info');
    addLog('⚡ Büyü kullanmak zorunlu değil - sadece seçim yapın!', 'info');
    
    // GÜNCELLENEN STRATEJİ: Büyü KULLANMAK opsiyonel, HAZIRLAMAK zorunlu
    if (gameState.playerSpellCards.length === 0) {
        addLog('⚠️ Hiç büyü hazırlamamışdınız! Bu duruma düşmemeliydiniz.', 'error');
    } else {
        addLog(`✨ ${gameState.playerSpellCards.length} büyü kartınız hazır! İsterseniz kullanın, istemezseniz savaşa geçin.`, 'win');
    }
    
    // Timer başlat
    const spellInterval = setInterval(() => {
        gameState.spellTimer--;
        updateUI();
        
        if (gameState.spellTimer <= 0) {
            clearInterval(spellInterval);
            endSpellPhase();
        }
    }, 1000);
    
    // Bot büyü kullanımı (rastgele 5-15 saniye arası)
    if (gameState.botSpellCards.length > 0) {
        const botSpellDelay = Math.random() * 10000 + 5000; // 5-15 saniye
        setTimeout(() => {
            if (gameState.spellPhase) {
                useBotSpell();
            }
        }, botSpellDelay);
    }
    
    updateUI();
}

// Bot büyü kullanımı - YENİ SİSTEM
function useBotSpell() {
    if (gameState.botSpellCards.length === 0 || gameState.playerBattleCards.length === 0) return;
    
    const spell = gameState.botSpellCards[0];
    
    // Rastgele oyuncu kartı seç
    const targetIndex = Math.floor(Math.random() * gameState.playerBattleCards.length);
    const targetCard = gameState.playerBattleCards[targetIndex];
    
    console.log('BOT BÜYÜ:', spell.name, 'Hedef:', targetCard.name, 'ID:', targetCard.id);
    
    // Hasar uygula
    const oldHealth = targetCard.currentHealth;
    targetCard.currentHealth = targetCard.currentHealth - spell.spellValue;
    
    addLog(`🔥 Bot ${spell.name} kullandı! ${targetCard.name} ${spell.spellValue} hasar aldı!`, 'battle');
    
    // Ölü kontrolü
    if (targetCard.currentHealth <= 0) {
        addLog(`💀 ${targetCard.name} bot büyüsü ile öldü!`, 'lose');
        gameState.playerBattleCards = gameState.playerBattleCards.filter(c => c.id !== targetCard.id);
    }
    
    // Bot büyü kartını temizle
    gameState.botSpellCards = [];
    
    playSound('battle');
    updateUI();
}

// RASTGELE DÜŞMAN HASAR SİSTEMİ - Basit ve çalışır!
function useSpellDirectly(spell) {
    if (gameState.botBattleCards.length === 0) {
        addLog('❌ Düşman kartı yok!', 'error');
        return;
    }
    
    // Rastgele bir düşman kartı seç
    const targetCard = gameState.botBattleCards[Math.floor(Math.random() * gameState.botBattleCards.length)];
    const oldHealth = targetCard.currentHealth;
    
    // Hasar uygula
    targetCard.currentHealth -= spell.spellValue;
    
    addLog(`✨ ${spell.name} kullandın! RASTGELE HEDEF: ${targetCard.name}`, 'win');
    addLog(`💥 ${targetCard.name} ${spell.spellValue} hasar aldı! (${oldHealth} → ${targetCard.currentHealth})`, 'info');
    
    // Kart öldü mü kontrol et
    if (targetCard.currentHealth <= 0) {
        addLog(`💀 ${targetCard.name} öldü!`, 'win');
        gameState.botBattleCards = gameState.botBattleCards.filter(c => c.id !== targetCard.id);
    }
    
    // Büyü kartını kullanıldı olarak işaretle (büyü alanından kaldır)
    gameState.playerSpellCards = gameState.playerSpellCards.filter(c => c.id !== spell.id);
    
    // Ses efekti ve UI güncelle
    playSound('battle');
    updateUI();
    
    addLog('✅ Büyü başarıyla kullanıldı!', 'win');
}

// Büyü uygula ve hedef seçimi bitir
function applySpellToTarget(targetCard) {
    if (!gameState.targetingMode || !gameState.selectedSpell) {
        addLog('❌ Hedef seçim modu aktif değil!', 'error');
        return;
    }
    
    const spell = gameState.selectedSpell;
    
    // Büyü hasar uygula
    if (spell.spellType === 'damage') {
        const oldHealth = targetCard.currentHealth;
        targetCard.currentHealth -= spell.spellValue;
        
        addLog(`✨ ${spell.name} kullandın! ${targetCard.name} ${spell.spellValue} hasar aldı!`, 'win');
        addLog(`💔 ${targetCard.name} canı: ${oldHealth} → ${targetCard.currentHealth}`, 'info');
        
        if (targetCard.currentHealth <= 0) {
            addLog(`💀 ${targetCard.name} büyünle öldü!`, 'win');
            // Ölü kartı bot savaş alanından kaldır
            gameState.botBattleCards = gameState.botBattleCards.filter(c => c.id !== targetCard.id);
        }
    }
    
    // Büyü kartını kullanıldı olarak işaretle (büyü alanından kaldır)
    gameState.playerSpellCards = gameState.playerSpellCards.filter(c => c.id !== spell.id);
    
    // Hedef seçim modunu kapat
    gameState.targetingMode = false;
    gameState.selectedSpell = null;
    document.body.classList.remove('targeting-mode');
    
    // Ses efekti
    playSound('battle');
    
    // UI güncelle
    updateUI();
    
    addLog('✅ Büyü başarıyla uygulandı!', 'win');
}

// Hedef seçimi iptal etme
function cancelTargeting() {
    if (!gameState.targetingMode) return;
    
    gameState.targetingMode = false;
    gameState.selectedSpell = null;
    document.body.classList.remove('targeting-mode');
    
    addLog('❌ Hedef seçimi iptal edildi.', 'info');
    updateUI();
}

// Büyü aşamasını bitir
function endSpellPhase() {
    gameState.spellPhase = false;
    gameState.spellTimer = 0;
    
    // Hedef seçim modunu da temizle
    gameState.targetingMode = false;
    gameState.selectedSpell = null;
    document.body.classList.remove('targeting-mode');
    
    // Büyü aşaması görsel efektini kaldır
    document.body.classList.remove('spell-phase');
    
    // Kullanılmamış büyüleri geri gönder - KULLANMAMAYI SEÇEN OYUNCU İÇİN
    gameState.playerCards.push(...gameState.playerSpellCards);
    gameState.botCards.push(...gameState.botSpellCards);
    gameState.playerSpellCards = [];
    gameState.botSpellCards = [];
    
    if (gameState.playerSpellCards.length > 0) {
        addLog('⚔️ Büyü kullanmamayı seçtiniz! Savaş başlıyor!', 'battle');
    } else {
        addLog('⚔️ Büyü aşaması bitti! Savaş başlıyor!', 'battle');
    }
    
    setTimeout(() => {
        executeBattleWithAnimations();
    }, 1000);
    
    updateUI();
}

// Optimize edilmiş animasyonlu savaş
async function executeBattleWithAnimations() {
    if (isAnimating) return; // Çoklu animasyon engelle
    isAnimating = true;
    
    // Savaş ortasında targeting mode'u temizle
    if (gameState.targetingMode) {
        cancelTargeting();
    }
    
    addLog('🔥 === SAVAŞ BAŞLADI ===', 'battle');
    
    let playerWins = 0;
    let botWins = 0;
    
    try {
        // Her kart çiftini sırayla karşılaştır
        for (let i = 0; i < Math.min(gameState.playerBattleCards.length, gameState.botBattleCards.length); i++) {
            const playerCard = gameState.playerBattleCards[i];
            const botCard = gameState.botBattleCards[i];
            
            addLog(`⚡ ${playerCard.name} vs ${botCard.name}`, 'battle');
            
            // Optimize edilmiş animasyon
            await playOptimizedBattleAnimation(playerCard, botCard, i);
            
            // Savaş hesaplaması (daha dengeli)
            const playerDamage = Math.max(1, playerCard.attack - Math.floor(botCard.defense * 0.25) + Math.floor(Math.random() * 10));
            const botDamage = Math.max(1, botCard.attack - Math.floor(playerCard.defense * 0.25) + Math.floor(Math.random() * 10));
            
            // Hasar uygula
            botCard.currentHealth -= playerDamage;
            playerCard.currentHealth -= botDamage;
            
            addLog(`💥 ${playerCard.name} ${playerDamage} hasar verdi!`, 'info');
            addLog(`💥 ${botCard.name} ${botDamage} hasar verdi!`, 'info');
            
            // Kartların durumunu kontrol et
            if (botCard.currentHealth <= 0) {
                addLog(`💀 ${botCard.name} öldü!`, 'win');
                playerWins++;
                playSound('win');
            }
            
            if (playerCard.currentHealth <= 0) {
                addLog(`💀 ${playerCard.name} öldü!`, 'lose');
                botWins++;
                playSound('lose');
            }
            
            // UI güncelle
            updateUI();
            
            // Sonraki savaş için bekle (optimize edilmiş)
            await new Promise(resolve => setTimeout(resolve, Math.max(500, 1500 / settings.animationSpeed)));
        }
        
        // Ölü kartları kaldır - ID BAZLI FİLTRELEME
        console.log('SAVAŞ ÖNCE PLAYER KARTLAR:', gameState.playerBattleCards.map(c => `${c.name}(${c.id.substr(0,3)}) Can:${c.currentHealth}`));
        console.log('SAVAŞ ÖNCE BOT KARTLAR:', gameState.botBattleCards.map(c => `${c.name}(${c.id.substr(0,3)}) Can:${c.currentHealth}`));
        
        gameState.playerBattleCards = gameState.playerBattleCards.filter(card => card.currentHealth > 0);
        gameState.botBattleCards = gameState.botBattleCards.filter(card => card.currentHealth > 0);
        
        console.log('SAVAŞ SONRA PLAYER KARTLAR:', gameState.playerBattleCards.map(c => `${c.name}(${c.id.substr(0,3)}) Can:${c.currentHealth}`));
        console.log('SAVAŞ SONRA BOT KARTLAR:', gameState.botBattleCards.map(c => `${c.name}(${c.id.substr(0,3)}) Can:${c.currentHealth}`));
        
        // Yaralı kartları ellere geri gönder
        gameState.playerCards.push(...gameState.playerBattleCards);
        gameState.botCards.push(...gameState.botBattleCards);
        
        // Savaş alanını temizle
        gameState.playerBattleCards = [];
        gameState.botBattleCards = [];
        arena.classList.remove('battle-active');
        
        // Sonucu değerlendir
        setTimeout(() => {
            evaluateBattleResult(playerWins, botWins);
        }, 500);
        
    } finally {
        isAnimating = false;
    }
}

// Optimize edilmiş savaş animasyonu
async function playOptimizedBattleAnimation(playerCard, botCard, index) {
    const playerCardElements = document.querySelectorAll('#playerBattleCards .card');
    const botCardElements = document.querySelectorAll('#botBattleCards .card');
    
    if (playerCardElements[index] && botCardElements[index]) {
        const playerElement = playerCardElements[index];
        const botElement = botCardElements[index];
        
        // Optimize edilmiş animasyon - GPU acceleration
        playerElement.style.willChange = 'transform, filter';
        botElement.style.willChange = 'transform, filter';
        
        // Saldırı animasyonu
        playerElement.classList.add('attack-animation');
        botElement.classList.add('attack-animation');
        
        // Optimize edilmiş savaş efektleri
        createOptimizedBattleEffects();
        
        await new Promise(resolve => setTimeout(resolve, Math.max(400, 800 / settings.animationSpeed)));
        
        // Vuruş animasyonu
        playerElement.classList.add('hit-animation');
        botElement.classList.add('hit-animation');
        
        await new Promise(resolve => setTimeout(resolve, Math.max(300, 600 / settings.animationSpeed)));
        
        // Animasyonları temizle ve will-change'i kaldır
        playerElement.classList.remove('attack-animation', 'hit-animation');
        botElement.classList.remove('attack-animation', 'hit-animation');
        playerElement.style.willChange = 'auto';
        botElement.style.willChange = 'auto';
    }
}

// Optimize edilmiş savaş efektleri
function createOptimizedBattleEffects() {
    const effectsContainer = document.getElementById('battleEffects');
    if (!effectsContainer) return;
    
    const effects = ['⚡', '💥', '🔥'];
    const maxEffects = 3; // Performans için sınırla
    
    for (let i = 0; i < maxEffects; i++) {
        const effect = document.createElement('div');
        effect.textContent = effects[Math.floor(Math.random() * effects.length)];
        effect.style.cssText = `
            position: absolute;
            font-size: 2rem;
            left: ${Math.random() * 60 + 20}px;
            top: ${Math.random() * 60 + 20}px;
            animation: optimizedExplode ${Math.max(0.5, 1 / settings.animationSpeed)}s ease-out forwards;
            pointer-events: none;
            will-change: transform, opacity;
        `;
        
        effectsContainer.appendChild(effect);
        
        // Performans için element'i hızlıca kaldır
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, Math.max(500, 1000 / settings.animationSpeed));
    }
}

// Savaş sonucunu değerlendir
function evaluateBattleResult(playerWins, botWins) {
    if (playerWins > botWins) {
        // Oyuncu kazandı
        gameState.gold += 50;
        gameState.score += 100;
        addLog('🏆 KAZANDIN! +50 altın kazandın!', 'win');
        playSound('win');
    } else if (botWins > playerWins) {
        // Bot kazandı
        gameState.gold = Math.max(0, gameState.gold - 20);
        gameState.health -= 20;
        addLog('💔 KAYBETTİN! -20 altın, -20 can kaybettin!', 'lose');
        playSound('lose');
    } else {
        // Berabere
        addLog('🤝 BERABERE! Kimse altın kazanmadı.', 'info');
    }
    
    gameState.battleInProgress = false;
    updateUI();
    checkGameOver();
}

// Kart satın al
function buyCard() {
    if (gameState.gold >= 10) {
        gameState.gold -= 10;
        const newCard = createRandomCard();
        gameState.playerCards.push(newCard);
        playSound('cardPlace');
        addLog(`🛒 Yeni kart satın alındı: ${newCard.name}`, 'info');
        updateUI();
    }
}

// Oyun bitişini kontrol et
function checkGameOver() {
    if (gameState.health <= 0) {
        showGameOver('💀 Oyunu Kaybettin!', 'Canın bitti! Daha dikkatli ol.');
    } else if (gameState.playerCards.length === 0 && gameState.gold < 10) {
        showGameOver('💸 Oyunu Kaybettin!', 'Kartın ve altının kalmadı!');
    }
}

// Oyun bitti popup
function showGameOver(title, message) {
    document.getElementById('gameOverTitle').textContent = title;
    document.getElementById('gameOverMessage').textContent = message;
    gameOverPopup.style.display = 'flex';
    
    if (title.includes('KAZANDIN')) {
        playSound('win');
    } else {
        playSound('lose');
    }
}

// Oyunu yeniden başlat
function restartGame() {
    gameOverPopup.style.display = 'none';
    initGame();
}

// Optimize edilmiş log ekleme
function addLog(message, type = 'info') {
    // Performans için requestAnimationFrame kullan
    requestAnimationFrame(() => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString();
        logEntry.textContent = `${time}: ${message}`;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Eski logları temizle (performans için)
        if (logContent.children.length > 30) {
            logContent.removeChild(logContent.firstChild);
        }
    });
}

// Sayfa yenileme/kapanma öncesi temizlik
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});

// ========== YENİ TEMİZ BÜYÜ SİSTEMİ ==========

// Büyü kartlarını render et - SIFIRDAN TEMİZ
function renderCleanSpellCards() {
    const playerSpellFragment = document.createDocumentFragment();
    const botSpellFragment = document.createDocumentFragment();
    
    playerSpellCardsContainer.innerHTML = '';
    botSpellCardsContainer.innerHTML = '';
    
    gameState.playerSpellCards.forEach(spellCard => {
        const cardElement = createCardElement(spellCard, true);
        cardElement.classList.add('spell-in-area');
        
        // TEMİZ BÜYÜ SİSTEMİ - Tek tıkla kullan ve yok ol
        cardElement.onclick = function() {
            useCleanSpell(spellCard);
        };
        
        // Görsel - Parlak yeşil kenarlık
        cardElement.style.cursor = 'pointer';
        cardElement.style.border = '4px solid #00ff00';
        cardElement.style.boxShadow = '0 0 15px #00ff00';
        cardElement.title = 'Tıkla: Rastgele düşmana 10 hasar!';
        
        playerSpellFragment.appendChild(cardElement);
    });
    
    gameState.botSpellCards.forEach(spellCard => {
        const cardElement = createCardElement(spellCard, false);
        cardElement.classList.add('spell-in-area');
        botSpellFragment.appendChild(cardElement);
    });
    
    playerSpellCardsContainer.appendChild(playerSpellFragment);
    botSpellCardsContainer.appendChild(botSpellFragment);
}

// GÜVENLİ BÜYÜ KULLANIM FONKSİYONU
function useSpellSafely(targetSpell) {
    console.log('🔮 ===== GÜVENLİ BÜYÜ KULLANIMI BAŞLADI =====');
    console.log('Hedef Büyü:', {
        name: targetSpell.name,
        id: targetSpell.id,
        spellValue: targetSpell.spellValue,
        uniqueStamp: targetSpell._uniqueStamp
    });
    
    // BÜYÜ AŞAMASI KONTROLÜ
    if (!gameState.spellPhase) {
        alert('❌ Büyü aşamasında değil!');
        console.log('❌ Büyü aşaması aktif değil');
        return;
    }
    
    // DÜŞMAN KONTROLÜ
    if (!gameState.botBattleCards || gameState.botBattleCards.length === 0) {
        alert('❌ Düşman kartı yok!');
        console.log('❌ Bot battle kartları mevcut değil');
        return;
    }
    
    // BÜYÜ KARTINI OYUNCU ELİNDE DOĞRULA
    const spellExists = gameState.playerSpellCards.find(spell => spell.id === targetSpell.id);
    if (!spellExists) {
        alert('❌ Bu büyü kartı artık mevcut değil!');
        console.log('❌ Büyü kartı bulunamadı:', targetSpell.id);
        return;
    }
    
    console.log('✅ Tüm kontroller geçildi, büyü uygulanıyor...');
    
    // RASTGELE DÜŞMAN SEÇ - TAM GÜVENLİ
    const availableEnemies = gameState.botBattleCards.filter(enemy => enemy.currentHealth > 0);
    if (availableEnemies.length === 0) {
        alert('❌ Canlı düşman kalmadı!');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableEnemies.length);
    const selectedEnemy = availableEnemies[randomIndex];
    
    console.log('🎯 Seçilen düşman:', {
        name: selectedEnemy.name,
        id: selectedEnemy.id,
        currentHealth: selectedEnemy.currentHealth,
        maxHealth: selectedEnemy.maxHealth,
        uniqueStamp: selectedEnemy._uniqueStamp
    });
    
    // HASAR UYGULA - SADECE BU DÜŞMANA
    const damage = targetSpell.spellValue;
    const oldHealth = selectedEnemy.currentHealth;
    
    // DİREKT HASAR UYGULAMA - REF SORUNLARINI ÖNLE
    for (let i = 0; i < gameState.botBattleCards.length; i++) {
        if (gameState.botBattleCards[i].id === selectedEnemy.id) {
            gameState.botBattleCards[i].currentHealth = Math.max(0, gameState.botBattleCards[i].currentHealth - damage);
            console.log(`💥 Hasar uygulandı [${i}]:`, oldHealth, '->', gameState.botBattleCards[i].currentHealth);
            break;
        }
    }
    
    // ÖLÜ DÜŞMAN KONTROLÜ VE KALDIRMA
    if (selectedEnemy.currentHealth <= 0) {
        console.log('💀 Düşman öldü, kaldırılıyor...');
        const beforeCount = gameState.botBattleCards.length;
        gameState.botBattleCards = gameState.botBattleCards.filter(enemy => enemy.id !== selectedEnemy.id);
        const afterCount = gameState.botBattleCards.length;
        console.log(`🗑️ Bot kartları: ${beforeCount} -> ${afterCount}`);
    }
    
    // BÜYÜ KARTINI KALDIRMA - GÜVENLİ
    console.log('🗑️ Büyü kartı kaldırılıyor...');
    const beforeSpellCount = gameState.playerSpellCards.length;
    gameState.playerSpellCards = gameState.playerSpellCards.filter(spell => spell.id !== targetSpell.id);
    const afterSpellCount = gameState.playerSpellCards.length;
    console.log(`📜 Büyü kartları: ${beforeSpellCount} -> ${afterSpellCount}`);
    
    // UI GÜNCELLEMESİ
    updateUI();
    
    // BAŞARI MESAJI
    const healthDisplay = selectedEnemy.currentHealth <= 0 ? 'ÖLDÜ' : `${selectedEnemy.currentHealth}`;
    addLog(`🔮 ${targetSpell.name} kullanıldı!`, 'win');
    addLog(`🎯 Hedef: ${selectedEnemy.name}`, 'info');
    addLog(`💥 ${damage} hasar! (${oldHealth} → ${healthDisplay})`, 'battle');
    
    if (selectedEnemy.currentHealth <= 0) {
        addLog(`💀 ${selectedEnemy.name} büyüyle öldü!`, 'win');
    }
    
    console.log('✅ ===== BÜYÜ KULLANIMI TAMAM =====');
}

// TEMİZ BÜYÜ KULLAN - YENİ VERSİYON
function useCleanSpell(spellCard) {
    useSpellSafely(spellCard);
}
