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
}
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
}

function renderMenuFromAPI(menu) {
	console.log('Menu data from API:', menu);
	window.menuData = menu;
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
		let cat = item.category || item.section || 'OTHER';
		if (cat.toUpperCase() === "PIZZA'S" || cat.toUpperCase() === "PIZZAS") cat = "PIZZAS";
		if (!grouped[cat]) grouped[cat] = [];
		grouped[cat].push(item);
	});
	console.log('Grouped categories:', grouped);
	// Fetch section descriptions from backend and render menu after
	fetch(`${API_BASE}/section-descriptions`).then(res => res.json()).then(sectionDescs => {
		categories.forEach(cat => {
			if (grouped[cat.key] && grouped[cat.key].length > 0) {
				const header = document.createElement('h2');
				header.className = 'section-heading soft-box';
				header.textContent = cat.label;
				menuDiv.appendChild(header);
				// Show description only if present
				const desc = sectionDescs && sectionDescs[cat.key] ? sectionDescs[cat.key].trim() : '';
				if (desc) {
					const sub = document.createElement('div');
					sub.className = 'section-subheading';
					sub.style.fontSize = '1.05em';
					sub.style.color = '#7a5a00';
					sub.style.marginBottom = '0.7em';
					sub.style.background = '#fffbe7';
					sub.style.border = '1px dashed #e1c97a';
					sub.style.borderRadius = '4px';
					sub.style.padding = '0.5em 0.8em';
					sub.textContent = desc;
					menuDiv.appendChild(sub);
				}
				grouped[cat.key].forEach(item => {
				const div = document.createElement('div');
				div.className = 'menu-item soft-box';
						let toppingsHtml = '';
						// PIZZAS: Toppings as checkboxes
						if (cat.key === 'PIZZAS' && Array.isArray(item.toppings) && item.toppings.length > 0) {
							let customFreeNote = '';
							if (Array.isArray(item.toppings) && item.toppings.length > 0 && typeof item.toppings[0] === 'object') {
								customFreeNote = `<div class='toppings-note soft-box' style='font-size:0.95em;color:#b36b00;margin-bottom:0.2em;'><strong>Choose up to 4 toppings for free. Extra toppings will be charged as shown.</strong></div>`;
							}
							toppingsHtml = `<div class='toppings-list'>`
								+ customFreeNote
								+ `<div class='toppings-note soft-box' style='font-size:0.85em;color:#666;margin-bottom:0.2em;'>Uncheck to remove</div>`
								+ `<strong>Toppings:</strong> `
								+ item.toppings.map((t, idx) => {
									if (typeof t === 'object' && t !== null) {
										return `<span class='topping-item soft-box' data-idx='${idx}'><label style='font-weight:normal;'><span class='custom-checkbox'><input type='checkbox'><span class='checkbox-box'></span></span> ${t.name}${t.price ? ` (£${t.price.toFixed(2)})` : ''}</label></span>`;
									} else {
										return `<span class='topping-item soft-box' data-idx='${idx}'><label style='font-weight:normal;'><input type='checkbox' checked onchange=\"toggleTopping('${item.id}',${idx},this)\"> ${t}</label></span>`;
									}
								}).join('')
								+ `</div>`;
						}
						// SALADS: Ingredients as checkboxes
						if (cat.key === 'SALADS' && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
							toppingsHtml = `<div class='toppings-list'>`
								+ `<div class='toppings-note soft-box' style='font-size:0.85em;color:#666;margin-bottom:0.2em;'>Uncheck to remove</div>`
								+ `<strong>Ingredients:</strong> `
								+ item.ingredients.map((ing, idx) =>
										`<span class='topping-item soft-box' data-idx='${idx}'><label style='font-weight:normal;'><input type='checkbox' checked onchange=\"toggleSaladIngredient('${item.id}',${idx},this)\"> ${ing}</label></span>`
									).join('')
								+ `</div>`;
						}
				// --- SIDES with types dropdown ---
				if (cat.key === 'SIDES' && Array.isArray(item.types) && item.types.length > 0) {
					const selectId = `side-type-select-${item.id}`;
					// Escape single quotes for HTML attribute
					const safeName = item.name.replace(/'/g, "\\'");
					div.innerHTML = `<strong>${item.name}</strong><br>` +
						`<select id='${selectId}' class='soft-box' style='margin:0.5em 0;'>`
						+ item.types.map((t, idx) => `<option value='${idx}'>${t.name} - £${t.price.toFixed(2)}</option>`).join('')
						+ `</select>`
						+ `<div style='margin-top:0.7em;'><button onclick=\"addSelectedSideType('${safeName}', '${selectId}', '${item.id}')\">Add</button></div>`;
				}
				else if (cat.key === 'PIZZAS' && Array.isArray(item.sizes) && item.sizes.length > 0) {
					const selectId = `pizza-size-select-${item.id}`;
					// Detect custom pizza by checking if toppings are objects
					const isCustom = Array.isArray(item.toppings) && item.toppings.length > 0 && typeof item.toppings[0] === 'object';
					div.innerHTML = `<strong>${item.name}</strong><br>` +
						`<select id='${selectId}' class='soft-box' style='margin:0.5em 0;'>`
						+ item.sizes.map((s, idx) => `<option value='${idx}'>${s.size} - £${s.price.toFixed(2)}</option>`).join('')
						+ `</select>`
						+ toppingsHtml;
					// Add button using JS, not inline HTML
					const btn = document.createElement('button');
					btn.textContent = 'Add';
					btn.className = 'add-pizza-btn';
					btn.style.marginTop = '0.7em';
					btn.addEventListener('click', function() {
						window.addSelectedPizzaSize(item.name, selectId, item.id, isCustom);
					});
					div.appendChild(btn);
// Helper to lookup pizza name by id and call addSelectedPizzaSize
window.addSelectedPizzaSizeById = function(id, selectId, isCustom) {
	const item = (window.menuData || []).find(i => String(i.id) === String(id));
	if (!item) return;
	addSelectedPizzaSize(item.name, selectId, id, isCustom);
}
				} else {
					div.innerHTML = `<strong>${item.name}</strong> – £${item.price ? item.price.toFixed(2) : ''}` +
						(item.description ? `<br><span>${item.description}</span>` : '') +
						toppingsHtml +
						`<div style='margin-top:0.7em;'><button onclick=\"addToCart('${item.name}',${item.price || 0})\">Add to Cart</button></div>`;
				}
				menuDiv.appendChild(div);
			});
			}
		});
	}
// End of renderMenuFromAPI
}

// Toggle ingredient (checkbox) from salad (live site)
window.toggleSaladIngredient = async function(saladId, ingredientIdx, checkbox) {
		try {
				const res = await fetch(`${API_BASE}/menu/${saladId}`);
				if (!res.ok) {
						showFriendlyMenuError('Menu item not found. It may have been removed or updated. Please refresh the page or contact staff.');
						return;
				}
				const salad = await res.json();
				if (!salad.ingredients) return;
				if (!checkbox.checked) {
						salad.ingredients.splice(ingredientIdx, 1);
						await fetch(`${API_BASE}/menu/${saladId}` , {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ ingredients: salad.ingredients })
						});
						loadAndRenderMenu();
				}
		} catch (e) {
				showFriendlyMenuError('Failed to update ingredient. Please try again or contact staff.');
		}
}

