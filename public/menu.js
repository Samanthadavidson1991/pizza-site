let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Category styling configuration
const categoryConfig = {
	PIZZAS: {
		icon: '🍕',
		color: '#e74c3c',
		gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)',
		description: 'Hand-stretched with fresh ingredients'
	},
	SALADS: {
		icon: '🥗',
		color: '#27ae60', 
		gradient: 'linear-gradient(135deg, #27ae60, #229954)',
		description: 'Fresh, crisp and healthy'
	},
	SIDES: {
		icon: '🍟',
		color: '#f39c12',
		gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
		description: 'Perfect to share or as a starter'
	},
	DRINKS: {
		icon: '🥤',
		color: '#3498db',
		gradient: 'linear-gradient(135deg, #3498db, #2980b9)',
		description: 'Refreshing beverages'
	},
	DESSERTS: {
		icon: '🍰',
		color: '#9b59b6',
		gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
		description: 'Sweet treats to finish your meal'
	},
	CHICKEN: {
		icon: '🍗',
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

// Setup search and filter functionality
function setupSearchAndFilters() {
	const searchInput = document.getElementById('menu-search');
	const filterButtons = document.querySelectorAll('.filter-btn');
	const categorySection = document.querySelectorAll('.menu-category-section');
	
	// Search functionality
	if (searchInput) {
		searchInput.addEventListener('input', function() {
			const searchTerm = this.value.toLowerCase();
			const allCards = document.querySelectorAll('.menu-item-card');
			
			allCards.forEach(card => {
				const itemName = card.getAttribute('data-item-name') || '';
				const isVisible = itemName.includes(searchTerm);
				card.style.display = isVisible ? 'block' : 'none';
			});
		});
	}
	
	// Filter functionality
	filterButtons.forEach(btn => {
		btn.addEventListener('click', function() {
			// Update active button
			filterButtons.forEach(b => b.classList.remove('active'));
			this.classList.add('active');
			
			const category = this.getAttribute('data-category');
			
			if (category === 'all') {
				// Show all categories
				categorySection.forEach(section => {
					section.style.display = 'block';
				});
			} else {
				// Show only selected category
				categorySection.forEach(section => {
					const sectionCategory = section.getAttribute('data-category');
					section.style.display = sectionCategory === category ? 'block' : 'none';
				});
			}
		});
	});
}

// Fetch and render menu
async function renderMenuFromAPI() {
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
		
		// Add search bar and filters
		menuDiv.innerHTML = `
			<div class="menu-search-container">
				<input type="text" id="menu-search" placeholder="Search menu items..." class="menu-search-input">
				<div class="menu-filter-buttons">
					<button class="filter-btn active" data-category="all">All</button>
					${Object.keys(categorizedMenu).map(cat => 
						`<button class="filter-btn" data-category="${cat}">${cat}</button>`
					).join('')}
				</div>
			</div>
		`;
		
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
				<div class="category-icon" style="background: ${categoryInfo.gradient}">${categoryInfo.icon}</div>
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
						console.warn(`Invalid price for "${label}". Original:`, priceValue, 'Setting to £0.00');
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
					
					// Item image with category-specific styling
					const imgDiv = document.createElement('div');
					imgDiv.className = 'menu-item-image';
					imgDiv.style.background = categoryInfo.gradient;
					imgDiv.innerHTML = categoryInfo.icon;
					
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
						// Multiple size options
						sizeOptions.forEach((sizeOpt, idx) => {
							const sizeDiv = document.createElement('div');
							sizeDiv.className = 'size-option';
							sizeDiv.innerHTML = `
								<span class="size-name">${sizeOpt.size}</span>
								<span class="size-price">£${parseFloat(sizeOpt.price || 0).toFixed(2)}</span>
							`;
							priceContainer.appendChild(sizeDiv);
						});
					} else {
						// Single price
						const priceDiv = document.createElement('div');
						priceDiv.className = 'menu-item-price';
						priceDiv.textContent = `£${price.toFixed(2)}`;
						priceContainer.appendChild(priceDiv);
					}
					
					// Item description
					const descDiv = document.createElement('div');
					descDiv.className = 'menu-item-description';
					descDiv.textContent = generateItemDescription(item, category);
					
					// Add to cart button
					const btn = document.createElement('button');
					btn.className = 'menu-item-button';
					btn.style.background = categoryInfo.color;
					btn.textContent = 'Add to Cart';
					btn.onclick = () => addToCart(label, price);
					
					// Assemble card
					content.appendChild(nameDiv);
					content.appendChild(priceContainer);
					content.appendChild(descDiv);
					content.appendChild(btn);
					
					card.appendChild(imgDiv);
					card.appendChild(content);
					itemsContainer.appendChild(card);
					
					console.log(`Successfully added item: ${label} - £${price.toFixed(2)}`);
					
				} catch (itemError) {
					console.error(`Error processing item ${index}:`, itemError, 'Item data:', item);
					// Continue processing other items instead of failing completely
				}
			});
			
			categorySection.appendChild(itemsContainer);
			menuDiv.appendChild(categorySection);
		});
		
		// Add search and filter functionality
		setupSearchAndFilters();
		
		console.log('Menu rendering completed successfully');
		
	} catch (err) {
		console.error('Error in renderMenuFromAPI:', err);
		const menuDiv = document.getElementById('dynamic-menu');
		if (menuDiv) {
			menuDiv.innerHTML = '<p>Failed to load menu. Please try again later.</p>';
		}
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
	ticket.textContent = `✓ ${itemName} added to cart`;
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
	updateCartDisplay();
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
		cartTotal.innerHTML = '<strong>Total: £0.00</strong>';
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
				<span>£${(item.price * item.quantity).toFixed(2)}</span>
				<button onclick="removeFromCart('${item.item}')" class="remove-item">Remove</button>
			</div>
		`).join('')}
	`;
	
	cartTotal.innerHTML = `<strong>Total: £${total.toFixed(2)}</strong>`;
}

function removeFromCart(itemName) {
	cart = cart.filter(item => item.item !== itemName);
	localStorage.setItem('cart', JSON.stringify(cart));
	updateCartDisplay();
}