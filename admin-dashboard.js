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

function printOrders() {
  window.print();
}
function printSingleOrder(idx) {
  const order = allOrders[idx];
  if (!order) return;
  
  // Calculate kitchen time
  const kitchenTime = calculateKitchenTime(order.orderTimeSlot);
  
  const printWin = window.open('', '', 'width=600,height=800');
  let html = `<html><head><title>Order #${idx + 1}</title><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 2em; }
    h2 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 1em; }
    th, td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
    th { background: #222; color: #fff; }
    .kitchen-time { background: #ff6b6b; color: white; font-weight: bold; }
  </style></head><body>`;
  html += `<h2>Order #${idx + 1}</h2>`;
  html += '<table>';
  html += `<tr><th>Name</th><td>${order.customerName || ''}</td></tr>`;
  html += `<tr><th>Phone</th><td>${order.customerPhone || ''}</td></tr>`;
  html += `<tr><th>Type</th><td>${order.orderType || ''}</td></tr>`;
  html += `<tr><th>Delivery Date</th><td>${order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'Not set'}</td></tr>`;
  html += `<tr><th>Delivery Time Slot</th><td>${order.orderTimeSlot || ''}</td></tr>`;
  if (kitchenTime) {
    html += `<tr class="kitchen-time"><th>🍕 OUT OF KITCHEN BY</th><td>${kitchenTime}</td></tr>`;
  }
  html += `<tr><th>Status</th><td>${order.status || 'pending'}</td></tr>`;
  html += `<tr><th>Total (£)</th><td>${order.total ? order.total.toFixed(2) : ''}</td></tr>`;
  html += `<tr><th>Note</th><td>${order.adminNote || ''}</td></tr>`;
  html += '</table>';
  html += '<h3>Items</h3>';
  html += '<ul>';
  if (order.cart && order.cart.length) {
    order.cart.forEach(item => {
      html += `<li>${item.name} x${item.quantity || item.count || 1} - £${item.price ? item.price.toFixed(2) : ''}</li>`;
    });
  } else {
    html += '<li>No items</li>';
  }
  html += '</ul>';
  html += '</body></html>';
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  printWin.print();
  printWin.close();
}
// Point to customer website where orders are stored
const BACKEND = 'https://thecrustatngb.co.uk';

// Test function to debug API connectivity
async function testAPI() {
  console.log('Testing API connectivity...');
  console.log('BACKEND URL:', BACKEND);
  
  try {
    // Test simple GET request first
    const testRes = await fetch(`${BACKEND}/debug`);
    console.log('Debug endpoint status:', testRes.status);
    const testText = await testRes.text();
    console.log('Debug endpoint response:', testText);
    
    // Test the login endpoint with a simple request
    const loginRes = await fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'test' })
    });
    console.log('Login endpoint status:', loginRes.status);
    const loginText = await loginRes.text();
    console.log('Login endpoint response:', loginText);
    
  } catch (error) {
    console.error('API test error:', error);
  }
}

// Call testAPI on page load for debugging
window.testAPI = testAPI;
let allOrders = [];
let currentUser = localStorage.getItem('adminUser') || '';
function showLogin(show) {
  console.log('showLogin called with:', show);
  const loginBox = document.getElementById('login-box');
  const dashboard = document.getElementById('dashboard');
  if (!loginBox || !dashboard) {
    console.error('Login box or dashboard element not found!');
    return;
  }
  if (show) {
    loginBox.classList.remove('hidden');
    dashboard.classList.add('hidden');
    // Clear login fields every time login is shown
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  } else {
    loginBox.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }
  console.log('loginBox display:', loginBox.style.display, 'dashboard display:', dashboard.style.display);
}

// Global inactivity timer variables and functions
let inactivityTimer;
function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(function() {
    localStorage.removeItem('adminUser');
    currentUser = '';
    showLogin(true);
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    alert('Session expired due to inactivity. Please log in again.');
  }, 1800000); // 30 minutes (1,800,000 ms)
}

