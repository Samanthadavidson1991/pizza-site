// admin-sales.js
// Loads and displays daily sales summary and order details
const BACKEND = 'https://pizza-site-c8t6.onrender.com';
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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.orderType || ''}</td>
      <td>${order.total ? order.total.toFixed(2) : ''}</td>
      <td>${order.orderTimeSlot || ''}</td>
      <td>${placedAt}</td>
      <td>${order.method || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  summaryDiv.innerHTML = `<h3>Sales Summary</h3>
    <p><strong>Total Sales:</strong> £${totalSales.toFixed(2)}</p>
    <p><strong>Card Sales:</strong> £${cardSales.toFixed(2)}</p>
    <p><strong>Cash Sales:</strong> £${cashSales.toFixed(2)}</p>
    <p><strong>Orders:</strong> ${filtered.length}</p>`;
}
document.addEventListener('DOMContentLoaded', function() {
  const dateInput = document.getElementById('sales-date');
  // Default to today
  dateInput.value = new Date().toISOString().slice(0, 10);
  loadSales();
  dateInput.addEventListener('change', () => loadSales());
});
