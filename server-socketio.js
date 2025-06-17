// Epic Card Battle - Socket.io Server (CORS Fixed)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// AGGRESSIVE CORS configuration - GitHub Pages support
app.use(cors({
    origin: [
    "http://localhost:8080", 
    "http://127.0.0.1:8080", 
    "http://localhost:3000",
    "https://enesefeoglu.github.io",    // GitHub Pages
    "https://yourdomain.com",          // ÖZEL DOMAINİNİZ BURAYA
    "https://dawn-fi92.onrender.com",   // Self-reference
    "*"  // Allow all for development
    ],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
}));

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:8080", 
            "http://127.0.0.1:8080", 
            "http://localhost:3000",
            "https://enesefeoglu.github.io",    // GitHub Pages
            "https://yourdomain.com",          // ÖZEL DOMAINİNİZ BURAYA
            "https://dawn-fi92.onrender.com",   // Self-reference
            "*"  // Allow all for development
        ],
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["*"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

const PORT = process.env.PORT || 8080;

// Static files serve
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
        status: 'OK',
        service: 'Epic Card Battle Socket.io',
        timestamp: new Date().toISOString(),
        connected_players: connectedPlayers.size,
        active_games: games.size,
        socketio: true,
        port: PORT,
        cors_enabled: true
    });
});

// CORS preflight
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.sendStatus(200);
});

