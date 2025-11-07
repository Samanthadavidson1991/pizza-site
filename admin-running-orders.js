// admin-running-orders.js
// Loads and displays running orders, sorted by time slot and placed time
const BACKEND = window.location.hostname === 'localhost' ? 'http://localhost:4242' : 'https://thecrustatngb.co.uk';
let allOrders = [];

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

// Helper function to check if order matches selected date
function orderMatchesDateFilter(order, dateFilter) {
  if (dateFilter === 'all') return true;
  
  const orderDate = new Date(order.placedAt || order.time);
  if (isNaN(orderDate.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateFilter === 'today') {
    const orderDateOnly = new Date(orderDate);
    orderDateOnly.setHours(0, 0, 0, 0);
    return orderDateOnly.getTime() === today.getTime();
  }
  
  // For specific date strings (YYYY-MM-DD format)
  const filterDate = new Date(dateFilter);
  if (!isNaN(filterDate.getTime())) {
    const orderDateOnly = new Date(orderDate);
    orderDateOnly.setHours(0, 0, 0, 0);
    filterDate.setHours(0, 0, 0, 0);
    return orderDateOnly.getTime() === filterDate.getTime();
  }
  
  return false;
}

// Function to populate date filter dropdown with available dates
function populateDateFilter() {
  const dateFilter = document.getElementById('date-filter');
  const availableDates = new Set();
  
  allOrders.forEach(order => {
    const orderDate = new Date(order.placedAt || order.time);
    if (!isNaN(orderDate.getTime())) {
      const dateStr = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      availableDates.add(dateStr);
    }
  });
  
  // Sort dates in descending order (newest first)
  const sortedDates = Array.from(availableDates).sort().reverse();
  
  // Keep the existing options and add new date options
  const existingOptions = ['today', 'all'];
  
  // Remove old date options, keep only today and all
  Array.from(dateFilter.options).forEach(option => {
    if (!existingOptions.includes(option.value)) {
      option.remove();
    }
  });
  
  // Add date options
  sortedDates.forEach(dateStr => {
    const option = document.createElement('option');
    option.value = dateStr;
    const date = new Date(dateStr);
    option.textContent = date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    dateFilter.appendChild(option);
  });
}

async function loadRunningOrders() {
  try {
    const res = await fetch(`${BACKEND}/orders.json`);
    allOrders = await res.json();
  } catch (e) {
    allOrders = [];
  }
  populateDateFilter();
  renderRunningOrders();
}
function renderRunningOrders() {
  const tbody = document.querySelector('#running-orders-table tbody');
  const summaryDiv = document.getElementById('running-orders-summary');
  const dateFilter = document.getElementById('date-filter').value;
  tbody.innerHTML = '';
  
  // Filter by date first, then by running status
  let filtered = allOrders.filter(order => {
    // Check date filter first
    if (!orderMatchesDateFilter(order, dateFilter)) return false;
    
    // Then check if it's a running order (not completed, refunded, or cancelled)
    return !['completed','refunded','cancelled'].includes((order.status||'').toLowerCase());
  });
  // Sort by time slot, then by placed time
  filtered.sort((a, b) => {
    // Sort by time slot first
    if (a.orderTimeSlot < b.orderTimeSlot) return -1;
    if (a.orderTimeSlot > b.orderTimeSlot) return 1;
    // Then by placed time
    const aTime = new Date(a.placedAt || a.time).getTime();
    const bTime = new Date(b.placedAt || b.time).getTime();
    return aTime - bTime;
  });
  // Get current time and slot
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const currentTimeStr = pad(now.getHours()) + ':' + pad(now.getMinutes());
  // Find the current slot
  let currentSlot = null;
  const slots = [
    '17:00-17:30','17:30-18:00','18:00-18:30','18:30-19:00','19:00-19:30','19:30-20:00','20:00-20:30','20:30-21:00','21:00-21:30','21:30-22:00'
  ];
  for (let slot of slots) {
    const [start, end] = slot.split('-');
    if (currentTimeStr >= start && currentTimeStr < end) {
      currentSlot = slot;
      break;
    }
  }
  filtered.forEach((order, idx) => {
    // Items ordered as a string
    const itemsOrdered = order.cart ? order.cart.map(i => i.name + (i.count ? ' x' + i.count : '')).join(', ') : '';
    // Postcode only for deliveries
    const postcode = order.orderType === 'delivery' ? (order.customerPostcode || '') : '';
    // Calculate kitchen time
    const kitchenTime = calculateKitchenTime(order.orderTimeSlot);
    
    // Find the original index in allOrders array for updating
    const originalIndex = allOrders.findIndex(o => 
      o.customerName === order.customerName && 
      o.customerPhone === order.customerPhone && 
      o.placedAt === order.placedAt
    );
    
    const tr = document.createElement('tr');
    // Format delivery date
    const deliveryDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'Today';
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.orderType || ''}</td>
      <td>${itemsOrdered}</td>
      <td>${deliveryDate}</td>
      <td>${order.orderTimeSlot || ''}</td>
      <td style="font-weight: bold; color: #e74c3c;">${kitchenTime}</td>
      <td>${postcode}</td>
      <td><span class="status-btn ${order.status || 'pending'}">${order.status || 'pending'}</span></td>
      <td>
        <button class="status-btn completed" onclick="markOrderCompleted(${originalIndex})">Mark Completed</button>
        <button class="status-btn cancelled" onclick="markOrderStatus(${originalIndex}, 'cancelled')">Cancel</button>
      </td>
    `;
    if (order.orderTimeSlot === currentSlot) {
      tr.style.background = '#d4f8d4'; // light green
    }
    tbody.appendChild(tr);
  });
  // Update summary with date filter info
  const dateFilterText = dateFilter === 'today' ? 'today' : 
                        dateFilter === 'all' ? 'total' : 
                        new Date(dateFilter).toLocaleDateString('en-GB');
  
  summaryDiv.innerHTML = `<h3>Running Orders</h3>
    <p><strong>Orders in progress ${dateFilter === 'all' ? 'total' : 'for ' + dateFilterText}:</strong> ${filtered.length}</p>`;
  
  // Update dough counter
  updateDoughCounter(filtered);
}

// Function to count dough items from running orders
function updateDoughCounter(orders) {
  console.log('Updating dough counter with orders:', orders.length);
  let totalDoughItems = 0;
  let pizzaCount = 0;
  let garlicBreadCount = 0;
  let doughballsCount = 0;
  
  // Items that require dough (case insensitive matching)
  const doughItems = {
    pizza: ['pizza', 'margherita', 'pepperoni', 'hawaiian', 'quattro', 'meat feast', 'veggie', 'bbq', 'buffalo', 'chicken', 'supreme', 'italian', 'greek', 'mushroom', 'cheese'],
    garlicBread: ['garlic bread', 'garlic', 'bread', 'focaccia'],
    doughballs: ['doughballs', 'dough balls', 'pizza balls', 'bread balls', 'balls']
  };
  
  orders.forEach(order => {
    if (order.cart && Array.isArray(order.cart)) {
      order.cart.forEach(item => {
        const itemName = (item.name || item.item || '').toLowerCase();
        const quantity = parseInt(item.count || item.quantity || 1);
        
        // Check if item contains pizza keywords
        if (doughItems.pizza.some(keyword => itemName.includes(keyword))) {
          pizzaCount += quantity;
          totalDoughItems += quantity;
        }
        // Check if item contains garlic bread keywords
        else if (doughItems.garlicBread.some(keyword => itemName.includes(keyword))) {
          garlicBreadCount += quantity;
          totalDoughItems += quantity;
        }
        // Check if item contains doughballs keywords
        else if (doughItems.doughballs.some(keyword => itemName.includes(keyword))) {
          doughballsCount += quantity;
          totalDoughItems += quantity;
        }
      });
    }
  });
  
  // Update the display
  console.log('Dough counts - Total:', totalDoughItems, 'Pizzas:', pizzaCount, 'Garlic Bread:', garlicBreadCount, 'Doughballs:', doughballsCount);
  
  const totalElement = document.getElementById('total-dough-items');
  const pizzaElement = document.getElementById('pizza-count');
  const garlicElement = document.getElementById('garlic-bread-count');
  const doughballsElement = document.getElementById('doughballs-count');
  
  if (totalElement) totalElement.textContent = totalDoughItems;
  if (pizzaElement) pizzaElement.textContent = pizzaCount;
  if (garlicElement) garlicElement.textContent = garlicBreadCount;
  if (doughballsElement) doughballsElement.textContent = doughballsCount;
  
  console.log('Dough counter elements found:', {
    total: !!totalElement,
    pizza: !!pizzaElement,
    garlic: !!garlicElement,
    doughballs: !!doughballsElement
  });
}

// Function to mark an order as completed
async function markOrderCompleted(orderIndex) {
  if (orderIndex < 0 || orderIndex >= allOrders.length) {
    alert('Order not found');
    return;
  }
  
  const order = allOrders[orderIndex];
  const customerName = order.customerName || 'Unknown';
  
  if (!confirm(`Mark order for ${customerName} as completed?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND}/update-order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        index: orderIndex, 
        status: 'completed',
        username: localStorage.getItem('adminUser') || 'system'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Update the local order status
      allOrders[orderIndex].status = 'completed';
      // Re-render the table to remove the completed order from running orders
      renderRunningOrders();
      
      // Show success message
      alert(`Order for ${customerName} marked as completed!`);
    } else {
      console.error('Update failed:', data);
      alert('Failed to update order: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error. Please check your connection and try again.');
  }
}

// Generic function to update order status
async function markOrderStatus(orderIndex, newStatus) {
  if (orderIndex < 0 || orderIndex >= allOrders.length) {
    alert('Order not found');
    return;
  }
  
  const order = allOrders[orderIndex];
  const customerName = order.customerName || 'Unknown';
  
  if (!confirm(`Mark order for ${customerName} as ${newStatus}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND}/update-order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        index: orderIndex, 
        status: newStatus,
        username: localStorage.getItem('adminUser') || 'system'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Update the local order status
      allOrders[orderIndex].status = newStatus;
      // Re-render the table
      renderRunningOrders();
      
      // Show success message
      alert(`Order for ${customerName} marked as ${newStatus}!`);
    } else {
      console.error('Update failed:', data);
      alert('Failed to update order: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error. Please check your connection and try again.');
  }
}
document.addEventListener('DOMContentLoaded', function() {
  loadRunningOrders();
  setInterval(loadRunningOrders, 60000); // Refresh every minute
  
  // Add event listener for date filter
  document.getElementById('date-filter').addEventListener('change', renderRunningOrders);
});
