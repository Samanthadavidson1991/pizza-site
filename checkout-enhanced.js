// Enhanced checkout cart functionality
function loadCheckoutCart() {
const cart = JSON.parse(localStorage.getItem('cart') || '[]');
const cartItemsDiv = document.getElementById('cart-items');
const cartTotalP = document.getElementById('cart-total');
const cartTotalBottom = document.getElementById('cart-total-bottom');

if (cart.length === 0) {
cartItemsDiv.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Your cart is empty. <a href="menu.html">Go to menu</a> to add items.</p>';
cartTotalP.innerHTML = '<strong>Total: £0.00</strong>';
if (cartTotalBottom) {
cartTotalBottom.innerHTML = '<strong>Total: £0.00</strong>';
}
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

// Display cart items with delete buttons
cartItemsDiv.innerHTML = Object.values(groupedCart).map(item => `
<div class="checkout-cart-item">
<div class="item-details">
<span class="item-name">${item.item}</span>
<span class="item-quantity">x${item.quantity}</span>
</div>
<div class="item-actions">
<span class="item-price">£${(item.price * item.quantity).toFixed(2)}</span>
<button onclick="removeItemFromCheckout('${item.item}')" class="delete-item-btn"></button>
</div>
</div>
`).join('');

cartTotalP.innerHTML = `<strong>Total: £${total.toFixed(2)}</strong>`;
if (cartTotalBottom) {
cartTotalBottom.innerHTML = `<strong>Total: £${total.toFixed(2)}</strong>`;
}
}

function removeItemFromCheckout(itemName) {
if (confirm(`Remove "${itemName}" from your cart?`)) {
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
cart = cart.filter(item => item.item !== itemName);
localStorage.setItem('cart', JSON.stringify(cart));
loadCheckoutCart();

const cartItemsDiv = document.getElementById('cart-items');
const tempMessage = document.createElement('div');
tempMessage.className = 'item-removed-message';
tempMessage.textContent = `"${itemName}" removed from cart`;
cartItemsDiv.insertBefore(tempMessage, cartItemsDiv.firstChild);

setTimeout(() => {
if (tempMessage.parentNode) {
tempMessage.parentNode.removeChild(tempMessage);
}
}, 2000);
}
}
