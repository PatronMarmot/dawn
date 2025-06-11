// Vercel Serverless WebSocket Handler - Updated
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // WebSocket bilgisi döndür
    res.status(200).json({
      status: 'WebSocket Ready',
      service: 'Epic Card Battle Multiplayer',
      websocket: 'wss://' + req.headers.host + '/api/websocket',
      instructions: {
        client: 'Use WebSocket connection to this endpoint',
        example: 'new WebSocket("wss://' + req.headers.host + '/api/websocket")'
      },
      timestamp: new Date().toISOString(),
      vercel: true,
      ready: true
    });
    return;
  }

  // WebSocket upgrade handling
  if (req.headers.upgrade === 'websocket') {
    try {
      // Vercel Edge Runtime WebSocket
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // WebSocket event handlers
      server.accept();
      
      // Game state (in-memory for this connection)
      let gameState = {
        games: new Map(),
        players: new Map(),
        playerId: null,
        gameId: null
      };

      server.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(server, message, gameState);
        } catch (error) {
          sendMessage(server, {
            type: 'error',
            message: 'Invalid JSON: ' + error.message
          });
        }
      });

      server.addEventListener('close', () => {
        console.log('🔌 WebSocket connection closed');
        if (gameState.playerId) {
          handlePlayerDisconnect(server, gameState);
        }
      });

      server.addEventListener('error', (error) => {
        console.error('🚫 WebSocket error:', error);
      });

      // Return WebSocket response
      return new Response(null, {
        status: 101,
        webSocket: client,
      });

    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      res.status(500).json({
        error: 'WebSocket upgrade failed',
        message: error.message
      });
    }
  } else {
    res.status(426).json({
      error: 'Upgrade Required',
      message: 'This endpoint requires WebSocket connection',
      upgrade: 'websocket'
    });
  }
}

function handleWebSocketMessage(ws, message, gameState) {
  console.log('📨 Message received:', message.type);

  switch (message.type) {
    case 'player_connected':
      handlePlayerConnected(ws, message, gameState);
      break;
    case 'create_game':
      handleCreateGame(ws, message, gameState);
      break;
    case 'join_game':
      handleJoinGame(ws, message, gameState);
      break;
    case 'start_game':
      handleStartGame(ws, message, gameState);
      break;
    case 'ping':
      sendMessage(ws, { type: 'pong', timestamp: Date.now() });
      break;
    default:
      sendMessage(ws, {
        type: 'error',
        message: 'Unknown message type: ' + message.type
      });
  }
}

function handlePlayerConnected(ws, message, gameState) {
  gameState.playerId = message.playerId;
  gameState.playerName = message.playerName || 'Player';
  
  sendMessage(ws, {
    type: 'connected',
    playerId: gameState.playerId,
    message: 'Connected to Vercel WebSocket',
    timestamp: Date.now()
  });
  
  console.log('👤 Player connected:', gameState.playerName);
}

function handleCreateGame(ws, message, gameState) {
  if (!gameState.playerId) {
    sendMessage(ws, { type: 'error', message: 'Player not connected' });
    return;
  }

  const gameId = message.gameId || generateGameId();
  
  const game = {
    id: gameId,
    host: gameState.playerId,
    players: [gameState.playerId],
    status: 'waiting',
    createdAt: Date.now()
  };

  gameState.games.set(gameId, game);
  gameState.gameId = gameId;

  sendMessage(ws, {
    type: 'game_created',
    gameId: gameId,
    hostId: gameState.playerId,
    message: 'Game created successfully'
  });

  console.log('🏠 Game created:', gameId);
}

function handleJoinGame(ws, message, gameState) {
  if (!gameState.playerId) {
    sendMessage(ws, { type: 'error', message: 'Player not connected' });
    return;
  }

  const gameId = message.gameId;
  const game = gameState.games.get(gameId);

  if (!game) {
    sendMessage(ws, { type: 'error', message: 'Game not found: ' + gameId });
    return;
  }

  if (game.players.length >= 2) {
    sendMessage(ws, { type: 'error', message: 'Game is full' });
    return;
  }

  game.players.push(gameState.playerId);
  gameState.gameId = gameId;

  sendMessage(ws, {
    type: 'player_joined',
    gameId: gameId,
    players: game.players.length,
    message: 'Successfully joined game'
  });

  console.log('🚪 Player joined game:', gameId);
}

function handleStartGame(ws, message, gameState) {
  const game = gameState.games.get(message.gameId);
  
  if (!game || game.host !== gameState.playerId) {
    sendMessage(ws, { type: 'error', message: 'Cannot start game' });
    return;
  }

  if (game.players.length < 2) {
    sendMessage(ws, { type: 'error', message: 'Need 2 players to start' });
    return;
  }

  game.status = 'playing';
  
  sendMessage(ws, {
    type: 'game_started',
    gameId: game.id,
    players: game.players,
    firstPlayer: game.host
  });

  console.log('🎮 Game started:', game.id);
}

function handlePlayerDisconnect(ws, gameState) {
  if (gameState.gameId) {
    const game = gameState.games.get(gameState.gameId);
    if (game) {
      gameState.games.delete(gameState.gameId);
      console.log('🏠 Game deleted due to disconnect:', gameState.gameId);
    }
  }
  
  console.log('👋 Player disconnected:', gameState.playerId);
}

function sendMessage(ws, message) {
  try {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(message));
    }
  } catch (error) {
    console.error('Send message error:', error);
  }
}

function generateGameId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}