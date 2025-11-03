const https = require('https');

// Get the live JavaScript and check for issues
async function checkLiveJS() {
    console.log('🔍 Checking live JavaScript for click handler issues...\n');
    
    const jsFile = await getFile('/menu.js?v=18-debug');
    
    if (jsFile.includes('sizeDiv.onclick = () => {')) {
        console.log('✅ Click handler assignment found');
    } else {
        console.log('❌ Click handler assignment NOT found');
    }
    
    // Check if there are any syntax errors in the click handler
    const onclickMatch = jsFile.match(/sizeDiv\.onclick = \(\) => \{[^}]+\}/g);
    if (onclickMatch) {
        console.log('✅ Found click handler code:');
        onclickMatch.forEach((handler, i) => {
            console.log(`Handler ${i + 1}:`, handler.substring(0, 100) + '...');
        });
    }
    
    // Check if the selectSizeOption function exists
    if (jsFile.includes('function selectSizeOption')) {
        console.log('✅ selectSizeOption function exists');
    } else {
        console.log('❌ selectSizeOption function missing');
    }
    
    // Check for common JavaScript errors
    const errors = [];
    if (jsFile.includes('const btn') && jsFile.match(/const btn/g).length > 1) {
        errors.push('Duplicate const btn declarations');
    }
    if (jsFile.includes('undefined') && jsFile.includes('is not defined')) {
        errors.push('Undefined variable references');
    }
    
    if (errors.length > 0) {
        console.log('❌ Potential JavaScript errors found:');
        errors.forEach(error => console.log(`  - ${error}`));
    } else {
        console.log('✅ No obvious JavaScript errors detected');
    }
    
    // Check the structure of the size option creation
    const sizeOptionCreation = jsFile.match(/sizeOptions\.forEach\([^}]+\}/gs);
    if (sizeOptionCreation) {
        console.log('\n📝 Size option creation code found');
    } else {
        console.log('\n❌ Size option creation code NOT found');
    }
}

function getFile(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'thecrustatngb.co.uk',
            port: 443,
            path: path,
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', () => resolve('ERROR'));
        req.end();
    });
}

checkLiveJS();