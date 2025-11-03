// Debug why renderMenuFromAPI isn't working
const https = require('https');

console.log('🔍 DEBUGGING MENU LOADING ISSUE...');
console.log('===================================');

// Step 1: Test if API is accessible
console.log('\n1. Testing API endpoint...');
https.get('https://pizza-site-c8t6.onrender.com/menu', (res) => {
    console.log(`🗄️ API Status: ${res.statusCode}`);
    
    let apiData = '';
    res.on('data', (chunk) => apiData += chunk);
    res.on('end', () => {
        try {
            const menuItems = JSON.parse(apiData);
            console.log(`📊 Menu items available: ${menuItems.length}`);
            
            if (menuItems.length > 0) {
                console.log(`📋 First item: ${menuItems[0].name} (${menuItems[0].category})`);
                console.log('✅ API is working fine');
                
                // Step 2: Check if the JS function can reach the API
                testJSFunctionCall();
            } else {
                console.log('❌ No menu items in database');
            }
        } catch (e) {
            console.log('❌ API returned invalid JSON:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('❌ API connection failed:', err.message);
});

function testJSFunctionCall() {
    console.log('\n2. Testing renderMenuFromAPI function structure...');
    
    const jsUrl = 'https://thecrustatngb.co.uk/menu.js?v=26-cachebust';
    
    https.get(jsUrl, (res) => {
        let jsData = '';
        res.on('data', (chunk) => jsData += chunk);
        res.on('end', () => {
            // Look for the specific function implementation
            const hasRenderFunction = jsData.includes('async function renderMenuFromAPI');
            const hasFetchCall = jsData.includes('fetch(');
            const hasMenuEndpoint = jsData.includes('pizza-site-c8t6.onrender.com/menu');
            const hasDynamicMenu = jsData.includes('dynamic-menu');
            const hasErrorHandling = jsData.includes('catch');
            
            console.log('📋 Function Implementation Check:');
            console.log(`  ${hasRenderFunction ? '✅' : '❌'} renderMenuFromAPI function defined`);
            console.log(`  ${hasFetchCall ? '✅' : '❌'} fetch() call present`);
            console.log(`  ${hasMenuEndpoint ? '✅' : '❌'} correct API endpoint`);
            console.log(`  ${hasDynamicMenu ? '✅' : '❌'} dynamic-menu container reference`);
            console.log(`  ${hasErrorHandling ? '✅' : '❌'} error handling present`);
            
            // Check the exact DOMContentLoaded setup
            if (jsData.includes('DOMContentLoaded')) {
                const domMatch = jsData.match(/addEventListener\('DOMContentLoaded',\s*([^)]+)\)/);
                if (domMatch) {
                    console.log(`🎯 DOMContentLoaded calls: ${domMatch[1]}`);
                } else {
                    console.log('❌ DOMContentLoaded format issue');
                }
            }
            
            // Look for any obvious syntax errors around the function
            const renderStart = jsData.indexOf('async function renderMenuFromAPI');
            if (renderStart > -1) {
                const functionSnippet = jsData.substring(renderStart, renderStart + 200);
                console.log('\n📄 Function start:');
                console.log(functionSnippet);
            }
        });
    }).on('error', (err) => {
        console.error('❌ JS file check failed:', err.message);
    });
}

console.log('⏳ Running diagnostic...');