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
    img.onload = () => console.log(`Character image loaded: ${char.name}`);
    img.onerror = () => console.error(`Failed to load character image: ${char.image}`);
    img.src = char.image;
    characterImages[char.id] = img;
});
// CHARACTER SYSTEM END

// GAME CONSTANTS
const GAME_CONFIG = {
    FPS: 60,
    NETWORK_UPDATE_RATE: 50, // ms
    PLAYER_SPEED: 5,
    FRICTION: 0.8,
    HITBOX_SIZE: 80, // Increased from 60 for bigger, more visible characters
    PROJECTILE_SPEED: 8,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    // Animation constants
    ANIMATION_SCALE_ATTACK: 1.4, // More dramatic scaling
    ANIMATION_SCALE_ABILITY: 1.6,
    ANIMATION_DURATION_ATTACK: 400, // Longer animations
    ANIMATION_DURATION_ABILITY: 600,
    ANIMATION_DURATION_HIT: 300
};

// AUDIO SYSTEM - Preloaded meme sounds
const MEME_SOUNDS = [];
let masterVolume = 0.7;
let lastSoundTime = 0;
let audioMuted = false;
let startupSoundPlayed = false;

// Preload audio files with actual names
function preloadAudio() {
    const audioFiles = [
        'cid.mp3.mpeg',           // Startup sound
        'aayein.mp3.mpeg',        // Hit/Miss/GameOver pool
        'amongus.mp3.mpeg',       // Hit/Miss/GameOver pool  
        'bruh.mp3.mpeg',          // Hit/Miss/GameOver pool
        'faah.mp3.mpeg',          // Hit/Miss/GameOver pool
        'khatam.mp3.mpeg',        // Hit/Miss/GameOver pool
        'laughing.mp3.mpeg',      // Hit/Miss/GameOver pool
        'modibhujyam.mp3.mpeg',   // Hit/Miss/GameOver pool
        'modibkl.mp3.mpeg',       // Hit/Miss/GameOver pool
        'rukozara.mp3.mpeg'       // Hit/Miss/GameOver pool
    ];
    
    audioFiles.forEach((file, index) => {
        const audio = new Audio(`/public/audio/${file}`);
        audio.volume = masterVolume;
        audio.preload = 'auto';
        
        audio.addEventListener('canplaythrough', () => {
            console.log(`Audio loaded: ${file}`);
        });
        
        audio.addEventListener('error', () => {
            console.warn(`Failed to load audio: ${file}`);
        });
        
        MEME_SOUNDS.push(audio);
    });
}

// Play audio for specific events with 4-second limit
function playMemeSound(eventType = 'random') {
    if (audioMuted || MEME_SOUNDS.length === 0) return;
    
    const now = Date.now();
    const minInterval = 300; // Anti-spam protection
    
    if (now - lastSoundTime < minInterval) return;
    
    try {
        // Only play sounds for specific events
        const allowedEvents = ['hit', 'miss', 'gameOver', 'startup'];
        if (!allowedEvents.includes(eventType)) return;
        
        let sound;
        
        if (eventType === 'startup') {
            // Use cid.mp3.mpeg for startup (index 0)
            sound = MEME_SOUNDS[0];
        } else {
            // Use random sound from the pool (indices 1-9) for hit/miss/gameOver
            const randomIndex = 1 + Math.floor(Math.random() * (MEME_SOUNDS.length - 1));
            sound = MEME_SOUNDS[randomIndex];
        }
        
        // Clone audio for overlapping sounds
        const soundClone = sound.cloneNode();
        soundClone.volume = masterVolume;
        soundClone.currentTime = 0;
        
        // Play only first 4 seconds
        soundClone.play().then(() => {
            setTimeout(() => {
                soundClone.pause();
                soundClone.currentTime = 0;
            }, 4000); // Stop after 4 seconds
        }).catch(e => console.warn('Audio play failed:', e));
        
        lastSoundTime = now;
        console.log(`Playing meme sound for: ${eventType}`);
    } catch (error) {
        console.warn('Error playing meme sound:', error);
    }
}

// Play startup sound (CID audio)
function playStartupSound() {
    if (startupSoundPlayed || audioMuted || MEME_SOUNDS.length === 0) return;
    
    try {
        // Use cid.mp3.mpeg as startup sound (index 0)
        const startupAudio = MEME_SOUNDS[0].cloneNode();
        startupAudio.volume = masterVolume * 0.8; // Slightly quieter for startup
        startupAudio.currentTime = 0;
        
        startupAudio.play().then(() => {
            setTimeout(() => {
                startupAudio.pause();
                startupAudio.currentTime = 0;
            }, 4000); // Stop after 4 seconds
        }).catch(e => console.warn('Startup audio play failed:', e));
        
        startupSoundPlayed = true;
        console.log('Playing startup sound: cid.mp3.mpeg (first 4 seconds)');
    } catch (error) {
        console.warn('Error playing startup sound:', error);
    }
}

// Audio control functions
function toggleMute() {
    audioMuted = !audioMuted;
    console.log('Audio muted:', audioMuted);
}

function setVolume(volume) {
    masterVolume = Math.max(0, Math.min(1, volume));
    MEME_SOUNDS.forEach(sound => {
        sound.volume = masterVolume;
    });
}

// Initialize audio system
document.addEventListener('DOMContentLoaded', () => {
    preloadAudio();
    
    // Play startup sound after a short delay to ensure audio is loaded
    setTimeout(() => {
        playStartupSound();
    }, 2000);
});

class MemeFighters {
    constructor() {
        // Core systems
        this.socket = io();
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game state
        this.gameState = null;
        this.playerNumber = null;
        this.selectedCharacter = null;
        this.selectedDifficulty = null;
        this.gameMode = null;
        this.roomCodeToJoin = null;
        
        // Input system
        this.keys = {};
        this.lastNetworkUpdate = 0;
        
        // Game objects
        this.projectiles = [];
        this.particles = [];
        this.animations = [];
        
        // Solo mode
        this.isSoloMode = false;
        this.botAI = null;
        
        // Camera effects
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        
        this.init();
    }
    
    // INITIALIZATION
    init() {
        this.setupEventListeners();
        this.setupSocketEvents();
        this.setupInputSystem();
        this.setupConnectionDebug();
    }
    
