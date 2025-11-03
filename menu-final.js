let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Category styling configuration
const categoryConfig = {
	PIZZAS: {
		color: '#e74c3c',
		gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)',
		description: 'Hand-stretched with fresh ingredients'
	},
	SALADS: {
		color: '#27ae60', 
		gradient: 'linear-gradient(135deg, #27ae60, #229954)',
		description: 'Fresh, crisp and healthy'
	},
	SIDES: {
		color: '#f39c12',
		gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
		description: 'Perfect to share or as a starter'
	},
	DRINKS: {
		color: '#3498db',
		gradient: 'linear-gradient(135deg, #3498db, #2980b9)',
		description: 'Refreshing beverages'
	},
	DESSERTS: {
		color: '#9b59b6',
		gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
		description: 'Sweet treats to finish your meal'
	},
	CHICKEN: {
		color: '#e67e22',
		gradient: 'linear-gradient(135deg, #e67e22, #d35400)',
		description: 'Tender and flavourful chicken dishes'
	}
};

// Get category from item data
function getCategoryFromItem(item) {
	return item.category || 'SIDES'; // Default fallback
}

// Generate item description from item data
function generateItemDescription(item, category) {
	const categoryInfo = categoryConfig[category];
	let description = categoryInfo ? categoryInfo.description : 'Made with quality ingredients';
	
	// Add specific details based on item data
	if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
		description = `Includes: ${item.ingredients.slice(0, 3).join(', ')}${item.ingredients.length > 3 ? '...' : ''}`;
	} else if (item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) {
		const toppings = item.toppings.map(t => typeof t === 'object' ? t.name : t);
		description = `Available toppings: ${toppings.slice(0, 3).join(', ')}${toppings.length > 3 ? '...' : ''}`;
	} else if (item.types && Array.isArray(item.types) && item.types.length > 1) {
		description = `Available in ${item.types.length} varieties`;
	}
	
	return description;
}



