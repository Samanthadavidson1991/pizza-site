// Check if the clearCart function is deployed on live site
const https = require('https');

console.log('🔍 Checking live site for clearCart function...');

const url = 'https://thecrustatngb.co.uk/menu.js?v=21-fixed';

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        const hasClearCart = data.includes('function clearCart');
        const hasMenuLoad = data.includes('loadMenu');
        const hasAddToCart = data.includes('addToCart');
        
        console.log('\n📊 LIVE SITE ANALYSIS:');
        console.log('✅ clearCart function found:', hasClearCart ? 'YES' : 'NO');
        console.log('✅ loadMenu function found:', hasMenuLoad ? 'YES' : 'NO'); 
        console.log('✅ addToCart function found:', hasAddToCart ? 'YES' : 'NO');
        
        if (!hasClearCart) {
            console.log('\n❌ PROBLEM: clearCart function is missing from live site!');
            console.log('🔧 This explains why the menu disappeared - JS error on clearCart reference');
        } else if (!hasMenuLoad) {
            console.log('\n❌ PROBLEM: loadMenu function is missing - this would break the menu display');
        } else {
            console.log('\n🎉 All functions found - the issue might be elsewhere');
        }
        
        // Check file size
        console.log(`\n📏 File size: ${data.length} characters`);
        if (data.length < 10000) {
            console.log('⚠️  WARNING: File seems smaller than expected');
        }
    });
}).on('error', (err) => {
    console.error('Error checking live site:', err.message);
});