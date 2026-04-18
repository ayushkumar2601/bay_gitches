# 🥊 Meme Fighters: Chaos Duel

A minimal real-time multiplayer browser fighting game with meme-based mechanics.

## 🚀 Quick Start

### Local Play (Single Computer)
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   - Go to `http://localhost:3000`
   - Open in 2 different browser windows/tabs to test multiplayer

### LAN Multiplayer (Two Computers on Same WiFi)

1. **Host Setup (Computer 1):**
   ```bash
   npm install
   npm start
   ```

2. **Find Your Local IP Address:**
   ```bash
   # Easy way - use our network test tool
   npm run network-test
   
   # Manual way
   # Windows: ipconfig
   # Mac/Linux: ifconfig
   ```

3. **Connect Players:**
   - **Host (Computer 1):** Open `http://localhost:3000`
   - **Friend (Computer 2):** Open `http://[HOST_IP]:3000`
   - Example: `http://10.155.172.50:3000`

4. **Play Together:**
   - Host creates a room and shares the 4-digit code
   - Friend joins using the room code
   - Fight in real-time across the network!

## 🎮 How to Play

### Game Modes
- **Multiplayer**: Play against another human player online
- **Solo Mode**: Play against an AI opponent (no internet required)

### Character Selection
Before each match, choose your fighter:
- **Size Beast**: Size Boost ability - grows massive and deals double damage
- **Sound Blaster**: Sonic Boom ability - area damage with sound waves  
- **Toxic Thrower**: Green Projectile ability - throws toxic waste projectiles
- **Laser Eyes**: Laser Beam ability - instant laser damage from eyes

### Character Images
Your character images should be placed in the `public` folder:
- `public/1.jpeg` - Size Beast character
- `public/2.jpeg` - Sound Blaster character  
- `public/3.jpeg` - Toxic Thrower character
- `public/4.jpeg` - Laser Eyes character

The images are automatically served at `/public/1.jpeg`, `/public/2.jpeg`, etc.

### Room System (Multiplayer)
- **Create Room**: Select character, then get a 4-digit code
- **Join Room**: Enter room code, select character, then fight!
- Maximum 2 players per room

### Solo Mode
- **Play Solo**: Select character and instantly fight an AI opponent
- AI randomly picks a character with its unique ability
- No room codes needed - jump straight into action!

### Controls
- **Movement**: Arrow Keys or WASD
- **Attack**: SPACE (deals 10 damage, requires close range)
- **Ability**: E (character-specific ability)
- **Ultimate**: Q (one-time use, deals 30 damage)

### Character Abilities
- **📏 Size Boost**: Player grows massive (2x size) and deals double damage for 3 seconds
- **🔊 Sonic Boom**: Area damage with expanding sound waves (25 damage, 120px range)
- **🟢 Toxic Projectile**: Throws green projectile that tracks and deals 15 damage
- **🔴 Laser Beam**: Instant laser from eyes dealing 30 damage with visual beam effect

### Win Condition
- Reduce opponent's HP to 0
- Winner gets victory screen
- Loser gets a random meme punishment text

## 🛠 Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 Canvas + Vanilla JavaScript
- **Real-time**: WebSocket communication at ~20 FPS
- **Network**: Supports localhost and LAN connections

## 🔧 Development

The game runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### Network Configuration
- Server listens on `0.0.0.0` (all network interfaces)
- Client uses dynamic socket connection (`io()`)
- Works with both localhost and IP address access
- Automatic connection debugging in browser console

## 📁 Project Structure

```
/
├── server/
│   └── index.js          # Game server with Socket.IO
├── client/
│   ├── index.html        # Main game interface
│   ├── style.css         # Game styling
│   └── game.js           # Game logic and rendering
├── package.json          # Dependencies
└── README.md            # This file
```

## 🎯 Features

✅ Real-time multiplayer (2 players)  
✅ **NEW: Solo mode vs AI opponent**  
✅ **NEW: Character selection system with unique abilities**  
✅ **NEW: Simple animations and visual effects**  
✅ Room-based matchmaking with codes  
✅ Canvas-based rendering with character sprites  
✅ Attack system with range checking  
✅ Character-specific abilities (freeze, reverse, burst)  
✅ Ultimate attacks  
✅ **Smart AI with character-based behavior**  
✅ Meme-based punishment system  
✅ Sound effects  
✅ Responsive controls  
✅ Game over detection  

## 🎭 Character System

### Available Fighters
1. **Size Beast** - Grows massive and deals enhanced damage
2. **Sound Blaster** - Creates devastating sonic booms
3. **Toxic Thrower** - Launches toxic projectiles  
4. **Laser Eyes** - Fires instant laser beams

### Character Features
- **Custom Images**: Each character uses your provided JPEG images (1.jpeg to 4.jpeg)
- **Unique Abilities**: Every character has a completely different special power
- **Advanced Animations**: 
  - Size scaling effects for Size Beast
  - Expanding sound wave animations for Sound Blaster
  - Projectile tracking and movement for Toxic Thrower
  - Instant laser beam effects for Laser Eyes
- **Enhanced Audio**: Character-specific sound effects (sonic booms, laser sounds)
- **Visual Effects**: Hit flashes, projectile trails, laser beams, and size transformations  

## 🤖 AI Opponent Features

- **Adaptive Movement**: AI moves toward player with realistic delays
- **Combat Intelligence**: Attacks when in range with 50% chance
- **Ability Usage**: Randomly uses abilities every 3-5 seconds  
- **Strategic Ultimate**: Uses ultimate when player health is low
- **Reaction Delays**: ~200ms delays to feel more human-like
- **Unpredictable**: Just smart enough to be challenging, dumb enough to beat!  

## 🌐 Network Requirements

- **Local Play**: No internet required
- **LAN Multiplayer**: Both computers must be on the same WiFi network
- **Firewall**: Ensure port 3000 is not blocked by firewall
- **Browser**: Modern browser with WebSocket support (Chrome, Firefox, Safari, Edge)

## 🔧 Troubleshooting

**Can't connect over LAN?**
- Verify both computers are on the same WiFi network
- Check if Windows Firewall is blocking port 3000
- Try temporarily disabling firewall to test
- Make sure the server shows "Server running on port 3000"

**Connection issues?**
- Check browser console (F12) for error messages
- Ensure the IP address is correct (192.168.x.x format)
- Try refreshing the page if connection drops

## 🎮 Gameplay Tips

**Character Selection:**
- Choose based on playstyle: Sigma for control, NPC for confusion, Skull for damage
- Each character's ability can turn the tide of battle
- Learn the timing of each ability for maximum effect

**Multiplayer:**
- Stay close to your opponent to land attacks
- Use character abilities strategically to control the fight
- Save your ultimate for the right moment
- Movement is key - don't stand still!

**Solo Mode vs AI:**
- The AI will chase you - use this to your advantage
- Bait the AI into corners for easy attacks
- AI has reaction delays - exploit them with quick movements
- Different AI characters behave differently based on their abilities
- Don't underestimate the bot - it can be surprisingly tricky!

**Animation System:**
- Watch for attack animations to time your dodges
- Ability animations give visual feedback for successful casts
- Hit effects help you know when attacks connect
- Character scaling shows when someone is attacking or using abilities

Enjoy the chaos! 🎉