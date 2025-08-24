// Menu data loaded from backend
let menuData = {
  PIZZAS: [],
  SALADS: [],
  SIDES: [],
  DRINKS: [],
  DESSERTS: [],
  CHICKEN: []
};

async function loadMenuData() {
  try {
    const res = await fetch('/menu');
    const items = await res.json();
    // Reset
    menuData = { PIZZAS: [], SALADS: [], SIDES: [], DRINKS: [], DESSERTS: [], CHICKEN: [] };
    items.forEach(item => {
      if (menuData[item.category]) {
        menuData[item.category].push(item);
      }
    });
    renderMenuItems();
  } catch (err) {
    alert('Failed to load menu from server.');
  }
}

async function addMenuItem(category, item) {
  try {
    await fetch('/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, category })
    });
    await loadMenuData();
  } catch (err) {
    alert('Failed to add menu item.');
  }
}

async function deleteMenuItem(category, id) {
  try {
    await fetch(`/menu/${id}`, { method: 'DELETE' });
    await loadMenuData();
  } catch (err) {
    alert('Failed to delete menu item.');
  }
}

let currentCategory = 'PIZZAS';
let newPizzaSizes = [];

function renderMenuItems() {
  const list = document.getElementById('menu-items-list');
  list.innerHTML = '';
  menuData[currentCategory].forEach((item) => {
    const li = document.createElement('li');
    if (currentCategory === 'PIZZAS') {
      li.innerHTML = `<strong>${item.name}</strong><ul style='margin:0; padding-left:1.2em;'>` +
        (item.sizes ? item.sizes.map(s => `<li>${s.size} - £${s.price.toFixed(2)}</li>`).join('') : '') + '</ul>';
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.style.marginLeft = '1em';
      delBtn.style.background = '#e74c3c';
      delBtn.style.color = '#fff';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '3px';
      delBtn.style.padding = '0.2em 0.7em';
      delBtn.style.fontSize = '0.95em';
      delBtn.style.cursor = 'pointer';
      delBtn.onclick = function() {
        deleteMenuItem('PIZZAS', item.id || item._id);
      };
      li.appendChild(delBtn);
    } else {
      li.textContent = `${item.name} - £${item.price ? item.price.toFixed(2) : ''}`;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.style.marginLeft = '1em';
      delBtn.style.background = '#e74c3c';
      delBtn.style.color = '#fff';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '3px';
      delBtn.style.padding = '0.2em 0.7em';
      delBtn.style.fontSize = '0.95em';
      delBtn.style.cursor = 'pointer';
      delBtn.onclick = function() {
        deleteMenuItem(currentCategory, item.id || item._id);
      };
      li.appendChild(delBtn);
    }
    list.appendChild(li);
  });
}

document.querySelectorAll('.menu-category-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentCategory = this.getAttribute('data-category');
    // Show/hide pizza size/price controls
    if (currentCategory === 'PIZZAS') {
      document.getElementById('pizza-sizes-section').style.display = 'flex';
      document.getElementById('new-item-price').classList.add('hide-price');
    } else {
      document.getElementById('pizza-sizes-section').style.display = 'none';
      document.getElementById('new-item-price').classList.remove('hide-price');
    }
    renderMenuItems();
  });
});

document.getElementById('add-item-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('new-item-name').value.trim();
  if (currentCategory === 'PIZZAS') {
    if (name && newPizzaSizes.length > 0) {
      addMenuItem('PIZZAS', { name, sizes: [...newPizzaSizes] });
      newPizzaSizes = [];
      renderPizzaSizesList();
      this.reset();
      document.getElementById('pizza-sizes-list').innerHTML = '';
      document.getElementById('new-item-name').value = '';
    }
  } else {
    const price = parseFloat(document.getElementById('new-item-price').value);
    if (name && !isNaN(price)) {
      addMenuItem(currentCategory, { name, price });
      this.reset();
    }
  }
});

document.getElementById('add-size-price-btn').addEventListener('click', function() {
  const size = document.getElementById('new-size-name').value.trim();
  const price = parseFloat(document.getElementById('new-size-price').value);
  if (size && !isNaN(price)) {
    newPizzaSizes.push({ size, price });
    renderPizzaSizesList();
    document.getElementById('new-size-name').value = '';
    document.getElementById('new-size-price').value = '';
  }
});

function renderPizzaSizesList() {
  const list = document.getElementById('pizza-sizes-list');
  list.innerHTML = '';
  newPizzaSizes.forEach((sp, idx) => {
    const div = document.createElement('div');
    div.textContent = `${sp.size} - £${sp.price.toFixed(2)}`;
    // Add remove button
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.style.marginLeft = '1em';
    btn.onclick = function() {
      newPizzaSizes.splice(idx, 1);
      renderPizzaSizesList();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}


// Initial render
if (currentCategory === 'PIZZAS') {
  document.getElementById('pizza-sizes-section').style.display = 'flex';
  document.getElementById('new-item-price').classList.add('hide-price');
}
renderPizzaSizesList();
loadMenuData();
