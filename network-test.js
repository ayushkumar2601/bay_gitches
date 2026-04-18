// Network Test Script for Meme Fighters: Chaos Duel
// Run this to find your local IP address for LAN play

const os = require('os');

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                addresses.push({
                    interface: name,
                    address: interface.address
                });
            }
        }
    }
    
    return addresses;
}

console.log('🌐 Meme Fighters: Network Configuration Test');
console.log('='.repeat(50));

const addresses = getLocalIPAddress();

if (addresses.length === 0) {
    console.log('❌ No network interfaces found');
    console.log('Make sure you are connected to WiFi or Ethernet');
} else {
    console.log('✅ Available network addresses:');
    addresses.forEach((addr, index) => {
        console.log(`${index + 1}. ${addr.interface}: ${addr.address}`);
        console.log(`   LAN URL: http://${addr.address}:3000`);
    });
    
    console.log('\n📋 Instructions:');
    console.log('1. Start the game server: npm start');
    console.log('2. Host opens: http://localhost:3000');
    console.log('3. Friend opens one of the LAN URLs above');
    console.log('4. Create/join rooms and play!');
}

console.log('\n🔧 Troubleshooting:');
console.log('- Ensure both computers are on the same WiFi');
console.log('- Check firewall settings for port 3000');
console.log('- Try different network addresses if one doesn\'t work');