// admin-sales.js
// Loads and displays daily sales summary and order details
const BACKEND = window.location.hostname === 'localhost' ? 'http://localhost:4242' : 'https://thecrustatngb.co.uk';
let allOrders = [];
function printSales() {
  window.print();
}
async function loadSales() {
  const dateInput = document.getElementById('sales-date');
  const selectedDate = dateInput.value;
  try {
    const res = await fetch(`${BACKEND}/orders.json`);
    allOrders = await res.json();
  } catch (e) {
    allOrders = [];
  }
  renderSales(selectedDate);
}
function renderSales(selectedDate) {
  const tbody = document.querySelector('#sales-table tbody');
  const summaryDiv = document.getElementById('sales-summary');
  tbody.innerHTML = '';
  let filtered = allOrders;
  if (selectedDate) {
    filtered = allOrders.filter(order => {
      const dateStr = order.placedAt || order.time;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      // Compare only yyyy-mm-dd
      return d.toISOString().slice(0, 10) === selectedDate;
    });
  }
  let totalSales = 0;
  let cashSales = 0;
  let cardSales = 0;
  let manualOrders = 0;
  let manualSales = 0;
  let onlineOrders = 0;
  let onlineSales = 0;
  
  filtered.forEach((order, idx) => {
    const dateStr = order.placedAt || order.time;
    let placedAt = '';
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        placedAt = d.toLocaleString();
      } catch (e) {
        placedAt = dateStr;
      }
    }
    
    totalSales += order.total || 0;
    if (order.method === 'cash') cashSales += order.total || 0;
    if (order.method === 'card') cardSales += order.total || 0;
    
    // Track manual vs online orders
    if (order.isManualOrder) {
      manualOrders++;
      manualSales += order.total || 0;
    } else {
      onlineOrders++;
      onlineSales += order.total || 0;
    }
    
    // Determine row color class based on order source and payment method
    let rowClass = '';
    if (order.isManualOrder) {
      rowClass = 'sales-row-manual';
    } else if (order.method === 'cash') {
      rowClass = 'sales-row-cash';
    } else if (order.method === 'card') {
      rowClass = 'sales-row-card';
    }
    
    const tr = document.createElement('tr');
    tr.className = rowClass;
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.orderType || ''}</td>
      <td>${order.total ? order.total.toFixed(2) : ''}</td>
      <td>${order.orderTimeSlot || ''}</td>
      <td>${placedAt}</td>
      <td>
        <span class="payment-method ${order.isManualOrder ? 'manual-order' : order.method}">
          ${order.isManualOrder ? 'Manual (' + (order.method || 'cash') + ')' : (order.method || '')}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
  summaryDiv.innerHTML = `
    <h3>Sales Summary</h3>
    <div class="sales-summary-grid">
      <div class="summary-stat">
        <span class="stat-label">Total Sales:</span>
        <span class="stat-value">£${totalSales.toFixed(2)}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Total Orders:</span>
        <span class="stat-value">${filtered.length}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Card Sales:</span>
        <span class="stat-value stat-card">£${cardSales.toFixed(2)}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Cash Sales:</span>
        <span class="stat-value stat-cash">£${cashSales.toFixed(2)}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Manual Orders:</span>
        <span class="stat-value stat-manual">${manualOrders} (£${manualSales.toFixed(2)})</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Online Orders:</span>
        <span class="stat-value stat-online">${onlineOrders} (£${onlineSales.toFixed(2)})</span>
      </div>
    </div>
    <div class="sales-legend">
      <h4>Color Legend:</h4>
      <div class="legend-items">
        <span class="legend-item"><span class="color-box sales-row-cash"></span> Cash Orders</span>
        <span class="legend-item"><span class="color-box sales-row-card"></span> Card Orders</span>
        <span class="legend-item"><span class="color-box sales-row-manual"></span> Manual/Phone Orders</span>
      </div>
    </div>`;
}
document.addEventListener('DOMContentLoaded', function() {
  const dateInput = document.getElementById('sales-date');
  // Default to today
  dateInput.value = new Date().toISOString().slice(0, 10);
  loadSales();
  dateInput.addEventListener('change', () => loadSales());
});
