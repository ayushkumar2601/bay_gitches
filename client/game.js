// CHARACTER SYSTEM START
const CHARACTERS = [
    {
        id: 1,
        name: "Size Beast",
        image: "/public/1.jpeg",
        ability: "size_boost",
        description: "Grows massive for power"
    },
    {
        id: 2,
        name: "Sound Blaster", 
        image: "/public/2.jpeg",
        ability: "sound_power",
        description: "Sonic boom devastation"
    },
    {
        id: 3,
        name: "Toxic Thrower",
        image: "/public/3.jpeg", 
        ability: "green_projectile",
        description: "Throws toxic waste"
    },
    {
        id: 4,
        name: "Laser Eyes",
        image: "/public/4.jpeg",
        ability: "laser_beam",
        description: "Deadly eye lasers"
    }
];

// Preload character images
const characterImages = {};
CHARACTERS.forEach(char => {
    const img = new Image();
    img.onload = () => {
        console.log(`Character image loaded: ${char.name}`);
    };
    img.onerror = () => {
        console.error(`Failed to load character image: ${char.image}`);
    };
    img.src = char.image;
    characterImages[char.id] = img;
});
// CHARACTER SYSTEM END

class MemeFighters {
    constructor() {
        // Dynamic socket connection - works with both localhost and IP addresses
        this.socket = io();
        this.canvas = null;
        this.ctx = null;
        this.gameState = null;
        this.playerNumber = null;
        this.keys = {};
        this.lastMoveTime = 0;
        
        // SOLO MODE START
        this.isSoloMode = false;
        this.botAI = null;
        this.localGameLoop = null;
        // SOLO MODE END
        
        // CHARACTER SYSTEM START
        this.selectedCharacter = null;
        this.gameMode = null; // 'multiplayer', 'solo', 'create', 'join'
        this.projectiles = []; // For projectile abilities
        this.animations = []; // For visual effects
        // CHARACTER SYSTEM END
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupSocketEvents();
        this.setupKeyboardControls();
        
        // Connection debugging
        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            console.log('Server URL:', window.location.origin);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }
    
    // CHARACTER SYSTEM START
    showCharacterSelection() {
        this.showScreen('characterSelect');
    }
    
    selectCharacter(characterId) {
        // Remove previous selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select new character
        const selectedCard = document.querySelector(`[data-character="${characterId}"]`);
        selectedCard.classList.add('selected');
        
        this.selectedCharacter = CHARACTERS.find(c => c.id === characterId);
        document.getElementById('confirmCharacterBtn').classList.remove('hidden');
    }
    
    confirmCharacterSelection() {
        if (!this.selectedCharacter) return;
        
        console.log('Confirming character selection:', this.selectedCharacter.name, 'for mode:', this.gameMode);
        
        switch (this.gameMode) {
            case 'create':
                console.log('Emitting createRoom with character:', this.selectedCharacter.id);
                this.socket.emit('createRoom', { characterId: this.selectedCharacter.id });
                break;
            case 'join':
                console.log('Emitting joinRoom with character:', this.selectedCharacter.id);
                this.socket.emit('joinRoom', { 
                    roomCode: this.roomCodeToJoin, 
                    characterId: this.selectedCharacter.id 
                });
                break;
            case 'solo':
                console.log('Starting solo mode');
                this.startSoloMode();
                break;
        }
    }
    // CHARACTER SYSTEM END
    
