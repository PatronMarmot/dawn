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