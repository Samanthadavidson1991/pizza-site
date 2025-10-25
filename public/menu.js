let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fetch and render menu
async function renderMenuFromAPI() {
	try {
	const response = await fetch('/menu');
		const menuData = await response.json();
		const menuDiv = document.getElementById('dynamic-menu');
		menuDiv.innerHTML = '';
		menuData.forEach(item => {
			let price = item.price;
			let label = item.name;
			// Handle pizzas and items with sizes
			if (Array.isArray(item.sizes) && item.sizes.length > 0) {
				price = parseFloat(item.sizes[0].price);
				label = `${item.name} (${item.sizes[0].size})`;
			} else if (Array.isArray(item.types) && item.types.length > 0) {
				price = parseFloat(item.types[0].price);
				label = `${item.name} (${item.types[0].name})`;
			}
			const div = document.createElement('div');
			div.className = 'menu-item';
			div.textContent = `${label} - £${price.toFixed(2)}`;
			// Add to cart button
			const btn = document.createElement('button');
			btn.textContent = 'Add to Cart';
			btn.onclick = () => addToCart(label, price);
			div.appendChild(btn);
			menuDiv.appendChild(div);
		});
	} catch (err) {
		document.getElementById('dynamic-menu').textContent = 'Failed to load menu.';
		console.error(err);
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
