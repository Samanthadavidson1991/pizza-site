// Test the live site to see if click handlers are now working
const https = require('https');

console.log('🔍 Testing live site click handlers...');

const url = 'https://thecrustatngb.co.uk/menu.js?v=18-debug';

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        // Check for the fixed function syntax
        const hasFunctionSyntax = data.includes('sizeDiv.onclick = function()');
        const hasArrowSyntax = data.includes('sizeDiv.onclick = () =>');
        const hasClickHandlers = data.includes('CLICK DETECTED on:');
        
        console.log('\n📊 LIVE SITE ANALYSIS:');
        console.log('✅ Function syntax found:', hasFunctionSyntax ? 'YES' : 'NO');
        console.log('❌ Old arrow syntax found:', hasArrowSyntax ? 'YES (PROBLEM!)' : 'NO');
        console.log('✅ Click handler debug found:', hasClickHandlers ? 'YES' : 'NO');
        
        if (hasFunctionSyntax && hasClickHandlers) {
            console.log('\n🎉 SUCCESS! Click handlers should now work for all menu items!');
            console.log('🍕 Test by clicking on pizza sizes, drink options, or single-price items');
        } else {
            console.log('\n❌ Still issues - deployment may not be complete yet');
        }
    });
}).on('error', (err) => {
    console.error('Error checking live site:', err.message);
});