// Fetch and render menu
async function renderMenuFromAPI() {
	console.log('ðŸš€ renderMenuFromAPI starting...');
	try {
		console.log('Fetching menu from /menu endpoint...');
		
		const response = await fetch('/menu');
		console.log('Response status:', response.status, response.statusText);
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const menuData = await response.json();
		console.log('Menu data received:', menuData);
		console.log('Menu data type:', typeof menuData);
		console.log('Menu data is array:', Array.isArray(menuData));
		console.log('Menu data length:', menuData ? menuData.length : 'N/A');
		
		if (!menuData) {
			throw new Error('Menu data is null or undefined');
		}
		
		if (!Array.isArray(menuData)) {
			throw new Error('Menu data is not an array');
		}
		
		if (menuData.length === 0) {
			document.getElementById('dynamic-menu').innerHTML = '<p>No menu items available</p>';
			return;
		}
		
		const menuDiv = document.getElementById('dynamic-menu');
		
		// Group items by category
		const categorizedMenu = {};
		menuData.forEach(item => {
			const category = getCategoryFromItem(item);
			if (!categorizedMenu[category]) {
				categorizedMenu[category] = [];
			}
			categorizedMenu[category].push(item);
		});
		
		// Clear the menu div
		menuDiv.innerHTML = '';
		
		// Remove any search elements that might exist

		const existingSearch = document.querySelector('input[type="text"]');
		const allInputs = document.querySelectorAll('input');
		const searchContainer = document.querySelector('.search-container, #search-container, [class*="search"]');
		
		console.log('ðŸ” Found inputs:', allInputs.length);
		console.log('ðŸ” Search input found:', !!existingSearch);
		console.log('ðŸ” Search container found:', !!searchContainer);
		
		if (existingSearch) {
			console.log('ðŸš¨ FOUND SEARCH INPUT:', existingSearch);
			console.log('ðŸš¨ Search input HTML:', existingSearch.outerHTML);
			console.log('ðŸš¨ REMOVING SEARCH INPUT NOW');
			existingSearch.remove();
		}
		
		if (searchContainer) {
			console.log('ðŸš¨ FOUND SEARCH CONTAINER:', searchContainer);
			console.log('ðŸš¨ Search container HTML:', searchContainer.outerHTML);
			console.log('ðŸš¨ REMOVING SEARCH CONTAINER NOW');
			searchContainer.remove();
		}
		

		
		// Render each category
		Object.keys(categorizedMenu).forEach(category => {
			const categoryInfo = categoryConfig[category] || categoryConfig.SIDES;
			
			// Create category section
			const categorySection = document.createElement('div');
			categorySection.className = 'menu-category-section';
			categorySection.setAttribute('data-category', category);
			
			// Category header
			const categoryHeader = document.createElement('div');
			categoryHeader.className = 'menu-category-header';
			categoryHeader.innerHTML = `
				<div class="category-icon" style="background: ${categoryInfo.gradient}"></div>
				<h3 class="category-title">${category}</h3>
				<p class="category-subtitle">${categoryInfo.description}</p>
			`;
			categorySection.appendChild(categoryHeader);
			
			// Category items container
			const itemsContainer = document.createElement('div');  
			itemsContainer.className = 'menu-items-grid';
			
			categorizedMenu[category].forEach((item, index) => {
				try {
					console.log(`Processing item ${index} in ${category}:`, item);
					
					// Ultra-safe item processing
					let price = 0;
					let label = 'Unknown Item';
					
					// Validate item exists and is an object
					if (!item || typeof item !== 'object') {
						console.warn(`Item ${index} is invalid:`, item);
						return; // Skip this item
					}
					
					// Extract name safely
					if (item.name && typeof item.name === 'string') {
						label = item.name;
					} else {
						label = `Item ${index + 1}`;
						console.warn(`Item ${index} has invalid name:`, item.name);
					}
					
					// Extract price with multiple fallbacks
					let priceValue = item.price;
					let sizeOptions = [];
					let currentButton = null;
					
					// Handle pizzas and items with sizes
					if (Array.isArray(item.sizes) && item.sizes.length > 0) {
						sizeOptions = item.sizes;
						priceValue = item.sizes[0].price;
					} else if (Array.isArray(item.types) && item.types.length > 0) {
						sizeOptions = item.types.map(type => ({size: type.name, price: type.price}));
						priceValue = item.types[0].price;
					}
					
					// Convert to number with extensive validation
					if (typeof priceValue === 'string') {
						priceValue = priceValue.replace(/[^0-9.]/g, '');
					}
					
					price = parseFloat(priceValue);
					
					if (isNaN(price) || price < 0 || !isFinite(price)) {
						price = 0;
						console.warn(`Invalid price for "${label}". Original:`, priceValue, 'Setting to Â£0.00');
					}
					
					// Additional safety check before toFixed
					if (typeof price !== 'number' || price === null || price === undefined) {
						console.error(`Price is not a number for "${label}":`, price, 'typeof:', typeof price);
						price = 0;
					}
					
					// Create menu item card
					const card = document.createElement('div');
					card.className = 'menu-item-card';
					card.setAttribute('data-item-name', label.toLowerCase());
					
					// Item image with category-specific styling (no emoji)
					const imgDiv = document.createElement('div');
					imgDiv.className = 'menu-item-image';
					imgDiv.style.background = categoryInfo.gradient;
					
					// Content container
					const content = document.createElement('div');
					content.className = 'menu-item-content';
					
					// Item name
					const nameDiv = document.createElement('div');
					nameDiv.className = 'menu-item-name';
					nameDiv.textContent = label;
					
					// Size options or single price
					const priceContainer = document.createElement('div');
					priceContainer.className = 'menu-item-prices';
					
					if (sizeOptions.length > 1) {
						// Multiple size options - make them clickable
						sizeOptions.forEach((sizeOpt, idx) => {
							const sizeDiv = document.createElement('div');
							let className = 'size-option';
							if (item.autoAdd) {
								className += ' auto-add';
							} else if (idx === 0) {
								className += ' selected';
							}
							sizeDiv.className = className;
							sizeDiv.setAttribute('data-price', sizeOpt.price);
							sizeDiv.setAttribute('data-size', sizeOpt.size);
							sizeDiv.innerHTML = `
								<span class="size-name">${sizeOpt.size}</span>
								<span class="size-price">Â£${parseFloat(sizeOpt.price || 0).toFixed(2)}</span>
							`;
							
							// Make size option clickable
							sizeDiv.onclick = function() {
							console.log('ðŸ–±ï¸ CLICK DETECTED on:', sizeOpt.size || sizeOpt.name, 'for', item.name);
							const sizeName = sizeOpt.size || sizeOpt.name || 'Unknown';
							const sizePrice = sizeOpt.price || 0;
							selectSizeOption(card, sizeDiv, sizeName, sizePrice, item.name, item.autoAdd);
						};
							sizeDiv.style.cursor = 'pointer';
							
							priceContainer.appendChild(sizeDiv);
						});
					} else {
						// Single price
						const priceDiv = document.createElement('div');
						priceDiv.className = 'menu-item-price';
						priceDiv.textContent = `Â£${price.toFixed(2)}`;
						priceContainer.appendChild(priceDiv);
					}
					
					// Item description
					const descDiv = document.createElement('div');
					descDiv.className = 'menu-item-description';
					descDiv.textContent = generateItemDescription(item, category);
					
					// Add to cart button (only for non-auto-add items)
					if (!item.autoAdd) {
						btn = document.createElement('button');
						btn.className = 'menu-item-button';
						btn.style.background = categoryInfo.color;
						btn.textContent = 'Add to Cart';
						
						// Store original item info and current selection
						btn.setAttribute('data-base-name', label);
						btn.setAttribute('data-current-price', price);
						btn.setAttribute('data-current-size', sizeOptions.length > 1 ? sizeOptions[0].size : '');
						
						btn.onclick = () => {
							const currentPrice = parseFloat(btn.getAttribute('data-current-price'));
							const currentSize = btn.getAttribute('data-current-size');
							const itemName = currentSize ? `${label} (${currentSize})` : label;
							addToCart(itemName, currentPrice);
						};
						
						// Button will be added after assembly} else {
						// For auto-add items, create a disabled "Add to Cart" button at the bottom
						btn = document.createElement('button');
						btn.className = 'menu-item-button';
						btn.style.background = categoryInfo.color;
						btn.textContent = 'Add to Cart';
						btn.style.opacity = '0.6';
						btn.style.cursor = 'default';
						btn.onclick = () => {
							alert('Click on the variety options above to add them to your cart!');
						};
						
						// Button will be added after assembly
					}
					
					// Assemble card
					content.appendChild(nameDiv);
					content.appendChild(priceContainer);
					content.appendChild(descDiv);
					
					card.appendChild(imgDiv);
					card.appendChild(content);
					itemsContainer.appendChild(card);
					
					console.log(`Successfully added item: ${label} - Â£${price.toFixed(2)}`);
					
				} catch (itemError) {
					console.error(`Error processing item ${index}:`, itemError, 'Item data:', item);
					// Continue processing other items instead of failing completely
				}
			});
			
			categorySection.appendChild(itemsContainer);
			menuDiv.appendChild(categorySection);
		});
		
		console.log('âœ… Menu rendering completed successfully - checking for clickable elements...');
			const allSizeOptions = document.querySelectorAll('.size-option');
			console.log('ðŸ” Found', allSizeOptions.length, 'size-option elements');
			allSizeOptions.forEach((option, i) => {
				console.log('Option', i + 1, ':', option.textContent.trim(), 'clickable:', option.onclick ? 'YES' : 'NO');
			});
		
	} catch (err) {
		console.error('Error in renderMenuFromAPI:', err);
		const menuDiv = document.getElementById('dynamic-menu');
		if (menuDiv) {
			menuDiv.innerHTML = '<p>Failed to load menu. Please try again later.</p>';
		}
	}
}

