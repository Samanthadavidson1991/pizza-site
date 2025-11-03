// Create a completely fixed version of the click handlers
const fs = require('fs');

let content = fs.readFileSync('menu.js', 'utf8');

// Replace the problematic click handler with a simpler, working version
const oldHandler = `sizeDiv.onclick = () => selectSizeOption(card, sizeDiv, sizeOpt.size, sizeOpt.price, item.name, item.autoAdd);`;

const newHandler = `sizeDiv.onclick = function() {
							console.log('🖱️ CLICK DETECTED on:', sizeOpt.size || sizeOpt.name, 'for', item.name);
							const sizeName = sizeOpt.size || sizeOpt.name || 'Unknown';
							const sizePrice = sizeOpt.price || 0;
							selectSizeOption(card, sizeDiv, sizeName, sizePrice, item.name, item.autoAdd);
						};`;

content = content.replace(oldHandler, newHandler);

// Also fix any single-price click handlers that might not be working
const oldSingleClick = `priceDiv.onclick = () => {
							console.log('🖱️ Single price item clicked:', label);
							selectSizeOption(card, priceDiv, label, price, item.name, item.autoAdd);
						};`;

const newSingleClick = `priceDiv.onclick = function() {
							console.log('🖱️ SINGLE PRICE CLICK:', label);  
							selectSizeOption(card, priceDiv, label, price, item.name, item.autoAdd);
						};`;

content = content.replace(oldSingleClick, newSingleClick);

fs.writeFileSync('menu.js', content);
console.log('✅ Fixed click handlers with proper function syntax');