// Game state - LOBI DESTEKLI
const games = new Map();
const connectedPlayers = new Map();
const lobbyList = new Map(); // gameId -> lobby info
const quickMatchQueue = new Set(); // Hızlı eşleşme kuyuğu

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🎮 Player connected:', socket.id);
    
    // Player registration
    socket.on('register_player', (data) => {
        const player = {
            id: socket.id,
            name: data.name || `Player${Math.floor(Math.random() * 1000)}`,
            gameId: null,
            isHost: false,
            socket: socket
        };
        
        connectedPlayers.set(socket.id, player);
        
        socket.emit('player_registered', {
            playerId: socket.id,
            playerName: player.name,
            message: 'Socket.io connection established!',
            timestamp: Date.now()
        });
        
        console.log('👤 Player registered:', player.name);
        
        // Online oyuncu listesini tüm oyunculara gönder
        broadcastPlayersList();
    });

    // Create game room
    socket.on('create_game', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player) {
            socket.emit('error', { message: 'Player not registered' });
            return;
        }

        const gameId = data.gameId || generateGameId();
        
        if (games.has(gameId)) {
            socket.emit('error', { message: 'Game ID already exists' });
            return;
        }

        const game = {
            id: gameId,
            host: socket.id,
            players: [player],
            status: 'waiting',
            createdAt: Date.now(),
            gameState: {
                currentPlayer: socket.id,
                turn: 1
            }
        };

        games.set(gameId, game);
        player.gameId = gameId;
        player.isHost = true;
        
        // Join socket room
        socket.join(gameId);

        socket.emit('game_created', {
            gameId: gameId,
            hostId: socket.id,
            message: 'Game room created successfully!',
            timestamp: Date.now()
        });

        console.log('🏠 Game created:', gameId, 'by', player.name);
        
        // Lobi listesine ekle
        addToLobbyList(game, player);
    });

    // Join game room
    socket.on('join_game', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player) {
            socket.emit('error', { message: 'Player not registered' });
            return;
        }

        const gameId = data.gameId?.toUpperCase();
        const game = games.get(gameId);

        if (!game) {
            socket.emit('error', { message: 'Game not found: ' + gameId });
            return;
        }

        if (game.players.length >= 2) {
            socket.emit('error', { message: 'Game is full' });
            return;
        }

        // Add player to game
        game.players.push(player);
        player.gameId = gameId;
        
        // Join socket room
        socket.join(gameId);

        // Get opponent info
        const opponent = game.players.find(p => p.id !== socket.id);

        // Notify both players
        io.to(gameId).emit('player_joined', {
            gameId: gameId,
            opponent: {
                id: socket.id,
                name: player.name
            },
            players: game.players.map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.id === game.host
            })),
            message: `${player.name} joined the game!`
        });

        console.log('🚪 Player joined game:', gameId, player.name);

        // Auto start game when 2 players
        if (game.players.length === 2) {
            setTimeout(() => {
                game.status = 'playing';
                io.to(gameId).emit('game_started', {
                    gameId: gameId,
                    firstPlayer: game.host,
                    players: game.players.map(p => p.id),
                    message: 'Game starting! Let the battle begin!'
                });
                console.log('🎮 Game auto-started:', gameId);
            }, 1000);
        }
    });

    // Card played
    socket.on('card_played', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Broadcast to opponent
        socket.to(player.gameId).emit('opponent_card_played', {
            playerId: socket.id,
            playerName: player.name,
            card: data.card,
            position: data.position,
            area: data.area || 'battle',
            timestamp: Date.now()
        });

        console.log('🃏 Card played:', data.card?.name || 'Unknown', 'by', player.name);
    });

    // Spell cast
    socket.on('spell_cast', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Broadcast spell to opponent
        socket.to(player.gameId).emit('opponent_spell_cast', {
            playerId: socket.id,
            playerName: player.name,
            spell: data.spell,
            target: data.target,
            damage: data.damage || 10,
            timestamp: Date.now()
        });

        console.log('🔮 Spell cast:', data.spell?.name || 'Unknown', 'by', player.name);
    });

    // Battle start
    socket.on('battle_start', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Broadcast battle start
        socket.to(player.gameId).emit('opponent_battle_start', {
            playerId: socket.id,
            playerName: player.name,
            battleCards: data.battleCards,
            timestamp: Date.now()
        });

        console.log('⚔️ Battle started by:', player.name);
    });

    // Turn change
    socket.on('end_turn', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Switch turn to other player
        const currentPlayerIndex = game.players.findIndex(p => p.id === socket.id);
        const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
        const nextPlayer = game.players[nextPlayerIndex];
        
        if (nextPlayer) {
            game.gameState.currentPlayer = nextPlayer.id;
            game.gameState.turn++;

            // Notify all players
            io.to(player.gameId).emit('turn_changed', {
                currentPlayer: nextPlayer.id,
                turn: game.gameState.turn,
                message: `Turn ${game.gameState.turn} - ${nextPlayer.name}'s turn`
            });

            console.log('🔄 Turn changed to:', nextPlayer.name);
        }
    });

    // Chat message
    socket.on('chat_message', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        io.to(player.gameId).emit('chat_message', {
            playerId: socket.id,
            playerName: player.name,
            message: data.message,
            timestamp: Date.now()
        });

        console.log('💬 Chat:', player.name, ':', data.message);
    });

    // Game over
    socket.on('game_over', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        io.to(player.gameId).emit('game_ended', {
            winner: data.winner,
            reason: data.reason,
            stats: data.stats,
            timestamp: Date.now()
        });

        // Clean up game
        game.players.forEach(p => {
            p.gameId = null;
            p.isHost = false;
        });
        games.delete(player.gameId);

        console.log('🏆 Game ended:', player.gameId);
    });

    // Cancel game
    socket.on('cancel_game', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player || !player.gameId) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Notify all players
        io.to(player.gameId).emit('game_cancelled', {
            message: 'Game cancelled by host',
            timestamp: Date.now()
        });

        // Clean up
        game.players.forEach(p => {
            p.gameId = null;
            p.isHost = false;
            p.socket.leave(game.id);
        });
        games.delete(player.gameId);

        console.log('❌ Game cancelled:', player.gameId);
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
        const player = connectedPlayers.get(socket.id);
        if (player) {
            console.log('👋 Player disconnected:', player.name, '- Reason:', reason);

            // If player was in a game, notify opponent
            if (player.gameId) {
                const game = games.get(player.gameId);
                if (game) {
                    socket.to(player.gameId).emit('player_disconnected', {
                        playerId: socket.id,
                        playerName: player.name,
                        message: `${player.name} disconnected`
                    });

                    // Clean up game if needed
                    game.players = game.players.filter(p => p.id !== socket.id);
                    
                    if (game.players.length === 0 || player.isHost) {
                        games.delete(player.gameId);
                        console.log('🗑️ Game deleted due to disconnect:', player.gameId);
                    }
                }
            }

            connectedPlayers.delete(socket.id);
        }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });

    // Error handling
    socket.on('error', (error) => {
        console.error('🚫 Socket error:', error);
    });
    
    // 🏠 LOBI SISTEM EVENT'LERİ
    
    // Hızlı eşleşme
    socket.on('find_quick_match', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (!player) return;
        
        console.log('⚡ Quick match request from:', player.name);
        
        // Kuyrukta başka oyuncu var mı?
        if (quickMatchQueue.size > 0) {
            // Eşleştir
            const waitingPlayerId = Array.from(quickMatchQueue)[0];
            const waitingPlayer = connectedPlayers.get(waitingPlayerId);
            
            if (waitingPlayer && waitingPlayer.socket) {
                quickMatchQueue.delete(waitingPlayerId);
                
                // Otomatik oyun oluştur
                const gameId = generateGameId();
                const game = {
                    id: gameId,
                    host: waitingPlayerId,
                    players: [waitingPlayer, player],
                    status: 'playing',
                    createdAt: Date.now(),
                    gameState: {
                        currentPlayer: waitingPlayerId,
                        turn: 1
                    }
                };
                
                games.set(gameId, game);
                player.gameId = gameId;
                waitingPlayer.gameId = gameId;
                
                // Her iki oyuncuyu odalara ekle
                socket.join(gameId);
                waitingPlayer.socket.join(gameId);
                
                // Oyun başlangıcı mesajları
                io.to(gameId).emit('quick_match_found', {
                    gameId: gameId,
                    players: [
                        { id: waitingPlayer.id, name: waitingPlayer.name, isHost: true },
                        { id: player.id, name: player.name, isHost: false }
                    ],
                    message: 'Quick match found! Game starting...'
                });
                
                // Otomatik oyun başlat
                setTimeout(() => {
                    io.to(gameId).emit('game_started', {
                        gameId: gameId,
                        firstPlayer: waitingPlayerId,
                        players: [waitingPlayer.id, player.id],
                        message: 'Quick match game started!'
                    });
                }, 1000);
                
                console.log('⚡ Quick match created:', gameId, waitingPlayer.name, 'vs', player.name);
                
            } else {
                // Geçersiz oyuncu, kuyruğa ekle
                quickMatchQueue.delete(waitingPlayerId);
                quickMatchQueue.add(socket.id);
                
                socket.emit('quick_match_searching', {
                    message: 'Searching for opponent...',
                    queuePosition: quickMatchQueue.size
                });
            }
        } else {
            // Kuyruğa ekle
            quickMatchQueue.add(socket.id);
            
            socket.emit('quick_match_searching', {
                message: 'Searching for opponent...',
                queuePosition: quickMatchQueue.size
            });
            
            console.log('⚡ Player added to quick match queue:', player.name);
        }
    });
    
    // Lobi listesi iste
    socket.on('get_lobby_list', (data) => {
        const lobbies = Array.from(lobbyList.values()).filter(lobby => 
            lobby.status === 'waiting' && lobby.players < lobby.maxPlayers
        );
        
        socket.emit('lobby_list', {
            lobbies: lobbies,
            total: lobbies.length
        });
        
        console.log('📋 Lobby list sent to:', connectedPlayers.get(socket.id)?.name, '- Count:', lobbies.length);
    });
    
    // Oyuncu davet et
    socket.on('challenge_player', (data) => {
        const challenger = connectedPlayers.get(socket.id);
        const target = connectedPlayers.get(data.targetId);
        
        if (challenger && target && target.socket) {
            target.socket.emit('player_challenge', {
                challengerId: challenger.id,
                challengerName: challenger.name,
                message: `${challenger.name} sizi düelloya davet ediyor!`
            });
            
            socket.emit('challenge_sent', {
                targetName: target.name,
                message: `${target.name} oyuncusuna davet gönderildi!`
            });
            
            console.log('⚔️ Challenge sent:', challenger.name, '->', target.name);
        }
    });
    
    // Daveti kabul et
    socket.on('accept_challenge', (data) => {
        const accepter = connectedPlayers.get(socket.id);
        const challenger = connectedPlayers.get(data.challengerId);
        
        if (accepter && challenger && challenger.socket) {
            // Otomatik oyun oluştur
            const gameId = generateGameId();
            const game = {
                id: gameId,
                host: challenger.id,
                players: [challenger, accepter],
                status: 'playing',
                createdAt: Date.now(),
                gameState: {
                    currentPlayer: challenger.id,
                    turn: 1
                }
            };
            
            games.set(gameId, game);
            challenger.gameId = gameId;
            accepter.gameId = gameId;
            
            // Odalara ekle
            socket.join(gameId);
            challenger.socket.join(gameId);
            
            // Oyun başlat
            io.to(gameId).emit('challenge_accepted', {
                gameId: gameId,
                players: [
                    { id: challenger.id, name: challenger.name, isHost: true },
                    { id: accepter.id, name: accepter.name, isHost: false }
                ]
            });
            
            setTimeout(() => {
                io.to(gameId).emit('game_started', {
                    gameId: gameId,
                    firstPlayer: challenger.id,
                    players: [challenger.id, accepter.id],
                    message: 'Challenge game started!'
                });
            }, 1000);
            
            console.log('⚔️ Challenge accepted:', challenger.name, 'vs', accepter.name);
        }
    });
    
    // Daveti reddet
    socket.on('decline_challenge', (data) => {
        const decliner = connectedPlayers.get(socket.id);
        const challenger = connectedPlayers.get(data.challengerId);
        
        if (decliner && challenger && challenger.socket) {
            challenger.socket.emit('challenge_declined', {
                declinerName: decliner.name,
                message: `${decliner.name} daveti reddetti.`
            });
            
            console.log('❌ Challenge declined:', challenger.name, '<-', decliner.name);
        }
    });
});

