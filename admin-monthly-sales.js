// admin-monthly-sales.js
// Loads and displays monthly sales breakdown by item
const BACKEND = window.location.hostname === 'localhost' ? 'http://localhost:4242' : 'https://thecrustatngb.co.uk';
let allOrders = [];
function printMonthlySales() {
  window.print();
}
async function loadMonthlySales() {
  const monthInput = document.getElementById('sales-month');
  const selectedMonth = monthInput.value; // yyyy-mm
  try {
    const res = await fetch(`${BACKEND}/orders.json`);
    allOrders = await res.json();
  } catch (e) {
    allOrders = [];
  }
  renderMonthlySales(selectedMonth);
}
function renderMonthlySales(selectedMonth) {
  const tbody = document.querySelector('#monthly-sales-table tbody');
  const summaryDiv = document.getElementById('monthly-sales-summary');
  tbody.innerHTML = '';
  let filtered = allOrders;
  if (selectedMonth) {
    filtered = allOrders.filter(order => {
      const dateStr = order.placedAt || order.time;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      // Compare only yyyy-mm
      return d.toISOString().slice(0, 7) === selectedMonth;
    });
  }
  // Aggregate sales by item
  const itemStats = {};
  filtered.forEach(order => {
    if (!order.cart) return;
    order.cart.forEach(item => {
      const key = item.name;
      if (!itemStats[key]) {
        itemStats[key] = {
          name: item.name,
          category: item.category || '',
          orders: 0,
          totalSold: 0,
          totalAmount: 0
        };
      }
      itemStats[key].orders += 1;
      itemStats[key].totalSold += item.count || 1;
      itemStats[key].totalAmount += item.price * (item.count || 1);
    });
  });
  // Render table
  Object.values(itemStats).forEach(stat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${stat.name}</td>
      <td>${stat.category}</td>
      <td>${stat.orders}</td>
      <td>${stat.totalSold}</td>
      <td>£${stat.totalAmount.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
  summaryDiv.innerHTML = `<h3>Monthly Sales Summary</h3>
    <p><strong>Total Orders:</strong> ${filtered.length}</p>
    <p><strong>Total Sales (£):</strong> £${Object.values(itemStats).reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}</p>`;
}
document.addEventListener('DOMContentLoaded', function() {
  const monthInput = document.getElementById('sales-month');
  // Default to current month
  monthInput.value = new Date().toISOString().slice(0, 7);
  loadMonthlySales();
  monthInput.addEventListener('change', () => loadMonthlySales());
});
