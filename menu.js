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
  const menuDiv = document.getElementById('dynamic-menu');
  if (!menuDiv) return;
  menuDiv.innerHTML = '';
	const categories = [
		{ key: 'PIZZAS', label: 'PIZZAS' },
		{ key: 'SALADS', label: 'SALADS' },
		{ key: 'SIDES', label: 'SIDES' },
		{ key: 'CHICKEN', label: 'CHICKEN' },
		{ key: 'DRINKS', label: 'DRINKS' },
		{ key: 'DESSERTS', label: 'DESSERTS' }
	];
	console.log('Grouped categories:', grouped);
	// Fetch section subheadings from backend and render them if present
	fetch(`${API_BASE}/menu-section-subheadings`)
	// End of renderMenuFromAPI
// ...existing code...
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