// Helper functions
function generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 🏠 LOBI SISTEM HELPER FONKSIYONLARI

// Online oyuncuları yayınla
function broadcastPlayersList() {
    const players = Array.from(connectedPlayers.values()).map(player => ({
        id: player.id,
        name: player.name,
        status: player.gameId ? 'Oyunda' : 'Menüde',
        gameId: player.gameId || null
    }));
    
    io.emit('players_list', {
        players: players,
        count: players.length
    });
    
    console.log('👥 Players list broadcasted:', players.length, 'online');
}

// Lobi listesine ekle
function addToLobbyList(game, host) {
    const lobbyInfo = {
        gameId: game.id,
        hostId: host.id,
        hostName: host.name,
        players: game.players.length,
        maxPlayers: 2,
        status: game.status,
        gameMode: 'Standard',
        createdAt: game.createdAt,
        waitTime: '0m'
    };
    
    lobbyList.set(game.id, lobbyInfo);
    
    // Tüm oyunculara güncel lobi listesini gönder
    broadcastLobbyList();
    
    console.log('🏠 Lobby added:', game.id, 'by', host.name);
}

// Lobi listesinden kaldır
function removeFromLobbyList(gameId) {
    if (lobbyList.has(gameId)) {
        lobbyList.delete(gameId);
        broadcastLobbyList();
        console.log('🗑️ Lobby removed:', gameId);
    }
}

