let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fetch and render menu - BULLETPROOF VERSION
async function renderMenuFromAPI() {
	console.log('=== STARTING MENU RENDER ===');
	const menuDiv = document.getElementById('dynamic-menu');
	
	if (!menuDiv) {
		console.error('Menu div not found!');
		return;
	}
	
	try {
		menuDiv.innerHTML = '<p>Loading menu...</p>';
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
			menuDiv.innerHTML = '<p>No menu items available</p>';
			return;
		}
		
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
				
				// Create menu item card
				const card = document.createElement('div');
				card.className = 'menu-item-card';
				
				// Item image placeholder with category-specific emoji
				const imgDiv = document.createElement('div');
				imgDiv.className = 'menu-item-image';
				
				// Set emoji based on item category/name
				let emoji = '🍕'; // Default pizza
				const nameLower = label.toLowerCase();
				if (nameLower.includes('salad')) {
					emoji = '🥗';
				} else if (nameLower.includes('drink') || nameLower.includes('coke') || nameLower.includes('water') || nameLower.includes('juice')) {
					emoji = '🥤';
				} else if (nameLower.includes('side') || nameLower.includes('bread') || nameLower.includes('dough') || nameLower.includes('fries')) {
					emoji = '🍞';
				} else if (nameLower.includes('dessert') || nameLower.includes('cake') || nameLower.includes('ice')) {
					emoji = '🍰';
				} else if (nameLower.includes('chicken') || nameLower.includes('wing')) {
					emoji = '🍗';
				}
				imgDiv.innerHTML = emoji;
				
				// Content container
				const content = document.createElement('div');
				content.className = 'menu-item-content';
				
				// Item name
				const nameDiv = document.createElement('div');
				nameDiv.className = 'menu-item-name';
				nameDiv.textContent = label;
				
				// Item price
				const priceDiv = document.createElement('div');
				priceDiv.className = 'menu-item-price';
				priceDiv.textContent = `£${price.toFixed(2)}`;
				
				// Item description (placeholder for now)
				const descDiv = document.createElement('div');
				descDiv.className = 'menu-item-description';
				descDiv.textContent = 'Freshly made with quality ingredients';
				
				// Add to cart button
				const btn = document.createElement('button');
				btn.className = 'menu-item-button';
				btn.textContent = 'Add to Cart';
				btn.onclick = () => addToCart(label, price);
				
				// Assemble card
				content.appendChild(nameDiv);
				content.appendChild(priceDiv);
				content.appendChild(descDiv);
				content.appendChild(btn);
				
				card.appendChild(imgDiv);
				card.appendChild(content);
				menuDiv.appendChild(card);
				
				console.log(`Successfully added item: ${label} - £${price.toFixed(2)}`);
				
			} catch (itemError) {
				console.error(`Error processing item ${index}:`, itemError);
				// Continue with next item
			}
		});
		
		console.log('=== MENU RENDER COMPLETED ===');
		
	} catch (err) {
		console.error('=== MENU RENDER FAILED ===', err);
		menuDiv.innerHTML = `<p>Failed to load menu: ${err.message}</p>`;
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
	let ticket = document.getElementById('add-to-cart-ticket');
	if (!ticket) {
		ticket = document.createElement('div');
		ticket.id = 'add-to-cart-ticket';
		ticket.style.position = 'fixed';
		ticket.style.top = '30px';
		ticket.style.left = '50%';
		ticket.style.transform = 'translateX(-50%)';
		ticket.style.background = '#2ecc40';
		ticket.style.color = '#fff';
		ticket.style.fontWeight = 'bold';
		ticket.style.fontSize = '1.2em';
		ticket.style.padding = '1em 2em';
		ticket.style.borderRadius = '8px';
		ticket.style.boxShadow = '0 2px 8px #0002';
		ticket.style.zIndex = '9999';
		ticket.style.display = 'none';
		document.body.appendChild(ticket);
	}
	ticket.textContent = `✔️ "${itemName}" added to checkout!`;
	ticket.style.display = 'block';
	setTimeout(() => { ticket.style.display = 'none'; }, 1800);
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
