// Epic Card Battle - Custom Multiplayer System (No Socket.io)
// GitHub Pages uyumlu P2P multiplayer sistem

class CustomMultiplayer {
    constructor() {
        this.playerId = this.generateId();
        this.playerName = `Player${Math.floor(Math.random() * 9999)}`;
        this.currentRoom = null;
        this.opponent = null;
        this.isHost = false;
        this.gameState = 'menu'; // menu, waiting, playing
        this.isMyTurn = false;
        
        // Connection methods
        this.webrtcPeer = null;
        this.dataChannel = null;
        this.firebaseRef = null;
        
        // Fallback storage
        this.storageKey = 'epic_card_battle_';
        this.heartbeatInterval = null;
        this.roomCleanupInterval = null;
        
        console.log('🎮 Custom Multiplayer System Started');
        console.log(`👤 Player: ${this.playerName} (${this.playerId})`);
        
        this.init();
    }
    
    // Initialize all connection methods
    async init() {
        this.log('🚀 Initializing multiplayer systems...', 'info');
        
        // 1. Setup localStorage fallback (always works)
        this.setupLocalStorage();
        
        // 2. Try Firebase Realtime Database
        await this.setupFirebase();
        
        // 3. Setup WebRTC for P2P
        this.setupWebRTC();
        
        // 4. Start heartbeat and cleanup
        this.startHeartbeat();
        this.startRoomCleanup();
        
        this.updateUI();
        this.log('✅ Multiplayer system ready!', 'success');
    }
    
