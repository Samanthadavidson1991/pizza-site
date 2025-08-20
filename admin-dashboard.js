function printOrders() {
  window.print();
}
function printSingleOrder(idx) {
  const order = allOrders[idx];
  if (!order) return;
  const printWin = window.open('', '', 'width=600,height=800');
  let html = `<html><head><title>Order #${idx + 1}</title><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 2em; }
    h2 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 1em; }
    th, td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
    th { background: #222; color: #fff; }
  </style></head><body>`;
  html += `<h2>Order #${idx + 1}</h2>`;
  html += '<table>';
  html += `<tr><th>Name</th><td>${order.customerName || ''}</td></tr>`;
  html += `<tr><th>Phone</th><td>${order.customerPhone || ''}</td></tr>`;
  html += `<tr><th>Type</th><td>${order.orderType || ''}</td></tr>`;
  html += `<tr><th>Time Slot</th><td>${order.orderTimeSlot || ''}</td></tr>`;
  html += `<tr><th>Status</th><td>${order.status || 'pending'}</td></tr>`;
  html += `<tr><th>Total (£)</th><td>${order.total ? order.total.toFixed(2) : ''}</td></tr>`;
  html += `<tr><th>Note</th><td>${order.adminNote || ''}</td></tr>`;
  html += '</table>';
  html += '<h3>Items</h3>';
  html += '<ul>';
  if (order.cart && order.cart.length) {
    order.cart.forEach(item => {
      html += `<li>${item.name} x${item.count || 1} - £${item.price ? item.price.toFixed(2) : ''}</li>`;
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
const BACKEND = 'https://pizza-site-c8t6.onrender.com';
let allOrders = [];
let currentUser = localStorage.getItem('adminUser') || '';
function showLogin(show) {
  document.getElementById('login-box').style.display = show ? '' : 'none';
  document.getElementById('dashboard').style.display = show ? 'none' : '';
}
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = '';
  try {
    const res = await fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('adminUser', username);
      currentUser = username;
      showLogin(false);
      loadOrders();
    } else {
      msg.textContent = data.error || 'Login failed.';
    }
  } catch (e) {
    msg.textContent = 'Login error.';
  }
}
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  login();
});
document.getElementById('login-btn').onclick = login;
document.getElementById('logout-btn').onclick = function() {
  localStorage.removeItem('adminUser');
  currentUser = '';
  showLogin(true);
};
if (currentUser) {
  showLogin(false);
}
async function loadOrders() {
  const res = await fetch(`${BACKEND}/orders`);
  try {
    const jsonRes = await fetch(`${BACKEND}/orders.json`);
    if (jsonRes.ok) {
      allOrders = await jsonRes.json();
    } else {
      throw new Error('orders.json not found');
    }
  } catch {
    allOrders = [];
  }
  renderOrders();
}
function renderOrders() {
  const search = document.getElementById('search').value.toLowerCase();
  const tbody = document.querySelector('#orders-table tbody');
  tbody.innerHTML = '';
  allOrders.forEach((order, idx) => {
    if (
      search &&
      !(
        (order.customerName || '').toLowerCase().includes(search) ||
        (order.customerPhone || '').toLowerCase().includes(search) ||
        (order.status || '').toLowerCase().includes(search)
      )
    ) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.customerPhone || ''}</td>
      <td>${order.orderType || ''}</td>
      <td>${order.cart ? order.cart.map(i => i.name + ' x' + (i.count || 1)).join('<br>') : ''}</td>
      <td>${order.total ? order.total.toFixed(2) : ''}</td>
      <td>${order.orderTimeSlot || ''}</td>
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
      </td>
    `;
    tbody.appendChild(tr);
  });
}
async function updateStatus(index, status) {
  if (!currentUser) return alert('Please log in.');
  await fetch(`${BACKEND}/update-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, status, username: currentUser })
  });
  await loadOrders();
}
async function updateNote(index) {
  if (!currentUser) return alert('Please log in.');
  const note = document.getElementById(`note-${index}`).value;
  await fetch(`${BACKEND}/update-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, note, username: currentUser })
  });
  await loadOrders();
}
document.getElementById('search').addEventListener('input', renderOrders);
if (currentUser) loadOrders();
