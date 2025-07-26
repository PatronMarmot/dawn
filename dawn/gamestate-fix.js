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