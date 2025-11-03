// Test the new v19-fixed version
const https = require('https');

console.log('🔍 Testing v19-fixed version...');

const url = 'https://thecrustatngb.co.uk/menu.js?v=19-fixed';

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        // Check for the fixed function syntax
        const hasFunctionSyntax = data.includes('sizeDiv.onclick = function()');
        const hasClickDebug = data.includes('CLICK DETECTED on:');
        const hasSelectFunction = data.includes('selectSizeOption(card, sizeDiv, sizeName, sizePrice');
        
        console.log('\n📊 LIVE SITE v19-fixed ANALYSIS:');
        console.log('✅ Function syntax:', hasFunctionSyntax ? 'YES' : 'NO');
        console.log('✅ Click debug logs:', hasClickDebug ? 'YES' : 'NO');
        console.log('✅ Select function call:', hasSelectFunction ? 'YES' : 'NO');
        
        if (hasFunctionSyntax && hasClickDebug && hasSelectFunction) {
            console.log('\n🎉 EXCELLENT! All click handlers are now properly deployed!');
            console.log('🍕 Go test your menu - all items should now be clickable!');
            console.log('📱 Try clicking on:');
            console.log('   - Pizza sizes (Small, Medium, Large)');
            console.log('   - Drink options');
            console.log('   - Single-price items');
            console.log('   - Check browser console for click debug logs');
        } else {
            console.log('\n⏳ Still updating, wait a moment and try again...');
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});