# Meme Fighters: Audio System Setup

## Audio Folder Structure

The audio files are located in `client/public/audio/` with these names:

```
client/public/audio/
├── cid.mp3.mpeg           (Character selection sound)
├── aayein.mp3.mpeg        (Fight sounds - random pool)
├── amongus.mp3.mpeg       (Fight sounds - random pool)
├── bruh.mp3.mpeg          (Fight sounds - random pool)
├── faah.mp3.mpeg          (Fight sounds - random pool)
├── khatam.mp3.mpeg        (Fight sounds - random pool)
├── laughing.mp3.mpeg      (Fight sounds - random pool)
├── modibhujyam.mp3.mpeg   (Fight sounds - random pool)
├── modibkl.mp3.mpeg       (Fight sounds - random pool)
└── rukozara.mp3.mpeg      (Fight sounds - random pool)
```

## Audio Events

- **Character Selection**: Plays `cid.mp3.mpeg` (first 4 seconds) when entering character selection screen
- **Hit**: Truly random sound from ALL 10 files when attacks connect
- **Miss**: Truly random sound from ALL 10 files when attacks miss
- **Game Over**: Truly random sound from ALL 10 files when game ends

## Audio Behavior

- **4-Second Limit**: All sounds automatically stop after 4 seconds
- **No Overlap**: New sounds stop any currently playing audio to prevent collision
- **True Randomness**: Uses all 10 files randomly for fight events, avoids consecutive repeats
- **Variety Guarantee**: Algorithm ensures different sounds play in sequence
- **Anti-spam Protection**: 100ms cooldown between sounds for responsiveness

## Audio Controls

- **🔊 MUTE**: Toggle audio on/off (stops current audio immediately)
- **🔉 LOW**: Set volume to 30%
- **🔊 HIGH**: Set volume to 70%

## Technical Details

- **Overlap Prevention**: Stops current audio before playing new sound
- **Smart Randomization**: Tracks last played sound to ensure variety
- **Volume Sync**: Volume changes apply to currently playing audio
- **Graceful Cleanup**: Proper audio cleanup when sounds end or are stopped
- **Event Timing**: Character selection sound has 500ms delay for smooth transition