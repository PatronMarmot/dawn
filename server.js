// Epic Card Battle - WebSocket Multiplayer Server
// Temiz ve çalışır versiyon

const WebSocket = require('ws');
const http = require('http');

class EpicCardBattleServer {
    constructor() {
        this.games = new Map(); // gameId -> game data
        this.players = new Map(); // ws -> player data
        this.port = process.env.PORT || 10000;
        
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ 
            server: this.server,
            verifyClient: (info) => {
                // CORS için
                return true;
            }
        });
        
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🌐 Yeni bağlantı:', req.socket.remoteAddress);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('❌ Mesaj parse hatası:', error);
                    this.sendError(ws, 'Invalid message format');
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(ws);
            });

            ws.on('error', (error) => {
                console.error('🚫 WebSocket hatası:', error);
            });

            // Heartbeat
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });

        // Heartbeat interval
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    this.handleDisconnect(ws);
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        this.wss.on('close', () => {
            clearInterval(interval);
        });
    }

    handleMessage(ws, message) {
        console.log('📨 Gelen mesaj:', message.type, 'from', message.playerId);

        switch (message.type) {
            case 'player_connected':
                this.handlePlayerConnected(ws, message);
                break;
            case 'create_game':
                this.handleCreateGame(ws, message);
                break;
            case 'join_game':
                this.handleJoinGame(ws, message);
                break;
            case 'start_game':
                this.handleStartGame(ws, message);
                break;
            case 'card_played':
                this.handleCardPlayed(ws, message);
                break;
            case 'spell_cast':
                this.handleSpellCast(ws, message);
                break;
            case 'battle_start':
                this.handleBattleStart(ws, message);
                break;
            case 'end_turn':
                this.handleEndTurn(ws, message);
                break;
            case 'cancel_game':
                this.handleCancelGame(ws, message);
                break;
            default:
                this.sendError(ws, 'Unknown message type: ' + message.type);
        }
    }

    handlePlayerConnected(ws, message) {
        const player = {
            id: message.playerId,
            name: message.playerName,
            ws: ws,
            gameId: null,
            isHost: false
        };

        this.players.set(ws, player);
        console.log('👤 Oyuncu bağlandı:', player.name, player.id);
    }

    handleCreateGame(ws, message) {
        const player = this.players.get(ws);
        if (!player) {
            this.sendError(ws, 'Player not found');
            return;
        }

        const gameId = message.gameId;
        
        // Oyun zaten var mı kontrol et
        if (this.games.has(gameId)) {
            this.sendError(ws, 'Game already exists');
            return;
        }

        // Yeni oyun oluştur
        const game = {
            id: gameId,
            host: player.id,
            players: [player],
            status: 'waiting',
            currentPlayer: null,
            createdAt: Date.now()
        };

        this.games.set(gameId, game);
        player.gameId = gameId;
        player.isHost = true;

        // Oyun oluşturuldu mesajı gönder
        this.send(ws, {
            type: 'game_created',
            gameId: gameId,
            hostId: player.id
        });

        console.log('🏠 Oyun oluşturuldu:', gameId, 'by', player.name);
    }

    handleJoinGame(ws, message) {
        const player = this.players.get(ws);
        if (!player) {
            this.sendError(ws, 'Player not found');
            return;
        }

        const gameId = message.gameId;
        const game = this.games.get(gameId);

        if (!game) {
            this.sendError(ws, 'Game not found');
            return;
        }

        if (game.players.length >= 2) {
            this.sendError(ws, 'Game is full');
            return;
        }

        if (game.status !== 'waiting') {
            this.sendError(ws, 'Game already started');
            return;
        }

        // Oyuncuyu oyuna ekle
        game.players.push(player);
        player.gameId = gameId;

        // Her iki oyuncuya bilgi ver
        const opponent = game.players.find(p => p.id !== player.id);
        
        this.send(ws, {
            type: 'player_joined',
            gameId: gameId,
            opponent: {
                id: opponent.id,
                name: opponent.name
            }
        });

        this.send(opponent.ws, {
            type: 'player_joined',
            gameId: gameId,
            opponent: {
                id: player.id,
                name: player.name
            }
        });

        console.log('🚪 Oyuncu katıldı:', player.name, 'to', gameId);
    }

    handleStartGame(ws, message) {
        const player = this.players.get(ws);
        const game = this.games.get(message.gameId);

        if (!game || !player || player.gameId !== game.id) {
            this.sendError(ws, 'Invalid game or player');
            return;
        }

        if (!player.isHost) {
            this.sendError(ws, 'Only host can start game');
            return;
        }

        if (game.players.length !== 2) {
            this.sendError(ws, 'Need 2 players to start');
            return;
        }

        game.status = 'playing';
        game.currentPlayer = game.host;
        game.turnStartTime = Date.now();

        game.players.forEach(p => {
            this.send(p.ws, {
                type: 'game_started',
                gameId: game.id,
                firstPlayer: game.currentPlayer,
                players: game.players.map(player => ({
                    id: player.id,
                    name: player.name,
                    isHost: player.isHost
                }))
            });
        });

        console.log('🎮 Oyun başladı:', game.id);
    }

    handleCardPlayed(ws, message) {
        const player = this.players.get(ws);
        const game = this.games.get(message.gameId);

        if (!this.validateGameAction(ws, player, game)) return;

        const opponent = game.players.find(p => p.id !== player.id);
        if (opponent) {
            this.send(opponent.ws, {
                type: 'card_played',
                gameId: game.id,
                playerId: player.id,
                cardData: message.cardData,
                position: message.position,
                timestamp: message.timestamp
            });
        }

        console.log('🎯 Kart oynandı:', player.name, message.cardData.name);
    }

    handleSpellCast(ws, message) {
        const player = this.players.get(ws);
        const game = this.games.get(message.gameId);

        if (!this.validateGameAction(ws, player, game)) return;

        const opponent = game.players.find(p => p.id !== player.id);
        if (opponent) {
            this.send(opponent.ws, {
                type: 'spell_cast',
                gameId: game.id,
                playerId: player.id,
                spellData: message.spellData,
                targetId: message.targetId,
                timestamp: message.timestamp
            });
        }

        console.log('🔮 Büyü kullanıldı:', player.name, message.spellData.name);
    }

    handleBattleStart(ws, message) {
        const player = this.players.get(ws);
        const game = this.games.get(message.gameId);

        if (!this.validateGameAction(ws, player, game)) return;

        const opponent = game.players.find(p => p.id !== player.id);
        if (opponent) {
            this.send(opponent.ws, {
                type: 'battle_start',
                gameId: game.id,
                playerId: player.id,
                playerCards: message.playerCards,
                spellCards: message.spellCards,
                timestamp: message.timestamp
            });
        }

        console.log('⚔️ Savaş başlatıldı:', player.name);
    }

    handleEndTurn(ws, message) {
        const player = this.players.get(ws);
        const game = this.games.get(message.gameId);

        if (!this.validateGameAction(ws, player, game)) return;

        if (game.currentPlayer !== player.id) {
            this.sendError(ws, 'Not your turn');
            return;
        }

        const opponent = game.players.find(p => p.id !== player.id);
        game.currentPlayer = opponent.id;
        game.turnStartTime = Date.now();

        game.players.forEach(p => {
            this.send(p.ws, {
                type: 'turn_changed',
                gameId: game.id,
                currentPlayer: game.currentPlayer,
                previousPlayer: player.id
            });
        });

        console.log('🔄 Tur değişti:', player.name, '->', opponent.name);
    }

    handleCancelGame(ws, message) {
        const player = this.players.get(ws);
        const game = this.games.get(message.gameId);

        if (game) {
            game.players.forEach(p => {
                if (p.ws !== ws) {
                    this.send(p.ws, {
                        type: 'game_ended',
                        gameId: game.id,
                        reason: 'Game cancelled by ' + player.name,
                        winner: null
                    });
                }
            });

            this.games.delete(game.id);
            console.log('❌ Oyun iptal edildi:', game.id);
        }
    }

    handleDisconnect(ws) {
        const player = this.players.get(ws);
        if (!player) return;

        console.log('👋 Oyuncu ayrıldı:', player.name);

        if (player.gameId) {
            const game = this.games.get(player.gameId);
            if (game) {
                game.players.forEach(p => {
                    if (p.ws !== ws) {
                        this.send(p.ws, {
                            type: 'player_disconnected',
                            gameId: game.id,
                            playerId: player.id,
                            playerName: player.name
                        });
                    }
                });

                this.games.delete(game.id);
            }
        }

        this.players.delete(ws);
    }

    validateGameAction(ws, player, game) {
        if (!player || !game || player.gameId !== game.id) {
            this.sendError(ws, 'Invalid game or player');
            return false;
        }

        if (game.status !== 'playing') {
            this.sendError(ws, 'Game not in playing status');
            return false;
        }

        return true;
    }

    send(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Send error:', error);
            }
        }
    }

    sendError(ws, message) {
        this.send(ws, {
            type: 'error',
            message: message
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🎮 Epic Card Battle Server çalışıyor: ws://localhost:${this.port}`);
            console.log('🌐 CORS destekleniyor');
            console.log('⚡ WebSocket bağlantıları kabul ediliyor...');
        });
    }

    getStats() {
        return {
            connectedPlayers: this.players.size,
            activeGames: this.games.size,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
}

// Sunucuyu başlat
const server = new EpicCardBattleServer();
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('👋 Sunucu kapatılıyor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('👋 Hosting tarafından sonlandırılıyor...');
    process.exit(0);
});

// İstatistik logları
setInterval(() => {
    const stats = server.getStats();
    if (stats.connectedPlayers > 0 || stats.activeGames > 0) {
        console.log(`📊 [${new Date().toISOString()}] Aktif: ${stats.connectedPlayers} oyuncu, ${stats.activeGames} oyun`);
    }
}, 60000);

module.exports = EpicCardBattleServer;
