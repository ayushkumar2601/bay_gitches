const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Serve public folder (for character images)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Debug route to check if images exist
app.get('/debug/images', (req, res) => {
  const fs = require('fs');
  const clientPath = path.join(__dirname, '../client');
  const publicPath = path.join(__dirname, '../public');
  
  try {
    const clientFiles = fs.existsSync(clientPath) ? fs.readdirSync(clientPath) : [];
    const publicFiles = fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : [];
    
    const clientImageFiles = clientFiles.filter(file => file.match(/\.(jpeg|jpg|png|gif)$/i));
    const publicImageFiles = publicFiles.filter(file => file.match(/\.(jpeg|jpg|png|gif)$/i));
    
    res.json({
      clientPath: clientPath,
      publicPath: publicPath,
      clientFiles: clientFiles,
      publicFiles: publicFiles,
      clientImageFiles: clientImageFiles,
      publicImageFiles: publicImageFiles,
      characterImages: [
        { 
          file: '1.jpeg', 
          existsInClient: fs.existsSync(path.join(clientPath, '1.jpeg')),
          existsInPublic: fs.existsSync(path.join(publicPath, '1.jpeg'))
        },
        { 
          file: '2.jpeg', 
          existsInClient: fs.existsSync(path.join(clientPath, '2.jpeg')),
          existsInPublic: fs.existsSync(path.join(publicPath, '2.jpeg'))
        },
        { 
          file: '3.jpeg', 
          existsInClient: fs.existsSync(path.join(clientPath, '3.jpeg')),
          existsInPublic: fs.existsSync(path.join(publicPath, '3.jpeg'))
        },
        { 
          file: '4.jpeg', 
          existsInClient: fs.existsSync(path.join(clientPath, '4.jpeg')),
          existsInPublic: fs.existsSync(path.join(publicPath, '4.jpeg'))
        }
      ]
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Game state
const rooms = new Map();
const players = new Map();

// Generate 4-digit room code
function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Check Tic Tac Toe winner
function checkTicTacToeWinner(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === 'X' ? 1 : 2; // Return player number
    }
  }
  
  return null;
}

// Meme texts for losers
const memeTexts = [
  "I lost like an NPC 💀",
  "Skill issue 😭", 
  "Get rekt noob 🤡",
  "Touch grass maybe? 🌱",
  "L + ratio + you fell off 📉",
  "Imagine losing to a meme 🗿"
];

// Game types
const GAME_TYPES = {
  MEME_FIGHTERS: 'memeFighters',
  TIC_TAC_TOE: 'ticTacToe',
  REACTION_CLICK: 'reactionClick'
};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id, 'from', socket.handshake.address);

  socket.on('createRoom', (data) => {
    const roomCode = generateRoomCode();
    
    const room = {
      code: roomCode,
      players: [],
      selectedGame: null,
      gameConfirmed: false,
      currentGameState: null,
      gameStarted: false,
      playerCharacters: {}
    };
    
    rooms.set(roomCode, room);
    room.players.push(socket.id);
    
    // Store character selection if provided
    if (data && data.characterId) {
      room.playerCharacters[socket.id] = data.characterId;
    }
    
    players.set(socket.id, { roomCode, playerNumber: 1 });
    
    socket.join(roomCode);
    console.log(`Room ${roomCode} created by player ${socket.id}`);
    socket.emit('roomCreated', { roomCode, playerNumber: 1 });
  });

  socket.on('joinRoom', (data) => {
    const roomCode = typeof data === 'string' ? data : data.roomCode;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }
    
    room.players.push(socket.id);
    
    // Store character selection if provided
    if (data && data.characterId) {
      room.playerCharacters[socket.id] = data.characterId;
    }
    
    players.set(socket.id, { roomCode, playerNumber: 2 });
    
    socket.join(roomCode);
    console.log(`Player ${socket.id} joined room ${roomCode}`);
    
    socket.emit('roomCreated', { roomCode, playerNumber: 2 });
    
    // If both players have joined, they can now select games
    if (room.players.length === 2) {
      io.to(roomCode).emit('bothPlayersReady');
    }
  });

  // Game selection events
  socket.on('selectGame', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    room.selectedGame = data.game;
    console.log(`Game selected in room ${playerInfo.roomCode}: ${data.game}`);
    
    // Notify other player
    socket.to(playerInfo.roomCode).emit('gameSelected', { game: data.game });
  });

  socket.on('confirmGame', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.selectedGame) return;
    
    room.gameConfirmed = true;
    console.log(`Game confirmed in room ${playerInfo.roomCode}: ${room.selectedGame}`);
    
    // Start the selected game
    io.to(playerInfo.roomCode).emit('startSelectedGame', { game: room.selectedGame });
    
    // Initialize game-specific state
    initializeGameState(room, room.selectedGame);
  });

  function initializeGameState(room, gameType) {
    switch (gameType) {
      case GAME_TYPES.MEME_FIGHTERS:
        // Meme Fighters uses existing character selection system
        break;
        
      case GAME_TYPES.TIC_TAC_TOE:
        room.currentGameState = {
          board: Array(9).fill(''),
          currentPlayer: 1,
          gameActive: true,
          winner: null
        };
        break;
        
      case GAME_TYPES.REACTION_CLICK:
        room.currentGameState = {
          scores: { 1: 0, 2: 0 },
          gameActive: false,
          roundActive: false
        };
        break;
    }
  }

  socket.on('playerMove', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.gameStarted) return;
    
    const playerKey = `player${playerInfo.playerNumber}`;
    const player = room.gameState[playerKey];
    
    if (!player.canMove) return;
    
    // Update position with bounds checking
    player.x = Math.max(20, Math.min(780, data.x));
    player.y = Math.max(20, Math.min(380, data.y));
    
    // Update state if provided
    if (data.state) {
      player.state = data.state;
    }
    
    // Broadcast to room (throttled on client side)
    io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
  });

  socket.on('playerAttack', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.gameStarted) return;
    
    const attackerKey = `player${playerInfo.playerNumber}`;
    const targetKey = playerInfo.playerNumber === 1 ? 'player2' : 'player1';
    
    const attacker = room.gameState[attackerKey];
    const target = room.gameState[targetKey];
    
    // Check range (within 80 pixels)
    const distance = Math.sqrt(
      Math.pow(attacker.x - target.x, 2) + Math.pow(attacker.y - target.y, 2)
    );
    
    if (distance <= 80) {
      target.health = Math.max(0, target.health - 10);
      
      io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
      io.to(playerInfo.roomCode).emit('attack', { attacker: playerInfo.playerNumber, hit: true });
      
      if (target.health <= 0) {
        const memeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];
        io.to(playerInfo.roomCode).emit('gameOver', {
          winner: playerInfo.playerNumber,
          loser: playerInfo.playerNumber === 1 ? 2 : 1,
          memeText
        });
      }
    } else {
      io.to(playerInfo.roomCode).emit('attack', { attacker: playerInfo.playerNumber, hit: false });
    }
  });

  socket.on('useAbility', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.gameStarted) return;
    
    const attackerKey = `player${playerInfo.playerNumber}`;
    const targetKey = playerInfo.playerNumber === 1 ? 'player2' : 'player1';
    
    const attacker = room.gameState[attackerKey];
    const target = room.gameState[targetKey];
    
    const ability = attacker.ability;
    
    // Calculate distance for range-based abilities
    const distance = Math.sqrt(
      Math.pow(attacker.x - target.x, 2) + Math.pow(attacker.y - target.y, 2)
    );
    
    switch (ability) {
      case 'size_boost':
        // Size boost affects the attacker, not the target
        attacker.sizeBoosted = true;
        setTimeout(() => {
          if (room.gameState[attackerKey]) {
            attacker.sizeBoosted = false;
            io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
          }
        }, 3000);
        break;
        
      case 'sound_power':
        // Sonic boom - area damage within 120 pixels
        if (distance <= 120) {
          target.health = Math.max(0, target.health - 25);
          if (target.health <= 0) {
            const memeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];
            io.to(playerInfo.roomCode).emit('gameOver', {
              winner: playerInfo.playerNumber,
              loser: playerInfo.playerNumber === 1 ? 2 : 1,
              memeText
            });
          }
        }
        break;
        
      case 'green_projectile':
        // Projectile damage - handled by client-side projectile system
        // Server just acknowledges the ability use
        break;
        
      case 'laser_beam':
        // Instant laser damage
        target.health = Math.max(0, target.health - 30);
        if (target.health <= 0) {
          const memeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];
          io.to(playerInfo.roomCode).emit('gameOver', {
            winner: playerInfo.playerNumber,
            loser: playerInfo.playerNumber === 1 ? 2 : 1,
            memeText
          });
        }
        break;
        
      default:
        // Fallback for unknown abilities
        target.health = Math.max(0, target.health - 15);
        if (target.health <= 0) {
          const memeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];
          io.to(playerInfo.roomCode).emit('gameOver', {
            winner: playerInfo.playerNumber,
            loser: playerInfo.playerNumber === 1 ? 2 : 1,
            memeText
          });
        }
        break;
    }
    
    io.to(playerInfo.roomCode).emit('abilityUsed', { 
      player: playerInfo.playerNumber, 
      ability,
      attackerPos: { x: attacker.x, y: attacker.y },
      targetPos: { x: target.x, y: target.y }
    });
    io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
  });

  socket.on('projectileHit', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.gameStarted) return;
    
    const targetKey = data.targetPlayer === 1 ? 'player1' : 'player2';
    const target = room.gameState[targetKey];
    
    if (!target) return;
    
    // Apply projectile damage
    target.health = Math.max(0, target.health - data.damage);
    
    // Check for game over
    if (target.health <= 0) {
      const memeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];
      io.to(playerInfo.roomCode).emit('gameOver', {
        winner: playerInfo.playerNumber,
        loser: data.targetPlayer,
        memeText
      });
    }
    
    // Broadcast hit event and state update
    io.to(playerInfo.roomCode).emit('projectileHitConfirmed', {
      targetPlayer: data.targetPlayer,
      damage: data.damage,
      position: data.position
    });
    io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
  });

  socket.on('useUltimate', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.gameStarted) return;
    
    const attackerKey = `player${playerInfo.playerNumber}`;
    const targetKey = playerInfo.playerNumber === 1 ? 'player2' : 'player1';
    
    const attacker = room.gameState[attackerKey];
    const target = room.gameState[targetKey];
    
    if (!attacker.hasUlt) return;
    
    attacker.hasUlt = false;
    target.health = Math.max(0, target.health - 30);
    
    io.to(playerInfo.roomCode).emit('ultimateUsed', { player: playerInfo.playerNumber });
    io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
    
    if (target.health <= 0) {
      const memeText = memeTexts[Math.floor(Math.random() * memeTexts.length)];
      io.to(playerInfo.roomCode).emit('gameOver', {
        winner: playerInfo.playerNumber,
        loser: playerInfo.playerNumber === 1 ? 2 : 1,
        memeText
      });
    }
  });

  // Tic Tac Toe game events
  socket.on('ticTacMove', (data) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.currentGameState || room.selectedGame !== GAME_TYPES.TIC_TAC_TOE) return;
    
    const gameState = room.currentGameState;
    const cellIndex = data.cell;
    
    // Validate move
    if (!gameState.gameActive || 
        gameState.currentPlayer !== playerInfo.playerNumber ||
        gameState.board[cellIndex] !== '') {
      return;
    }
    
    // Make move
    const symbol = playerInfo.playerNumber === 1 ? 'X' : 'O';
    gameState.board[cellIndex] = symbol;
    
    // Check for winner
    const winner = checkTicTacToeWinner(gameState.board);
    if (winner) {
      gameState.winner = winner;
      gameState.gameActive = false;
    } else if (!gameState.board.includes('')) {
      // Draw
      gameState.winner = 'draw';
      gameState.gameActive = false;
    } else {
      // Switch player
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    
    // Broadcast update
    io.to(playerInfo.roomCode).emit('ticTacUpdate', gameState);
    
    // Handle game over
    if (!gameState.gameActive) {
      setTimeout(() => {
        const gameOverData = {
          winner: gameState.winner === 'draw' ? null : gameState.winner,
          message: gameState.winner === 'draw' ? "It's a draw!" : `Player ${gameState.winner} wins!`
        };
        io.to(playerInfo.roomCode).emit('gameOver', gameOverData);
      }, 1500);
    }
  });

  // Reaction Click game events
  socket.on('startReactionRound', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.currentGameState || room.selectedGame !== GAME_TYPES.REACTION_CLICK) return;
    
    const gameState = room.currentGameState;
    if (gameState.roundActive) return;
    
    gameState.roundActive = true;
    gameState.roundStartTime = null;
    gameState.clickedPlayers = [];
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    
    // Notify players to wait
    io.to(playerInfo.roomCode).emit('reactionStart', { delay });
    
    // Start the round after delay
    setTimeout(() => {
      if (gameState.roundActive) {
        gameState.roundStartTime = Date.now();
        io.to(playerInfo.roomCode).emit('reactionGo');
      }
    }, delay);
  });

  socket.on('reactionClick', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room || !room.currentGameState || room.selectedGame !== GAME_TYPES.REACTION_CLICK) return;
    
    const gameState = room.currentGameState;
    
    // Check if round is active and started
    if (!gameState.roundActive || !gameState.roundStartTime) {
      // Too early click
      gameState.roundActive = false;
      io.to(playerInfo.roomCode).emit('reactionResult', {
        winner: null,
        message: 'Too early! Wait for the signal.',
        earlyClicker: playerInfo.playerNumber
      });
      return;
    }
    
    // Check if player already clicked
    if (gameState.clickedPlayers.includes(playerInfo.playerNumber)) return;
    
    const clickTime = Date.now();
    const reactionTime = clickTime - gameState.roundStartTime;
    
    // First valid click wins
    gameState.roundActive = false;
    gameState.scores[playerInfo.playerNumber]++;
    
    io.to(playerInfo.roomCode).emit('reactionResult', {
      winner: playerInfo.playerNumber,
      time: reactionTime,
      scores: gameState.scores
    });
  });

  // Rematch and game change events
  socket.on('playAgain', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    // Reset game state based on current game
    initializeGameState(room, room.selectedGame);
    io.to(playerInfo.roomCode).emit('startSelectedGame', { game: room.selectedGame });
  });

  socket.on('changeGame', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    // Reset game selection
    room.selectedGame = null;
    room.gameConfirmed = false;
    room.currentGameState = null;
    
    io.to(playerInfo.roomCode).emit('gameChanged');
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomCode);
      if (room) {
        console.log(`Player left room ${playerInfo.roomCode}`);
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0) {
          console.log(`Room ${playerInfo.roomCode} deleted (empty)`);
          rooms.delete(playerInfo.roomCode);
        } else {
          io.to(playerInfo.roomCode).emit('playerDisconnected');
        }
      }
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`LAN access: Use your local IP address (e.g., http://192.168.x.x:${PORT})`);
  console.log(`To find your IP:`);
  console.log(`  Windows: ipconfig`);
  console.log(`  Mac/Linux: ifconfig`);
});