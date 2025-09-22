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
// Limit to 4 toppings
const maxToppings = 30;
const toppingCheckboxes = document.querySelectorAll('#custom-pizza-form input[type="checkbox"]');

toppingCheckboxes.forEach(cb => {
  cb.addEventListener('change', function() {
    const checkedCount = document.querySelectorAll('#custom-pizza-form input[type="checkbox"]:checked').length;
    if (checkedCount > maxToppings) {
      this.checked = false;
      alert(`You can select up to ${30} toppings.`);
    }
  });
});
function addCustomPizzaToCart() {
  const form = document.getElementById('custom-pizza-form');
  const selected = Array.from(form.querySelectorAll('input[name="topping"]:checked')).map(cb => cb.value);
  const basePrice = 11.99;
  const includedToppings = 4;
  const extraToppingPrice = 1; // £1 for each extra topping
  const extraCount = Math.max(0, selected.length - includedToppings);
  const totalPrice = basePrice + (extraCount * extraToppingPrice);
  const toppings = selected.length ? selected.join(', ') : 'No extra toppings';
  addToCart(`Custom Pizza (${toppings})`, totalPrice);
}
function addCustomPizzaToCart() {
  const form = document.getElementById('custom-pizza-form');
  const selected = Array.from(form.querySelectorAll('input[name="topping"]:checked')).map(cb => cb.value);
  const sizeSelect = form.querySelector('#pizza-size');
  const size = sizeSelect.value;
  const basePrice = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].getAttribute('data-price'));
  const includedToppings = 4;
  const extraToppingPrice = 1;
  const extraCount = Math.max(0, selected.length - includedToppings);
  const totalPrice = basePrice + (extraCount * extraToppingPrice);
  const toppings = selected.length ? selected.join(', ') : 'No extra toppings';
  addToCart(`Custom Pizza (${size}, ${toppings})`, totalPrice);
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
