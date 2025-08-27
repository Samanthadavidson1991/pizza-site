// Menu data loaded from backend
let menuData = {
  PIZZAS: [],
  SALADS: [],
  SIDES: [],
  DRINKS: [],
  DESSERTS: [],
  CHICKEN: []
};

const API_BASE = 'https://pizza-site-c8t6.onrender.com';
async function loadMenuData() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
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
    await fetch(`${API_BASE}/menu`, {
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
    await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
    await loadMenuData();
  } catch (err) {
    alert('Failed to delete menu item.');
  }
}

let currentCategory = 'PIZZAS';
let newPizzaSizes = [];
let newPizzaToppings = [];
let newSaladIngredients = [];
let newSideTypes = [];
let newChickenSizes = [];

function renderMenuItems() {
  const list = document.getElementById('menu-items-list');
  list.innerHTML = '';
  menuData[currentCategory].forEach((item) => {
    const li = document.createElement('li');
    if (currentCategory === 'PIZZAS') {
      // Simpler, smaller, inline display
      let html = `<span style='font-weight:500;'>${item.name}</span>`;
      if (item.sizes && item.sizes.length > 0) {
        html += `<span style='margin-left:0.5em; color:#7a5a00; font-size:0.95em;'>` +
          item.sizes.map(s => `${s.size} £${s.price.toFixed(2)}`).join(' | ') +
          `</span>`;
      }
      if (item.toppings && item.toppings.length > 0) {
        html += `<span style='margin-left:0.5em; color:#888; font-size:0.93em;'>Toppings: ` +
          item.toppings.map(t => typeof t === 'object' && t !== null ? `${t.name}${t.price ? ` (£${t.price.toFixed(2)})` : ''}` : `${t}`).join(', ') +
          `</span>`;
      }
      li.innerHTML = html;
      // Smaller delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.title = 'Delete';
      delBtn.style.marginLeft = '0.7em';
      delBtn.style.background = '#e74c3c';
      delBtn.style.color = '#fff';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '50%';
      delBtn.style.width = '1.5em';
      delBtn.style.height = '1.5em';
      delBtn.style.fontSize = '1em';
      delBtn.style.lineHeight = '1.2em';
      delBtn.style.cursor = 'pointer';
      delBtn.style.verticalAlign = 'middle';
      delBtn.onclick = function() {
        deleteMenuItem('PIZZAS', item.id);
      };
      li.appendChild(delBtn);
    } else {
      li.innerHTML = `<span style='font-weight:500;'>${item.name}</span><span style='margin-left:0.5em; color:#7a5a00;'>£${item.price ? item.price.toFixed(2) : ''}</span>`;
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.title = 'Delete';
      delBtn.style.marginLeft = '0.7em';
      delBtn.style.background = '#e74c3c';
      delBtn.style.color = '#fff';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '50%';
      delBtn.style.width = '1.5em';
      delBtn.style.height = '1.5em';
      delBtn.style.fontSize = '1em';
      delBtn.style.lineHeight = '1.2em';
      delBtn.style.cursor = 'pointer';
      delBtn.style.verticalAlign = 'middle';
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
      document.getElementById('new-item-price').style.display = '';
      // Show Create Your Own section
      const cyo = document.getElementById('create-your-own-section');
      if (cyo) cyo.style.display = 'block';
  document.getElementById('salad-ingredients-section').classList.add('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
      document.getElementById('chicken-sizes-section').style.display = 'none';
    } else {
      document.getElementById('pizza-sizes-section').style.display = 'none';
      document.getElementById('new-item-price').classList.remove('hide-price');
      if (currentCategory === 'CHICKEN') {
        document.getElementById('new-item-price').style.display = 'none';
      } else {
        document.getElementById('new-item-price').style.display = '';
      }
      // Hide Create Your Own section
      const cyo = document.getElementById('create-your-own-section');
      if (cyo) cyo.style.display = 'none';
      if (currentCategory === 'SALADS') {
  document.getElementById('salad-ingredients-section').classList.remove('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
        document.getElementById('chicken-sizes-section').style.display = 'none';
      } else {
  document.getElementById('salad-ingredients-section').classList.add('hidden');
        if (currentCategory === 'SIDES') {
          document.getElementById('side-types-section').classList.remove('hidden');
          document.getElementById('new-item-price').classList.add('hide-price');
          document.getElementById('new-item-price').style.display = 'none';
          document.getElementById('chicken-sizes-section').style.display = 'none';
        } else {
          document.getElementById('side-types-section').classList.add('hidden');
          document.getElementById('new-item-price').classList.remove('hide-price');
          document.getElementById('new-item-price').style.display = '';
          if (currentCategory === 'CHICKEN') {
            document.getElementById('chicken-sizes-section').style.display = 'block';
          } else {
            document.getElementById('chicken-sizes-section').style.display = 'none';
          }
        }
      }
    }
    renderMenuItems();
  });
});

document.getElementById('add-item-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('new-item-name').value.trim();
  if (currentCategory === 'PIZZAS') {
    if (name && newPizzaSizes.length > 0) {
      addMenuItem('PIZZAS', { name, sizes: [...newPizzaSizes], toppings: [...newPizzaToppings] });
      newPizzaSizes = [];
      newPizzaToppings = [];
      renderPizzaSizesList();
      renderToppingsList();
      this.reset();
      document.getElementById('pizza-sizes-list').innerHTML = '';
      document.getElementById('new-item-name').value = '';
    }
  } else {
    if (name) {
      if (currentCategory === 'SALADS') {
        addMenuItem('SALADS', { name, price, ingredients: [...newSaladIngredients] });
        newSaladIngredients = [];
        renderSaladIngredientsList();
      } else if (currentCategory === 'SIDES') {
      addMenuItem('SIDES', { name, types: [...newSideTypes] });
        newSideTypes = [];
        renderSideTypesList();
      } else if (currentCategory === 'CHICKEN') {
        addMenuItem('CHICKEN', { name, sizes: [...newChickenSizes] });
        newChickenSizes = [];
        renderChickenSizesList();
      } else {
        addMenuItem(currentCategory, { name, price });
      }
      this.reset();
    }
  }
});
// Chicken sizes logic
function renderChickenSizesList() {
  const list = document.getElementById('chicken-sizes-list');
  if (!list) return;
  list.innerHTML = '';
  newChickenSizes.forEach((sp, idx) => {
    const div = document.createElement('div');
    div.textContent = `${sp.size} - £${sp.price.toFixed(2)}`;
    // Add remove button
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.style.marginLeft = '1em';
    btn.onclick = function() {
      newChickenSizes.splice(idx, 1);
      renderChickenSizesList();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}
document.getElementById('add-chicken-size-price-btn').addEventListener('click', function() {
  const size = document.getElementById('new-chicken-size-name').value.trim();
  const price = parseFloat(document.getElementById('new-chicken-size-price').value);
  if (size && !isNaN(price)) {
    newChickenSizes.push({ size, price });
    renderChickenSizesList();
    document.getElementById('new-chicken-size-name').value = '';
    document.getElementById('new-chicken-size-price').value = '';
  }
});
// Side types logic
function renderSideTypesList() {
  const list = document.getElementById('side-types-list');
  if (!list) return;
  list.innerHTML = '';
  newSideTypes.forEach((typeObj, idx) => {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.marginRight = '0.7em';
    div.textContent = `${typeObj.name} - £${typeObj.price.toFixed(2)}`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.style.marginLeft = '0.5em';
    btn.onclick = function() {
      newSideTypes.splice(idx, 1);
      renderSideTypesList();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}
document.getElementById('add-side-type-btn').addEventListener('click', function() {
  const name = document.getElementById('new-side-type-name').value.trim();
  const price = parseFloat(document.getElementById('new-side-type-price').value);
  if (name && !isNaN(price)) {
    newSideTypes.push({ name, price });
    renderSideTypesList();
    document.getElementById('new-side-type-name').value = '';
    document.getElementById('new-side-type-price').value = '';
  }
});
// Salad ingredients logic
function renderSaladIngredientsList() {
  const list = document.getElementById('salad-ingredients-list');
  if (!list) return;
  list.innerHTML = '';
  newSaladIngredients.forEach((ingredient, idx) => {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.marginRight = '0.7em';
    div.textContent = ingredient;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.style.marginLeft = '0.5em';
    btn.onclick = function() {
      newSaladIngredients.splice(idx, 1);
      renderSaladIngredientsList();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}
document.getElementById('add-ingredient-btn').addEventListener('click', function() {
  const ingredient = document.getElementById('new-ingredient-name').value.trim();
  if (ingredient && !newSaladIngredients.includes(ingredient)) {
    newSaladIngredients.push(ingredient);
    renderSaladIngredientsList();
    document.getElementById('new-ingredient-name').value = '';
  }
});
function renderToppingsList() {
  const list = document.getElementById('pizza-toppings-list');
  if (!list) return;
  list.innerHTML = '';
  newPizzaToppings.forEach((topping, idx) => {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.marginRight = '0.7em';
    div.textContent = topping;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.style.marginLeft = '0.5em';
    btn.onclick = function() {
      newPizzaToppings.splice(idx, 1);
      renderToppingsList();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}
document.getElementById('add-topping-btn').addEventListener('click', function() {
  const topping = document.getElementById('new-topping-name').value.trim();
  if (topping && !newPizzaToppings.includes(topping)) {
    newPizzaToppings.push(topping);
    renderToppingsList();
    document.getElementById('new-topping-name').value = '';
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


// --- Create Your Own Pizza Section Logic ---
let customPizzaSizes = [];
let customPizzaToppings = [];

document.getElementById('add-custom-size-price-btn').addEventListener('click', function() {
  const size = document.getElementById('custom-size-name').value.trim();
  const price = parseFloat(document.getElementById('custom-size-price').value);
  if (size && !isNaN(price)) {
    customPizzaSizes.push({ size, price });
    document.getElementById('custom-size-name').value = '';
    document.getElementById('custom-size-price').value = '';
    renderCustomPizzaSizes();
  }
});

function renderCustomPizzaSizes() {
  const list = document.getElementById('custom-pizza-sizes-list');
  list.innerHTML = '';
  customPizzaSizes.forEach((s, idx) => {
    const div = document.createElement('div');
    div.textContent = `${s.size} - £${s.price.toFixed(2)}`;
    div.style.marginBottom = '0.2em';
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.onclick = () => {
      customPizzaSizes.splice(idx, 1);
      renderCustomPizzaSizes();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}

document.getElementById('add-custom-topping-btn').addEventListener('click', function() {
  const topping = document.getElementById('custom-topping-name').value.trim();
  const price = parseFloat(document.getElementById('custom-topping-price').value);
  if (topping && !isNaN(price)) {
    customPizzaToppings.push({ name: topping, price });
    document.getElementById('custom-topping-name').value = '';
    document.getElementById('custom-topping-price').value = '';
    renderCustomPizzaToppings();
  }
});

function renderCustomPizzaToppings() {
  const list = document.getElementById('custom-pizza-toppings-list');
  list.innerHTML = '';
  customPizzaToppings.forEach((t, idx) => {
    const div = document.createElement('div');
    div.textContent = `${t.name} - £${t.price.toFixed(2)}`;
    div.style.marginBottom = '0.2em';
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.type = 'button';
    btn.onclick = () => {
      customPizzaToppings.splice(idx, 1);
      renderCustomPizzaToppings();
    };
    div.appendChild(btn);
    list.appendChild(div);
  });
}

document.getElementById('create-your-own-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('custom-pizza-name').value.trim();
  if (!name || customPizzaSizes.length === 0) {
    alert('Please add at least one size/price.');
    return;
  }
  // Ensure toppings are array of {name, price}
  const toppings = customPizzaToppings.map(t => ({ name: t.name, price: t.price }));
  const item = {
    name,
    sizes: customPizzaSizes,
    toppings,
    category: 'PIZZAS'
  };
  addMenuItem('PIZZAS', item);
  customPizzaSizes = [];
  customPizzaToppings = [];
  renderCustomPizzaSizes();
  renderCustomPizzaToppings();
  alert('Custom pizza added!');
});

// Initial render
if (currentCategory === 'PIZZAS') {
  document.getElementById('pizza-sizes-section').classList.remove('hidden');
  document.getElementById('new-item-price').classList.add('hide-price');
  document.getElementById('new-item-price').style.display = '';
  const cyo = document.getElementById('create-your-own-section');
  if (cyo) cyo.classList.remove('hidden');
  document.getElementById('salad-ingredients-section').classList.add('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
  document.getElementById('chicken-sizes-section').classList.add('hidden');
} else if (currentCategory === 'SALADS') {
  document.getElementById('pizza-sizes-section').classList.add('hidden');
  document.getElementById('new-item-price').classList.remove('hide-price');
  document.getElementById('new-item-price').style.display = '';
  const cyo = document.getElementById('create-your-own-section');
  if (cyo) cyo.classList.add('hidden');
  const saladSection = document.getElementById('salad-ingredients-section');
  saladSection.classList.remove('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
  document.getElementById('chicken-sizes-section').classList.add('hidden');
} else if (currentCategory === 'SIDES') {
  document.getElementById('pizza-sizes-section').classList.add('hidden');
  document.getElementById('new-item-price').classList.add('hide-price');
  document.getElementById('new-item-price').style.display = 'none';
  const cyo = document.getElementById('create-your-own-section');
  if (cyo) cyo.classList.add('hidden');
  document.getElementById('salad-ingredients-section').classList.add('hidden');
  document.getElementById('side-types-section').classList.remove('hidden');
  document.getElementById('chicken-sizes-section').classList.add('hidden');
} else if (currentCategory === 'CHICKEN') {
  document.getElementById('pizza-sizes-section').classList.add('hidden');
  document.getElementById('new-item-price').classList.remove('hide-price');
  document.getElementById('new-item-price').style.display = 'none';
  const cyo = document.getElementById('create-your-own-section');
  if (cyo) cyo.classList.add('hidden');
  document.getElementById('salad-ingredients-section').classList.add('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
  document.getElementById('chicken-sizes-section').classList.remove('hidden');
} else {
  document.getElementById('pizza-sizes-section').classList.add('hidden');
  document.getElementById('new-item-price').classList.remove('hide-price');
  document.getElementById('new-item-price').style.display = '';
  const cyo = document.getElementById('create-your-own-section');
  if (cyo) cyo.classList.add('hidden');
  document.getElementById('salad-ingredients-section').classList.add('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
  document.getElementById('chicken-sizes-section').classList.add('hidden');
}
renderPizzaSizesList();
renderToppingsList();
renderSaladIngredientsList();
renderSideTypesList();
renderChickenSizesList();
loadMenuData();
