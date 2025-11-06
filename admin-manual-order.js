// admin-manual-order.js
// Manual order entry system for telephone orders

let menuItems = [];
let manualCart = [];
let allCategories = [];

// Helper function to calculate "Out of Kitchen" time (15 minutes before delivery slot)
function calculateKitchenTime(timeSlot) {
  if (!timeSlot) return '';
  
  try {
    // Extract start time from slot (e.g., "17:30-18:00" -> "17:30")
    const startTime = timeSlot.split('-')[0];
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Create date object for today with the delivery time
    const deliveryTime = new Date();
    deliveryTime.setHours(hours, minutes, 0, 0);
    
    // Subtract 15 minutes for kitchen time
    const kitchenTime = new Date(deliveryTime.getTime() - (15 * 60 * 1000));
    
    // Format as HH:MM
    const kitchenHours = kitchenTime.getHours().toString().padStart(2, '0');
    const kitchenMinutes = kitchenTime.getMinutes().toString().padStart(2, '0');
    
    return `${kitchenHours}:${kitchenMinutes}`;
  } catch (error) {
    console.error('Error calculating kitchen time:', error);
    return '';
  }
}

// Function to populate available time slots based on selected date
function populateTimeSlots() {
    const dateInput = document.getElementById('order-date');
    const timeSlotSelect = document.getElementById('order-time-slot');
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    // Clear existing options except the first one
    timeSlotSelect.innerHTML = '<option value="">Select Time Slot *</option>';

    // Define all possible time slots
    const allSlots = [
        '17:00-17:30', '17:30-18:00', '18:00-18:30', '18:30-19:00', '19:00-19:30',
        '19:30-20:00', '20:00-20:30', '20:30-21:00', '21:00-21:30', '21:30-22:00'
    ];

    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    allSlots.forEach(slot => {
        const [startTime] = slot.split('-');
        const [hours, minutes] = startTime.split(':').map(Number);
        const slotStartMinutes = hours * 60 + minutes;

        // For today: exclude slots that start within 15 minutes
        // For future dates: show all slots
        if (!isToday || (slotStartMinutes > currentTimeMinutes + 15)) {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot.replace('-', ' - ');
            timeSlotSelect.appendChild(option);
        }
    });
}

// Function to set minimum date (today) and populate initial time slots
function initializeDateAndTimeSlots() {
    const dateInput = document.getElementById('order-date');
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Set minimum date to today
    dateInput.min = todayString;
    
    // Set default date to today
    dateInput.value = todayString;
    
    // Populate initial time slots
    populateTimeSlots();
    
    // Add event listener for date changes
    dateInput.addEventListener('change', populateTimeSlots);
}

// Load menu items on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    setupEventListeners();
    initializeDateAndTimeSlots();
});

function setupEventListeners() {
    // Order type toggle
    document.querySelectorAll('input[name="orderType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const deliveryFields = document.getElementById('delivery-fields');
            if (this.value === 'delivery') {
                deliveryFields.style.display = 'block';
            } else {
                deliveryFields.style.display = 'none';
            }
        });
    });

    // Menu search and filter
    document.getElementById('menu-search').addEventListener('input', filterMenuItems);
    document.getElementById('category-filter').addEventListener('change', filterMenuItems);

    // Order actions
    document.getElementById('clear-order-btn').addEventListener('click', clearOrder);
    document.getElementById('submit-order-btn').addEventListener('click', submitOrder);
}