async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = '';
  try {
    console.log('Making login request to:', `${BACKEND}/login`);
    console.log('Request body:', { username, password });
    
    const res = await fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('Response received');
    console.log('Response status:', res.status, res.statusText);
    console.log('Response headers:', res.headers);
    console.log('Response type:', res.type);
    console.log('Response ok:', res.ok);
    
    if (!res.ok) {
      msg.textContent = `Network/server error: ${res.status} ${res.statusText}`;
      return;
    }
    
    // Get response as text first to debug
    const responseText = await res.text();
    console.log('Raw response length:', responseText.length);
    console.log('Raw response:', responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error('Server returned empty response');
      msg.textContent = 'Server returned empty response';
      return;
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      console.error('Response was:', responseText);
      msg.textContent = 'Server returned invalid response: ' + responseText.substring(0, 100);
      return;
    };
    if (data.success) {
      console.log('Login successful, username:', username);
      localStorage.setItem('adminUser', username);
      currentUser = username;
      resetInactivityTimer(); // Start timer after successful login
      showLogin(false);
      loadOrders();
    } else {
      console.warn('Login failed:', data.error);
      msg.textContent = data.error || 'Login failed.';
    }
  } catch (e) {
    console.error('Login error:', e);
    msg.textContent = 'Login error: ' + (e.message || e);
  }
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
  });
  document.getElementById('login-btn').onclick = login;
  document.getElementById('logout-btn').onclick = function() {
  localStorage.removeItem('adminUser');
  currentUser = '';
  showLogin(true);
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  };
  // Only show login page if not already logged in
  if (!currentUser) {
    showLogin(true);
  } else {
    resetInactivityTimer(); // Start timer for existing session
    showLogin(false);
    loadOrders();
  }
  document.getElementById('search').addEventListener('input', renderOrders);
  document.getElementById('date-filter').addEventListener('change', renderOrders);

  // Security: Auto-logout when page is closed (but allow navigation between admin pages)
  window.addEventListener('beforeunload', function() {
    // Note: Disabled clearing localStorage to enable seamless navigation
    // between admin pages. Security is maintained through inactivity timers.
    // localStorage.removeItem('adminUser');
    // currentUser = '';
  });

  // Security: Auto-logout when browser tab loses focus for extended period
  let focusTimer;
  window.addEventListener('blur', function() {
    // Start timer when window loses focus
    focusTimer = setTimeout(function() {
      localStorage.removeItem('adminUser');
      currentUser = '';
      showLogin(true);
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      alert('Session expired due to inactivity. Please log in again.');
    }, 300000); // 5 minutes (300,000 ms)
  });

  window.addEventListener('focus', function() {
    // Clear timer when window gains focus
    if (focusTimer) {
      clearTimeout(focusTimer);
      focusTimer = null;
    }
  });

  // Security: Auto-logout after 30 minutes of any inactivity (function defined globally)

  // Reset timer on any user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(function(event) {
    document.addEventListener(event, resetInactivityTimer, true);
  });

  // Start the inactivity timer if user is logged in
  if (currentUser) {
    resetInactivityTimer();
  }
});
async function loadOrders() {
  console.log('Loading orders...');
  try {
    const jsonRes = await fetch(`${BACKEND}/orders.json`, {
      headers: {
        'Authorization': 'Basic ' + btoa('admin:password123!')
      }
    });
    if (jsonRes.ok) {
      allOrders = await jsonRes.json();
      console.log('Orders loaded:', allOrders.length);
    } else {
      console.error('Failed to fetch orders:', jsonRes.status, jsonRes.statusText);
      throw new Error(`Failed to fetch orders: ${jsonRes.status}`);
    }
  } catch (e) {
    console.error('Error loading orders:', e);
    allOrders = [];
  }
  populateDateFilter();
  renderOrders();
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

function renderOrders() {
  const search = document.getElementById('search').value.toLowerCase();
  const dateFilter = document.getElementById('date-filter').value;
  const tbody = document.querySelector('#orders-table tbody');
  const ordersCount = document.getElementById('orders-count');
  tbody.innerHTML = '';
  
  let displayedOrders = 0;
  let filteredOrders = [];
  
  allOrders.forEach((order, idx) => {
    // Check date filter first
    if (!orderMatchesDateFilter(order, dateFilter)) return;
    
    // Then check search filter
    if (
      search &&
      !(
        (order.customerName || '').toLowerCase().includes(search) ||
        (order.customerPhone || '').toLowerCase().includes(search) ||
        (order.status || '').toLowerCase().includes(search)
      )
    ) return;
    
    filteredOrders.push({order, idx});
  });
  
  filteredOrders.forEach(({order, idx}) => {
    displayedOrders++;
    const tr = document.createElement('tr');
    let placedAt = '';
    const dateStr = order.placedAt || order.time;
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        placedAt = d.toLocaleString();
      } catch (e) {
        placedAt = dateStr;
      }
    }
    // Format delivery date
    const deliveryDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'Not set';
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.customerPhone || ''}</td>
      <td>${order.orderType || ''}</td>
      <td>${order.cart ? order.cart.map(i => i.name + ' x' + (i.quantity || i.count || 1)).join('<br>') : ''}</td>
      <td>${order.total ? order.total.toFixed(2) : ''}</td>
      <td>${deliveryDate}</td>
      <td>${order.orderTimeSlot || ''}</td>
      <td>${placedAt}</td>
      <td><span class="status-btn ${order.status || 'pending'}">${order.status || 'pending'}</span></td>
      <td>
        <input class="note-input" type="text" value="${order.adminNote || ''}" id="note-${idx}">
        <button class="save-note-btn" onclick="updateNote(${idx})">Save</button>
      </td>
      <td>
        <button class="status-btn completed" onclick="updateStatus(${idx}, 'completed')">Completed</button>
        <button class="status-btn refunded" onclick="updateStatus(${idx}, 'refunded')">Refunded</button>
        <button class="status-btn cancelled" onclick="updateStatus(${idx}, 'cancelled')">Cancelled</button>
        <button class="status-btn" onclick="printSingleOrder(${idx})">Print</button>
        <button class="status-btn refund" onclick="refundOrder(${idx})">Refund</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Update orders count display
  if (displayedOrders === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="11" style="text-align:center;color:#b00;font-weight:bold;">No orders found or nothing matches your search.</td>`;
    tbody.appendChild(tr);
    ordersCount.textContent = 'No orders to display';
  } else {
    const dateFilterText = dateFilter === 'today' ? 'today' : 
                          dateFilter === 'all' ? 'total' : 
                          new Date(dateFilter).toLocaleDateString('en-GB');
    ordersCount.textContent = `Showing ${displayedOrders} order${displayedOrders === 1 ? '' : 's'} ${dateFilter === 'all' ? 'total' : 'for ' + dateFilterText}`;
  }
}

async function refundOrder(index) {
  if (!currentUser) return alert('Please log in.');
  const order = allOrders[index];
  if (!order || order.method !== 'card') {
    alert('Refunds are only available for card payments.');
    return;
  }
  if (!confirm('Are you sure you want to refund this order?')) return;
  try {
    const res = await fetch(`${BACKEND}/refund-order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('admin:password123!')
      },
      body: JSON.stringify({ orderId: order.id, username: currentUser })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Order refunded successfully.');
      await loadOrders();
    } else {
      alert('Refund failed: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    alert('Network error. Please try again.');
  }
}

