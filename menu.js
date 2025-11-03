let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function loadMenu() {
    try {
        const response = await fetch('https://thecrustatngb.co.uk/menu');
        const menuItems = await response.json();
        renderMenu(menuItems);
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('dynamic-menu').innerHTML = '<p>Unable to load menu</p>';
    }
}

function renderMenu(items) {
    const container = document.getElementById('dynamic-menu');
    container.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        
        const name = document.createElement('h3');
        name.textContent = item.name;
        
        const desc = document.createElement('p');
        desc.textContent = item.description || '';
        
        const price = document.createElement('p');
        price.textContent = '£' + (item.price || 0).toFixed(2);
        price.className = 'price';
        
        const button = document.createElement('button');
        button.textContent = 'Add to Cart';
        button.onclick = () => addToCart(item.name, item.price || 0);
        
        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(price);
        card.appendChild(button);
        
        container.appendChild(card);
    });
}

function addToCart(itemName, price) {
    cart.push({ item: itemName, price: price, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartTotal();
    
    // Show success message
    const message = document.createElement('div');
    message.textContent = '✓ ' + itemName + ' added to cart';
    message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: green; color: white; padding: 10px; border-radius: 5px; z-index: 1000;';
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (document.body.contains(message)) {
            document.body.removeChild(message);
        }
    }, 2000);
}

function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
        totalElement.innerHTML = '<strong>Total: £' + total.toFixed(2) + '</strong>';
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

document.addEventListener('DOMContentLoaded', loadMenu);