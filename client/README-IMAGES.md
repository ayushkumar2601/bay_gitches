# Character Images Setup

## Required Files

You need to add 4 character images to this folder:

- `1.jpeg` - Size Beast character
- `2.jpeg` - Sound Blaster character  
- `3.jpeg` - Toxic Thrower character
- `4.jpeg` - Laser Eyes character

## Image Requirements

- **Format**: JPEG (.jpeg extension)
- **Size**: Any size (will be automatically resized to fit)
- **Aspect Ratio**: Square images work best (1:1 ratio)
- **File Names**: Must be exactly `1.jpeg`, `2.jpeg`, `3.jpeg`, `4.jpeg`

## How to Add Images

1. Save your character images with the correct names
2. Place them directly in the `client` folder (same folder as this README)
3. Restart the server: `npm start`
4. The images should now appear in the character selection screen

## Troubleshooting

If images don't appear:

1. Check file names are exactly: `1.jpeg`, `2.jpeg`, `3.jpeg`, `4.jpeg`
2. Make sure files are in the `client` folder
3. Check the debug endpoint: `http://localhost:3000/debug/images`
4. Look at browser console for error messages (F12 → Console)
5. Restart the server after adding images

## Current Status

Run this command to check which images are found:
```bash
curl http://localhost:3000/debug/images
```

The game will work without images (showing colored squares as fallback), but images make it much more fun!