    setupEventListeners() {
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.gameMode = 'create';
            this.showCharacterSelection();
        });
        
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            document.getElementById('joinRoomInput').classList.remove('hidden');
            document.querySelector('.menu-buttons').classList.add('hidden');
        });
        
        // SOLO MODE START
        document.getElementById('playSoloBtn').addEventListener('click', () => {
            this.gameMode = 'solo';
            this.showCharacterSelection();
        });
        // SOLO MODE END
        
        document.getElementById('joinBtn').addEventListener('click', () => {
            const roomCode = document.getElementById('roomCodeInput').value;
            if (roomCode.length === 4) {
                this.gameMode = 'join';
                this.roomCodeToJoin = roomCode;
                this.showCharacterSelection();
            }
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.getElementById('joinRoomInput').classList.add('hidden');
            document.querySelector('.menu-buttons').classList.remove('hidden');
            document.getElementById('roomCodeInput').value = '';
        });
        
        // CHARACTER SYSTEM START
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(parseInt(card.dataset.character));
            });
        });
        
        document.getElementById('confirmCharacterBtn').addEventListener('click', () => {
            this.confirmCharacterSelection();
        });
        // CHARACTER SYSTEM END
        
        document.getElementById('copyMemeBtn').addEventListener('click', () => {
            const memeText = document.getElementById('memeText').textContent;
            navigator.clipboard.writeText(memeText).then(() => {
                this.showMessage('Copied to clipboard! 📋', 1000);
            });
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            location.reload();
        });
    }
    
    setupSocketEvents() {
        this.socket.on('roomCreated', (data) => {
            console.log('Room created event received:', data);
            this.playerNumber = data.playerNumber;
            document.getElementById('roomCode').textContent = data.roomCode;
            
            // Show room info screen after character selection
            console.log('Showing room info screen');
            this.showScreen('menu');
            document.getElementById('roomInfo').classList.remove('hidden');
            document.querySelector('.menu-buttons').classList.add('hidden');
            document.getElementById('joinRoomInput').classList.add('hidden');
        });
        
        this.socket.on('startGame', (data) => {
            this.gameState = data;
            this.playerNumber = this.socket.id === data.player1.id ? 1 : 2;
            this.startGame();
        });
        
        this.socket.on('stateUpdate', (gameState) => {
            this.gameState = gameState;
            this.updateUI();
            this.render();
        });
        
        this.socket.on('attack', (data) => {
            if (data.hit) {
                this.showMessage('💥 HIT!', 500);
                this.playSound('hit');
            } else {
                this.showMessage('❌ MISS!', 500);
            }
        });
        
        this.socket.on('abilityUsed', (data) => {
            const abilityNames = {
                freeze: '🧊 FREEZE!',
                reverse: '🔄 REVERSE!',
                burst: '💥 BURST!'
            };
            this.showMessage(abilityNames[data.ability], 1000);
        });
        
        this.socket.on('ultimateUsed', (data) => {
            this.showMessage('⚡ ULTIMATE ATTACK! ⚡', 1500);
            this.playSound('ultimate');
        });
        
        this.socket.on('gameOver', (data) => {
            const isWinner = data.winner === this.playerNumber;
            document.getElementById('resultTitle').textContent = isWinner ? '🎉 YOU WIN! 🎉' : '💀 YOU LOSE! 💀';
            document.getElementById('memeText').textContent = isWinner ? 'Victory Royale! 👑' : data.memeText;
            
            this.showScreen('gameOver');
        });
        
        this.socket.on('playerDisconnected', () => {
            this.showMessage('Opponent disconnected!', 3000);
        });
        
        this.socket.on('error', (message) => {
            alert(message);
        });
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Attack
            if (e.code === 'Space') {
                e.preventDefault();
                // SOLO MODE START
                if (this.isSoloMode) {
                    this.handleSoloAttack();
                } else {
                    this.socket.emit('playerAttack');
                }
                // SOLO MODE END
            }
            
            // Ability
            if (e.code === 'KeyE') {
                // SOLO MODE START
                if (this.isSoloMode) {
                    this.handleSoloAbility();
                } else {
                    this.socket.emit('useAbility');
                }
                // SOLO MODE END
            }
            
            // Ultimate
            if (e.code === 'KeyQ') {
                // SOLO MODE START
                if (this.isSoloMode) {
                    this.handleSoloUltimate();
                } else {
                    this.socket.emit('useUltimate');
                }
                // SOLO MODE END
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    startGame() {
        this.showScreen('game');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // SOLO MODE START - Update UI labels
        if (this.isSoloMode) {
            document.getElementById('p1Label').textContent = 'You';
            document.getElementById('p2Label').textContent = 'AI Opponent 🤖';
        } else {
            document.getElementById('p1Label').textContent = 'Player 1';
            document.getElementById('p2Label').textContent = 'Player 2';
        }
        // SOLO MODE END
        
        // CHARACTER SYSTEM START - Update abilities display
        const p1Character = CHARACTERS.find(c => c.id === this.gameState.player1.characterId);
        const p2Character = CHARACTERS.find(c => c.id === this.gameState.player2.characterId);
        
        document.getElementById('p1Ability').textContent = p1Character ? p1Character.ability : 'unknown';
        document.getElementById('p2Ability').textContent = p2Character ? p2Character.ability : 'unknown';
        // CHARACTER SYSTEM END
        
        this.gameLoop();
    }
    
    gameLoop() {
        this.handleMovement();
        
        // SOLO MODE START - Update projectiles
        if (this.isSoloMode) {
            this.updateProjectiles();
        }
        // SOLO MODE END
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // SOLO MODE START
    startSoloMode() {
        this.isSoloMode = true;
        this.playerNumber = 1;
        
        // Get random character for bot
        const botCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        
        // Create game state with characters
        this.gameState = {
            player1: { 
                id: 'human', 
                x: 100, 
                y: 200, 
                health: 100, 
                canMove: true, 
                hasUlt: true,
                characterId: this.selectedCharacter.id,
                ability: this.selectedCharacter.ability,
                state: 'idle',
                sizeBoosted: false
            },
            player2: { 
                id: 'bot', 
                x: 600, 
                y: 200, 
                health: 100, 
                canMove: true, 
                hasUlt: true,
                characterId: botCharacter.id,
                ability: botCharacter.ability,
                state: 'idle',
                sizeBoosted: false
            }
        };
        
        this.startGame();
        this.initBotAI();
    }
    
    initBotAI() {
        this.botAI = {
            lastAction: 0,
            lastAbility: 0,
            reactionDelay: 200,
            moveInterval: null,
            abilityInterval: null
        };
        
        // Bot movement AI (every 300-500ms)
        this.botAI.moveInterval = setInterval(() => {
            this.updateBotMovement();
        }, 300 + Math.random() * 200);
        
        // Bot ability AI (every 3-5 seconds)
        this.botAI.abilityInterval = setInterval(() => {
            this.updateBotAbility();
        }, 3000 + Math.random() * 2000);
    }
    
    updateBotMovement() {
        if (!this.gameState || !this.gameState.player2.canMove) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        const speed = 4;
        
        // Move toward player with some randomness
        let dx = 0, dy = 0;
        
        if (Math.abs(bot.x - player.x) > 20) {
            if (bot.x < player.x) dx = speed;
            else dx = -speed;
        }
        
        // Add some vertical movement randomness
        if (Math.random() < 0.3) {
            dy = (Math.random() - 0.5) * speed * 2;
        }
        
        // Apply reverse effect
        if (bot.reversed) {
            dx = -dx;
            dy = -dy;
        }
        
        // Update bot position with bounds
        bot.x = Math.max(0, Math.min(750, bot.x + dx));
        bot.y = Math.max(0, Math.min(350, bot.y + dy));
        
        // Attack if close enough (50% chance)
        const distance = Math.sqrt(Math.pow(bot.x - player.x, 2) + Math.pow(bot.y - player.y, 2));
        if (distance < 80 && Math.random() < 0.5) {
            setTimeout(() => this.botAttack(), this.botAI.reactionDelay);
        }
    }
    
    updateBotAbility() {
        if (!this.gameState) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        
        // Use ultimate if player health is low (30% chance)
        if (player.health < 50 && bot.hasUlt && Math.random() < 0.3) {
            setTimeout(() => this.botUltimate(), this.botAI.reactionDelay);
            return;
        }
        
        // Use regular ability (40% chance)
        if (Math.random() < 0.4) {
            setTimeout(() => this.botUseAbility(), this.botAI.reactionDelay);
        }
    }
    
    botAttack() {
        if (!this.gameState) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        
        // Animation
        bot.state = 'attack';
        setTimeout(() => {
            if (this.gameState) bot.state = 'idle';
        }, 200);
        
        // Check range
        const distance = Math.sqrt(Math.pow(bot.x - player.x, 2) + Math.pow(bot.y - player.y, 2));
        
        if (distance <= 80) {
            player.health = Math.max(0, player.health - 10);
            player.hit = true;
            setTimeout(() => {
                if (this.gameState) player.hit = false;
            }, 150);
            
            this.showMessage('💥 BOT HIT!', 500);
            this.playSound('hit');
            
            if (player.health <= 0) {
                this.endSoloGame(false);
            }
        } else {
            this.showMessage('❌ BOT MISS!', 500);
        }
        
        this.updateUI();
    }
    
    botUseAbility() {
        if (!this.gameState) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        const ability = bot.ability;
        
        // Animation
        bot.state = 'ability';
        setTimeout(() => {
            if (this.gameState) bot.state = 'idle';
        }, 500);
        
        switch (ability) {
            case 'freeze':
                player.canMove = false;
                setTimeout(() => {
                    if (this.gameState) player.canMove = true;
                }, 2000);
                break;
                
            case 'reverse':
                player.reversed = true;
                setTimeout(() => {
                    if (this.gameState) player.reversed = false;
                }, 2000);
                break;
                
            case 'burst':
                player.health = Math.max(0, player.health - 20);
                player.hit = true;
                setTimeout(() => {
                    if (this.gameState) player.hit = false;
                }, 300);
                
                // Burst explosion effect
                this.drawBurstEffect(player.x, player.y);
                
                if (player.health <= 0) {
                    this.endSoloGame(false);
                }
                break;
        }
        
        const abilityNames = {
            freeze: '🧊 BOT FREEZE!',
            reverse: '🔄 BOT REVERSE!',
            burst: '💥 BOT BURST!'
        };
        this.showMessage(abilityNames[ability], 1000);
        this.updateUI();
    }
    
    botUltimate() {
        if (!this.gameState || !this.gameState.player2.hasUlt) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        
        bot.hasUlt = false;
        player.health = Math.max(0, player.health - 30);
        
        this.showMessage('⚡ BOT ULTIMATE! ⚡', 1500);
        this.playSound('ultimate');
        this.updateUI();
        
        if (player.health <= 0) {
            this.endSoloGame(false);
        }
    }
    
    handleSoloAttack() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        const bot = this.gameState.player2;
        
        // Animation
        player.state = 'attack';
        setTimeout(() => {
            if (this.gameState) player.state = 'idle';
        }, 200);
        
        // Check range
        const distance = Math.sqrt(Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2));
        
        if (distance <= 80) {
            // Calculate damage (enhanced if size boosted)
            let damage = 10;
            if (player.sizeBoosted) {
                damage = 20; // Double damage when size boosted
            }
            
            bot.health = Math.max(0, bot.health - damage);
            bot.hit = true;
            setTimeout(() => {
                if (this.gameState) bot.hit = false;
            }, 150);
            
            this.showMessage(player.sizeBoosted ? '💥 MEGA HIT!' : '💥 HIT!', 500);
            this.playSound('hit');
            
            if (bot.health <= 0) {
                this.endSoloGame(true);
            }
        } else {
            this.showMessage('❌ MISS!', 500);
        }
        
        this.updateUI();
    }
    
    handleSoloAbility() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        const bot = this.gameState.player2;
        const ability = player.ability;
        
        // Animation
        player.state = 'ability';
        setTimeout(() => {
            if (this.gameState) player.state = 'idle';
        }, ability === 'size_boost' ? 3000 : 1000); // Size boost lasts longer
        
        switch (ability) {
            case 'size_boost':
                // Player grows massive and deals more damage
                this.showMessage('📏 SIZE BOOST!', 1500);
                // Enhanced damage for next few attacks
                player.sizeBoosted = true;
                setTimeout(() => {
                    if (this.gameState) player.sizeBoosted = false;
                }, 3000);
                break;
                
            case 'sound_power':
                // Sonic boom - area damage with sound effect
                this.showMessage('🔊 SONIC BOOM!', 1000);
                this.createSoundWave(player.x, player.y);
                
                // Check if bot is in range for sonic damage
                const distance = Math.sqrt(Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2));
                if (distance <= 120) { // Larger range than normal attack
                    bot.health = Math.max(0, bot.health - 25);
                    bot.hit = true;
                    setTimeout(() => {
                        if (this.gameState) bot.hit = false;
                    }, 300);
                }
                break;
                
            case 'green_projectile':
                // Throw toxic projectile
                this.showMessage('🟢 TOXIC SHOT!', 1000);
                this.createProjectile(player.x, player.y, bot.x, bot.y, 'green', 15);
                break;
                
            case 'laser_beam':
                // Laser beam from eyes
                this.showMessage('🔴 LASER EYES!', 1000);
                this.createLaserBeam(player.x, player.y, bot.x, bot.y);
                
                // Instant hit with laser
                bot.health = Math.max(0, bot.health - 30);
                bot.hit = true;
                setTimeout(() => {
                    if (this.gameState) bot.hit = false;
                }, 300);
                break;
        }
        
        if (bot.health <= 0) {
            this.endSoloGame(true);
        }
        
        this.updateUI();
    }
    
    handleSoloUltimate() {
        if (!this.gameState || !this.gameState.player1.hasUlt) return;
        
        const player = this.gameState.player1;
        const bot = this.gameState.player2;
        
        player.hasUlt = false;
        bot.health = Math.max(0, bot.health - 30);
        
        this.showMessage('⚡ ULTIMATE ATTACK! ⚡', 1500);
        this.playSound('ultimate');
        this.updateUI();
        
        if (bot.health <= 0) {
            this.endSoloGame(true);
        }
    }
    
    endSoloGame(playerWon) {
        // Clear bot AI intervals
        if (this.botAI) {
            clearInterval(this.botAI.moveInterval);
            clearInterval(this.botAI.abilityInterval);
        }
        
        const memeTexts = {
            win: [
                "You beat artificial stupidity 🔥",
                "Bot got rekt 🤖💀",
                "AI needs more training 📚",
                "Humans > Robots confirmed ✅"
            ],
            lose: [
                "You got cooked by a bot 💀",
                "Skill issue vs AI 😭",
                "Defeated by 1s and 0s 🤡",
                "Bot said 'ez clap' 🤖"
            ]
        };
        
        const resultTexts = playerWon ? memeTexts.win : memeTexts.lose;
        const memeText = resultTexts[Math.floor(Math.random() * resultTexts.length)];
        
        document.getElementById('resultTitle').textContent = playerWon ? '🎉 YOU WIN! 🎉' : '💀 YOU LOSE! 💀';
        document.getElementById('memeText').textContent = memeText;
        
        this.showScreen('gameOver');
    }
    // SOLO MODE END
    
    handleMovement() {
        if (!this.gameState) return;
        
        // SOLO MODE START
        if (this.isSoloMode) {
            this.handleSoloMovement();
            return;
        }
        // SOLO MODE END
        
        const now = Date.now();
        if (now - this.lastMoveTime < 50) return; // 20 FPS limit
        
        const player = this.gameState[`player${this.playerNumber}`];
        if (!player || !player.canMove) return;
        
        let dx = 0, dy = 0;
        const speed = 5;
        
        // Movement controls (works for both players locally, server validates)
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx = -speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx = speed;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy = -speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy = speed;
        
        // Apply reverse effect
        if (player.reversed) {
            dx = -dx;
            dy = -dy;
        }
        
        if (dx !== 0 || dy !== 0) {
            const newX = player.x + dx;
            const newY = player.y + dy;
            
            this.socket.emit('playerMove', { x: newX, y: newY });
            this.lastMoveTime = now;
        }
    }
    
    // SOLO MODE START
    handleSoloMovement() {
        const now = Date.now();
        if (now - this.lastMoveTime < 50) return; // 20 FPS limit
        
        const player = this.gameState.player1;
        if (!player || !player.canMove) return;
        
        let dx = 0, dy = 0;
        const speed = 5;
        
        // Movement controls
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx = -speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx = speed;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy = -speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy = speed;
        
        // Apply reverse effect
        if (player.reversed) {
            dx = -dx;
            dy = -dy;
        }
        
        if (dx !== 0 || dy !== 0) {
            player.x = Math.max(0, Math.min(750, player.x + dx));
            player.y = Math.max(0, Math.min(350, player.y + dy));
            this.lastMoveTime = now;
        }
    }
    // SOLO MODE END
    
    render() {
        if (!this.ctx || !this.gameState) return;
        
        // Clear canvas with neobrutalism background
        this.ctx.fillStyle = '#E8F5FF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some neobrutalism background elements
        this.ctx.fillStyle = '#FFE066';
        this.ctx.fillRect(50, 50, 60, 60);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(50, 50, 60, 60);
        
        this.ctx.fillStyle = '#FF6B9D';
        this.ctx.fillRect(650, 300, 80, 40);
        this.ctx.strokeRect(650, 300, 80, 40);
        
        this.ctx.fillStyle = '#00D2FF';
        this.ctx.beginPath();
        this.ctx.arc(700, 80, 30, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw players
        this.drawPlayer(this.gameState.player1, '#ff6b6b', '1');
        if (this.gameState.player2) {
            this.drawPlayer(this.gameState.player2, '#4ecdc4', '2');
        }
        
        // Draw projectiles
        this.drawProjectiles();
    }
    
    drawPlayer(player, color, number) {
        if (!player) return;
        
        let size = 40;
        const character = CHARACTERS.find(c => c.id === player.characterId) || CHARACTERS[0];
        
        // Animation effects
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        
        if (player.state === 'attack') {
            scale = 1.2;
        } else if (player.state === 'ability') {
            if (character.ability === 'size_boost') {
                scale = 2.0; // Massive size increase
            } else {
                scale = 1.1;
                offsetY = -5;
            }
        }
        
        const drawSize = size * scale;
        const drawX = player.x - drawSize/2 + offsetX;
        const drawY = player.y - drawSize/2 + offsetY;
        
        // Neobrutalism character container
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(drawX - 5, drawY - 5, drawSize + 10, drawSize + 10);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(drawX - 5, drawY - 5, drawSize + 10, drawSize + 10);
        
        // Draw character image if available
        const characterImg = characterImages[player.characterId];
        if (characterImg && characterImg.complete && characterImg.naturalWidth > 0) {
            this.ctx.save();
            
            // Create rectangular clipping path for neobrutalism
            this.ctx.beginPath();
            this.ctx.rect(drawX, drawY, drawSize, drawSize);
            this.ctx.clip();
            
            // Draw character image
            this.ctx.drawImage(characterImg, drawX, drawY, drawSize, drawSize);
            this.ctx.restore();
            
            // Character border (neobrutalism style)
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(drawX, drawY, drawSize, drawSize);
        } else {
            // Fallback to colored rectangle if image not loaded
            console.log(`Image not loaded for character ${player.characterId}:`, characterImg ? 'loading...' : 'not found');
            
            // Use character-specific colors as fallback
            const fallbackColors = ['#FFE066', '#FF6B9D', '#00D2FF', '#98FB98'];
            this.ctx.fillStyle = fallbackColors[player.characterId - 1] || '#999';
            this.ctx.fillRect(drawX, drawY, drawSize, drawSize);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(drawX, drawY, drawSize, drawSize);
            
            // Draw character number as fallback
            this.ctx.fillStyle = '#000';
            this.ctx.font = `bold ${drawSize/2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.characterId, player.x, player.y + drawSize/6);
        }
        
        // Health bar (neobrutalism style)
        const barWidth = 70;
        const barHeight = 12;
        const barX = player.x - barWidth/2;
        const barY = player.y - size/2 - 25;
        
        // Health bar background
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar fill
        const healthPercent = player.health / 100;
        if (healthPercent > 0.5) {
            this.ctx.fillStyle = '#98FB98';
        } else if (healthPercent > 0.25) {
            this.ctx.fillStyle = '#FFE066';
        } else {
            this.ctx.fillStyle = '#FF6B9D';
        }
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Status effects and animations
        if (!player.canMove) {
            this.ctx.fillStyle = 'rgba(0, 150, 255, 0.7)';
            this.ctx.fillRect(drawX, drawY, drawSize, drawSize);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🧊', player.x, player.y - size/2 - 35);
        }
        
        if (player.reversed) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.fillRect(drawX, drawY, drawSize, drawSize);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🔄', player.x, player.y - size/2 - 35);
        }
        
        if (player.hit) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(drawX, drawY, drawSize, drawSize);
        }
        
        // Ultimate indicator (neobrutalism style)
        if (player.hasUlt) {
            this.ctx.fillStyle = '#FFE066';
            this.ctx.fillRect(player.x + size/2 + 10, player.y - 10, 20, 20);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(player.x + size/2 + 10, player.y - 10, 20, 20);
            
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚡', player.x + size/2 + 20, player.y + 5);
        }
        
        // Character name (neobrutalism style)
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(player.x - 40, player.y + size/2 + 25, 80, 20);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(player.x - 40, player.y + size/2 + 25, 80, 20);
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.name.toUpperCase(), player.x, player.y + size/2 + 38);
    }
    
    updateUI() {
        if (!this.gameState) return;
        
        document.getElementById('p1Health').textContent = this.gameState.player1.health;
        if (this.gameState.player2) {
            document.getElementById('p2Health').textContent = this.gameState.player2.health;
        }
    }
    
    // CHARACTER SYSTEM START - Animation Effects
    drawBurstEffect(x, y) {
        if (!this.ctx) return;
        
        // Draw explosion circle
        this.ctx.strokeStyle = '#FF6B6B';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 60, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Clear effect after animation
        setTimeout(() => {
            if (this.ctx) this.render();
        }, 200);
    }
    
    createSoundWave(x, y) {
        // Create expanding sound wave animation (neobrutalism style)
        let radius = 0;
        const maxRadius = 120;
        const animate = () => {
            if (radius < maxRadius && this.ctx) {
                // Multiple concentric rectangles for neobrutalism effect
                this.ctx.strokeStyle = '#00D2FF';
                this.ctx.lineWidth = 6;
                this.ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
                
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - radius - 3, y - radius - 3, (radius + 3) * 2, (radius + 3) * 2);
                
                radius += 12;
                setTimeout(animate, 60);
            }
        };
        animate();
        
        // Play enhanced sound
        this.playSound('sonic');
    }
    
    createProjectile(startX, startY, targetX, targetY, color, damage) {
        const projectile = {
            x: startX,
            y: startY,
            targetX: targetX,
            targetY: targetY,
            color: color,
            damage: damage,
            speed: 8,
            size: 8
        };
        
        // Calculate direction
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        projectile.vx = (dx / distance) * projectile.speed;
        projectile.vy = (dy / distance) * projectile.speed;
        
        this.projectiles.push(projectile);
    }
    
    createLaserBeam(startX, startY, targetX, targetY) {
        // Draw instant laser beam (neobrutalism style)
        if (!this.ctx) return;
        
        // Main laser beam
        this.ctx.strokeStyle = '#FF6B9D';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(targetX, targetY);
        this.ctx.stroke();
        
        // Laser border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(targetX, targetY);
        this.ctx.stroke();
        
        // Inner laser core
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(targetX, targetY);
        this.ctx.stroke();
        
        // Clear laser after short time
        setTimeout(() => {
            if (this.ctx) this.render();
        }, 300);
        
        this.playSound('laser');
    }
    
    updateProjectiles() {
        if (!this.gameState) return;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Move projectile
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            // Check collision with target (bot in solo mode)
            const bot = this.gameState.player2;
            if (bot) {
                const distance = Math.sqrt(Math.pow(proj.x - bot.x, 2) + Math.pow(proj.y - bot.y, 2));
                if (distance < 25) {
                    // Hit!
                    bot.health = Math.max(0, bot.health - proj.damage);
                    bot.hit = true;
                    setTimeout(() => {
                        if (this.gameState) bot.hit = false;
                    }, 300);
                    
                    // Remove projectile
                    this.projectiles.splice(i, 1);
                    
                    if (bot.health <= 0) {
                        this.endSoloGame(true);
                    }
                    continue;
                }
            }
            
            // Remove projectile if it goes off screen
            if (proj.x < 0 || proj.x > 800 || proj.y < 0 || proj.y > 400) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    drawProjectiles() {
        if (!this.ctx) return;
        
        this.projectiles.forEach(proj => {
            // Neobrutalism projectile style
            const size = proj.size;
            
            // Main projectile body
            this.ctx.fillStyle = proj.color === 'green' ? '#98FB98' : proj.color;
            this.ctx.fillRect(proj.x - size, proj.y - size, size * 2, size * 2);
            
            // Projectile border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(proj.x - size, proj.y - size, size * 2, size * 2);
            
            // Add inner highlight for neobrutalism effect
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(proj.x - size + 2, proj.y - size + 2, 4, 4);
        });
    }
    // CHARACTER SYSTEM END
    
    showMessage(text, duration) {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.textContent = text;
        messagesDiv.style.display = 'block';
        
        setTimeout(() => {
            messagesDiv.style.display = 'none';
        }, duration);
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    playSound(type) {
        // Simple sound simulation with Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'hit') {
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
            } else if (type === 'ultimate') {
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            } else if (type === 'sonic') {
                // Sonic boom sound - low to high frequency sweep
                oscillator.frequency.setValueAtTime(50, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);
            } else if (type === 'laser') {
                // Laser sound - high frequency buzz
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.2);
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Fallback for browsers without Web Audio API
            console.log(`Sound: ${type}`);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemeFighters();
});