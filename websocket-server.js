// Epic Card Battle - Dedicated WebSocket Server
// Render.com için optimize edilmiş WebSocket server

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// CORS ayarları - özel domain için
app.use(cors({
  origin: [
    "https://dawnlighten.com.tr",
    "https://www.dawnlighten.com.tr", 
    "https://dawn-epic-card.vercel.app",
    "http://localhost:3000",
    "http://localhost:8080"
  ],
  credentials: true
}));

// Socket.io server - özel domain CORS
const io = new Server(server, {
  cors: {
    origin: [
      "https://dawnlighten.com.tr",
      "https://www.dawnlighten.com.tr",
      "https://dawn-epic-card.vercel.app", 
      "http://localhost:3000",
      "http://localhost:8080"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 3000;

// Game state management
const gameState = {
  players: new Map(),
  games: new Map(),
  quickMatchQueue: []
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Epic Card Battle WebSocket Server',
    timestamp: new Date().toISOString(),
    players: gameState.players.size,
    games: gameState.games.size,
    uptime: process.uptime(),
    domain: 'dawnlighten.com.tr ready'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Epic Card Battle WebSocket',
    status: 'Running',
    websocket_url: `wss://${req.get('host')}`,
    domain: 'dawnlighten.com.tr',
    instructions: 'Connect via Socket.io client'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🎮 Player connected: ${socket.id}`);

  // Register player
  socket.on('register_player', (data) => {
    const player = {
      id: socket.id,
      name: data.name || `Player${Math.floor(Math.random() * 1000)}`,
      status: 'online',
      gameId: null,
      joinedAt: Date.now()
    };
    
    gameState.players.set(socket.id, player);
    
    socket.emit('player_registered', {
      playerId: socket.id,
      playerName: player.name,
      message: 'Successfully connected to Epic Card Battle!'
    });
    
    console.log(`👤 Player registered: ${player.name}`);
  });

  // Create game
  socket.on('create_game', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    const gameId = generateGameId();
    const game = {
      id: gameId,
      host: player.id,
      hostName: player.name,
      players: [player],
      status: 'waiting',
      maxPlayers: 2,
      createdAt: Date.now()
    };

    gameState.games.set(gameId, game);
    player.gameId = gameId;
    socket.join(gameId);

    socket.emit('game_created', {
      gameId,
      hostId: player.id,
      message: 'Game room created successfully!'
    });

    console.log(`🏠 Game created: ${gameId} by ${player.name}`);
  });

  // Join game
  socket.on('join_game', (data) => {
    const player = gameState.players.get(socket.id);
    const game = gameState.games.get(data.gameId);
    
    if (!player || !game) {
      socket.emit('join_error', { message: 'Game not found' });
      return;
    }

    if (game.players.length >= game.maxPlayers) {
      socket.emit('join_error', { message: 'Game is full' });
      return;
    }

    if (game.status !== 'waiting') {
      socket.emit('join_error', { message: 'Game already started' });
      return;
    }

    // Add player to game
    game.players.push(player);
    player.gameId = data.gameId;
    socket.join(data.gameId);

    // Notify all players in game
    io.to(data.gameId).emit('player_joined', {
      gameId: data.gameId,
      player: { id: player.id, name: player.name },
      players: game.players.map(p => ({ id: p.id, name: p.name })),
      message: `${player.name} joined the game!`
    });

    // Auto-start if full
    if (game.players.length >= game.maxPlayers) {
      game.status = 'playing';
      setTimeout(() => {
        io.to(data.gameId).emit('game_started', {
          gameId: data.gameId,
          firstPlayer: game.host,
          players: game.players.map(p => p.id),
          message: 'Game starting!'
        });
      }, 2000);
    }

    console.log(`🚪 Player joined: ${player.name} -> ${data.gameId}`);
  });

  // Quick match
  socket.on('find_quick_match', () => {
    const player = gameState.players.get(socket.id);
    if (!player) return;

    console.log(`⚡ Quick match request: ${player.name}`);

    if (gameState.quickMatchQueue.length > 0) {
      // Match with waiting player
      const waitingPlayerId = gameState.quickMatchQueue.shift();
      const waitingPlayer = gameState.players.get(waitingPlayerId);
      
      if (waitingPlayer && io.sockets.sockets.has(waitingPlayerId)) {
        const gameId = generateGameId();
        const game = createMatchGame(gameId, waitingPlayer, player);
        
        // Notify both players
        io.to(waitingPlayerId).emit('match_found', {
          gameId,
          opponent: { id: player.id, name: player.name },
          isHost: true
        });
        
        socket.emit('match_found', {
          gameId,
          opponent: { id: waitingPlayer.id, name: waitingPlayer.name },
          isHost: false
        });
        
        // Start game
        setTimeout(() => {
          io.to(gameId).emit('game_started', {
            gameId,
            firstPlayer: waitingPlayer.id,
            message: 'Quick match game starting!'
          });
        }, 3000);
        
        console.log(`⚡ Quick match: ${waitingPlayer.name} vs ${player.name}`);
      } else {
        // Waiting player disconnected, add current to queue
        gameState.quickMatchQueue.push(socket.id);
        socket.emit('searching_match', {
          message: 'Searching for opponent...'
        });
      }
    } else {
      // Add to queue
      gameState.quickMatchQueue.push(socket.id);
      socket.emit('searching_match', {
        message: 'Searching for opponent...',
        queuePosition: gameState.quickMatchQueue.length
      });
    }
  });

  // Game actions
  socket.on('card_played', (data) => {
    socket.to(data.gameId).emit('opponent_card_played', {
      playerId: socket.id,
      ...data
    });
  });

  socket.on('spell_cast', (data) => {
    socket.to(data.gameId).emit('opponent_spell_cast', {
      playerId: socket.id,
      ...data
    });
  });

  socket.on('turn_end', (data) => {
    const game = gameState.games.get(data.gameId);
    if (game) {
      const currentIndex = game.players.findIndex(p => p.id === socket.id);
      const nextIndex = (currentIndex + 1) % game.players.length;
      const nextPlayer = game.players[nextIndex];
      
      io.to(data.gameId).emit('turn_changed', {
        gameId: data.gameId,
        currentPlayer: nextPlayer.id,
        playerName: nextPlayer.name
      });
    }
  });

  // Heartbeat/ping
  socket.on('ping', (data) => {
    socket.emit('pong', {
      timestamp: Date.now(),
      original: data.timestamp
    });
  });

  // Disconnect handling
  socket.on('disconnect', (reason) => {
    const player = gameState.players.get(socket.id);
    
    if (player) {
      console.log(`👋 Player disconnected: ${player.name} (${reason})`);
      
      // Remove from quick match queue
      gameState.quickMatchQueue = gameState.quickMatchQueue.filter(id => id !== socket.id);
      
      // Handle game cleanup
      if (player.gameId) {
        const game = gameState.games.get(player.gameId);
        if (game) {
          // Notify other players
          socket.to(player.gameId).emit('player_disconnected', {
            playerId: socket.id,
            playerName: player.name,
            message: `${player.name} disconnected`
          });
          
          // Remove game if empty or host left
          game.players = game.players.filter(p => p.id !== socket.id);
          if (game.players.length === 0 || game.host === socket.id) {
            gameState.games.delete(player.gameId);
          }
        }
      }
      
      // Remove player
      gameState.players.delete(socket.id);
    }
  });
});

// Helper functions
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createMatchGame(gameId, player1, player2) {
  const game = {
    id: gameId,
    host: player1.id,
    hostName: player1.name,
    players: [player1, player2],
    status: 'playing',
    maxPlayers: 2,
    createdAt: Date.now()
  };
  
  gameState.games.set(gameId, game);
  player1.gameId = gameId;
  player2.gameId = gameId;
  
  // Join socket rooms
  io.sockets.sockets.get(player1.id)?.join(gameId);
  io.sockets.sockets.get(player2.id)?.join(gameId);
  
  return game;
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Epic Card Battle WebSocket Server: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Ready for dawnlighten.com.tr connections`);
});

export default server;