    setupConnectionDebug() {
        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }
    
    // INPUT SYSTEM - Key state tracking for smooth movement
    setupInputSystem() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle instant actions
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleAttack();
            }
            if (e.code === 'KeyE') {
                this.handleAbility();
            }
            if (e.code === 'KeyQ') {
                this.handleUltimate();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    // EVENT LISTENERS
    setupEventListeners() {
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.gameMode = 'create';
            this.showCharacterSelection();
        });
        
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            document.getElementById('joinRoomInput').classList.remove('hidden');
            document.querySelector('.menu-buttons').classList.add('hidden');
        });
        
        document.getElementById('playSoloBtn').addEventListener('click', () => {
            this.gameMode = 'solo';
            this.showDifficultySelection();
        });
        
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
        
        // Character selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(parseInt(card.dataset.character));
            });
        });
        
        document.getElementById('confirmCharacterBtn').addEventListener('click', () => {
            this.confirmCharacterSelection();
        });
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectDifficulty(card.dataset.difficulty);
            });
        });
        
        document.getElementById('confirmDifficultyBtn').addEventListener('click', () => {
            this.confirmDifficultySelection();
        });
        
        // Game over actions
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
    
    // SOCKET EVENTS
    setupSocketEvents() {
        this.socket.on('roomCreated', (data) => {
            console.log('Room created event received:', data);
            this.playerNumber = data.playerNumber;
            document.getElementById('roomCode').textContent = data.roomCode;
            
            this.showScreen('menu');
            document.getElementById('roomInfo').classList.remove('hidden');
            document.querySelector('.menu-buttons').classList.add('hidden');
            document.getElementById('joinRoomInput').classList.add('hidden');
        });
        
        this.socket.on('startGame', (data) => {
            this.gameState = this.initializeGameState(data);
            this.playerNumber = this.socket.id === data.player1.id ? 1 : 2;
            this.startGame();
        });
        
        this.socket.on('stateUpdate', (serverState) => {
            this.handleServerUpdate(serverState);
        });
        
        this.socket.on('attack', (data) => {
            this.handleAttackFeedback(data);
        });
        
        this.socket.on('abilityUsed', (data) => {
            this.handleAbilityFeedback(data);
        });
        
        this.socket.on('ultimateUsed', (data) => {
            this.showMessage('⚡ ULTIMATE ATTACK! ⚡', 1500);
            this.addScreenShake(10);
            this.playSound('ultimate');
        });
        
        this.socket.on('gameOver', (data) => {
            this.handleGameOver(data);
        });
        
        this.socket.on('playerDisconnected', () => {
            this.showMessage('Opponent disconnected!', 3000);
        });
        
        this.socket.on('error', (message) => {
            alert(message);
        });
    }
    
    // Initialize game state with proper structure
    initializeGameState(data) {
        const state = {
            player1: this.createPlayerObject(data.player1),
            player2: this.createPlayerObject(data.player2)
        };
        return state;
    }
    
    createPlayerObject(playerData) {
        return {
            ...playerData,
            // Physics
            vx: 0,
            vy: 0,
            // Rendering
            renderX: playerData.x,
            renderY: playerData.y,
            scale: 1,
            // Animation
            state: 'idle',
            stateTime: 0,
            // Combat
            hitbox: {
                x: playerData.x - GAME_CONFIG.HITBOX_SIZE/2,
                y: playerData.y - GAME_CONFIG.HITBOX_SIZE/2,
                width: GAME_CONFIG.HITBOX_SIZE,
                height: GAME_CONFIG.HITBOX_SIZE
            }
        };
    }
    
    // DIFFICULTY SELECTION
    showDifficultySelection() {
        this.showScreen('difficultySelect');
    }
    
    selectDifficulty(difficulty) {
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-difficulty="${difficulty}"]`);
        selectedCard.classList.add('selected');
        
        this.selectedDifficulty = difficulty;
        document.getElementById('confirmDifficultyBtn').classList.remove('hidden');
    }
    
    confirmDifficultySelection() {
        if (!this.selectedDifficulty) return;
        
        console.log('Difficulty selected:', this.selectedDifficulty);
        this.showCharacterSelection();
    }
    
    // CHARACTER SELECTION
    showCharacterSelection() {
        this.showScreen('characterSelect');
    }
    
    selectCharacter(characterId) {
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
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
                this.socket.emit('createRoom', { characterId: this.selectedCharacter.id });
                break;
            case 'join':
                this.socket.emit('joinRoom', { 
                    roomCode: this.roomCodeToJoin, 
                    characterId: this.selectedCharacter.id 
                });
                break;
            case 'solo':
                this.startSoloMode();
                break;
        }
    }
    
    // GAME INITIALIZATION
    startGame() {
        this.showScreen('game');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Update UI labels
        if (this.isSoloMode) {
            const difficultyEmojis = {
                easy: '😴',
                medium: '😐', 
                hard: '😈'
            };
            const difficultyLabel = this.selectedDifficulty ? 
                `${difficultyEmojis[this.selectedDifficulty]} ${this.selectedDifficulty.toUpperCase()} BOT` : 
                'AI Opponent 🤖';
            
            document.getElementById('p1Label').textContent = 'You';
            document.getElementById('p2Label').textContent = difficultyLabel;
        } else {
            document.getElementById('p1Label').textContent = 'Player 1';
            document.getElementById('p2Label').textContent = 'Player 2';
        }
        
        // Update abilities display
        const p1Character = CHARACTERS.find(c => c.id === this.gameState.player1.characterId);
        const p2Character = CHARACTERS.find(c => c.id === this.gameState.player2.characterId);
        
        document.getElementById('p1Ability').textContent = p1Character ? p1Character.ability : 'unknown';
        document.getElementById('p2Ability').textContent = p2Character ? p2Character.ability : 'unknown';
        
        // Start the main game loop
        this.startGameLoop();
    }
    
    // MAIN GAME LOOP - 60 FPS with proper timing
    startGameLoop() {
        const gameLoop = (currentTime) => {
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Update game logic
            this.update(this.deltaTime);
            
            // Render everything
            this.render();
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    // UPDATE LOGIC - Separated from rendering
    update(deltaTime) {
        if (!this.gameState) return;
        
        // Update input and movement
        this.handleInput();
        
        // Update players
        this.updatePlayers(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
        
        // Network updates (throttled)
        this.handleNetworkUpdates();
        
        // Solo mode AI
        if (this.isSoloMode) {
            this.updateBotAI(deltaTime);
        }
    }
    
    // INPUT HANDLING - Smooth movement with velocity
    handleInput() {
        if (!this.gameState) return;
        
        const player = this.gameState[`player${this.playerNumber}`];
        if (!player || !player.canMove) return;
        
        // Reset velocity
        player.vx = 0;
        player.vy = 0;
        
        // Apply movement based on keys
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            player.vx = -GAME_CONFIG.PLAYER_SPEED;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            player.vx = GAME_CONFIG.PLAYER_SPEED;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            player.vy = -GAME_CONFIG.PLAYER_SPEED;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            player.vy = GAME_CONFIG.PLAYER_SPEED;
        }
        
        // Apply reverse effect
        if (player.reversed) {
            player.vx = -player.vx;
            player.vy = -player.vy;
        }
        
        // Update animation state with better timing
        if (player.vx !== 0 || player.vy !== 0) {
            this.setPlayerState(player, 'run');
        } else if (player.state === 'run') {
            this.setPlayerState(player, 'idle');
        }
    }
    
    // PLAYER UPDATES - Physics and interpolation
    updatePlayers(deltaTime) {
        if (!this.gameState) return;
        
        Object.values(this.gameState).forEach(player => {
            if (!player) return;
            
            // Update physics
            this.updatePlayerPhysics(player, deltaTime);
            
            // Update interpolation for smooth rendering
            this.updatePlayerInterpolation(player, deltaTime);
            
            // Update hitbox
            this.updatePlayerHitbox(player);
            
            // Update animation timers
            player.stateTime += deltaTime;
        });
    }
    
    updatePlayerPhysics(player, deltaTime) {
        // Apply velocity to position
        player.x += player.vx;
        player.y += player.vy;
        
        // Boundary checks
        player.x = Math.max(GAME_CONFIG.HITBOX_SIZE/2, 
                           Math.min(GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.HITBOX_SIZE/2, player.x));
        player.y = Math.max(GAME_CONFIG.HITBOX_SIZE/2, 
                           Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.HITBOX_SIZE/2, player.y));
    }
    
    updatePlayerInterpolation(player, deltaTime) {
        // Smooth interpolation for rendering position
        const lerpFactor = 0.2;
        player.renderX += (player.x - player.renderX) * lerpFactor;
        player.renderY += (player.y - player.renderY) * lerpFactor;
        
        // Enhanced animation scale interpolation with proper timing
        let targetScale = 1;
        
        if (player.state === 'attack' && player.stateTime < GAME_CONFIG.ANIMATION_DURATION_ATTACK) {
            targetScale = GAME_CONFIG.ANIMATION_SCALE_ATTACK;
        } else if (player.state === 'ability' && player.stateTime < GAME_CONFIG.ANIMATION_DURATION_ABILITY) {
            const character = CHARACTERS.find(c => c.id === player.characterId);
            targetScale = character?.ability === 'size_boost' ? 2.2 : GAME_CONFIG.ANIMATION_SCALE_ABILITY;
        } else if (player.state === 'hit' && player.stateTime < GAME_CONFIG.ANIMATION_DURATION_HIT) {
            // Hit animation with pulsing effect
            const hitProgress = player.stateTime / GAME_CONFIG.ANIMATION_DURATION_HIT;
            targetScale = 1 + Math.sin(hitProgress * Math.PI * 4) * 0.2;
        } else if (player.state === 'run') {
            // Subtle running animation
            targetScale = 1 + Math.sin(player.stateTime * 0.01) * 0.05;
        }
        
        // Size boost effect
        if (player.sizeBoosted) {
            targetScale *= 1.8;
        }
        
        player.scale += (targetScale - player.scale) * 0.3;
        
        // Auto-reset animation states after duration
        if (player.state === 'attack' && player.stateTime > GAME_CONFIG.ANIMATION_DURATION_ATTACK) {
            this.setPlayerState(player, 'idle');
        } else if (player.state === 'ability' && player.stateTime > GAME_CONFIG.ANIMATION_DURATION_ABILITY) {
            this.setPlayerState(player, 'idle');
        } else if (player.state === 'hit' && player.stateTime > GAME_CONFIG.ANIMATION_DURATION_HIT) {
            this.setPlayerState(player, 'idle');
        }
    }
    
    updatePlayerHitbox(player) {
        player.hitbox.x = player.x - GAME_CONFIG.HITBOX_SIZE/2;
        player.hitbox.y = player.y - GAME_CONFIG.HITBOX_SIZE/2;
    }
    
    setPlayerState(player, newState) {
        if (player.state !== newState) {
            player.state = newState;
            player.stateTime = 0;
        }
    }
    
    // PROJECTILE SYSTEM
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Move projectile
            proj.x += proj.vx;
            proj.y += proj.vy;
            
            // Reduce life
            proj.life -= deltaTime;
            
            // Check collision with players
            if (this.checkProjectileCollisions(proj)) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Remove if expired or out of bounds
            if (proj.life <= 0 || this.isOutOfBounds(proj)) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkProjectileCollisions(projectile) {
        if (!this.gameState) return false;
        
        // Check collision with opponent
        const opponent = projectile.owner === 1 ? this.gameState.player2 : this.gameState.player1;
        if (!opponent) return false;
        
        if (this.isColliding(projectile, opponent.hitbox)) {
            this.handleProjectileHit(projectile, opponent);
            return true;
        }
        
        return false;
    }
    
    handleProjectileHit(projectile, target) {
        // Apply damage
        target.health = Math.max(0, target.health - projectile.damage);
        
        // Visual feedback with enhanced animations
        this.setPlayerState(target, 'hit');
        this.addHitEffect(target.x, target.y);
        this.addScreenShake(8); // Increased screen shake
        
        // Play meme sound for hit
        playMemeSound('hit');
        
        // Damage number
        this.addDamageNumber(target.x, target.y, projectile.damage);
        
        // Check game over
        if (target.health <= 0 && this.isSoloMode) {
            const playerWon = target.id === 'bot';
            this.endSoloGame(playerWon);
        }
        
        this.updateUI();
    }
    
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    isOutOfBounds(obj) {
        return obj.x < -50 || obj.x > GAME_CONFIG.CANVAS_WIDTH + 50 ||
               obj.y < -50 || obj.y > GAME_CONFIG.CANVAS_HEIGHT + 50;
    }
    
    // PARTICLE SYSTEM
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity/effects
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }
            
            // Reduce life
            particle.life -= deltaTime;
            
            // Remove if expired
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // ANIMATION SYSTEM
    updateAnimations(deltaTime) {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            
            anim.time += deltaTime;
            
            if (anim.time >= anim.duration) {
                this.animations.splice(i, 1);
            }
        }
    }
    
    // SCREEN SHAKE
    updateScreenShake(deltaTime) {
        if (this.screenShake.intensity > 0) {
            this.screenShake.intensity -= deltaTime * 0.01;
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }
    
    addScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }
    
    // NETWORK UPDATES - Throttled to reduce bandwidth
    handleNetworkUpdates() {
        const now = Date.now();
        if (now - this.lastNetworkUpdate < GAME_CONFIG.NETWORK_UPDATE_RATE) return;
        
        if (!this.isSoloMode && this.gameState) {
            const player = this.gameState[`player${this.playerNumber}`];
            if (player) {
                this.socket.emit('playerMove', { 
                    x: player.x, 
                    y: player.y,
                    state: player.state
                });
            }
        }
        
        this.lastNetworkUpdate = now;
    }
    
    handleServerUpdate(serverState) {
        if (!this.gameState) return;
        
        // Update opponent position (with interpolation)
        const opponentNumber = this.playerNumber === 1 ? 2 : 1;
        const serverOpponent = serverState[`player${opponentNumber}`];
        const localOpponent = this.gameState[`player${opponentNumber}`];
        
        if (serverOpponent && localOpponent) {
            // Set target position for interpolation
            localOpponent.x = serverOpponent.x;
            localOpponent.y = serverOpponent.y;
            localOpponent.health = serverOpponent.health;
            localOpponent.state = serverOpponent.state || 'idle';
        }
        
        this.updateUI();
    }
    
    // COMBAT ACTIONS
    handleAttack() {
        if (!this.gameState) return;
        
        const player = this.gameState[`player${this.playerNumber}`];
        if (!player) return;
        
        // Set attack state with enhanced feedback
        this.setPlayerState(player, 'attack');
        
        // Create attack effect
        this.addAttackEffect(player);
        
        if (this.isSoloMode) {
            this.handleSoloAttack();
        } else {
            this.socket.emit('playerAttack');
        }
    }
    
    handleAbility() {
        if (!this.gameState) return;
        
        const player = this.gameState[`player${this.playerNumber}`];
        if (!player) return;
        
        this.setPlayerState(player, 'ability');
        
        if (this.isSoloMode) {
            this.handleSoloAbility();
        } else {
            this.socket.emit('useAbility');
        }
    }
    
    handleUltimate() {
        if (!this.gameState) return;
        
        const player = this.gameState[`player${this.playerNumber}`];
        if (!player || !player.hasUlt) return;
        
        if (this.isSoloMode) {
            this.handleSoloUltimate();
        } else {
            this.socket.emit('useUltimate');
        }
    }
    
    // SOLO MODE IMPLEMENTATION
    startSoloMode() {
        this.isSoloMode = true;
        this.playerNumber = 1;
        
        const botCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        
        this.gameState = {
            player1: this.createPlayerObject({ 
                id: 'human', 
                x: 100, 
                y: 200, 
                health: 100, 
                canMove: true, 
                hasUlt: true,
                characterId: this.selectedCharacter.id,
                ability: this.selectedCharacter.ability
            }),
            player2: this.createPlayerObject({ 
                id: 'bot', 
                x: 600, 
                y: 200, 
                health: 100, 
                canMove: true, 
                hasUlt: true,
                characterId: botCharacter.id,
                ability: botCharacter.ability
            })
        };
        
        this.startGame();
        this.initBotAI();
    }
    
    initBotAI() {
        // Difficulty-based AI configuration
        const difficultySettings = {
            easy: {
                speedMultiplier: 0.4,        // Very slow movement
                reactionDelay: 800,          // Slow reactions
                attackChance: 0.08,          // Rarely attacks (8%)
                abilityChance: 0.02,         // Very rare abilities (2%)
                attackCooldown: [2500, 4000], // Long cooldowns
                abilityCooldown: [8000, 12000],
                ultimateChance: 0.1,         // Rarely uses ultimate
                defensiveBehavior: 0.4       // Often backs away
            },
            medium: {
                speedMultiplier: 0.6,        // Balanced speed
                reactionDelay: 300,          // Normal reactions
                attackChance: 0.15,          // Moderate attacks (15%)
                abilityChance: 0.03,         // Occasional abilities (3%)
                attackCooldown: [1500, 3000], // Balanced cooldowns
                abilityCooldown: [5000, 8000],
                ultimateChance: 0.2,         // Sometimes uses ultimate
                defensiveBehavior: 0.3       // Sometimes defensive
            },
            hard: {
                speedMultiplier: 0.8,        // Fast movement
                reactionDelay: 150,          // Quick reactions
                attackChance: 0.25,          // Aggressive attacks (25%)
                abilityChance: 0.05,         // Frequent abilities (5%)
                attackCooldown: [800, 1500], // Short cooldowns
                abilityCooldown: [3000, 5000],
                ultimateChance: 0.35,        // Often uses ultimate
                defensiveBehavior: 0.1       // Rarely defensive
            }
        };
        
        const settings = difficultySettings[this.selectedDifficulty] || difficultySettings.medium;
        
        this.botAI = {
            lastAction: 0,
            lastAbility: 0,
            reactionDelay: settings.reactionDelay,
            nextActionTime: 0,
            nextAbilityTime: Date.now() + settings.abilityCooldown[0],
            difficulty: this.selectedDifficulty,
            settings: settings
        };
        
        console.log(`Bot AI initialized with ${this.selectedDifficulty} difficulty:`, settings);
    }
    
    updateBotAI(deltaTime) {
        if (!this.gameState || !this.botAI) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        const now = Date.now();
        const settings = this.botAI.settings;
        
        // Bot movement AI - Difficulty-based behavior
        if (bot.canMove) {
            const dx = player.x - bot.x;
            const dy = player.y - bot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Reset velocity
            bot.vx = 0;
            bot.vy = 0;
            
            // Difficulty-based movement
            const minDistance = this.selectedDifficulty === 'easy' ? 120 : 
                               this.selectedDifficulty === 'medium' ? 80 : 60;
            
            if (distance > minDistance) {
                // Bot moves at difficulty-adjusted speed
                const botSpeed = GAME_CONFIG.PLAYER_SPEED * settings.speedMultiplier;
                
                bot.vx = Math.sign(dx) * botSpeed;
                bot.vy = Math.sign(dy) * botSpeed;
                
                // Add randomness based on difficulty
                const randomness = this.selectedDifficulty === 'easy' ? 0.02 : 
                                  this.selectedDifficulty === 'medium' ? 0.05 : 0.08;
                
                if (Math.random() < randomness) {
                    bot.vx += (Math.random() - 0.5) * 2;
                    bot.vy += (Math.random() - 0.5) * 2;
                }
                
                // Defensive behavior based on difficulty
                if (Math.random() < settings.defensiveBehavior && distance < minDistance + 40) {
                    bot.vx = -bot.vx * 0.5;
                    bot.vy = -bot.vy * 0.5;
                }
            } else {
                // When close, sometimes back away (more on easier difficulties)
                if (Math.random() < settings.defensiveBehavior) {
                    bot.vx = -Math.sign(dx) * GAME_CONFIG.PLAYER_SPEED * 0.3;
                    bot.vy = -Math.sign(dy) * GAME_CONFIG.PLAYER_SPEED * 0.3;
                }
            }
            
            // Apply reverse effect
            if (bot.reversed) {
                bot.vx = -bot.vx;
                bot.vy = -bot.vy;
            }
            
            // Update bot position
            this.updatePlayerPhysics(bot, deltaTime);
            
            // Attack with difficulty-based frequency
            const attackDistance = this.selectedDifficulty === 'easy' ? 70 : 
                                  this.selectedDifficulty === 'medium' ? 80 : 90;
            
            if (distance < attackDistance && now > this.botAI.nextActionTime) {
                if (Math.random() < settings.attackChance) {
                    this.botAttack();
                    // Difficulty-based cooldown
                    const cooldownRange = settings.attackCooldown;
                    const cooldown = cooldownRange[0] + Math.random() * (cooldownRange[1] - cooldownRange[0]);
                    this.botAI.nextActionTime = now + cooldown;
                }
            }
        }
        
        // Bot ability usage - Difficulty-based frequency
        if (now > this.botAI.nextAbilityTime) {
            if (Math.random() < settings.abilityChance) {
                this.botUseAbility();
                // Difficulty-based ability cooldown
                const cooldownRange = settings.abilityCooldown;
                const cooldown = cooldownRange[0] + Math.random() * (cooldownRange[1] - cooldownRange[0]);
                this.botAI.nextAbilityTime = now + cooldown;
            }
        }
        
        // Bot ultimate usage - Difficulty-based strategy
        const ultimateHealthThreshold = this.selectedDifficulty === 'easy' ? 40 : 
                                       this.selectedDifficulty === 'medium' ? 60 : 70;
        
        if (bot.hasUlt && player.health < ultimateHealthThreshold && now > this.botAI.nextActionTime) {
            if (Math.random() < settings.ultimateChance) {
                this.botUltimate();
                this.botAI.nextActionTime = now + 2000; // Cooldown after ultimate
            }
        }
    }
    
    // SOLO MODE COMBAT
    handleSoloAttack() {
        const player = this.gameState.player1;
        const bot = this.gameState.player2;
        
        const distance = Math.sqrt(Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2));
        
        if (distance <= 80) {
            let damage = 10;
            if (player.sizeBoosted) damage = 20;
            
            bot.health = Math.max(0, bot.health - damage);
            this.setPlayerState(bot, 'hit');
            this.addHitEffect(bot.x, bot.y);
            this.addScreenShake(8);
            this.addDamageNumber(bot.x, bot.y, damage);
            
            this.showMessage(player.sizeBoosted ? '💥 MEGA HIT!' : '💥 HIT!', 500);
            playMemeSound('hit');
            
            if (bot.health <= 0) {
                this.endSoloGame(true);
            }
        } else {
            this.showMessage('❌ MISS!', 500);
            playMemeSound('miss');
        }
        
        this.updateUI();
    }
    
    handleSoloAbility() {
        const player = this.gameState.player1;
        const bot = this.gameState.player2;
        const ability = player.ability;
        
        switch (ability) {
            case 'size_boost':
                this.showMessage('📏 SIZE BOOST!', 1500);
                player.sizeBoosted = true;
                setTimeout(() => {
                    if (this.gameState) player.sizeBoosted = false;
                }, 3000);
                break;
                
            case 'sound_power':
                this.showMessage('🔊 SONIC BOOM!', 1000);
                this.createSoundWave(player.x, player.y);
                
                const distance = Math.sqrt(Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2));
                if (distance <= 120) {
                    bot.health = Math.max(0, bot.health - 25);
                    this.setPlayerState(bot, 'hit');
                    this.addHitEffect(bot.x, bot.y);
                    this.addDamageNumber(bot.x, bot.y, 25);
                }
                break;
                
            case 'green_projectile':
                this.showMessage('🟢 TOXIC SHOT!', 1000);
                this.createProjectile(player.x, player.y, bot.x, bot.y, 'toxic', 15, 1);
                break;
                
            case 'laser_beam':
                this.showMessage('🔴 LASER EYES!', 1000);
                this.createLaserBeam(player.x, player.y, bot.x, bot.y);
                
                bot.health = Math.max(0, bot.health - 30);
                this.setPlayerState(bot, 'hit');
                this.addHitEffect(bot.x, bot.y);
                this.addDamageNumber(bot.x, bot.y, 30);
                break;
        }
        
        if (bot.health <= 0) {
            this.endSoloGame(true);
        }
        
        this.updateUI();
    }
    
    handleSoloUltimate() {
        const player = this.gameState.player1;
        const bot = this.gameState.player2;
        
        if (!player.hasUlt) return;
        
        player.hasUlt = false;
        bot.health = Math.max(0, bot.health - 30);
        
        this.setPlayerState(bot, 'hit');
        this.addHitEffect(bot.x, bot.y);
        this.addScreenShake(15);
        this.addDamageNumber(bot.x, bot.y, 30);
        
        this.showMessage('⚡ ULTIMATE ATTACK! ⚡', 1500);
        // No sound for ultimate - only hit/miss/gameOver
        
        if (bot.health <= 0) {
            this.endSoloGame(true);
        }
        
        this.updateUI();
    }
    
    // BOT AI ACTIONS
    botAttack() {
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        
        this.setPlayerState(bot, 'attack');
        
        // Fixed distance calculation (was using player.y twice)
        const distance = Math.sqrt(Math.pow(bot.x - player.x, 2) + Math.pow(bot.y - player.y, 2));
        
        if (distance <= 80) {
            let damage = 10;
            if (bot.sizeBoosted) damage = 20;
            
            player.health = Math.max(0, player.health - damage);
            this.setPlayerState(player, 'hit');
            this.addHitEffect(player.x, player.y);
            this.addScreenShake(8);
            this.addDamageNumber(player.x, player.y, damage);
            
            this.showMessage('💥 BOT HIT!', 500);
            playMemeSound('hit');
            
            if (player.health <= 0) {
                this.endSoloGame(false);
            }
        } else {
            this.showMessage('❌ BOT MISS!', 500);
            playMemeSound('miss');
        }
        
        this.updateUI();
    }
    
    botUltimate() {
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        
        if (!bot.hasUlt) return;
        
        bot.hasUlt = false;
        player.health = Math.max(0, player.health - 30);
        
        this.setPlayerState(player, 'hit');
        this.addHitEffect(player.x, player.y);
        this.addScreenShake(15);
        this.addDamageNumber(player.x, player.y, 30);
        
        this.showMessage('⚡ BOT ULTIMATE! ⚡', 1500);
        // No sound for ultimate - only hit/miss/gameOver
        
        if (player.health <= 0) {
            this.endSoloGame(false);
        }
        
        this.updateUI();
    }
    
    botUseAbility() {
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        const ability = bot.ability;
        
        this.setPlayerState(bot, 'ability');
        
        switch (ability) {
            case 'size_boost':
                bot.sizeBoosted = true;
                setTimeout(() => {
                    if (this.gameState) bot.sizeBoosted = false;
                }, 3000);
                this.showMessage('📏 BOT SIZE BOOST!', 1000);
                break;
                
            case 'sound_power':
                this.createSoundWave(bot.x, bot.y);
                const distance = Math.sqrt(Math.pow(bot.x - player.x, 2) + Math.pow(bot.y - player.y, 2));
                if (distance <= 120) {
                    player.health = Math.max(0, player.health - 25);
                    this.setPlayerState(player, 'hit');
                    this.addHitEffect(player.x, player.y);
                    this.addDamageNumber(player.x, player.y, 25);
                }
                this.showMessage('🔊 BOT SONIC BOOM!', 1000);
                break;
                
            case 'green_projectile':
                // Bot projectiles move slightly slower for fairness
                this.createProjectile(bot.x, bot.y, player.x, player.y, 'toxic', 15, 2);
                this.showMessage('🟢 BOT TOXIC SHOT!', 1000);
                break;
                
            case 'laser_beam':
                this.createLaserBeam(bot.x, bot.y, player.x, player.y);
                player.health = Math.max(0, player.health - 30);
                this.setPlayerState(player, 'hit');
                this.addHitEffect(player.x, player.y);
                this.addDamageNumber(player.x, player.y, 30);
                this.showMessage('🔴 BOT LASER EYES!', 1000);
                break;
        }
        
        if (player.health <= 0) {
            this.endSoloGame(false);
        }
        
        this.updateUI();
    }
    
    // WEAPON SYSTEMS
    createProjectile(startX, startY, targetX, targetY, type, damage, owner) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust projectile speed based on owner (bot projectiles are slower)
        let projectileSpeed = GAME_CONFIG.PROJECTILE_SPEED;
        if (owner === 2) { // Bot projectiles
            projectileSpeed = GAME_CONFIG.PROJECTILE_SPEED * 0.75; // 25% slower
        }
        
        const projectile = {
            x: startX,
            y: startY,
            vx: (dx / distance) * projectileSpeed,
            vy: (dy / distance) * projectileSpeed,
            width: 8,
            height: 8,
            type: type,
            damage: damage,
            owner: owner,
            life: 2000 // 2 seconds
        };
        
        this.projectiles.push(projectile);
        // No sound for projectile creation - only on hit/miss
    }
    
    createLaserBeam(startX, startY, targetX, targetY) {
        // Add laser animation
        this.animations.push({
            type: 'laser',
            startX: startX,
            startY: startY,
            endX: targetX,
            endY: targetY,
            time: 0,
            duration: 300
        });
        
        this.addScreenShake(8);
        // No sound for laser creation - only on hit/miss
    }
    
    createSoundWave(x, y) {
        // Add sound wave animation
        this.animations.push({
            type: 'soundwave',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 120,
            time: 0,
            duration: 800
        });
        
        this.addScreenShake(6);
        // No sound for sound wave creation - only on hit/miss
    }
    
    // VISUAL EFFECTS - Enhanced for better visibility
    addHitEffect(x, y) {
        // Add more dramatic hit particles
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 800,
                color: i % 2 === 0 ? '#FFE066' : '#FF6B9D',
                size: 4 + Math.random() * 3
            });
        }
        
        // Add explosion ring effect
        this.animations.push({
            type: 'explosion',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 60,
            time: 0,
            duration: 500
        });
    }
    
    addAttackEffect(player) {
        // Add more visible attack particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: player.x + (Math.random() - 0.5) * 60,
                y: player.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 500,
                color: '#FF6B9D',
                size: 3 + Math.random() * 2
            });
        }
        
        // Add attack wave animation
        this.animations.push({
            type: 'attackwave',
            x: player.x,
            y: player.y,
            radius: 0,
            maxRadius: 80,
            time: 0,
            duration: 300
        });
    }
    
    addDamageNumber(x, y, damage) {
        this.particles.push({
            x: x,
            y: y - 30,
            vx: (Math.random() - 0.5) * 2,
            vy: -3,
            life: 1500,
            color: '#FF0000',
            text: `-${damage}`,
            size: 20,
            outline: true
        });
    }
    
    // RENDERING SYSTEM - Separated and optimized
    render() {
        if (!this.ctx || !this.gameState) return;
        
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Clear and draw background
        this.renderBackground();
        
        // Render game objects
        this.renderPlayers();
        this.renderProjectiles();
        this.renderParticles();
        this.renderAnimations();
        
        this.ctx.restore();
    }
    
    renderBackground() {
        // Neobrutalism background
        this.ctx.fillStyle = '#E8F5FF';
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // Background elements
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
    }
    
    renderPlayers() {
        this.renderPlayer(this.gameState.player1, '#FFE066', '1');
        if (this.gameState.player2) {
            this.renderPlayer(this.gameState.player2, '#00D2FF', '2');
        }
    }
    
    renderPlayer(player, fallbackColor, number) {
        if (!player) return;
        
        const character = CHARACTERS.find(c => c.id === player.characterId) || CHARACTERS[0];
        const size = GAME_CONFIG.HITBOX_SIZE * player.scale;
        
        // Calculate render position
        let renderX = player.renderX;
        let renderY = player.renderY;
        
        // Animation offsets
        if (player.state === 'attack') {
            renderX += Math.sin(player.stateTime * 0.02) * 5;
        }
        
        const drawX = renderX - size/2;
        const drawY = renderY - size/2;
        
        // Player container (neobrutalism style)
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(drawX - 5, drawY - 5, size + 10, size + 10);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(drawX - 5, drawY - 5, size + 10, size + 10);
        
        // Character image or fallback
        const characterImg = characterImages[player.characterId];
        if (characterImg && characterImg.complete && characterImg.naturalWidth > 0) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(drawX, drawY, size, size);
            this.ctx.clip();
            this.ctx.drawImage(characterImg, drawX, drawY, size, size);
            this.ctx.restore();
        } else {
            // Fallback colored rectangle
            const fallbackColors = ['#FFE066', '#FF6B9D', '#00D2FF', '#98FB98'];
            this.ctx.fillStyle = fallbackColors[player.characterId - 1] || fallbackColor;
            this.ctx.fillRect(drawX, drawY, size, size);
            
            this.ctx.fillStyle = '#000';
            this.ctx.font = `bold ${size/2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.characterId, renderX, renderY + size/6);
        }
        
        // Character border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(drawX, drawY, size, size);
        
        // Health bar
        this.renderHealthBar(player, renderX, renderY - size/2 - 25);
        
        // Status effects
        this.renderStatusEffects(player, drawX, drawY, size);
        
        // Character name
        this.renderPlayerName(player, character, renderX, renderY + size/2 + 30);
    }
    
    renderHealthBar(player, x, y) {
        const barWidth = 70;
        const barHeight = 12;
        const barX = x - barWidth/2;
        
        // Background
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(barX - 2, y - 2, barWidth + 4, barHeight + 4);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(barX - 2, y - 2, barWidth + 4, barHeight + 4);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(barX, y, barWidth, barHeight);
        
        // Health fill
        const healthPercent = player.health / 100;
        if (healthPercent > 0.5) {
            this.ctx.fillStyle = '#98FB98';
        } else if (healthPercent > 0.25) {
            this.ctx.fillStyle = '#FFE066';
        } else {
            this.ctx.fillStyle = '#FF6B9D';
        }
        this.ctx.fillRect(barX, y, barWidth * healthPercent, barHeight);
    }
    
    renderStatusEffects(player, drawX, drawY, size) {
        if (!player.canMove) {
            this.ctx.fillStyle = 'rgba(0, 150, 255, 0.7)';
            this.ctx.fillRect(drawX, drawY, size, size);
        }
        
        if (player.reversed) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.fillRect(drawX, drawY, size, size);
        }
        
        if (player.state === 'hit' && player.stateTime < 200) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(drawX, drawY, size, size);
        }
        
        if (player.sizeBoosted) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 6;
            this.ctx.strokeRect(drawX - 3, drawY - 3, size + 6, size + 6);
        }
    }
    
    renderPlayerName(player, character, x, y) {
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(x - 40, y, 80, 20);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - 40, y, 80, 20);
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.name.toUpperCase(), x, y + 13);
    }
    
    renderProjectiles() {
        this.projectiles.forEach(proj => {
            const size = proj.width;
            
            // Main projectile
            if (proj.type === 'toxic') {
                this.ctx.fillStyle = '#98FB98';
            } else {
                this.ctx.fillStyle = '#FF6B9D';
            }
            this.ctx.fillRect(proj.x - size, proj.y - size, size * 2, size * 2);
            
            // Border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(proj.x - size, proj.y - size, size * 2, size * 2);
            
            // Inner highlight
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(proj.x - size + 2, proj.y - size + 2, 4, 4);
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            if (particle.text) {
                // Enhanced damage numbers with outline
                if (particle.outline) {
                    // Black outline
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 4;
                    this.ctx.font = `bold ${particle.size}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(particle.text, particle.x, particle.y);
                }
                
                // Main text
                this.ctx.fillStyle = particle.color;
                this.ctx.font = `bold ${particle.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(particle.text, particle.x, particle.y);
            } else {
                // Enhanced particles with glow effect
                this.ctx.save();
                this.ctx.globalAlpha = Math.min(1, particle.life / 300);
                
                // Glow effect
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 10;
                
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        });
    }
    
    renderAnimations() {
        this.animations.forEach(anim => {
            if (anim.type === 'laser') {
                // Enhanced laser beam effect
                const progress = anim.time / anim.duration;
                const alpha = 1 - progress;
                
                this.ctx.globalAlpha = alpha;
                
                // Outer glow
                this.ctx.strokeStyle = '#FF6B9D';
                this.ctx.lineWidth = 16;
                this.ctx.shadowColor = '#FF6B9D';
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.moveTo(anim.startX, anim.startY);
                this.ctx.lineTo(anim.endX, anim.endY);
                this.ctx.stroke();
                
                // Main beam
                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = '#FFF';
                this.ctx.lineWidth = 8;
                this.ctx.beginPath();
                this.ctx.moveTo(anim.startX, anim.startY);
                this.ctx.lineTo(anim.endX, anim.endY);
                this.ctx.stroke();
                
                // Core
                this.ctx.strokeStyle = '#FF6B9D';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(anim.startX, anim.startY);
                this.ctx.lineTo(anim.endX, anim.endY);
                this.ctx.stroke();
                
                this.ctx.globalAlpha = 1;
                
            } else if (anim.type === 'soundwave') {
                // Enhanced sound wave effect
                const progress = anim.time / anim.duration;
                anim.radius = anim.maxRadius * progress;
                const alpha = 1 - progress;
                
                this.ctx.globalAlpha = alpha;
                
                // Multiple wave rings
                for (let i = 0; i < 3; i++) {
                    const ringRadius = anim.radius - (i * 15);
                    if (ringRadius > 0) {
                        this.ctx.strokeStyle = '#00D2FF';
                        this.ctx.lineWidth = 6 - i;
                        this.ctx.strokeRect(anim.x - ringRadius, anim.y - ringRadius, 
                                          ringRadius * 2, ringRadius * 2);
                    }
                }
                
                this.ctx.globalAlpha = 1;
                
            } else if (anim.type === 'explosion') {
                // New explosion effect
                const progress = anim.time / anim.duration;
                anim.radius = anim.maxRadius * progress;
                const alpha = 1 - progress;
                
                this.ctx.globalAlpha = alpha;
                this.ctx.strokeStyle = '#FFE066';
                this.ctx.lineWidth = 8;
                this.ctx.shadowColor = '#FFE066';
                this.ctx.shadowBlur = 15;
                
                this.ctx.beginPath();
                this.ctx.arc(anim.x, anim.y, anim.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                this.ctx.globalAlpha = 1;
                this.ctx.shadowBlur = 0;
                
            } else if (anim.type === 'attackwave') {
                // New attack wave effect
                const progress = anim.time / anim.duration;
                anim.radius = anim.maxRadius * progress;
                const alpha = 1 - progress;
                
                this.ctx.globalAlpha = alpha;
                this.ctx.strokeStyle = '#FF6B9D';
                this.ctx.lineWidth = 6;
                
                this.ctx.beginPath();
                this.ctx.arc(anim.x, anim.y, anim.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                this.ctx.globalAlpha = 1;
            }
        });
    }
    
    // FEEDBACK SYSTEMS
    handleAttackFeedback(data) {
        if (data.hit) {
            this.showMessage('💥 HIT!', 500);
            this.addScreenShake(8);
            playMemeSound('hit');
        } else {
            this.showMessage('❌ MISS!', 500);
            playMemeSound('miss');
        }
    }
    
    handleAbilityFeedback(data) {
        const abilityNames = {
            size_boost: '📏 SIZE BOOST!',
            sound_power: '🔊 SONIC BOOM!',
            green_projectile: '🟢 TOXIC SHOT!',
            laser_beam: '🔴 LASER EYES!'
        };
        
        const message = abilityNames[data.ability] || '⚡ ABILITY!';
        this.showMessage(message, 1000);
        this.addScreenShake(5);
        // No sound for abilities - only hit/miss/gameOver
    }
    
    handleGameOver(data) {
        const isWinner = data.winner === this.playerNumber;
        document.getElementById('resultTitle').textContent = isWinner ? '🎉 YOU WIN! 🎉' : '💀 YOU LOSE! 💀';
        document.getElementById('memeText').textContent = isWinner ? 'Victory Royale! 👑' : data.memeText;
        
        // Play game over sound
        playMemeSound('gameOver');
        
        this.showScreen('gameOver');
    }
    
    endSoloGame(playerWon) {
        if (this.botAI) {
            this.botAI = null;
        }
        
        const difficultyMessages = {
            easy: {
                win: [
                    "You beat the sleepy bot 😴",
                    "Easy mode conquered! 🎉",
                    "Bot was taking a nap 💤",
                    "Ready for medium? 🤔"
                ],
                lose: [
                    "Lost to easy mode? 😅",
                    "The sleepy bot got lucky 😴",
                    "Even easy bots have feelings 🤖",
                    "Try again, you got this! 💪"
                ]
            },
            medium: {
                win: [
                    "Balanced bot defeated! ⚖️",
                    "Fair fight, good win! 🏆",
                    "Medium mode mastered 🎯",
                    "Ready for hard mode? 😈"
                ],
                lose: [
                    "Medium bot got you 😐",
                    "Balanced and beaten 📊",
                    "Fair fight, fair loss 🤝",
                    "Almost had it! 💪"
                ]
            },
            hard: {
                win: [
                    "HARD MODE CONQUERED! 👑",
                    "You're a meme fighting legend! 🔥",
                    "Tryhard bot got rekt! 😈💀",
                    "Absolute unit performance! 💪"
                ],
                lose: [
                    "Hard bot is ruthless 😈",
                    "Tryhard mode lived up to its name 💀",
                    "That bot doesn't mess around 🤖",
                    "Respect for trying hard mode! 🫡"
                ]
            }
        };
        
        const difficulty = this.selectedDifficulty || 'medium';
        const messages = difficultyMessages[difficulty];
        const resultTexts = playerWon ? messages.win : messages.lose;
        const memeText = resultTexts[Math.floor(Math.random() * resultTexts.length)];
        
        document.getElementById('resultTitle').textContent = playerWon ? '🎉 YOU WIN! 🎉' : '💀 YOU LOSE! 💀';
        document.getElementById('memeText').textContent = memeText;
        
        // Play game over sound
        playMemeSound('gameOver');
        
        this.showScreen('gameOver');
    }
    
    // UI MANAGEMENT
    updateUI() {
        if (!this.gameState) return;
        
        document.getElementById('p1Health').textContent = this.gameState.player1.health;
        if (this.gameState.player2) {
            document.getElementById('p2Health').textContent = this.gameState.player2.health;
        }
    }
    
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
    
    // AUDIO SYSTEM - Uses meme sounds or fallback to Web Audio API
    playSound(type) {
        // Try to play meme sound first
        if (MEME_SOUNDS.length > 0) {
            playMemeSound(type);
            return;
        }
        
        // Fallback to Web Audio API if no meme sounds loaded
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (type) {
                case 'hit':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
                    break;
                case 'shoot':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                    break;
                case 'ultimate':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
                    break;
                case 'sonic':
                    oscillator.frequency.setValueAtTime(50, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);
                    break;
                case 'laser':
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.2);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log(`Sound: ${type}`);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemeFighters();
});