// Function to handle size option selection
function selectSizeOption(card, selectedDiv, sizeName, sizePrice, itemName, autoAdd) {
	console.log('ðŸŽ¯ selectSizeOption called:', sizeName, 'for', itemName, 'autoAdd:', autoAdd);
	// Remove selected class from all size options in this card
	const allSizeOptions = card.querySelectorAll('.size-option');
	allSizeOptions.forEach(option => option.classList.remove('selected'));
	
	// Add selected class to clicked option
	selectedDiv.classList.add('selected');
	
	// Check if this should auto-add to cart
	if (autoAdd) {
		// Automatically add to cart
		const fullItemName = `${itemName} - ${sizeName}`;
		addToCart(fullItemName, sizePrice);
		console.log(`Auto-added to cart: ${fullItemName} for Â£${sizePrice}`);
		
		// Remove selection after short delay to show it was added
		setTimeout(() => {
			selectedDiv.classList.remove('selected');
		}, 500);
	} else {
		// Update the add to cart button with new price and size
		const addToCartBtn = card.querySelector('.menu-item-button');
		addToCartBtn.setAttribute('data-current-price', sizePrice);
		addToCartBtn.setAttribute('data-current-size', sizeName);
		
		console.log(`Selected ${sizeName} for Â£${sizePrice}`);
	}
}