async function loadMenuItems() {
    try {
        console.log('Loading menu items with stock data...');
        
        // Try to load from the combined menu-with-stock endpoint first
        try {
            const response = await fetch('https://thecrustatngb.co.uk/menu-with-stock', {
                headers: {
                    'Authorization': 'Basic ' + btoa('admin:password123!')
                }
            });
            
            if (response.ok) {
                menuItems = await response.json();
                console.log('Menu items with stock loaded:', menuItems.length);
            } else {
                throw new Error('Failed to fetch from menu-with-stock endpoint');
            }
        } catch (stockEndpointError) {
            console.log('Stock endpoint failed, loading separately...');
            
            // Fallback to loading menu and stock data separately
            const [menuResponse, stockResponse] = await Promise.all([
                fetch('https://thecrustatngb.co.uk/menu'),
                fetch('https://thecrustatngb.co.uk/stock-data.json', {
                    headers: {
                        'Authorization': 'Basic ' + btoa('admin:password123!')
                    }
                }).catch(() => ({ json: () => ({}) }))
            ]);
            
            if (!menuResponse.ok) {
                throw new Error('Failed to fetch menu');
            }
            
            menuItems = await menuResponse.json();
            const stockData = await stockResponse.json();
            
            console.log('Menu items loaded:', menuItems.length);
            console.log('Stock data loaded:', Object.keys(stockData).length, 'items');
            
            // Process menu items with stock information
            menuItems = menuItems.map(item => {
                const stockInfo = stockData[item.name] || { stock: 999, minStock: 0 }; // Default to available if no stock data
                return {
                    ...item,
                    stockInfo: stockInfo,
                    isInStock: stockInfo.stock > 0,
                    isLowStock: stockInfo.stock <= stockInfo.minStock && stockInfo.stock > 0
                };
            });
        }
        
        // Extract categories
        allCategories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
        populateCategoryFilter();
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menu-items-container').innerHTML = 
            '<p style="color: red;">Error loading menu items. Please refresh the page.</p>';
    }
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function filterMenuItems() {
    const searchTerm = document.getElementById('menu-search').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;
    
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = !searchTerm || 
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    displayMenuItems(filteredItems);
}

function displayMenuItems(items) {
    const container = document.getElementById('menu-items-container');
    
    if (items.length === 0) {
        container.innerHTML = '<p>No menu items found.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        
        // Handle different option formats: sizes, types, or single price
        let options = {};
        let optionType = '';
        
        if (item.sizes && Array.isArray(item.sizes)) {
            // Pizza sizes format: [{size: "Small", price: 9.99}]
            item.sizes.forEach(sizeObj => {
                options[sizeObj.size] = sizeObj.price;
            });
            optionType = 'sizes';
        } else if (item.types && Array.isArray(item.types)) {
            // Drinks/dips format: [{name: "330ml Can", price: 1.50}]
            item.types.forEach(typeObj => {
                options[typeObj.name] = typeObj.price;
            });
            optionType = 'types';
        } else if (item.sizes && typeof item.sizes === 'object') {
            // Object format sizes
            options = item.sizes;
            optionType = 'sizes';
        } else if (item.price) {
            // Single price item
            options[item.name] = item.price;
            optionType = 'single';
        }
        
        const hasMultipleOptions = Object.keys(options).length > 1;
        const isOutOfStock = item.stockInfo && !item.isInStock;
        const isLowStock = item.stockInfo && item.isLowStock;
        
        // Add stock status classes
        if (isOutOfStock) {
            itemCard.classList.add('out-of-stock');
        } else if (isLowStock) {
            itemCard.classList.add('low-stock');
        }
        
        // Get stock status text
        let stockStatus = '';
        if (isOutOfStock) {
            stockStatus = '<span class="stock-status out-of-stock">OUT OF STOCK</span>';
        } else if (isLowStock) {
            stockStatus = `<span class="stock-status low-stock">LOW STOCK (${item.stockInfo.stock} left)</span>`;
        } else if (item.stockInfo && item.stockInfo.stock < 999) {
            stockStatus = `<span class="stock-status in-stock">${item.stockInfo.stock} in stock</span>`;
        }
        
        itemCard.innerHTML = `
            <div class="menu-item-info">
                <h4>${item.name || 'Unnamed Item'}</h4>
                <p class="menu-item-description">${item.description || ''}</p>
                ${stockStatus}
                ${hasMultipleOptions ? `<p class="menu-item-sizes">Multiple ${optionType} available</p>` : ''}
            </div>
            <div class="menu-item-actions">
                ${hasMultipleOptions ? 
                    Object.entries(options).map(([optionName, price]) => {
                        const displayName = optionType === 'single' ? optionName : item.name + ' (' + optionName + ')';
                        const buttonLabel = optionType === 'single' ? '£' + parseFloat(price).toFixed(2) : optionName + ' - £' + parseFloat(price).toFixed(2);
                        const safeName = displayName.replace(/'/g, "\\'");
                        return '<button class="menu-add-btn ' + (isOutOfStock ? 'disabled' : '') + '" ' +
                                (isOutOfStock ? 'disabled' : '') + ' ' +
                                'onclick="addToManualCart(\'' + safeName + '\', ' + price + ', ' + isOutOfStock + ')">' +
                            buttonLabel +
                        '</button>';
                    }).join('') :
                    '<button class="menu-add-btn ' + (isOutOfStock ? 'disabled' : '') + '" ' +
                            (isOutOfStock ? 'disabled' : '') + ' ' +
                            'onclick="addToManualCart(\'' + item.name.replace(/'/g, "\\'") + '\', ' + (Object.values(options)[0] || item.price || 0) + ', ' + isOutOfStock + ')">' +
                        '£' + parseFloat(Object.values(options)[0] || item.price || 0).toFixed(2) +
                    '</button>'
                }
            </div>
        `;
        
        container.appendChild(itemCard);
    });
}

