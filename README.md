# 🎮 Meme Fighters: Multi-Game Hub

A chaotic multiplayer gaming platform featuring **Meme Fighters** as the main attraction plus fun mini-games!

## 🚀 Quick Start Guide

### 1. Installation & Setup
```bash
# Install dependencies
npm install

# Start the server
node server/index.js

# Open your browser
http://localhost:3000
```

### 2. Game Modes Available

#### 🥊 **MEME FIGHTERS** (Main Game)
Epic fighting game with meme characters and special abilities

#### ❌⭕ **TIC TAC TOE** (Mini Game)  
Classic 3x3 strategy battle

#### ⚡ **REACTION CLICK** (Mini Game)
Fast-paced reaction time competition

---

## 🎯 How to Play

### 🏠 **MULTIPLAYER MODE**

1. **Create a Room**
   - Click "CREATE ROOM"
   - Choose your game (Meme Fighters recommended!)
   - Select your character (for Meme Fighters)
   - Share the 4-digit room code with friends

2. **Join a Room**
   - Click "JOIN ROOM" 
   - Enter the 4-digit code
   - Wait for game selection
   - Pick your character and fight!

3. **Network Play (LAN)**
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Friends connect to: `http://YOUR_IP:3000`
   - Create/join rooms normally

### 🤖 **SOLO MODE**

1. Click "PLAY SOLO"
2. Choose difficulty:
   - **😴 EASY**: Sleepy bot, perfect for beginners
   - **😐 MEDIUM**: Balanced challenge
   - **😈 HARD**: Aggressive tryhard bot
3. Select your fighter
4. Battle the AI!

---

## 🥊 Meme Fighters Guide

### 🎭 **Characters & Abilities**

| Character | Ability | Description |
|-----------|---------|-------------|
| **📏 Size Beast** | Size Boost | Grows massive for devastating power |
| **🔊 Sound Blaster** | Sonic Boom | Area damage with sound waves |
| **🟢 Toxic Thrower** | Toxic Shot | Ranged poison projectiles |
| **🔴 Laser Eyes** | Laser Beam | Instant precision damage |

### 🎮 **Controls**
- **Movement**: `WASD` or `Arrow Keys`
- **Attack**: `Spacebar` (close range)
- **Ability**: `E` key (special power)
- **Ultimate**: `Q` key (powerful finisher)

### 🎵 **Audio System**
- Random meme sounds during combat
- Character selection audio (CID sound)
- Hit/miss/game over sound effects
- 4-second clips with no overlap

---

## 🎲 Mini-Games Guide

### ❌⭕ **Tic Tac Toe**
- Turn-based 3x3 grid
- First to get 3 in a row wins
- Real-time multiplayer sync

### ⚡ **Reaction Click**
- Wait for the "CLICK NOW!" signal
- First to click wins the round
- First to 3 rounds wins the game
- Don't click early or you lose!

---

## 🔧 Troubleshooting

### **Buttons Not Working?**
1. Check browser console (F12) for errors
2. Refresh the page
3. Clear browser cache
4. Make sure JavaScript is enabled

### **Can't Connect to Multiplayer?**
1. Ensure server is running (`node server/index.js`)
2. Check firewall settings
3. Verify correct IP address for LAN play
4. Try `http://localhost:3000` first

### **Audio Not Playing?**
1. Check browser audio permissions
2. Click anywhere on page first (browser policy)
3. Check volume settings
4. Audio files should be in `/public/audio/` folder

---

## 🎪 Game Flow

```
🏠 LOBBY
    ↓
🎮 GAME SELECTION (Meme Fighters/Tic Tac Toe/Reaction Click)
    ↓
🎯 CHARACTER/DIFFICULTY SELECTION (for Meme Fighters)
    ↓
⚔️ GAMEPLAY
    ↓
🏆 RESULTS (Play Again / Change Game)
```

---

## 🌐 Network Features

- **Local Network Support**: Play across devices on same WiFi
- **Real-time Sync**: Instant updates for all players  
- **Room Management**: Automatic cleanup of empty rooms
- **Reconnection Handling**: Graceful disconnect management

---

## � Features

✅ **Fullscreen Experience**: Responsive design for all screens  
✅ **Neobrutalism UI**: Bold colors, thick borders, strong shadows  
✅ **Smooth Animations**: Screen transitions and visual effects  
✅ **Multi-Game Platform**: Seamless switching between games  
✅ **Solo & Multiplayer**: Play alone or with friends  
✅ **Meme Audio**: Chaotic sound effects system  

---

## 🚀 Ready to Play?

1. **Start the server**: `node server/index.js`
2. **Open browser**: `http://localhost:3000`  
3. **Choose your chaos**: Create room, join friends, or battle AI
4. **Have fun!** 🎉

**Pro Tip**: Meme Fighters is the main attraction - start there for the full experience!

---

## 📁 Project Structure

```
/
├── server/
│   └── index.js          # Multi-game server with Socket.IO
├── client/
│   ├── index.html        # Multi-game hub interface
│   ├── style.css         # Neobrutalism styling
│   └── game.js           # GameHub + all game logic
├── public/
│   ├── 1.jpeg - 4.jpeg   # Character images
│   └── audio/            # Meme sound effects
├── package.json          # Dependencies
└── README.md            # This guide
```

## 🛠 Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 Canvas + Vanilla JavaScript
- **Real-time**: WebSocket communication
- **Network**: Supports localhost and LAN connections
- **Audio**: Web Audio API with meme sound system