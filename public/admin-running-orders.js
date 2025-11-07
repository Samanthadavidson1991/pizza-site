// admin-running-orders.js
// Loads and displays running orders, sorted by time slot and placed time
const BACKEND = 'https://pizza-site-c8t6.onrender.com';
let allOrders = [];
async function loadRunningOrders() {
  try {
    const res = await fetch(`${BACKEND}/orders.json`);
    allOrders = await res.json();
  } catch (e) {
    allOrders = [];
  }
  renderRunningOrders();
}
function renderRunningOrders() {
  const tbody = document.querySelector('#running-orders-table tbody');
  const summaryDiv = document.getElementById('running-orders-summary');
  tbody.innerHTML = '';
  // Only show orders that are not completed, refunded, or cancelled
  let filtered = allOrders.filter(order => !['completed','refunded','cancelled'].includes((order.status||'').toLowerCase()));
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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.orderType || ''}</td>
      <td>${itemsOrdered}</td>
      <td>${order.orderTimeSlot || ''}</td>
      <td>${postcode}</td>
      <td>${order.status || ''}</td>
    `;
    if (order.orderTimeSlot === currentSlot) {
      tr.style.background = '#d4f8d4'; // light green
    }
    tbody.appendChild(tr);
  });
  summaryDiv.innerHTML = `<h3>Running Orders</h3>
    <p><strong>Orders in progress:</strong> ${filtered.length}</p>`;
}
document.addEventListener('DOMContentLoaded', function() {
  loadRunningOrders();
  setInterval(loadRunningOrders, 60000); // Refresh every minute
});
