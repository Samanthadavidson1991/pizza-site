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
	try {
		console.log('Fetching menu from API...');

		const response = await fetch('https://thecrustatngb.co.uk/menu');
		console.log('Response status:', response.status, response.statusText);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const menuData = await response.json();
		console.log('Menu data received:', menuData);

		if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
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

					let price = 0;
					let label = item.name || `Item ${index + 1}`;

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

					price = parseFloat(priceValue) || 0;

					// Create menu item card
					const card = document.createElement('div');
					card.className = 'menu-item-card';
					card.setAttribute('data-item-name', label.toLowerCase());

					// Item image with category-specific styling
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
								<span class="size-price">£${parseFloat(sizeOpt.price || 0).toFixed(2)}</span>
							`;

							// Make size option clickable
							sizeDiv.onclick = () => selectSizeOption(card, sizeDiv, sizeOpt.size, sizeOpt.price, item.name, item.autoAdd);
							sizeDiv.style.cursor = 'pointer';

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

					// Click instruction for single-price items
					if (sizeOptions.length <= 1) {
						const instructionDiv = document.createElement('div');
						instructionDiv.className = 'click-instruction';
						instructionDiv.textContent = 'Click price to add to cart';
						instructionDiv.style.cssText = `
							font-size: 0.85rem;
							color: #666;
							font-style: italic;
							margin-top: 0.5rem;
						`;
						
						// Make single price clickable for items without size options
						const priceDiv = priceContainer.querySelector('.menu-item-price');
						if (priceDiv) {
							priceDiv.onclick = () => addToCart(label, price);
							priceDiv.style.cursor = 'pointer';
							priceDiv.style.padding = '0.5rem';
							priceDiv.style.borderRadius = '4px';
							priceDiv.style.transition = 'background-color 0.2s';
							priceDiv.addEventListener('mouseover', () => {
								priceDiv.style.backgroundColor = categoryInfo.color + '20';
							});
							priceDiv.addEventListener('mouseout', () => {
								priceDiv.style.backgroundColor = 'transparent';
							});
						}
						
						content.appendChild(instructionDiv);
					}

					// Assemble card
					content.appendChild(nameDiv);
					content.appendChild(priceContainer);
					content.appendChild(descDiv);

					card.appendChild(imgDiv);
					card.appendChild(content);
					itemsContainer.appendChild(card);

					console.log(`Successfully added item: ${label} - £${price.toFixed(2)}`);

				} catch (itemError) {
					console.error(`Error processing item ${index}:`, itemError, 'Item data:', item);
				}
			});

			categorySection.appendChild(itemsContainer);
			menuDiv.appendChild(categorySection);
		});

		console.log('Menu rendering completed successfully');

	} catch (err) {
		console.error('Error in renderMenuFromAPI:', err);
		const menuDiv = document.getElementById('dynamic-menu');
		if (menuDiv) {
			menuDiv.innerHTML = '<p>Failed to load menu. Please try again later.</p>';
		}
	}
}

// Function to handle size option selection - ALL OPTIONS AUTO-ADD TO CART
function selectSizeOption(card, selectedDiv, sizeName, sizePrice, itemName, autoAdd) {
	// Remove selected class from all size options in this card
	const allSizeOptions = card.querySelectorAll('.size-option');
	allSizeOptions.forEach(option => option.classList.remove('selected'));

	// Add selected class to clicked option
	selectedDiv.classList.add('selected');

	// ALWAYS auto-add to cart when any option is clicked
	const fullItemName = `${itemName} - ${sizeName}`;
	addToCart(fullItemName, sizePrice);
	console.log(`Auto-added to cart: ${fullItemName} for £${sizePrice}`);

	// Remove selection after short delay to show it was added
	setTimeout(() => {
		selectedDiv.classList.remove('selected');
	}, 500);
}

function addToCart(item, price) {
	cart.push({ name: item, price, quantity: 1 });
	localStorage.setItem('cart', JSON.stringify(cart));
	showAddToCartTicket(item);
	updateCartDisplay();
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
		setTimeout(() => {
			if (document.body.contains(ticket)) {
				document.body.removeChild(ticket);
			}
		}, 300);
	}, 3000);
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

function clearCart() {
	if (cart.length === 0) {
		alert('Cart is already empty!');
		return;
	}
	
	if (confirm('Are you sure you want to clear all items from your cart?')) {
		cart = [];
		localStorage.setItem('cart', JSON.stringify(cart));
		updateCartDisplay();
		
		// Show confirmation message
		const confirmationDiv = document.createElement('div');
		confirmationDiv.textContent = '🗑️ Cart cleared successfully!';
		confirmationDiv.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: #e74c3c;
			color: white;
			padding: 1rem;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			z-index: 1000;
			animation: slideIn 0.3s ease;
		`;
		
		document.body.appendChild(confirmationDiv);
		
		setTimeout(() => {
			confirmationDiv.style.animation = 'slideOut 0.3s ease';
			setTimeout(() => {
				if (document.body.contains(confirmationDiv)) {
					document.body.removeChild(confirmationDiv);
				}
			}, 300);
		}, 2000);
	}
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

// Run on page load
document.addEventListener('DOMContentLoaded', renderMenuFromAPI);