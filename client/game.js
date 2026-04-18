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

// AUDIO SYSTEM - Preloaded meme sounds
const MEME_SOUNDS = [];
let masterVolume = 0.7;
let lastSoundTime = 0;
let audioMuted = false;
let currentlyPlayingAudio = null;
let lastPlayedIndex = -1;

// Preload audio files with actual names
function preloadAudio() {
    const audioFiles = [
        'cid.mp3.mpeg',           // Character selection sound
        'aayein.mp3.mpeg',        // Fight sounds pool
        'amongus.mp3.mpeg',       // Fight sounds pool  
        'bruh.mp3.mpeg',          // Fight sounds pool
        'faah.mp3.mpeg',          // Fight sounds pool
        'khatam.mp3.mpeg',        // Fight sounds pool
        'laughing.mp3.mpeg',      // Fight sounds pool
        'modibhujyam.mp3.mpeg',   // Fight sounds pool
        'modibkl.mp3.mpeg',       // Fight sounds pool
        'rukozara.mp3.mpeg'       // Fight sounds pool
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

// Stop any currently playing audio to prevent overlap
function stopCurrentAudio() {
    if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio.currentTime = 0;
        currentlyPlayingAudio = null;
    }
}

// Get truly random index ensuring variety (no consecutive repeats)
function getRandomSoundIndex(poolStart = 0, poolEnd = MEME_SOUNDS.length - 1) {
    if (poolEnd - poolStart <= 0) return poolStart;
    
    let randomIndex;
    let attempts = 0;
    
    do {
        randomIndex = poolStart + Math.floor(Math.random() * (poolEnd - poolStart + 1));
        attempts++;
    } while (randomIndex === lastPlayedIndex && attempts < 10 && (poolEnd - poolStart) > 1);
    
    lastPlayedIndex = randomIndex;
    return randomIndex;
}

// Play audio for specific events with 4-second limit and no overlap
function playMemeSound(eventType = 'random') {
    if (audioMuted || MEME_SOUNDS.length === 0) return;
    
    const now = Date.now();
    const minInterval = 100;
    
    if (now - lastSoundTime < minInterval) return;
    
    try {
        const allowedEvents = ['hit', 'miss', 'gameOver', 'characterSelect'];
        if (!allowedEvents.includes(eventType)) return;
        
        stopCurrentAudio();
        
        let sound;
        let soundIndex;
        
        if (eventType === 'characterSelect') {
            soundIndex = 0;
            sound = MEME_SOUNDS[0];
        } else {
            soundIndex = getRandomSoundIndex(0, MEME_SOUNDS.length - 1);
            sound = MEME_SOUNDS[soundIndex];
        }
        
        const soundClone = sound.cloneNode();
        soundClone.volume = masterVolume;
        soundClone.currentTime = 0;
        
        currentlyPlayingAudio = soundClone;
        
        soundClone.play().then(() => {
            const timeoutId = setTimeout(() => {
                if (currentlyPlayingAudio === soundClone) {
                    soundClone.pause();
                    soundClone.currentTime = 0;
                    currentlyPlayingAudio = null;
                }
            }, 4000);
            
            soundClone.addEventListener('ended', () => {
                clearTimeout(timeoutId);
                if (currentlyPlayingAudio === soundClone) {
                    currentlyPlayingAudio = null;
                }
            });
            
        }).catch(e => console.warn('Audio play failed:', e));
        
        lastSoundTime = now;
        console.log(`Playing sound ${soundIndex} for: ${eventType}`);
    } catch (error) {
        console.warn('Error playing meme sound:', error);
    }
}

// Audio control functions
function toggleMute() {
    audioMuted = !audioMuted;
    if (audioMuted) {
        stopCurrentAudio();
    }
    console.log('Audio muted:', audioMuted);
}

function setVolume(volume) {
    masterVolume = Math.max(0, Math.min(1, volume));
    MEME_SOUNDS.forEach(sound => {
        sound.volume = masterVolume;
    });
    if (currentlyPlayingAudio) {
        currentlyPlayingAudio.volume = masterVolume;
    }
}

// Initialize audio system
document.addEventListener('DOMContentLoaded', () => {
    preloadAudio();
});

// MAIN GAME HUB CLASS
class GameHub {
    constructor() {
        console.log('🎮 GameHub constructor called');
        
        // Core systems
        this.socket = io();
        this.currentGame = null;
        this.selectedGame = null;
        this.playerNumber = null;
        this.roomCode = null;
        this.gameMode = null;
        
        // Game instances
        this.memeFighters = null;
        this.ticTacToe = null;
        this.reactionClick = null;
        
        // UI System
        this.currentScreen = 'lobby';
        this.isTransitioning = false;
        
        // Character/difficulty selection
        this.selectedCharacter = null;
        this.selectedDifficulty = null;
        this.roomCodeToJoin = null;
        
        this.init();
    }
    
    init() {
        console.log('🚀 GameHub initializing...');
        this.setupEventListeners();
        this.setupSocketEvents();
        this.setupConnectionDebug();
        this.showScreen('lobby');
        console.log('✅ GameHub initialized');
    }
    
    // SCREEN MANAGEMENT
    showScreen(screenId) {
        console.log(`📺 Showing screen: ${screenId}`);
        
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const currentScreenEl = document.querySelector('.screen.active');
        const newScreenEl = document.getElementById(screenId);
        
        if (!newScreenEl) {
            console.error(`Screen ${screenId} not found`);
            this.isTransitioning = false;
            return;
        }
        
        // Fade out current screen
        if (currentScreenEl) {
            currentScreenEl.classList.remove('active');
        }
        
        // Fade in new screen after delay
        setTimeout(() => {
            newScreenEl.classList.add('active');
            this.currentScreen = screenId;
            this.isTransitioning = false;
            
            // Screen-specific setup
            this.onScreenChanged(screenId);
        }, currentScreenEl ? 250 : 0);
    }
    
    onScreenChanged(screenId) {
        switch (screenId) {
            case 'gameSelect':
                setTimeout(() => {
                    playMemeSound('characterSelect');
                }, 500);
                break;
            case 'characterSelect':
                setTimeout(() => {
                    playMemeSound('characterSelect');
                }, 500);
                break;
        }
    }
    
    // ENHANCED UI INTERACTIONS
    addButtonClickEffect(element) {
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 150);
    }
    
    // EVENT LISTENERS
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Main menu buttons
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const playSoloBtn = document.getElementById('playSoloBtn');
        
        if (!createRoomBtn || !joinRoomBtn || !playSoloBtn) {
            console.error('❌ Main menu buttons not found in DOM');
            return;
        }
        
        createRoomBtn.addEventListener('click', (e) => {
            console.log('🏠 Create Room button clicked');
            this.addButtonClickEffect(e.target);
            this.gameMode = 'create';
            this.showGameSelection();
        });
        
        joinRoomBtn.addEventListener('click', (e) => {
            console.log('🚪 Join Room button clicked');
            this.addButtonClickEffect(e.target);
            document.getElementById('joinRoomInput').classList.remove('hidden');
            document.querySelector('.main-menu').classList.add('hidden');
        });
        
        playSoloBtn.addEventListener('click', (e) => {
            console.log('🤖 Play Solo button clicked');
            this.addButtonClickEffect(e.target);
            this.gameMode = 'solo';
            this.showDifficultySelection();
        });
        
        // Join room functionality
        const joinBtn = document.getElementById('joinBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (joinBtn && cancelBtn) {
            joinBtn.addEventListener('click', (e) => {
                const roomCode = document.getElementById('roomCodeInput').value;
                if (roomCode.length === 4) {
                    this.addButtonClickEffect(e.target);
                    this.gameMode = 'join';
                    this.roomCodeToJoin = roomCode;
                    this.showGameSelection();
                }
            });
            
            cancelBtn.addEventListener('click', (e) => {
                this.addButtonClickEffect(e.target);
                document.getElementById('joinRoomInput').classList.add('hidden');
                document.querySelector('.main-menu').classList.remove('hidden');
                document.getElementById('roomCodeInput').value = '';
            });
        }
        
        // Game selection
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectGame(card.dataset.game);
            });
        });
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectDifficulty(card.dataset.difficulty);
            });
        });
        
        // Character selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(parseInt(card.dataset.character));
            });
        });
        
        // Confirm buttons
        const confirmDifficultyBtn = document.getElementById('confirmDifficultyBtn');
        if (confirmDifficultyBtn) {
            confirmDifficultyBtn.addEventListener('click', (e) => {
                console.log('✅ Difficulty confirm button clicked');
                this.addButtonClickEffect(e.target);
                this.confirmDifficultySelection();
            });
        }
        
        const confirmCharacterBtn = document.getElementById('confirmCharacterBtn');
        if (confirmCharacterBtn) {
            confirmCharacterBtn.addEventListener('click', (e) => {
                console.log('✅ Character confirm button clicked');
                this.addButtonClickEffect(e.target);
                this.confirmCharacterSelection();
            });
        }
        
        const confirmGameBtn = document.getElementById('confirmGameBtn');
        if (confirmGameBtn) {
            confirmGameBtn.addEventListener('click', (e) => {
                console.log('✅ Game confirm button clicked');
                this.addButtonClickEffect(e.target);
                this.confirmGameSelection();
            });
        }
        
        // Result screen buttons
        const playAgainBtn = document.getElementById('playAgainBtn');
        const changeGameBtn = document.getElementById('changeGameBtn');
        const copyMemeBtn = document.getElementById('copyMemeBtn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', (e) => {
                this.addButtonClickEffect(e.target);
                this.playAgain();
            });
        }
        
        if (changeGameBtn) {
            changeGameBtn.addEventListener('click', (e) => {
                this.addButtonClickEffect(e.target);
                this.changeGame();
            });
        }
        
        if (copyMemeBtn) {
            copyMemeBtn.addEventListener('click', (e) => {
                this.addButtonClickEffect(e.target);
                const memeText = document.getElementById('memeText').textContent;
                navigator.clipboard.writeText(memeText).then(() => {
                    this.showGameMessage('Copied to clipboard! 📋', 1000);
                });
            });
        }
        
        // Room code input enhancement
        const roomInput = document.getElementById('roomCodeInput');
        if (roomInput) {
            roomInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        
        console.log('✅ Event listeners setup complete');
        
        // Test if confirm buttons exist (check only, don't redeclare)
        console.log('🔍 Confirm buttons check:', {
            confirmDifficultyBtn: !!document.getElementById('confirmDifficultyBtn'),
            confirmCharacterBtn: !!document.getElementById('confirmCharacterBtn'),
            confirmGameBtn: !!document.getElementById('confirmGameBtn')
        });
    }
    
    // SOCKET EVENTS
    setupSocketEvents() {
        this.socket.on('roomCreated', (data) => {
            console.log('Room created event received:', data);
            this.playerNumber = data.playerNumber;
            this.roomCode = data.roomCode;
            document.getElementById('roomCode').textContent = data.roomCode;
            
            document.getElementById('roomInfo').classList.remove('hidden');
            document.querySelector('.main-menu').classList.add('hidden');
            document.getElementById('joinRoomInput').classList.add('hidden');
        });
        
        this.socket.on('bothPlayersReady', () => {
            console.log('Both players ready, showing game selection');
            this.showScreen('gameSelect');
        });
        
        this.socket.on('error', (message) => {
            alert(message);
        });
    }
    
    // CONNECTION DEBUG
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
    
    // GAME SELECTION
    showGameSelection() {
        this.showScreen('gameSelect');
    }
    
    selectGame(gameType) {
        console.log('🎮 Game selected:', gameType);
        
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-game="${gameType}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.selectedGame = gameType;
        
        if (this.gameMode === 'solo') {
            if (gameType === 'memeFighters') {
                this.showDifficultySelection();
            } else {
                alert(`${gameType} solo mode coming soon!`);
            }
        } else {
            // Multiplayer mode
            if (gameType === 'memeFighters') {
                this.showCharacterSelection();
            } else {
                alert(`${gameType} multiplayer coming soon!`);
            }
        }
    }
    
    // DIFFICULTY SELECTION
    showDifficultySelection() {
        this.showScreen('difficultySelect');
    }
    
    selectDifficulty(difficulty) {
        console.log('🎯 Difficulty selected:', difficulty);
        
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-difficulty="${difficulty}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            console.log('✅ Difficulty card selected and highlighted');
        } else {
            console.error('❌ Difficulty card not found:', difficulty);
        }
        
        this.selectedDifficulty = difficulty;
        
        const confirmBtn = document.getElementById('confirmDifficultyBtn');
        if (confirmBtn) {
            confirmBtn.classList.remove('hidden');
            console.log('✅ Difficulty confirm button shown');
        } else {
            console.error('❌ Difficulty confirm button not found');
        }
    }
    
    confirmDifficultySelection() {
        if (!this.selectedDifficulty) return;
        
        console.log('Difficulty confirmed:', this.selectedDifficulty);
        this.showCharacterSelection();
    }
    
    confirmGameSelection() {
        if (!this.selectedGame) return;
        
        console.log('Game selection confirmed:', this.selectedGame);
        
        if (this.gameMode === 'solo') {
            this.startSelectedGame();
        } else {
            this.socket.emit('confirmGame', { game: this.selectedGame });
        }
    }
    
    startSelectedGame() {
        console.log('🎮 Starting selected game:', this.selectedGame);
        
        switch (this.selectedGame) {
            case 'memeFighters':
                if (this.gameMode === 'solo') {
                    this.showCharacterSelection();
                } else {
                    this.showCharacterSelection();
                }
                break;
            case 'ticTacToe':
                this.showScreen('ticTacToe');
                break;
            case 'reactionClick':
                this.showScreen('reactionClick');
                break;
        }
    }
    
    playAgain() {
        if (this.gameMode === 'solo') {
            location.reload();
        } else {
            this.socket.emit('playAgain');
        }
    }
    
    changeGame() {
        if (this.gameMode === 'solo') {
            this.showGameSelection();
        } else {
            this.socket.emit('changeGame');
            this.showGameSelection();
        }
    }
    
    // CHARACTER SELECTION
    showCharacterSelection() {
        this.showScreen('characterSelect');
        setTimeout(() => {
            playMemeSound('characterSelect');
        }, 500);
    }
    
    selectCharacter(characterId) {
        console.log('👤 Character selected:', characterId);
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-character="${characterId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            console.log('✅ Character card selected and highlighted');
        } else {
            console.error('❌ Character card not found:', characterId);
        }
        
        this.selectedCharacter = CHARACTERS.find(c => c.id === characterId);
        if (this.selectedCharacter) {
            console.log('✅ Character data found:', this.selectedCharacter.name);
        } else {
            console.error('❌ Character data not found for ID:', characterId);
        }
        
        const confirmBtn = document.getElementById('confirmCharacterBtn');
        if (confirmBtn) {
            confirmBtn.classList.remove('hidden');
            console.log('✅ Character confirm button shown');
        } else {
            console.error('❌ Character confirm button not found');
        }
    }
    
    confirmCharacterSelection() {
        if (!this.selectedCharacter) return;
        
        console.log('Character confirmed:', this.selectedCharacter.name, 'for mode:', this.gameMode);
        
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
    
    // SOLO MODE IMPLEMENTATION - FULL GAME
    startSoloMode() {
        console.log('🤖 Starting solo mode...');
        console.log(`Character: ${this.selectedCharacter.name}`);
        console.log(`Difficulty: ${this.selectedDifficulty}`);
        
        // Initialize full game state
        this.isSoloMode = true;
        this.playerNumber = 1;
        
        // Create bot character
        const botCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        
        // Initialize game state with full physics and rendering
        this.gameState = {
            player1: this.createPlayerObject({ 
                id: 'human', 
                x: 150, 
                y: 200, 
                health: 100, 
                canMove: true, 
                hasUlt: true,
                characterId: this.selectedCharacter.id,
                ability: this.selectedCharacter.ability
            }),
            player2: this.createPlayerObject({ 
                id: 'bot', 
                x: 650, 
                y: 200, 
                health: 100, 
                canMove: true, 
                hasUlt: true,
                characterId: botCharacter.id,
                ability: botCharacter.ability
            })
        };
        
        // Initialize game systems
        this.keys = {};
        this.projectiles = [];
        this.particles = [];
        this.animations = [];
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.lastTime = 0;
        this.deltaTime = 0;
        this.lastNetworkUpdate = 0;
        
        // Initialize bot AI
        this.initBotAI();
        
        // Start the game
        this.startGame();
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
                x: playerData.x - 40,
                y: playerData.y - 40,
                width: 80,
                height: 80
            },
            // Status effects
            sizeBoosted: false,
            reversed: false
        };
    }
    
    initBotAI() {
        const difficultySettings = {
            easy: {
                speedMultiplier: 0.4,
                reactionDelay: 800,
                attackChance: 0.08,
                abilityChance: 0.02,
                attackCooldown: [2500, 4000],
                abilityCooldown: [8000, 12000],
                ultimateChance: 0.1,
                defensiveBehavior: 0.4
            },
            medium: {
                speedMultiplier: 0.6,
                reactionDelay: 300,
                attackChance: 0.15,
                abilityChance: 0.03,
                attackCooldown: [1500, 3000],
                abilityCooldown: [5000, 8000],
                ultimateChance: 0.2,
                defensiveBehavior: 0.3
            },
            hard: {
                speedMultiplier: 0.8,
                reactionDelay: 150,
                attackChance: 0.25,
                abilityChance: 0.05,
                attackCooldown: [800, 1500],
                abilityCooldown: [3000, 5000],
                ultimateChance: 0.35,
                defensiveBehavior: 0.1
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
    
    startGame() {
        this.showScreen('game');
        this.setupCanvas();
        this.setupInputSystem();
        
        // Update UI labels
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
        
        // Update abilities display
        const p1Character = CHARACTERS.find(c => c.id === this.gameState.player1.characterId);
        const p2Character = CHARACTERS.find(c => c.id === this.gameState.player2.characterId);
        
        document.getElementById('p1Ability').textContent = p1Character ? p1Character.ability : 'unknown';
        document.getElementById('p2Ability').textContent = p2Character ? p2Character.ability : 'unknown';
        
        // Initialize health bars
        this.updateHealthBars();
        
        // Start the main game loop
        this.startGameLoop();
    }
    
    setupCanvas() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Game canvas not found');
            return;
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size to full screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        console.log('Canvas setup complete:', canvas.width, 'x', canvas.height);
    }
    
    setupInputSystem() {
        // Clear any existing listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Bind methods to preserve 'this' context
        this.handleKeyDown = (e) => {
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
        };
        
        this.handleKeyUp = (e) => {
            this.keys[e.code] = false;
        };
        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        console.log('Input system setup complete');
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Update game logic
            this.update(this.deltaTime);
            
            // Render everything
            this.render();
            
            // Continue loop
            if (this.gameState) {
                requestAnimationFrame(gameLoop);
            }
        };
        
        this.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        console.log('Game loop started');
    }
    
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
        
        // Solo mode AI
        if (this.isSoloMode) {
            this.updateBotAI(deltaTime);
        }
    }
    
    handleInput() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        if (!player || !player.canMove) return;
        
        // Reset velocity
        player.vx = 0;
        player.vy = 0;
        
        const speed = 5;
        
        // Apply movement based on keys
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            player.vx = -speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            player.vx = speed;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            player.vy = -speed;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            player.vy = speed;
        }
        
        // Apply reverse effect
        if (player.reversed) {
            player.vx = -player.vx;
            player.vy = -player.vy;
        }
        
        // Update animation state
        if (player.vx !== 0 || player.vy !== 0) {
            this.setPlayerState(player, 'run');
        } else if (player.state === 'run') {
            this.setPlayerState(player, 'idle');
        }
    }
    
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
        const margin = 40;
        player.x = Math.max(margin, Math.min(this.canvas.width - margin, player.x));
        player.y = Math.max(margin, Math.min(this.canvas.height - margin, player.y));
    }
    
    updatePlayerInterpolation(player, deltaTime) {
        // Smooth interpolation for rendering position
        const lerpFactor = 0.2;
        player.renderX += (player.x - player.renderX) * lerpFactor;
        player.renderY += (player.y - player.renderY) * lerpFactor;
        
        // Enhanced animation scale interpolation
        let targetScale = 1;
        
        if (player.state === 'attack' && player.stateTime < 400) {
            targetScale = 1.4;
        } else if (player.state === 'ability' && player.stateTime < 600) {
            const character = CHARACTERS.find(c => c.id === player.characterId);
            targetScale = character?.ability === 'size_boost' ? 2.2 : 1.6;
        } else if (player.state === 'hit' && player.stateTime < 300) {
            const hitProgress = player.stateTime / 300;
            targetScale = 1 + Math.sin(hitProgress * Math.PI * 4) * 0.2;
        } else if (player.state === 'run') {
            targetScale = 1 + Math.sin(player.stateTime * 0.01) * 0.05;
        }
        
        // Size boost effect
        if (player.sizeBoosted) {
            targetScale *= 1.8;
        }
        
        player.scale += (targetScale - player.scale) * 0.3;
        
        // Auto-reset animation states
        if (player.state === 'attack' && player.stateTime > 400) {
            this.setPlayerState(player, 'idle');
        } else if (player.state === 'ability' && player.stateTime > 600) {
            this.setPlayerState(player, 'idle');
        } else if (player.state === 'hit' && player.stateTime > 300) {
            this.setPlayerState(player, 'idle');
        }
    }
    
    updatePlayerHitbox(player) {
        const size = 80 * player.scale;
        player.hitbox.x = player.x - size/2;
        player.hitbox.y = player.y - size/2;
        player.hitbox.width = size;
        player.hitbox.height = size;
    }
    
    setPlayerState(player, newState) {
        if (player.state !== newState) {
            player.state = newState;
            player.stateTime = 0;
        }
    }
    
    updateHealthBars() {
        if (!this.gameState) return;
        
        const p1Health = this.gameState.player1?.health || 0;
        const p2Health = this.gameState.player2?.health || 0;
        
        const p1Bar = document.getElementById('p1HealthBar');
        const p2Bar = document.getElementById('p2HealthBar');
        const p1Text = document.getElementById('p1Health');
        const p2Text = document.getElementById('p2Health');
        
        if (p1Bar) {
            p1Bar.style.width = `${p1Health}%`;
            if (p1Health > 60) {
                p1Bar.style.background = 'linear-gradient(90deg, #98FB98, #FFE066)';
            } else if (p1Health > 30) {
                p1Bar.style.background = 'linear-gradient(90deg, #FFE066, #FF6B9D)';
            } else {
                p1Bar.style.background = '#FF6B9D';
            }
        }
        
        if (p2Bar) {
            p2Bar.style.width = `${p2Health}%`;
            if (p2Health > 60) {
                p2Bar.style.background = 'linear-gradient(90deg, #98FB98, #FFE066)';
            } else if (p2Health > 30) {
                p2Bar.style.background = 'linear-gradient(90deg, #FFE066, #FF6B9D)';
            } else {
                p2Bar.style.background = '#FF6B9D';
            }
        }
        
        if (p1Text) p1Text.textContent = p1Health;
        if (p2Text) p2Text.textContent = p2Health;
    }
    
    // GAME MESSAGE SYSTEM
    showGameMessage(text, duration = 1000) {
        console.log('💬 Game message:', text);
        // Implementation for showing in-game messages
    }
    
    // COMBAT SYSTEM
    handleAttack() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        if (!player) return;
        
        this.setPlayerState(player, 'attack');
        this.addAttackEffect(player);
        
        if (this.isSoloMode) {
            this.handleSoloAttack();
        }
    }
    
    handleAbility() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        if (!player) return;
        
        this.setPlayerState(player, 'ability');
        
        if (this.isSoloMode) {
            this.handleSoloAbility();
        }
    }
    
    handleUltimate() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        if (!player || !player.hasUlt) return;
        
        if (this.isSoloMode) {
            this.handleSoloUltimate();
        }
    }
    
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
        
        this.updateHealthBars();
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
        
        this.updateHealthBars();
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
        
        if (bot.health <= 0) {
            this.endSoloGame(true);
        }
        
        this.updateHealthBars();
    }
    
    // GAME MESSAGE SYSTEM
    showGameMessage(text, duration = 1000) {
        console.log('💬 Game message:', text);
        // Implementation for showing in-game messages
    }
    
    showResultAnimation(playerWon) {
        // Add result animation effects
        console.log('🎬 Result animation:', playerWon ? 'WIN' : 'LOSE');
    }
}

