// Comprehensive diagnosis of the menu issue
const https = require('https');

console.log('🔍 COMPREHENSIVE MENU DIAGNOSIS');
console.log('================================');

// Step 1: Check if the website loads at all
console.log('\n1. Testing website accessibility...');
https.get('https://thecrustatngb.co.uk/menu.html', (res) => {
    console.log(`✅ Website responds with status: ${res.statusCode}`);
    
    let htmlData = '';
    res.on('data', (chunk) => htmlData += chunk);
    res.on('end', () => {
        // Check what JS version the HTML is requesting
        const jsMatch = htmlData.match(/menu\.js\?v=([^"']+)/);
        const cssMatch = htmlData.match(/style\.css\?v=([^"']+)/);
        
        console.log(`📄 HTML requests JS version: ${jsMatch ? jsMatch[1] : 'NOT FOUND'}`);
        console.log(`🎨 HTML requests CSS version: ${cssMatch ? cssMatch[1] : 'NOT FOUND'}`);
        
        // Check if dynamic-menu div exists
        const hasDynamicMenu = htmlData.includes('id="dynamic-menu"');
        console.log(`📦 Dynamic menu container exists: ${hasDynamicMenu ? 'YES' : 'NO'}`);
        
        // Now test the JS file
        if (jsMatch) {
            testJavaScriptFile(jsMatch[1]);
        }
    });
}).on('error', (err) => {
    console.error('❌ Website not accessible:', err.message);
});

function testJavaScriptFile(version) {
    console.log(`\n2. Testing JavaScript file v${version}...`);
    
    const jsUrl = `https://thecrustatngb.co.uk/menu.js?v=${version}`;
    
    https.get(jsUrl, (res) => {
        let jsData = '';
        res.on('data', (chunk) => jsData += chunk);
        res.on('end', () => {
            console.log(`📏 JS file size: ${jsData.length} characters`);
            
            // Check for essential functions
            const functions = {
                'renderMenuFromAPI': jsData.includes('renderMenuFromAPI'),
                'clearCart': jsData.includes('function clearCart'),
                'addToCart': jsData.includes('function addToCart'),
                'updateCartDisplay': jsData.includes('function updateCartDisplay'),
                'DOMContentLoaded event': jsData.includes('DOMContentLoaded')
            };
            
            console.log('\n📋 Function Analysis:');
            Object.entries(functions).forEach(([name, exists]) => {
                console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'EXISTS' : 'MISSING'}`);
            });
            
            // Check for syntax errors (basic check)
            const openBraces = (jsData.match(/{/g) || []).length;
            const closeBraces = (jsData.match(/}/g) || []).length;
            console.log(`\n🔧 Syntax Check:`);
            console.log(`  Opening braces: ${openBraces}`);
            console.log(`  Closing braces: ${closeBraces}`);
            console.log(`  Balanced: ${openBraces === closeBraces ? '✅ YES' : '❌ NO'}`);
            
            // Test the API endpoint
            testAPIEndpoint();
        });
    }).on('error', (err) => {
        console.error('❌ JS file not accessible:', err.message);
    });
}

function testAPIEndpoint() {
    console.log('\n3. Testing API endpoint...');
    
    https.get('https://pizza-site-c8t6.onrender.com/menu', (res) => {
        console.log(`🗄️ API responds with status: ${res.statusCode}`);
        
        let apiData = '';
        res.on('data', (chunk) => apiData += chunk);
        res.on('end', () => {
            try {
                const menuData = JSON.parse(apiData);
                console.log(`📊 Menu items in database: ${menuData.length}`);
                
                if (menuData.length > 0) {
                    console.log(`📋 Sample item: ${menuData[0].name} (${menuData[0].category})`);
                    console.log('✅ API is working correctly');
                } else {
                    console.log('⚠️ Database is empty');
                }
            } catch (e) {
                console.log('❌ API returned invalid JSON');
                console.log('Response:', apiData.substring(0, 200));
            }
        });
    }).on('error', (err) => {
        console.error('❌ API not accessible:', err.message);
    });
}

console.log('\n⏳ Running diagnosis... Please wait...');