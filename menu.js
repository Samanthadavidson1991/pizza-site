// Fetch and render menu from backend
// Show a friendly error message at the top of the page
function showFriendlyMenuError(msg) {
	let errDiv = document.getElementById('friendly-menu-error');
	if (!errDiv) {
		errDiv = document.createElement('div');
		errDiv.id = 'friendly-menu-error';
		errDiv.style.position = 'fixed';
		errDiv.style.top = '0';
		errDiv.style.left = '0';
		errDiv.style.width = '100%';
		errDiv.style.background = '#ffdddd';
		errDiv.style.color = '#b30000';
		errDiv.style.fontWeight = 'bold';
		errDiv.style.fontSize = '1.1em';
		errDiv.style.padding = '1em';
		errDiv.style.zIndex = '10000';
		errDiv.style.textAlign = 'center';
		document.body.appendChild(errDiv);
	}
	errDiv.textContent = msg;
	errDiv.style.display = 'block';
	setTimeout(() => { errDiv.style.display = 'none'; }, 4000);
const API_BASE = 'https://pizza-site-c8t6.onrender.com';
window.addEventListener('DOMContentLoaded', () => {
	// Load cart from localStorage if present
	const savedCart = localStorage.getItem('cart');
	if (savedCart) {
		try {
			cart = JSON.parse(savedCart);
		} catch (e) {
			cart = [];
		}
	}
	updateCart();
	loadAndRenderMenu();
});

function loadAndRenderMenu() {
	fetch(`${API_BASE}/menu`)
		.then(res => res.json())
		.then(renderMenuFromAPI)
		.catch(() => {
			document.getElementById('dynamic-menu').innerHTML = '<p style="color:red">Failed to load menu from server.</p>';
		});

function renderMenuFromAPI(menu) {
	window.menuData = menu;
	console.log('Menu data from API:', menu);
	const menuDiv = document.getElementById('dynamic-menu');
	if (!menuDiv) return;
	menuDiv.innerHTML = '';
	// Group menu items by category
	const categories = ["PIZZAS", "SALADS", "SIDES", "DRINKS", "DESSERTS"];
	const grouped = {};
	menu.forEach(item => {
		const cat = item.category || 'OTHER';
		if (!grouped[cat]) grouped[cat] = [];
		grouped[cat].push(item);
	});
	categories.forEach(cat => {
		if (grouped[cat] && grouped[cat].length > 0) {
			const header = document.createElement('h2');
			header.className = 'section-heading';
			header.textContent = cat;
			menuDiv.appendChild(header);
			grouped[cat].forEach(item => {
				const div = document.createElement('div');
				div.className = 'menu-item';
				let optionsHtml = '';
				// Handle pizzas and items with sizes
				if (Array.isArray(item.sizes) && item.sizes.length > 0) {
					optionsHtml = `<label for='${item.name}-size'><b>Size:</b></label> <select id='${item.name}-size'>` +
						item.sizes.map((opt, idx) =>
							`<option value='${idx}' data-price='${opt.price}'>${opt.size} (£${parseFloat(opt.price).toFixed(2)})</option>`
						).join('') +
						`</select><br>`;
				} else if (Array.isArray(item.types) && item.types.length > 0) {
					optionsHtml = `<label for='${item.name}-type'><b>Type:</b></label> <select id='${item.name}-type'>` +
						item.types.map((opt, idx) =>
							`<option value='${idx}' data-price='${opt.price}'>${opt.name} (£${parseFloat(opt.price).toFixed(2)})</option>`
						).join('') +
						`</select><br>`;
				}
				let toppingsHtml = '';
				if (Array.isArray(item.toppings) && item.toppings.length > 0) {
					const isPizza = item.category === "PIZZAS";
					toppingsHtml = `<div><b>Ingredients (click to remove):</b><br>` +
						item.toppings.map((topping, idx) =>
							`<label style='margin-right:10px;'><input type='checkbox' class='topping-checkbox' data-itemid='${item.id}' value='${typeof topping === 'string' ? topping : topping.name}' checked>${typeof topping === 'string' ? topping : topping.name}</label>`
						).join('') +
						(isPizza ? `<br><label style='margin-right:10px;'><input type='checkbox' class='special-checkbox' data-itemid='${item.id}' value='No Cheese'>No Cheese</label>` : '') +
						(isPizza ? `<label style='margin-right:10px;'><input type='checkbox' class='special-checkbox' data-itemid='${item.id}' value='No Sauce'>No Sauce</label>` : '') +
						`</div><div id='topping-warning-${item.id}' style='color:red;font-size:0.9em;display:none;'></div>`;
				} else if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
					toppingsHtml = `<div><b>Ingredients:</b> ${item.ingredients.join(', ')}</div>`;
				}
				let priceDisplay = '';
				if (typeof item.price === 'number' && !optionsHtml) {
					priceDisplay = `– £${item.price.toFixed(2)}`;
				}
				div.innerHTML = `
					<p><strong>${item.name}</strong> ${priceDisplay}</p>
					<p>${item.description || ''}</p>
					${item.image ? `<img src="${item.image}" alt="${item.name}" style="height:40px;">` : ''}
					${optionsHtml}
					${toppingsHtml}
					<button onclick="addDynamicToCart('${item.name.replace(/'/g, "\\'")}', ${item.id})">Add to Cart</button>
				`;
				menuDiv.appendChild(div);
			});
		}
	});
	// Optionally, fetch and display subheadings if needed
// Add function to handle Add to Cart from dynamic menu
function addDynamicToCart(name, id) {
		const item = window.menuData.find(i => i.id === id);
		let price = item.price;
		let label = name;
		// Handle pizzas and items with sizes
		if (Array.isArray(item.sizes) && item.sizes.length > 0) {
			const select = document.getElementById(`${item.name}-size`);
			const selectedIdx = select ? select.value : 0;
			const selectedOpt = item.sizes[selectedIdx];
			price = parseFloat(selectedOpt.price);
			label = `${item.name} (${selectedOpt.size})`;
		} else if (Array.isArray(item.types) && item.types.length > 0) {
			const select = document.getElementById(`${item.name}-type`);
			const selectedIdx = select ? select.value : 0;
			const selectedOpt = item.types[selectedIdx];
			price = parseFloat(selectedOpt.price);
			label = `${item.name} (${selectedOpt.name})`;
		}
		cart.push({ name: label, price });
		updateCart();
		showAddToCartTicket(label);
		localStorage.setItem('cart', JSON.stringify(cart));
	}
let cart = [];

function addToCart(item, price) {
	// Always use {name, price} for cart items
	cart.push({ name: item, price });
	updateCart();
	showAddToCartTicket(item);
	// Save cart to localStorage for checkout page
	localStorage.setItem('cart', JSON.stringify(cart));

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