// TIC TAC TOE GAME CLASS (Placeholder)
class TicTacToeGame {
    constructor(socket, playerNumber) {
        this.socket = socket;
        this.playerNumber = playerNumber;
        console.log('❌⭕ Tic Tac Toe game initialized');
    }
}

// REACTION CLICK GAME CLASS (Placeholder)
class ReactionClickGame {
    constructor(socket, playerNumber) {
        this.socket = socket;
        this.playerNumber = playerNumber;
        console.log('⚡ Reaction Click game initialized');
    }
}

// Initialize game hub when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded event fired');
    
    // Immediate button test
    const createBtn = document.getElementById('createRoomBtn');
    const joinBtn = document.getElementById('joinRoomBtn');
    const soloBtn = document.getElementById('playSoloBtn');
    
    console.log('🔍 Immediate button check:', {
        createBtn: !!createBtn,
        joinBtn: !!joinBtn,
        soloBtn: !!soloBtn
    });
    
    // Add immediate test listeners
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            console.log('🎯 DIRECT CREATE BUTTON CLICKED!');
            alert('Direct create button works!');
        });
        console.log('✅ Direct create listener added');
    } else {
        console.error('❌ createRoomBtn not found!');
    }
    
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            console.log('🎯 DIRECT JOIN BUTTON CLICKED!');
            alert('Direct join button works!');
        });
        console.log('✅ Direct join listener added');
    } else {
        console.error('❌ joinRoomBtn not found!');
    }
    
    if (soloBtn) {
        soloBtn.addEventListener('click', () => {
            console.log('🎯 DIRECT SOLO BUTTON CLICKED!');
            alert('Direct solo button works!');
        });
        console.log('✅ Direct solo listener added');
    } else {
        console.error('❌ playSoloBtn not found!');
    }
    
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
        console.log('Initializing GameHub...');
        
        try {
            window.gameHub = new GameHub();
            console.log('GameHub initialized successfully');
        } catch (error) {
            console.error('❌ GameHub initialization failed:', error);
        }
    }, 100);
});
        
        const player = this.gameState.player1;
        if (!player) return;
        
        this.setPlayerState(player, 'attack');
        this.addAttackEffect(player);
        
        if (this.isSoloMode) {
            this.handleSoloAttack();
        }
    }
    
    handleAbility() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        if (!player) return;
        
        this.setPlayerState(player, 'ability');
        
        if (this.isSoloMode) {
            this.handleSoloAbility();
        }
    }
    
    handleUltimate() {
        if (!this.gameState) return;
        
        const player = this.gameState.player1;
        if (!player || !player.hasUlt) return;
        
        if (this.isSoloMode) {
            this.handleSoloUltimate();
        }
    }
    
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
        
        this.updateHealthBars();
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
        
        this.updateHealthBars();
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
        
        if (bot.health <= 0) {
            this.endSoloGame(true);
        }
        
        this.updateHealthBars();
    }
    
    // BOT AI SYSTEM
    updateBotAI(deltaTime) {
        if (!this.gameState || !this.botAI) return;
        
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        const now = Date.now();
        const settings = this.botAI.settings;
        
        // Bot movement AI
        if (bot.canMove) {
            const dx = player.x - bot.x;
            const dy = player.y - bot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Reset velocity
            bot.vx = 0;
            bot.vy = 0;
            
            const minDistance = this.selectedDifficulty === 'easy' ? 120 : 
                               this.selectedDifficulty === 'medium' ? 80 : 60;
            
            if (distance > minDistance) {
                const botSpeed = 5 * settings.speedMultiplier;
                
                bot.vx = Math.sign(dx) * botSpeed;
                bot.vy = Math.sign(dy) * botSpeed;
                
                // Add randomness
                const randomness = this.selectedDifficulty === 'easy' ? 0.02 : 
                                  this.selectedDifficulty === 'medium' ? 0.05 : 0.08;
                
                if (Math.random() < randomness) {
                    bot.vx += (Math.random() - 0.5) * 2;
                    bot.vy += (Math.random() - 0.5) * 2;
                }
                
                // Defensive behavior
                if (Math.random() < settings.defensiveBehavior && distance < minDistance + 40) {
                    bot.vx = -bot.vx * 0.5;
                    bot.vy = -bot.vy * 0.5;
                }
            } else {
                // Back away sometimes
                if (Math.random() < settings.defensiveBehavior) {
                    bot.vx = -Math.sign(dx) * 5 * 0.3;
                    bot.vy = -Math.sign(dy) * 5 * 0.3;
                }
            }
            
            // Apply reverse effect
            if (bot.reversed) {
                bot.vx = -bot.vx;
                bot.vy = -bot.vy;
            }
            
            // Update bot position
            this.updatePlayerPhysics(bot, deltaTime);
            
            // Attack logic
            const attackDistance = this.selectedDifficulty === 'easy' ? 70 : 
                                  this.selectedDifficulty === 'medium' ? 80 : 90;
            
            if (distance < attackDistance && now > this.botAI.nextActionTime) {
                if (Math.random() < settings.attackChance) {
                    this.botAttack();
                    const cooldownRange = settings.attackCooldown;
                    const cooldown = cooldownRange[0] + Math.random() * (cooldownRange[1] - cooldownRange[0]);
                    this.botAI.nextActionTime = now + cooldown;
                }
            }
        }
        
        // Bot ability usage
        if (now > this.botAI.nextAbilityTime) {
            if (Math.random() < settings.abilityChance) {
                this.botUseAbility();
                const cooldownRange = settings.abilityCooldown;
                const cooldown = cooldownRange[0] + Math.random() * (cooldownRange[1] - cooldownRange[0]);
                this.botAI.nextAbilityTime = now + cooldown;
            }
        }
        
        // Bot ultimate usage
        const ultimateHealthThreshold = this.selectedDifficulty === 'easy' ? 40 : 
                                       this.selectedDifficulty === 'medium' ? 60 : 70;
        
        if (bot.hasUlt && player.health < ultimateHealthThreshold && now > this.botAI.nextActionTime) {
            if (Math.random() < settings.ultimateChance) {
                this.botUltimate();
                this.botAI.nextActionTime = now + 2000;
            }
        }
    }
    
    botAttack() {
        const bot = this.gameState.player2;
        const player = this.gameState.player1;
        
        this.setPlayerState(bot, 'attack');
        
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
        
        this.updateHealthBars();
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
        
        this.updateHealthBars();
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
        
        if (player.health <= 0) {
            this.endSoloGame(false);
        }
        
        this.updateHealthBars();
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
        
        const opponent = projectile.owner === 1 ? this.gameState.player2 : this.gameState.player1;
        if (!opponent) return false;
        
        if (this.isColliding(projectile, opponent.hitbox)) {
            this.handleProjectileHit(projectile, opponent);
            return true;
        }
        
        return false;
    }
    
    handleProjectileHit(projectile, target) {
        target.health = Math.max(0, target.health - projectile.damage);
        
        this.setPlayerState(target, 'hit');
        this.addHitEffect(target.x, target.y);
        this.addScreenShake(8);
        
        playMemeSound('hit');
        this.addDamageNumber(target.x, target.y, projectile.damage);
        
        if (target.health <= 0 && this.isSoloMode) {
            const playerWon = target.id === 'bot';
            this.endSoloGame(playerWon);
        }
        
        this.updateHealthBars();
    }
    
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    isOutOfBounds(obj) {
        return obj.x < -50 || obj.x > this.canvas.width + 50 ||
               obj.y < -50 || obj.y > this.canvas.height + 50;
    }
    
    createProjectile(startX, startY, targetX, targetY, type, damage, owner) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let projectileSpeed = 8;
        if (owner === 2) {
            projectileSpeed = 8 * 0.75;
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
            life: 2000
        };
        
        this.projectiles.push(projectile);
    }
    
    createLaserBeam(startX, startY, targetX, targetY) {
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
    }
    
    createSoundWave(x, y) {
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
    }
    
    // PARTICLE SYSTEM
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }
            
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateAnimations(deltaTime) {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            
            anim.time += deltaTime;
            
            if (anim.time >= anim.duration) {
                this.animations.splice(i, 1);
            }
        }
    }
    
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
    
    addHitEffect(x, y) {
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
    
    showMessage(text, duration = 1000) {
        const messagesEl = document.getElementById('gameMessages');
        if (!messagesEl) return;
        
        messagesEl.textContent = text;
        messagesEl.classList.add('show');
        
        setTimeout(() => {
            messagesEl.classList.remove('show');
        }, duration);
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
                    "The tryhard bot got rekt! 😈",
                    "Absolute unit performance! 💪"
                ],
                lose: [
                    "Hard bot is ruthless 😈",
                    "Tryhard mode lived up to its name 💀",
                    "That bot doesn't mess around 🤖",
                    "Respect the grind! 💪"
                ]
            }
        };
        
        const messages = difficultyMessages[this.selectedDifficulty] || difficultyMessages.medium;
        const messageList = playerWon ? messages.win : messages.lose;
        const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
        
        // Show result screen
        document.getElementById('resultTitle').textContent = playerWon ? '🎉 YOU WIN! 🎉' : '💀 YOU LOSE! 💀';
        document.getElementById('memeText').textContent = randomMessage;
        
        this.showResultAnimation(playerWon);
        
        setTimeout(() => {
            playMemeSound('gameOver');
        }, 300);
        
        // Stop the game loop
        this.gameState = null;
        
        this.showScreen('gameOver');
    }
    
    // RENDERING SYSTEM
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
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // Dynamic background elements
        const elementSize = Math.min(width, height) * 0.08;
        
        // Floating shapes
        this.ctx.fillStyle = 'rgba(255, 224, 102, 0.1)';
        this.ctx.fillRect(width * 0.1, height * 0.2, elementSize, elementSize);
        this.ctx.strokeStyle = 'rgba(255, 224, 102, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(width * 0.1, height * 0.2, elementSize, elementSize);
        
        this.ctx.fillStyle = 'rgba(255, 107, 157, 0.1)';
        this.ctx.fillRect(width * 0.8, height * 0.7, elementSize * 0.8, elementSize * 0.6);
        this.ctx.strokeStyle = 'rgba(255, 107, 157, 0.3)';
        this.ctx.strokeRect(width * 0.8, height * 0.7, elementSize * 0.8, elementSize * 0.6);
        
        this.ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.85, height * 0.15, elementSize * 0.4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
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
        const size = 80 * player.scale;
        
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
                // Explosion effect
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
                // Attack wave effect
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