// Run on page load
window.addEventListener('DOMContentLoaded', renderMenuFromAPI);

function addToCart(item, price) {
	cart.push({ item, price, quantity: 1 });
	localStorage.setItem('cart', JSON.stringify(cart));
	showAddToCartTicket(item);
	updateCart();
}

function showAddToCartTicket(itemName) {
	// Create a temporary notification
	const ticket = document.createElement('div');
	ticket.className = 'cart-ticket';
	ticket.textContent = `âœ“ ${itemName} added to cart`;
	ticket.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: #27ae60;
		color: white;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		animation: slideIn 0.3s ease;
	`;
	
	document.body.appendChild(ticket);
	
	// Remove after 3 seconds
	setTimeout(() => {
		ticket.style.animation = 'slideOut 0.3s ease';
		setTimeout(() => document.body.removeChild(ticket), 300);
	}, 3000);
}

function updateCart() {
}

function checkout() {
	if (cart.length === 0) {
		alert('Your cart is empty!');
		return;
	}
	
	// Calculate total
	const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	
	// Store cart data for checkout page
	localStorage.setItem('checkoutCart', JSON.stringify(cart));
	localStorage.setItem('checkoutTotal', total.toFixed(2));
	
	// Redirect to checkout
	window.location.href = 'checkout.html';
}

function removeSaladToppings(saladName, basePrice, formId) {
	// This function is for removing salad toppings - implementation depends on your needs
	console.log(`Removing toppings from ${saladName}`);
}

function updateCartDisplay() {
	const cartSection = document.getElementById('cart');
	const cartTotal = document.getElementById('cart-total');
	
	if (!cartSection || !cartTotal) return;
	
	if (cart.length === 0) {
		cartSection.innerHTML = '';
		cartTotal.innerHTML = '<strong>Total: Â£0.00</strong>';
		return;
	}
	
	// Group cart items by name
	const groupedCart = {};
	cart.forEach(item => {
		if (groupedCart[item.item]) {
			groupedCart[item.item].quantity += item.quantity;
		} else {
			groupedCart[item.item] = { ...item };
		}
	});
	
	// Calculate total
	const total = Object.values(groupedCart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
	
	// Update cart display
	cartSection.innerHTML = `
		<h3>Your Order</h3>
		${Object.values(groupedCart).map(item => `
			<div class="cart-item">
				<span>${item.item} x${item.quantity}</span>
				<span>Â£${(item.price * item.quantity).toFixed(2)}</span>
				<button onclick="removeFromCart('${item.item}')" class="remove-item">Remove</button>
			</div>
		`).join('')}
	`;
	
	cartTotal.innerHTML = `<strong>Total: Â£${total.toFixed(2)}</strong>`;
}

function removeFromCart(itemName) {
	cart = cart.filter(item => item.item !== itemName);
	localStorage.setItem('cart', JSON.stringify(cart));
}

 
 f u n c t i o n   c l e a r C a r t ( )   { 
 i f   ( c a r t . l e n g t h   = = =   0 )   { 
 a l e r t ( ' C a r t   i s   a l r e a d y   e m p t y ! ' ) ; 
 r e t u r n ; 
 } 
 
 i f   ( c o n f i r m ( ' A r e   y o u   s u r e   y o u   w a n t   t o   c l e a r   a l l   i t e m s   f r o m   y o u r   c a r t ? ' ) )   { 
 c a r t   =   [ ] ; 
 l o c a l S t o r a g e . s e t I t e m ( ' c a r t ' ,   J S O N . s t r i n g i f y ( c a r t ) ) ; 
 u p d a t e C a r t D i s p l a y ( ) ; 
 
 / /   S h o w   c o n f i r m a t i o n   m e s s a g e 

function clearCart() {
if (cart.length === 0) {
alert('Cart is already empty!');
return;
}

if (confirm('Are you sure you want to clear all items from your cart?')) {
cart = [];
localStorage.setItem('cart', JSON.stringify(cart));

// Show confirmation message
const cartSection = document.getElementById('cart');
if (cartSection) {
cartSection.innerHTML = '<div class="cart-cleared-message">🗑️ Cart cleared successfully!</div>';
setTimeout(() => {
}, 2000);
}
}
}

 / /   L o a d   m e n u   f r o m   d a t a b a s e 
 a s y n c   f u n c t i o n   l o a d M e n u ( )   { 
 t r y   { 
 c o n s o l e . l o g ( '   L o a d i n g   m e n u   f r o m   d a t a b a s e . . . ' ) ; 
 c o n s t   r e s p o n s e   =   a w a i t   f e t c h ( ' h t t p s : / / p i z z a - s i t e - c 8 t 6 . o n r e n d e r . c o m / m e n u ' ) ; 
 
 i f   ( ! r e s p o n s e . o k )   { 
 t h r o w   n e w   E r r o r ( ` H T T P   e r r o r !   s t a t u s :   $ { r e s p o n s e . s t a t u s } ` ) ; 
 } 
 
 c o n s t   m e n u I t e m s   =   a w a i t   r e s p o n s e . j s o n ( ) ; 
 c o n s o l e . l o g ( ' =���  M e n u   l o a d e d : ' ,   m e n u I t e m s . l e n g t h ,   ' i t e m s ' ) ; 
 
 c o n s t   m e n u C o n t a i n e r   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' d y n a m i c - m e n u ' ) ; 
 i f   ( ! m e n u C o n t a i n e r )   { 
 c o n s o l e . e r r o r ( '   M e n u   c o n t a i n e r   n o t   f o u n d ! ' ) ; 
 r e t u r n ; 
 } 
 
 / /   C l e a r   e x i s t i n g   c o n t e n t 
 m e n u C o n t a i n e r . i n n e r H T M L   =   ' ' ; 
 
 / /   G r o u p   i t e m s   b y   c a t e g o r y 
 c o n s t   c a t e g o r i e s   =   [ ' P I Z Z A S ' ,   ' D R I N K S ' ,   ' S I D E S ' ,   ' D E S S E R T S ' ,   ' C H I C K E N ' ] ; 
 
 c a t e g o r i e s . f o r E a c h ( c a t e g o r y   = >   { 
 c o n s t   c a t e g o r y I t e m s   =   m e n u I t e m s . f i l t e r ( i t e m   = >   i t e m . c a t e g o r y   = = =   c a t e g o r y ) ; 
 i f   ( c a t e g o r y I t e m s . l e n g t h   = = =   0 )   r e t u r n ; 
 
 / /   C r e a t e   c a t e g o r y   s e c t i o n 
 c o n s t   c a t e g o r y D i v   =   d o c u m e n t . c r e a t e E l e m e n t ( ' d i v ' ) ; 
 c a t e g o r y D i v . c l a s s N a m e   =   ' m e n u - c a t e g o r y ' ; 
 
 c o n s t   c a t e g o r y T i t l e   =   d o c u m e n t . c r e a t e E l e m e n t ( ' h 3 ' ) ; 
 c a t e g o r y T i t l e . c l a s s N a m e   =   ' c a t e g o r y - t i t l e ' ; 
 c a t e g o r y T i t l e . t e x t C o n t e n t   =   c a t e g o r y ; 
 c a t e g o r y D i v . a p p e n d C h i l d ( c a t e g o r y T i t l e ) ; 
 
 / /   C r e a t e   i t e m s   g r i d 
 c o n s t   i t e m s G r i d   =   d o c u m e n t . c r e a t e E l e m e n t ( ' d i v ' ) ; 
 i t e m s G r i d . c l a s s N a m e   =   ' m e n u - i t e m s - g r i d ' ; 
 
 c a t e g o r y I t e m s . f o r E a c h ( i t e m   = >   { 
 c o n s t   i t e m C a r d   =   c r e a t e M e n u I t e m C a r d ( i t e m ,   c a t e g o r y ) ; 
 i t e m s G r i d . a p p e n d C h i l d ( i t e m C a r d ) ; 
 } ) ; 
 
 c a t e g o r y D i v . a p p e n d C h i l d ( i t e m s G r i d ) ; 
 m e n u C o n t a i n e r . a p p e n d C h i l d ( c a t e g o r y D i v ) ; 
 } ) ; 
 
 c o n s o l e . l o g ( '   M e n u   d i s p l a y   c o m p l e t e d ' ) ; 
 
 }   c a t c h   ( e r r o r )   { 
 c o n s o l e . e r r o r ( ' L'  E r r o r   l o a d i n g   m e n u : ' ,   e r r o r ) ; 
 c o n s t   m e n u C o n t a i n e r   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' d y n a m i c - m e n u ' ) ; 
 i f   ( m e n u C o n t a i n e r )   { 
 m e n u C o n t a i n e r . i n n e r H T M L   =   ' < d i v   c l a s s = " e r r o r - m e s s a g e " > S o r r y ,   m e n u   c o u l d   n o t   b e   l o a d e d .   P l e a s e   r e f r e s h   t h e   p a g e . < / d i v > ' ; 
 } 
 } 
 } 
 
 / /   C r e a t e   i n d i v i d u a l   m e n u   i t e m   c a r d 
 f u n c t i o n   c r e a t e M e n u I t e m C a r d ( i t e m ,   c a t e g o r y )   { 
 c o n s t   c a r d   =   d o c u m e n t . c r e a t e E l e m e n t ( ' d i v ' ) ; 
 c a r d . c l a s s N a m e   =   ' m e n u - i t e m - c a r d   '   +   c a t e g o r y . t o L o w e r C a s e ( ) ; 
 
 c o n s t   t i t l e   =   d o c u m e n t . c r e a t e E l e m e n t ( ' h 4 ' ) ; 
 t i t l e . t e x t C o n t e n t   =   i t e m . n a m e ; 
 c a r d . a p p e n d C h i l d ( t i t l e ) ; 
 
 i f   ( i t e m . d e s c r i p t i o n )   { 
 c o n s t   d e s c   =   d o c u m e n t . c r e a t e E l e m e n t ( ' p ' ) ; 
 d e s c . c l a s s N a m e   =   ' i t e m - d e s c r i p t i o n ' ; 
 d e s c . t e x t C o n t e n t   =   i t e m . d e s c r i p t i o n ; 
 c a r d . a p p e n d C h i l d ( d e s c ) ; 
 } 
 
 / /   H a n d l e   d i f f e r e n t   i t e m   s t r u c t u r e s 
 i f   ( i t e m . s i z e s   & &   i t e m . s i z e s . l e n g t h   >   0 )   { 
 / /   I t e m s   w i t h   m u l t i p l e   s i z e s 
 c o n s t   s i z e s D i v   =   d o c u m e n t . c r e a t e E l e m e n t ( ' d i v ' ) ; 
 s i z e s D i v . c l a s s N a m e   =   ' s i z e - o p t i o n s ' ; 
 
 i t e m . s i z e s . f o r E a c h ( s i z e O p t i o n   = >   { 
 c o n s t   s i z e D i v   =   d o c u m e n t . c r e a t e E l e m e n t ( ' d i v ' ) ; 
 s i z e D i v . c l a s s N a m e   =   ' s i z e - o p t i o n ' ; 
 s i z e D i v . i n n e r H T M L   =   ` 
 < s p a n   c l a s s = " s i z e - n a m e " > $ { s i z e O p t i o n . s i z e   | |   s i z e O p t i o n . n a m e } < / s p a n > 
 < s p a n   c l a s s = " s i z e - p r i c e " > � $ { s i z e O p t i o n . p r i c e . t o F i x e d ( 2 ) } < / s p a n > 
 ` ; 
 
 s i z e D i v . o n c l i c k   =   f u n c t i o n ( )   { 
 c o n s o l e . l o g ( '   C L I C K   D E T E C T E D   o n : ' ,   s i z e O p t i o n . s i z e   | |   s i z e O p t i o n . n a m e ,   ' f o r ' ,   i t e m . n a m e ) ; 
 c o n s t   s i z e N a m e   =   s i z e O p t i o n . s i z e   | |   s i z e O p t i o n . n a m e   | |   ' U n k n o w n ' ; 
 c o n s t   s i z e P r i c e   =   s i z e O p t i o n . p r i c e   | |   0 ; 
 s e l e c t S i z e O p t i o n ( c a r d ,   s i z e D i v ,   s i z e N a m e ,   s i z e P r i c e ,   i t e m . n a m e ,   i t e m . a u t o A d d ) ; 
 } ; 
 
 s i z e s D i v . a p p e n d C h i l d ( s i z e D i v ) ; 
 } ) ; 
 
 c a r d . a p p e n d C h i l d ( s i z e s D i v ) ; 
 
 }   e l s e   i f   ( i t e m . p r i c e   ! = =   u n d e f i n e d )   { 
 / /   S i n g l e   p r i c e   i t e m s 
 c o n s t   p r i c e D i v   =   d o c u m e n t . c r e a t e E l e m e n t ( ' d i v ' ) ; 
 p r i c e D i v . c l a s s N a m e   =   ' s i n g l e - p r i c e - o p t i o n ' ; 
 p r i c e D i v . i n n e r H T M L   =   ` 
 < s p a n   c l a s s = " p r i c e " > � $ { i t e m . p r i c e . t o F i x e d ( 2 ) } < / s p a n > 
 ` ; 
 
 p r i c e D i v . o n c l i c k   =   f u n c t i o n ( )   { 
 c o n s o l e . l o g ( '   S I N G L E   P R I C E   C L I C K : ' ,   i t e m . n a m e ) ;     
 s e l e c t S i z e O p t i o n ( c a r d ,   p r i c e D i v ,   i t e m . n a m e ,   i t e m . p r i c e ,   i t e m . n a m e ,   i t e m . a u t o A d d ) ; 
 } ; 
 
 c a r d . a p p e n d C h i l d ( p r i c e D i v ) ; 
 } 
 
 r e t u r n   c a r d ; 
 } 
 
 / /   L o a d   m e n u   w h e n   p a g e   l o a d s 
 d o c u m e n t . a d d E v e n t L i s t e n e r ( ' D O M C o n t e n t L o a d e d ' ,   f u n c t i o n ( )   { 
 l o a d M e n u ( ) ; 
 u p d a t e C a r t D i s p l a y ( ) ; 
