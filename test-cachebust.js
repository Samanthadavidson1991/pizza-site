// Test the specific new version
const https = require('https');

console.log('🔍 Testing v26-cachebust specifically...');

const url = 'https://thecrustatngb.co.uk/menu.js?v=26-cachebust';

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        const functions = {
            'renderMenuFromAPI': data.includes('renderMenuFromAPI'),
            'clearCart': data.includes('function clearCart'),
            'addToCart': data.includes('function addToCart'),
            'DOMContentLoaded': data.includes('DOMContentLoaded')
        };
        
        console.log(`📏 File size: ${data.length} characters`);
        console.log('\n📋 Function Check:');
        Object.entries(functions).forEach(([name, exists]) => {
            console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'FOUND' : 'MISSING'}`);
        });
        
        if (functions.renderMenuFromAPI && functions.DOMContentLoaded) {
            console.log('\n🎉 SUCCESS! Menu should now load correctly!');
            console.log('🍕 Your menu should appear within 30 seconds');
        } else {
            console.log('\n❌ Still missing critical functions');
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});