// Add selected side type to cart
window.addSelectedSideType = function(name, selectId, sideId) {
		const select = document.getElementById(selectId);
		if (!select) return;
		const idx = select.value;
		fetch(`${API_BASE}/menu/${sideId}`)
				.then(async res => {
						if (!res.ok) {
								showFriendlyMenuError('Menu item not found. It may have been removed or updated. Please refresh the page or contact staff.');
								return null;
						}
						try {
								return await res.json();
						} catch (e) {
								showFriendlyMenuError('Menu data is invalid. Please refresh the page or contact staff.');
								return null;
						}
				})
				.then(side => {
						if (!side || !side.types || !side.types[idx]) return;
						addToCart(`${name} (${side.types[idx].name})`, side.types[idx].price);
				});
}

// Add selected pizza size to cart
window.addSelectedPizzaSize = function(name, selectId, pizzaId, isCustom) {
	const select = document.getElementById(selectId);
	if (!select) return;
	const idx = select.value;
	fetch(`${API_BASE}/menu/${pizzaId}`)
		.then(async res => {
			if (!res.ok) {
				showFriendlyMenuError('Menu item not found. It may have been removed or updated. Please refresh the page or contact staff.');
				return null;
			}
			try {
				return await res.json();
			} catch (e) {
				showFriendlyMenuError('Menu data is invalid. Please refresh the page or contact staff.');
				return null;
			}
		})
		.then(pizza => {
			if (!pizza || !pizza.sizes || !pizza.sizes[idx]) return;
			if (isCustom) {
				// For custom pizza, get all checked toppings by data-idx
				const toppingSpans = select.parentElement.querySelectorAll('.topping-item');
				const selectedToppingIndexes = Array.from(toppingSpans)
					.map(span => {
						const cb = span.querySelector('input[type="checkbox"]');
						return cb && cb.checked ? parseInt(span.getAttribute('data-idx')) : -1;
					})
					.filter(i => i !== -1);
				// Get topping objects by index
				const sortedToppings = selectedToppingIndexes.map(i => pizza.toppings[i]).filter(Boolean);
				const includedToppings = 4;
				let totalPrice = pizza.sizes[idx].price;
				let paidToppings = [];
				let freeToppings = [];
				if (sortedToppings.length > includedToppings) {
					freeToppings = sortedToppings.slice(0, includedToppings);
					paidToppings = sortedToppings.slice(includedToppings);
				} else {
					freeToppings = sortedToppings;
				}
				// Add up paid topping prices
				const extraTotal = paidToppings.reduce((sum, t) => {
					console.log('Paid topping:', t.name, 'Price:', t.price);
					return sum + (t.price || 0);
				}, 0);
				totalPrice += extraTotal;
				console.log('Base price:', pizza.sizes[idx].price, 'Extra topping total:', extraTotal, 'Final total:', totalPrice);
				const toppingsText = sortedToppings.length ? sortedToppings.map((t, i) => i < includedToppings ? t.name + ' (free)' : t.name + (t.price ? ` (+£${t.price.toFixed(2)})` : '')).join(', ') : 'No extra toppings';
				addToCart(`Custom Pizza (${pizza.sizes[idx].size}${toppingsText ? ', ' + toppingsText : ''})`, totalPrice);
			} else {
				addToCart(`${name} (${pizza.sizes[idx].size})`, pizza.sizes[idx].price);
			}
		});
}

// Toggle topping (checkbox) from pizza (live site)
window.toggleTopping = async function(pizzaId, toppingIdx, checkbox) {
		try {
				const res = await fetch(`${API_BASE}/menu/${pizzaId}`);
				if (!res.ok) {
						showFriendlyMenuError('Menu item not found. It may have been removed or updated. Please refresh the page or contact staff.');
						return;
				}
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
		showFriendlyMenuError('Failed to update topping. Please try again or contact staff.');
		}
}
let cart = [];

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