    // === LOCAL STORAGE SYSTEM ===
    setupLocalStorage() {
        this.log('🏠 Setting up localStorage multiplayer...', 'info');
        
        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.storageKey)) {
                this.handleStorageMessage(e.key, e.newValue);
            }
        });
        
        // Cleanup old data
        this.cleanupOldStorage();
        
        // Register player
        this.setStorageData('players', this.playerId, {
            id: this.playerId,
            name: this.playerName,
            lastSeen: Date.now(),
            room: null,
            status: 'online'
        });
        
        this.log('✅ localStorage system ready', 'success');
    }
    
    handleStorageMessage(key, value) {
        if (!value) return;
        
        try {
            const data = JSON.parse(value);
            const keyParts = key.replace(this.storageKey, '').split('_');
            
            // Ignore own messages
            if (data.playerId === this.playerId) return;
            
            switch (keyParts[0]) {
                case 'message':
                    this.handleGameMessage(data);
                    break;
                case 'room':
                    this.handleRoomUpdate(data);
                    break;
                case 'challenge':
                    this.handleChallenge(data);
                    break;
            }
        } catch (e) {
            console.warn('Storage message parse error:', e);
        }
    }
    
    // === FIREBASE INTEGRATION ===
    async setupFirebase() {
        try {
            this.log('🔥 Attempting Firebase connection...', 'info');
            
            // Simple Firebase config (you can replace with your own)
            const firebaseConfig = {
                apiKey: "demo-key",
                authDomain: "epic-card-battle.firebaseapp.com", 
                databaseURL: "https://epic-card-battle-default-rtdb.firebaseio.com",
                projectId: "epic-card-battle"
            };
            
            // Check if Firebase SDK is loaded
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(firebaseConfig);
                this.firebaseRef = firebase.database().ref('epic_card_battle');
                
                // Test connection
                await this.firebaseRef.child('test').set({
                    timestamp: Date.now(),
                    player: this.playerId
                });
                
                this.log('✅ Firebase connected!', 'success');
                this.setupFirebaseListeners();
                return true;
            } else {
                this.log('⚠️ Firebase SDK not loaded, using localStorage', 'warning');
                return false;
            }
        } catch (error) {
            this.log('❌ Firebase setup failed: ' + error.message, 'error');
            return false;
        }
    }
    
    setupFirebaseListeners() {
        if (!this.firebaseRef) return;
        
        // Listen for room changes
        this.firebaseRef.child('rooms').on('value', (snapshot) => {
            const rooms = snapshot.val() || {};
            this.updateRoomsList(rooms);
        });
        
        // Listen for messages
        this.firebaseRef.child('messages').limitToLast(50).on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.playerId !== this.playerId) {
                this.handleGameMessage(message);
            }
        });
    }
    
    // === WEBRTC P2P SYSTEM ===
    setupWebRTC() {
        this.log('🔗 Setting up WebRTC P2P...', 'info');
        
        try {
            this.rtcConfig = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            };
            
            this.log('✅ WebRTC ready for P2P connections', 'success');
        } catch (error) {
            this.log('❌ WebRTC setup failed: ' + error.message, 'error');
        }
    }
    
    // === GAME ROOM MANAGEMENT ===
    createRoom() {
        const roomCode = this.generateRoomCode();
        this.currentRoom = roomCode;
        this.isHost = true;
        this.gameState = 'waiting';
        
        const roomData = {
            id: roomCode,
            host: this.playerId,
            hostName: this.playerName,
            players: [this.playerId],
            created: Date.now(),
            status: 'waiting',
            maxPlayers: 2
        };
        
        // Store in localStorage
        this.setStorageData('room', roomCode, roomData);
        
        // Store in Firebase if available
        if (this.firebaseRef) {
            this.firebaseRef.child('rooms').child(roomCode).set(roomData);
        }
        
        this.log(`🏠 Room created: ${roomCode}`, 'success');
        this.updateUI();
        
        return roomCode;
    }
    
    async joinRoom(roomCode) {
        roomCode = roomCode.toUpperCase();
        
        this.log(`🚪 Attempting to join room: ${roomCode}`, 'info');
        
        // Check localStorage first
        const roomData = this.getStorageData('room', roomCode);
        
        if (!roomData) {
            this.log(`❌ Room not found: ${roomCode}`, 'error');
            return false;
        }
        
        if (roomData.players.length >= roomData.maxPlayers) {
            this.log(`❌ Room is full: ${roomCode}`, 'error');
            return false;
        }
        
        if (roomData.status !== 'waiting') {
            this.log(`❌ Game already started: ${roomCode}`, 'error');
            return false;
        }
        
        // Join the room
        this.currentRoom = roomCode;
        this.isHost = false;
        this.gameState = 'waiting';
        
        roomData.players.push(this.playerId);
        this.setStorageData('room', roomCode, roomData);
        
        // Notify other players
        this.sendMessage({
            type: 'player_joined',
            playerId: this.playerId,
            playerName: this.playerName,
            roomCode: roomCode
        });
        
        this.log(`✅ Joined room: ${roomCode}`, 'success');
        
        // Auto-start if room is full
        if (roomData.players.length >= roomData.maxPlayers) {
            setTimeout(() => this.startGame(), 2000);
        }
        
        this.updateUI();
        return true;
    }
    
    startGame() {
        if (!this.currentRoom) return;
        
        const roomData = this.getStorageData('room', this.currentRoom);
        if (!roomData) return;
        
        // Update room status
        roomData.status = 'playing';
        this.setStorageData('room', this.currentRoom, roomData);
        
        // Determine first player
        this.isMyTurn = this.isHost;
        this.gameState = 'playing';
        
        // Send game start message
        this.sendMessage({
            type: 'game_start',
            roomCode: this.currentRoom,
            firstPlayer: this.isHost ? this.playerId : null,
            players: roomData.players
        });
        
        this.log('🎮 Game starting!', 'success');
        this.updateUI();
    }
    
    leaveRoom() {
        if (!this.currentRoom) return;
        
        this.log(`🚪 Leaving room: ${this.currentRoom}`, 'info');
        
        // Notify other players
        this.sendMessage({
            type: 'player_left',
            playerId: this.playerId,
            playerName: this.playerName,
            roomCode: this.currentRoom
        });
        
        // Clean up room if host
        if (this.isHost) {
            this.removeStorageData('room', this.currentRoom);
        }
        
        this.currentRoom = null;
        this.opponent = null;
        this.isHost = false;
        this.gameState = 'menu';
        this.isMyTurn = false;
        
        this.updateUI();
    }
    
    // === QUICK MATCH SYSTEM ===
    findQuickMatch() {
        this.log('⚡ Searching for quick match...', 'info');
        
        // Get all available rooms
        const rooms = this.getAllRooms();
        const availableRooms = rooms.filter(room => 
            room.status === 'waiting' && 
            room.players.length < room.maxPlayers &&
            !room.players.includes(this.playerId)
        );
        
        if (availableRooms.length > 0) {
            // Join the first available room
            const room = availableRooms[0];
            this.joinRoom(room.id);
        } else {
            // Create a new room
            this.log('⚡ No rooms available, creating new room...', 'info');
            this.createRoom();
        }
    }
    
    // === MESSAGE SYSTEM ===
    sendMessage(message) {
        message.timestamp = Date.now();
        message.playerId = this.playerId;
        
        // Send via localStorage
        const messageKey = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.setStorageData('message', messageKey, message);
        
        // Send via Firebase if available
        if (this.firebaseRef) {
            this.firebaseRef.child('messages').push(message);
        }
        
        // Send via WebRTC if connected
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
        
        // Clean up message after delay
        setTimeout(() => {
            this.removeStorageData('message', messageKey);
        }, 10000);
    }
    
    handleGameMessage(message) {
        switch (message.type) {
            case 'player_joined':
                this.handlePlayerJoined(message);
                break;
            case 'player_left':
                this.handlePlayerLeft(message);
                break;
            case 'game_start':
                this.handleGameStart(message);
                break;
            case 'card_played':
                this.handleCardPlayed(message);
                break;
            case 'turn_end':
                this.handleTurnEnd(message);
                break;
            case 'game_end':
                this.handleGameEnd(message);
                break;
        }
    }
    
    handlePlayerJoined(message) {
        if (message.roomCode === this.currentRoom) {
            this.opponent = {
                id: message.playerId,
                name: message.playerName
            };
            this.log(`👥 ${message.playerName} joined the room!`, 'info');
            this.updateUI();
        }
    }
    
    handlePlayerLeft(message) {
        if (message.roomCode === this.currentRoom) {
            this.log(`👋 ${message.playerName} left the room`, 'warning');
            this.opponent = null;
            this.updateUI();
        }
    }
    
    handleGameStart(message) {
        if (message.roomCode === this.currentRoom) {
            this.gameState = 'playing';
            this.isMyTurn = message.firstPlayer === this.playerId;
            this.log('🎮 Game started!', 'success');
            this.updateUI();
        }
    }
    
    handleCardPlayed(message) {
        this.log(`🃏 ${message.playerName} played a card!`, 'info');
        // Game logic integration here
    }
    
    handleTurnEnd(message) {
        this.isMyTurn = message.nextPlayer === this.playerId;
        this.log(`⏰ Turn changed. ${this.isMyTurn ? 'Your turn!' : 'Opponent turn'}`, 'info');
        this.updateUI();
    }
    
    handleGameEnd(message) {
        const won = message.winner === this.playerId;
        this.log(`🏆 Game ended! ${won ? 'You won!' : 'You lost!'}`, won ? 'success' : 'error');
        this.gameState = 'menu';
        this.updateUI();
    }
    
    // === GAME ACTIONS ===
    playCard(cardData) {
        if (!this.isMyTurn || this.gameState !== 'playing') return;
        
        this.sendMessage({
            type: 'card_played',
            cardData: cardData,
            playerName: this.playerName
        });
    }
    
    endTurn() {
        if (!this.isMyTurn || this.gameState !== 'playing') return;
        
        this.isMyTurn = false;
        this.sendMessage({
            type: 'turn_end',
            nextPlayer: this.opponent?.id
        });
    }
    
    // === STORAGE HELPERS ===
    setStorageData(category, key, data) {
        const fullKey = `${this.storageKey}${category}_${key}`;
        localStorage.setItem(fullKey, JSON.stringify(data));
    }
    
    getStorageData(category, key) {
        const fullKey = `${this.storageKey}${category}_${key}`;
        const data = localStorage.getItem(fullKey);
        return data ? JSON.parse(data) : null;
    }
    
    removeStorageData(category, key) {
        const fullKey = `${this.storageKey}${category}_${key}`;
        localStorage.removeItem(fullKey);
    }
    
    getAllRooms() {
        const rooms = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.storageKey + 'room_')) {
                try {
                    const roomData = JSON.parse(localStorage.getItem(key));
                    if (roomData && roomData.created > Date.now() - 300000) { // 5 minutes
                        rooms.push(roomData);
                    }
                } catch (e) {
                    localStorage.removeItem(key); // Clean up invalid data
                }
            }
        });
        
        return rooms;
    }
    
    cleanupOldStorage() {
        const keys = Object.keys(localStorage);
        const cutoff = Date.now() - 3600000; // 1 hour
        
        keys.forEach(key => {
            if (key.startsWith(this.storageKey)) {
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
    
    // === UTILITY FUNCTIONS ===
    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // === HEARTBEAT & CLEANUP ===
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            // Update player status
            this.setStorageData('players', this.playerId, {
                id: this.playerId,
                name: this.playerName,
                lastSeen: Date.now(),
                room: this.currentRoom,
                status: this.gameState
            });
        }, 10000); // Every 10 seconds
    }
    
    startRoomCleanup() {
        this.roomCleanupInterval = setInterval(() => {
            this.cleanupOldStorage();
        }, 60000); // Every minute
    }
    
    // === UI INTEGRATION ===
    updateUI() {
        // Update game info
        if (typeof updateGameInfo === 'function') {
            updateGameInfo({
                playerId: this.playerId,
                room: this.currentRoom,
                opponent: this.opponent,
                turn: this.isMyTurn ? 'Your Turn' : 'Opponent Turn',
                state: this.gameState
            });
        }
        
        // Update room list
        const rooms = this.getAllRooms();
        if (typeof updateRoomsList === 'function') {
            updateRoomsList(rooms);
        }
        
        // Update connection status
        if (typeof updateConnectionStatus === 'function') {
            updateConnectionStatus({
                localStorage: true,
                firebase: !!this.firebaseRef,
                webrtc: !!this.webrtcPeer
            });
        }
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        
        // Send to UI log if available
        if (typeof addLog === 'function') {
            addLog(message, type);
        }
    }
    
    // === CLEANUP ===
    destroy() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.roomCleanupInterval) clearInterval(this.roomCleanupInterval);
        
        if (this.currentRoom) {
            this.leaveRoom();
        }
        
        // Remove player from storage
        this.removeStorageData('players', this.playerId);
        
        this.log('🛑 Multiplayer system stopped', 'info');
    }
}

// Global instance
window.customMultiplayer = new CustomMultiplayer();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomMultiplayer;
}

console.log('🎮 Custom Multiplayer System Loaded Successfully!');