function addToManualCart(itemName, price, isOutOfStock = false) {
    // Prevent adding out of stock items
    if (isOutOfStock) {
        alert('This item is currently out of stock and cannot be added to the order.');
        return;
    }
    
    // Check if item already exists in cart
    const existingItem = manualCart.find(item => item.name === itemName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        manualCart.push({
            name: itemName,
            price: parseFloat(price),
            quantity: 1
        });
    }
    
    updateCartDisplay();
    
    // Visual feedback
    const addButton = event.target;
    const originalText = addButton.textContent;
    addButton.textContent = 'Added!';
    addButton.style.backgroundColor = '#28a745';
    setTimeout(() => {
        addButton.textContent = originalText;
        addButton.style.backgroundColor = '';
    }, 1000);
}

function removeFromManualCart(index) {
    manualCart.splice(index, 1);
    updateCartDisplay();
}

function updateCartQuantity(index, change) {
    const item = manualCart[index];
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromManualCart(index);
    } else {
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('order-cart');
    const totalElement = document.getElementById('order-total');
    
    if (manualCart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart">No items added yet</p>';
        totalElement.textContent = 'Total: £0.00';
        return;
    }
    
    let cartHTML = '';
    let total = 0;
    
    manualCart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">£${item.price.toFixed(2)} each</span>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity(${index}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromManualCart(${index})">Remove</button>
                </div>
                <div class="cart-item-total">£${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    cartContainer.innerHTML = cartHTML;
    totalElement.textContent = `Total: £${total.toFixed(2)}`;
}

function clearOrder() {
    if (manualCart.length === 0) return;
    
    if (confirm('Are you sure you want to clear the entire order?')) {
        manualCart = [];
        updateCartDisplay();
        
        // Clear customer details
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-email').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('customer-postcode').value = '';
        document.getElementById('order-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('order-time-slot').value = '';
        document.getElementById('order-comments').value = '';
        
        // Repopulate time slots for today
        populateTimeSlots();
        
        // Reset to collection
        document.querySelector('input[name="orderType"][value="collection"]').checked = true;
        document.getElementById('delivery-fields').style.display = 'none';
    }
}

async function submitOrder() {
    // Validate required fields
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const orderTimeSlot = document.getElementById('order-time-slot').value;
    const orderDate = document.getElementById('order-date').value;
    
    if (!customerName) {
        alert('Please enter customer name');
        document.getElementById('customer-name').focus();
        return;
    }
    
    if (!customerPhone) {
        alert('Please enter customer phone number');
        document.getElementById('customer-phone').focus();
        return;
    }
    
    if (!orderDate) {
        alert('Please select a delivery date');
        document.getElementById('order-date').focus();
        return;
    }
    
    if (!orderTimeSlot) {
        alert('Please select a time slot');
        document.getElementById('order-time-slot').focus();
        return;
    }
    
    if (manualCart.length === 0) {
        alert('Please add items to the order');
        return;
    }
    
    // Calculate total
    const total = manualCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get form values
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Build order object
    const order = {
        cart: manualCart,
        total: total,
        orderType: orderType,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: document.getElementById('customer-email').value.trim(),
        customerAddress: document.getElementById('customer-address').value.trim(),
        customerPostcode: document.getElementById('customer-postcode').value.trim(),
        orderTimeSlot: orderTimeSlot,
        orderDate: orderDate,
        orderComments: document.getElementById('order-comments').value.trim(),
        method: paymentMethod,
        status: 'pending',
        placedAt: new Date().toISOString(),
        isManualOrder: true, // Flag to identify manual orders
        enteredBy: 'admin' // Could be made dynamic if multiple admin users
    };
    
    // Show loading state
    const submitBtn = document.getElementById('submit-order-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        console.log('Submitting manual order:', order);
        
        const response = await fetch('https://thecrustatngb.co.uk/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Order submitted successfully:', result);
        
        // Calculate kitchen time for the alert
        const kitchenTime = calculateKitchenTime(orderTimeSlot);
        const kitchenMsg = kitchenTime ? `\n🍕 OUT OF KITCHEN BY: ${kitchenTime}` : '';
        
        // Success message
        alert(`Order submitted successfully!\nOrder ID: ${result.orderId || 'N/A'}\nTotal: £${total.toFixed(2)}\nDelivery: ${orderTimeSlot}${kitchenMsg}`);
        
        // Clear the form
        clearOrder();
        
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('Error submitting order: ' + error.message + '\nPlease try again.');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}