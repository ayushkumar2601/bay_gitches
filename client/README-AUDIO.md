# Meme Fighters: Audio System Setup

## Audio Folder Structure

Create the following folder structure in your project:

```
client/public/audio/
├── 1.mp3  (Startup sound - CID audio)
├── 2.mp3  (Hit/Miss/GameOver sounds)
├── 3.mp3  (Hit/Miss/GameOver sounds) 
├── 4.mp3  (Hit/Miss/GameOver sounds)
└── 5.mp3  (Hit/Miss/GameOver sounds)
```

## Audio File Requirements

- **Format**: MP3 files
- **Duration**: Any length (only first 4 seconds will be played)
- **Volume**: Normalized to prevent ear damage
- **Content**: Meme sounds, vine booms, sound effects, etc.

## How to Add Audio Files

1. Create the `client/public/audio/` folder
2. Add your MP3 files named `1.mp3`, `2.mp3`, `3.mp3`, `4.mp3`, `5.mp3`
3. The game will automatically preload and use them

## Audio Events

- **Startup**: Plays `1.mp3` (first 4 seconds) when game loads
- **Hit**: Random sound from `2.mp3-5.mp3` when attacks connect
- **Miss**: Random sound from `2.mp3-5.mp3` when attacks miss
- **Game Over**: Random sound from `2.mp3-5.mp3` when game ends

## Audio Behavior

- **4-Second Limit**: All sounds automatically stop after 4 seconds
- **Random Selection**: Hit/Miss/GameOver events play random sounds from the pool
- **Anti-spam Protection**: 300ms cooldown between sounds
- **Master Volume Control**: Adjustable volume (default 70%)
- **Mute Functionality**: Toggle audio on/off

## Audio Controls

- **🔊 MUTE**: Toggle audio on/off
- **🔉 LOW**: Set volume to 30%
- **🔊 HIGH**: Set volume to 70%

## Fallback

If audio files are missing, the game uses Web Audio API to generate basic sound effects.