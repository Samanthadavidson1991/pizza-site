// Check what's actually in the live JS file
const https = require('https');

console.log('🔍 Checking what deployed to live site...');

const url = 'https://thecrustatngb.co.uk/menu.js?v=25-syntax-fixed';

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`📏 File size: ${data.length} characters`);
        
        // Show first 500 characters to see what's at the start
        console.log('\n📄 FIRST 500 CHARACTERS:');
        console.log('=' .repeat(50));
        console.log(data.substring(0, 500));
        console.log('=' .repeat(50));
        
        // Show last 500 characters to see what's at the end
        console.log('\n📄 LAST 500 CHARACTERS:');
        console.log('=' .repeat(50));
        console.log(data.substring(data.length - 500));
        console.log('=' .repeat(50));
        
        // Check for any recognizable patterns
        const hasHTML = data.includes('<html>') || data.includes('<!DOCTYPE');
        const hasCSS = data.includes('.menu-item') || data.includes('background:');
        const hasJS = data.includes('function') || data.includes('const ') || data.includes('var ');
        
        console.log('\n📊 CONTENT ANALYSIS:');
        console.log('Contains HTML:', hasHTML ? 'YES' : 'NO');
        console.log('Contains CSS:', hasCSS ? 'YES' : 'NO');
        console.log('Contains JavaScript:', hasJS ? 'YES' : 'NO');
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});