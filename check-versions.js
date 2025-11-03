// Check what version is actually loading on live site
const https = require('https');

console.log('🔍 Checking which version is loading...');

// Test both v22-working and v23-complete
const versions = ['v22-working', 'v23-complete'];

versions.forEach(version => {
  const url = `https://thecrustatngb.co.uk/menu.js?${version}`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const hasLoadMenu = data.includes('async function loadMenu');
      const hasLoadMenuCall = data.includes('loadMenu();');
      const hasCreateCard = data.includes('createMenuItemCard');
      
      console.log(`\n📊 VERSION ${version}:`);
      console.log('  loadMenu function:', hasLoadMenu ? 'YES' : 'NO');
      console.log('  loadMenu call:', hasLoadMenuCall ? 'YES' : 'NO');
      console.log('  createMenuItemCard:', hasCreateCard ? 'YES' : 'NO');
      console.log('  File size:', data.length, 'characters');
      
      if (hasLoadMenu && hasLoadMenuCall && hasCreateCard) {
        console.log('  ✅ THIS VERSION HAS ALL FUNCTIONS!');
      } else {
        console.log('  ❌ Missing functions in this version');
      }
    });
  }).on('error', (err) => {
    console.error(`Error checking ${version}:`, err.message);
  });
});

// Also check the HTML to see what version it's requesting
setTimeout(() => {
  console.log('\n🔍 Checking HTML version reference...');
  const htmlUrl = 'https://thecrustatngb.co.uk/menu.html';
  
  https.get(htmlUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const versionMatch = data.match(/menu\.js\?v=([^"']+)/);
      if (versionMatch) {
        console.log('📄 HTML is requesting version:', versionMatch[1]);
      } else {
        console.log('❌ No version found in HTML');
      }
    });
  }).on('error', (err) => {
    console.error('Error checking HTML:', err.message);
  });
}, 2000);