let cart = JSON.parse(localStorage.getItem('cart')) || [];

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
		menuDiv.innerHTML = '';
		
		menuData.forEach((item, index) => {
			try {
				console.log(`Processing item ${index}:`, item);
				
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
				
				// Handle pizzas and items with sizes
				if (Array.isArray(item.sizes) && item.sizes.length > 0 && item.sizes[0]) {
					priceValue = item.sizes[0].price;
					label = `${label} (${item.sizes[0].size || 'Regular'})`;
				} else if (Array.isArray(item.types) && item.types.length > 0 && item.types[0]) {
					priceValue = item.types[0].price;
					label = `${label} (${item.types[0].name || 'Standard'})`;
				}
				
				// Convert to number with extensive validation
				if (typeof priceValue === 'string') {
					priceValue = priceValue.replace(/[^0-9.]/g, ''); // Remove currency symbols
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
				
				// Create menu item
				const div = document.createElement('div');
				div.className = 'menu-item';
				div.textContent = `${label} - £${price.toFixed(2)}`;
				
				// Add to cart button
				const btn = document.createElement('button');
				btn.textContent = 'Add to Cart';
				btn.onclick = () => addToCart(label, price);
				div.appendChild(btn);
				menuDiv.appendChild(div);
				
				console.log(`Successfully processed: ${label} - £${price.toFixed(2)}`);
				
			} catch (itemError) {
				console.error(`Error processing item ${index}:`, itemError, 'Item data:', item);
				// Continue processing other items instead of failing completely
			}
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

// Run on page load
window.addEventListener('DOMContentLoaded', renderMenuFromAPI);

function addToCart(item, price) {
	// Always use {name, price} for cart items
	cart.push({ name: item, price });
	updateCart();
	showAddToCartTicket(item);
	// Save cart to localStorage for checkout page
	localStorage.setItem('cart', JSON.stringify(cart));
}

function showAddToCartTicket(itemName) {
	const ticket = document.createElement('div');
	ticket.textContent = `${itemName} added to cart!`;
	ticket.style.cssText = `
		position: fixed; 
		top: 20px; 
		right: 20px; 
		background: #2ecc71; 
		color: white; 
		padding: 10px 20px; 
		border-radius: 5px; 
		z-index: 1000; 
		font-weight: bold;
	`;
	document.body.appendChild(ticket);
	setTimeout(() => ticket.remove(), 3000);
}

function updateCart() {
	const cartTotal = document.getElementById('cart-total');
	if (!cartTotal) return;
	let total = 0;
	// Hide individual cart items, only show total
	const cartItems = document.getElementById('cart-items');
	if (cartItems) {
		cartItems.style.display = 'none';
	}
	cart.forEach(entry => { total += entry.price; });
	cartTotal.innerHTML = `<strong>Total: £${total.toFixed(2)}</strong>`;
}

function checkout() {
	if (cart.length === 0) {
		alert('Your cart is empty!');
		return;
	}
	alert('Thank you for your order! 🍕');
	cart = [];
	updateCart();
	localStorage.removeItem('cart'); // Clear cart from localStorage after checkout
}

function removeSaladToppings(saladName, basePrice, formId) {
	const form = document.getElementById(formId);
	const selected = Array.from(form.querySelectorAll('input[name="topping"]:checked')).map(cb => cb.value);
	const toppings = selected.length ? selected.join(', ') : 'No toppings';
	addToCart(`${saladName} (No: ${toppings})`, basePrice);
}

function updateCartDisplay() {
	const cartItems = document.getElementById('cart-items');
	cartItems.innerHTML = '';
	let total = 0;
	cart.forEach(function(item) {
		const div = document.createElement('div');
		div.className = 'menu-item';
		div.textContent = `${item.name} - £${item.price.toFixed(2)}`;
		cartItems.appendChild(div);
		total += item.price;
	});
	document.getElementById('cart-total').innerHTML = `<strong>Total: £${total.toFixed(2)}</strong>`;
}