// Lobi listesini yayınla
function broadcastLobbyList() {
    const lobbies = Array.from(lobbyList.values()).filter(lobby => 
        lobby.status === 'waiting' && lobby.players < lobby.maxPlayers
    );
    
    // Bekleme süresini güncelle
    lobbies.forEach(lobby => {
        const waitMinutes = Math.floor((Date.now() - lobby.createdAt) / 60000);
        lobby.waitTime = waitMinutes + 'm';
    });
    
    io.emit('lobby_list', {
        lobbies: lobbies,
        total: lobbies.length
    });
}

// Lobi durumunu güncelle
function updateLobbyStatus(gameId, newStatus, playerCount = null) {
    if (lobbyList.has(gameId)) {
        const lobby = lobbyList.get(gameId);
        lobby.status = newStatus;
        
        if (playerCount !== null) {
            lobby.players = playerCount;
        }
        
        // Eğer oyun başladıysa lobi listesinden kaldır
        if (newStatus === 'playing' || newStatus === 'finished') {
            removeFromLobbyList(gameId);
        } else {
            broadcastLobbyList();
        }
    }
}

// Periodic cleanup of old games
setInterval(() => {
    const now = Date.now();
    for (const [gameId, game] of games.entries()) {
        // Remove games older than 1 hour with no activity
        if (now - game.createdAt > 60 * 60 * 1000) {
            console.log('🧹 Cleaning up old game:', gameId);
            games.delete(gameId);
        }
    }
}, 10 * 60 * 1000); // Check every 10 minutes

// Server startup
server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Epic Card Battle Socket.io Server');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔧 CORS enabled for all origins`);
    console.log('🎮 Ready for multiplayer battles!');
    console.log('');
    console.log('📋 To test connection:');
    console.log('Browser console: const testSocket = io("http://localhost:8080");');
    console.log('testSocket.on("connect", () => console.log("CONNECTED!"));');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📤 Server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📤 Server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('🚫 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚫 Unhandled Rejection at:', promise, 'reason:', reason);
});

export default server;