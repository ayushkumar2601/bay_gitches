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

// Meme texts for losers
const memeTexts = [
  "I lost like an NPC 💀",
  "Skill issue 😭", 
  "Get rekt noob 🤡",
  "Touch grass maybe? 🌱",
  "L + ratio + you fell off 📉",
  "Imagine losing to a meme 🗿"
];

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id, 'from', socket.handshake.address);

  socket.on('createRoom', (data) => {
    const roomCode = generateRoomCode();
    const characterId = data ? data.characterId : 1; // Default to character 1
    
    const room = {
      code: roomCode,
      players: [],
      gameState: {
        player1: { 
          id: socket.id, 
          x: 100, 
          y: 200, 
          health: 100, 
          canMove: true, 
          hasUlt: true,
          characterId: characterId,
          state: 'idle'
        },
        player2: null
      },
      gameStarted: false
    };
    
    rooms.set(roomCode, room);
    room.players.push(socket.id);
    players.set(socket.id, { roomCode, playerNumber: 1 });
    
    socket.join(roomCode);
    console.log(`Room ${roomCode} created by player ${socket.id} with character ${characterId}`);
    socket.emit('roomCreated', { roomCode, playerNumber: 1 });
  });

  socket.on('joinRoom', (data) => {
    const roomCode = typeof data === 'string' ? data : data.roomCode;
    const characterId = data.characterId || 2; // Default to character 2
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
    room.gameState.player2 = { 
      id: socket.id, 
      x: 600, 
      y: 200, 
      health: 100, 
      canMove: true, 
      hasUlt: true,
      characterId: characterId,
      state: 'idle'
    };
    players.set(socket.id, { roomCode, playerNumber: 2 });
    
    socket.join(roomCode);
    room.gameStarted = true;
    
    console.log(`Player ${socket.id} joined room ${roomCode} with character ${characterId}. Game starting!`);
    
    // Set abilities based on character IDs
    const characters = [
      { id: 1, ability: 'size_boost' },
      { id: 2, ability: 'sound_power' },
      { id: 3, ability: 'green_projectile' },
      { id: 4, ability: 'laser_beam' }
    ];
    
    const p1Char = characters.find(c => c.id === room.gameState.player1.characterId) || characters[0];
    const p2Char = characters.find(c => c.id === room.gameState.player2.characterId) || characters[1];
    
    room.gameState.player1.ability = p1Char.ability;
    room.gameState.player2.ability = p2Char.ability;
    
    io.to(roomCode).emit('startGame', {
      player1: room.gameState.player1,
      player2: room.gameState.player2
    });
  });

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
    
    switch (ability) {
      case 'freeze':
        target.canMove = false;
        setTimeout(() => {
          target.canMove = true;
          io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
        }, 2000);
        break;
        
      case 'reverse':
        target.reversed = true;
        setTimeout(() => {
          target.reversed = false;
          io.to(playerInfo.roomCode).emit('stateUpdate', room.gameState);
        }, 2000);
        break;
        
      case 'burst':
        target.health = Math.max(0, target.health - 20);
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
      ability 
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