async function updateStatus(index, status) {
  if (!currentUser) return alert('Please log in.');
  await fetch(`${BACKEND}/update-order`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('admin:password123!')
    },
    body: JSON.stringify({ index, status, username: currentUser })
  });
  await loadOrders();
}
async function updateNote(index) {
  if (!currentUser) return alert('Please log in.');
  const note = document.getElementById(`note-${index}`).value;
  await fetch(`${BACKEND}/update-order`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('admin:password123!')
    },
    body: JSON.stringify({ index, note, username: currentUser })
  });
  await loadOrders();
}

// Stock Status Functions
async function refreshStockStatus() {
  try {
    // Get dough stock
    const doughResponse = await fetch('/stock-dough');
    const doughData = await doughResponse.json();
    document.getElementById('dough-count').textContent = 
      doughData.available || '0';

    // Get today's orders count and revenue
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = allOrders.filter(order => {
      const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    document.getElementById('orders-today').textContent = todaysOrders.length;
    
    const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    document.getElementById('revenue-today').textContent = `£${todaysRevenue.toFixed(2)}`;

  } catch (error) {
    console.error('Error refreshing stock status:', error);
    document.getElementById('dough-count').textContent = 'Error';
    document.getElementById('orders-today').textContent = 'Error';
    document.getElementById('revenue-today').textContent = 'Error';
  }
}

// Load stock status when dashboard loads
async function loadDashboard() {
  await loadOrders();
  await refreshStockStatus();
}

// Override the original loadOrders to also refresh stock
const originalLoadOrders = loadOrders;
loadOrders = async function() {
  await originalLoadOrders();
  await refreshStockStatus();
};

