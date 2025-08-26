// Fetch and render menu from backend
const API_BASE = 'https://pizza-site-c8t6.onrender.com';
window.addEventListener('DOMContentLoaded', loadAndRenderMenu);

function loadAndRenderMenu() {
	fetch(`${API_BASE}/menu`)
		.then(res => res.json())
		.then(renderMenuFromAPI)
		.catch(() => {
			document.getElementById('dynamic-menu').innerHTML = '<p style="color:red">Failed to load menu from server.</p>';
		});
}

function renderMenuFromAPI(menu) {
	const menuDiv = document.getElementById('dynamic-menu');
	if (!menuDiv) return;
	menuDiv.innerHTML = '';
	const categories = [
		{ key: 'PIZZAS', label: 'PIZZAS' },
		{ key: 'SALADS', label: 'SALADS' },
		{ key: 'DRINKS', label: 'DRINKS' },
		{ key: 'SIDES', label: 'SIDES' },
		{ key: 'DESSERTS', label: 'DESSERTS' },
		{ key: 'CHICKEN', label: 'CHICKEN' }
	];
	const grouped = {};
	menu.forEach(item => {
		const cat = item.category || item.section || 'OTHER';
		if (!grouped[cat]) grouped[cat] = [];
		grouped[cat].push(item);
	});
	categories.forEach(cat => {
		if (grouped[cat.key] && grouped[cat.key].length > 0) {
			const header = document.createElement('h2');
			header.className = 'section-heading';
			header.textContent = cat.label;
			menuDiv.appendChild(header);
					grouped[cat.key].forEach(item => {
						const div = document.createElement('div');
						div.className = 'menu-item';
								let toppingsHtml = '';
								if (cat.key === 'PIZZAS' && Array.isArray(item.toppings) && item.toppings.length > 0) {
									let customFreeNote = '';
									if (Array.isArray(item.toppings) && item.toppings.length > 0 && typeof item.toppings[0] === 'object') {
										customFreeNote = `<div class='toppings-note' style='font-size:0.95em;color:#b36b00;margin-bottom:0.2em;'><strong>Choose up to 4 toppings for free. Extra toppings will be charged as shown.</strong></div>`;
									}
									toppingsHtml = `<div class='toppings-list'>`
										+ customFreeNote
										+ `<div class='toppings-note' style='font-size:0.85em;color:#666;margin-bottom:0.2em;'>Uncheck to remove</div>`
										+ `<strong>Toppings:</strong> `
										+ item.toppings.map((t, idx) => {
											if (typeof t === 'object' && t !== null) {
												// Custom pizza: show name and price, UNchecked by default, NO onchange handler
												return `<span class='topping-item' data-idx='${idx}'><label style='font-weight:normal;'><input type='checkbox'> ${t.name}${t.price ? ` (£${t.price.toFixed(2)})` : ''}</label></span>`;
											} else {
												// Regular pizza: show string, checked by default, with backend update
												return `<span class='topping-item' data-idx='${idx}'><label style='font-weight:normal;'><input type='checkbox' checked onchange=\"toggleTopping('${item._id || item.id}',${idx},this)\"> ${t}</label></span>`;
											}
										}).join('')
										+ `</div>`;
								}
								if (cat.key === 'PIZZAS' && Array.isArray(item.sizes) && item.sizes.length > 0) {
									// Only use the top select box for size selection
									const selectId = `pizza-size-select-${item._id || item.id}`;
									div.innerHTML = `<strong>${item.name}</strong><br>` +
										`<select id='${selectId}' style='margin:0.5em 0;'>` +
										item.sizes.map((s, idx) => `<option value='${idx}'>${s.size} - £${s.price.toFixed(2)}</option>`).join('') +
										`</select>` +
										toppingsHtml +
										`<div style='margin-top:0.7em;'><button onclick=\"addSelectedPizzaSize('${item.name.replace(/'/g, "\\'")}', '${selectId}', '${item._id || item.id}')\">Add</button></div>`;
								} else {
									div.innerHTML = `<strong>${item.name}</strong> – £${item.price ? item.price.toFixed(2) : ''}` +
										(item.description ? `<br><span>${item.description}</span>` : '') +
										toppingsHtml +
										`<div style='margin-top:0.7em;'><button onclick=\"addToCart('${item.name}',${item.price || 0})\">Add to Cart</button></div>`;
								}
// Add selected pizza size to cart
window.addSelectedPizzaSize = function(name, selectId, pizzaId, isCustom) {
	const select = document.getElementById(selectId);
	if (!select) return;
	const idx = select.value;
	// Find pizza in menuData
	fetch(`${API_BASE}/menu/${pizzaId}`)
		.then(res => res.json())
		.then(pizza => {
			if (pizza && pizza.sizes && pizza.sizes[idx]) {
				let toppings = [];
				if (isCustom) {
					// For custom pizza, get all checked toppings (by name)
					const toppingInputs = select.parentElement.querySelectorAll('input[type="checkbox"]');
					const selectedToppingNames = Array.from(toppingInputs).filter(cb => cb.checked).map(cb => cb.parentElement.textContent.trim());
					// Find the topping objects from pizza.toppings (which is now an array of {name, price})
					const toppingObjs = (pizza.toppings || []).filter(t => selectedToppingNames.includes(t.name));
					// Sort toppings as selected by user
					const sortedToppings = selectedToppingNames.map(name => toppingObjs.find(t => t && t.name === name)).filter(Boolean);
					const includedToppings = 4;
					let totalPrice = pizza.sizes[idx].price;
					let extraToppingMsg = '';
					if (sortedToppings.length > includedToppings) {
						// First 4 are free, extras use their own price
						const freeToppings = sortedToppings.slice(0, includedToppings);
						const paidToppings = sortedToppings.slice(includedToppings);
						const extraTotal = paidToppings.reduce((sum, t) => sum + (t.price || 0), 0);
						totalPrice += extraTotal;
						extraToppingMsg = `You have selected more than 4 toppings. Each extra topping costs its own price.`;
					}
					const toppingsText = sortedToppings.length ? sortedToppings.map(t => t.name).join(', ') : 'No extra toppings';
					if (extraToppingMsg) {
						alert(extraToppingMsg);
					}
					addToCart(`Custom Pizza (${pizza.sizes[idx].size}${toppingsText ? ', ' + toppingsText : ''})`, totalPrice);
				} else {
					addToCart(`${name} (${pizza.sizes[idx].size})`, pizza.sizes[idx].price);
				}
			}
		});
}
						menuDiv.appendChild(div);
					});
// Toggle topping (checkbox) from pizza (live site)
window.toggleTopping = async function(pizzaId, toppingIdx, checkbox) {
	try {
		const res = await fetch(`${API_BASE}/menu/${pizzaId}`);
		const pizza = await res.json();
		if (!pizza.toppings) return;
		if (!checkbox.checked) {
			// Support both string and object toppings
			if (typeof pizza.toppings[toppingIdx] === 'object' && pizza.toppings[toppingIdx] !== null) {
				// Remove by index for object toppings
				pizza.toppings.splice(toppingIdx, 1);
			} else {
				// Remove by index for string toppings
				pizza.toppings.splice(toppingIdx, 1);
			}
			await fetch(`${API_BASE}/menu/${pizzaId}` , {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ toppings: pizza.toppings })
			});
			loadAndRenderMenu();
		}
	} catch (e) {
		alert('Failed to update topping.');
	}
}
		}
	});
}
let cart = [];

function addToCart(item, price) {
	cart.push({ item, price });
	updateCart();
	showAddToCartTicket(item);
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
	const cartItems = document.getElementById('cart-items');
	const cartTotal = document.getElementById('cart-total');
	cartItems.innerHTML = '';
	let total = 0;

	cart.forEach((entry, index) => {
		const li = document.createElement('li');
		li.textContent = `${entry.item} – £${entry.price.toFixed(2)}`;
		cartItems.appendChild(li);
		total += entry.price;
	});

	cartTotal.textContent = total.toFixed(2);
}

function checkout() {
	if (cart.length === 0) {
		alert('Your cart is empty!');
	} else {
		alert('Thank you for your order! 🍕');
		cart = [];
		updateCart();
	}
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
