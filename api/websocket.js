// Vercel WebSocket API Handler
import { WebSocketServer } from 'ws';

// In-memory game state (Vercel Serverless uyumlu)
const games = new Map();
const players = new Map();

// WebSocket connection handler
export default function handler(req, res) {
  if (req.method === 'GET') {
    // WebSocket upgrade request
    if (req.headers.upgrade === 'websocket') {
      handleWebSocket(req, res);
    } else {
      // Regular HTTP request
      res.status(200).json({
        status: 'WebSocket endpoint',
        message: 'Use WebSocket protocol to connect',
        wsUrl: 'wss://dawn-epic-card.vercel.app/api/websocket'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function handleWebSocket(req, res) {
  // Vercel WebSocket implementation
  const wss = new WebSocketServer({ 
    noServer: true,
    perMessageDeflate: false
  });

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    console.log('🌐 Yeni WebSocket bağlantısı');
    
    // Player tracking
    let playerData = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
        console.error('❌ Mesaj parse hatası:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      if (playerData) {
        handleDisconnect(ws, playerData);
      }
    });

    ws.on('error', (error) => {
      console.error('🚫 WebSocket hatası:', error);
    });

    // Store connection
    playerData = { ws, id: null, gameId: null };
  });
}

function handleMessage(ws, message) {
  console.log('📨 Gelen mesaj:', message.type);

  switch (message.type) {
    case 'player_connected':
      handlePlayerConnected(ws, message);
      break;
    case 'create_game':
      handleCreateGame(ws, message);
      break;
    case 'join_game':
      handleJoinGame(ws, message);
      break;
    case 'start_game':
      handleStartGame(ws, message);
      break;
    default:
      sendError(ws, 'Unknown message type: ' + message.type);
  }
}

function handlePlayerConnected(ws, message) {
  const player = {
    id: message.playerId,
    name: message.playerName,
    ws: ws,
    gameId: null,
    isHost: false
  };

  players.set(ws, player);
  console.log('👤 Oyuncu bağlandı:', player.name);
  
  send(ws, {
    type: 'connected',
    playerId: player.id,
    message: 'Connected to Vercel WebSocket'
  });
}

function handleCreateGame(ws, message) {
  const player = players.get(ws);
  if (!player) {
    sendError(ws, 'Player not found');
    return;
  }

  const gameId = message.gameId;
  
  if (games.has(gameId)) {
    sendError(ws, 'Game already exists');
    return;
  }

  const game = {
    id: gameId,
    host: player.id,
    players: [player],
    status: 'waiting',
    createdAt: Date.now()
  };

  games.set(gameId, game);
  player.gameId = gameId;
  player.isHost = true;

  send(ws, {
    type: 'game_created',
    gameId: gameId,
    hostId: player.id
  });

  console.log('🏠 Oyun oluşturuldu:', gameId);
}

function handleJoinGame(ws, message) {
  const player = players.get(ws);
  if (!player) {
    sendError(ws, 'Player not found');
    return;
  }

  const gameId = message.gameId;
  const game = games.get(gameId);

  if (!game) {
    sendError(ws, 'Game not found');
    return;
  }

  if (game.players.length >= 2) {
    sendError(ws, 'Game is full');
    return;
  }

  game.players.push(player);
  player.gameId = gameId;

  const opponent = game.players.find(p => p.id !== player.id);
  
  send(ws, {
    type: 'player_joined',
    gameId: gameId,
    opponent: {
      id: opponent.id,
      name: opponent.name
    }
  });

  send(opponent.ws, {
    type: 'player_joined',
    gameId: gameId,
    opponent: {
      id: player.id,
      name: player.name
    }
  });

  console.log('🚪 Oyuncu katıldı:', player.name);
}

function handleStartGame(ws, message) {
  const player = players.get(ws);
  const game = games.get(message.gameId);

  if (!game || !player || !player.isHost) {
    sendError(ws, 'Cannot start game');
    return;
  }

  if (game.players.length !== 2) {
    sendError(ws, 'Need 2 players to start');
    return;
  }

  game.status = 'playing';
  game.currentPlayer = game.host;

  game.players.forEach(p => {
    send(p.ws, {
      type: 'game_started',
      gameId: game.id,
      firstPlayer: game.currentPlayer
    });
  });

  console.log('🎮 Oyun başladı:', game.id);
}

function handleDisconnect(ws, playerData) {
  const player = players.get(ws);
  if (!player) return;

  console.log('👋 Oyuncu ayrıldı:', player.name);

  if (player.gameId) {
    const game = games.get(player.gameId);
    if (game) {
      game.players.forEach(p => {
        if (p.ws !== ws) {
          send(p.ws, {
            type: 'player_disconnected',
            gameId: game.id,
            playerId: player.id
          });
        }
      });
      games.delete(game.id);
    }
  }

  players.delete(ws);
}

function send(ws, message) {
  if (ws.readyState === 1) { // WebSocket.OPEN
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Send error:', error);
    }
  }
}

function sendError(ws, message) {
  send(ws, {
    type: 'error',
    message: message
  });
}
