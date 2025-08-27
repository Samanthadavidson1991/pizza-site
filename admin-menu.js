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
    let isEditing = false;
    function renderView() {
      li.innerHTML = '';
      if (currentCategory === 'PIZZAS') {
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
      } else {
        li.innerHTML = `<span style='font-weight:500;'>${item.name}</span><span style='margin-left:0.5em; color:#7a5a00;'>£${item.price ? item.price.toFixed(2) : ''}</span>`;
      }
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.title = 'Edit';
      editBtn.style.marginLeft = '0.7em';
      editBtn.style.background = '#f1c40f';
      editBtn.style.color = '#222';
      editBtn.style.border = 'none';
      editBtn.style.borderRadius = '3px';
      editBtn.style.padding = '0.2em 0.7em';
      editBtn.style.fontSize = '0.95em';
      editBtn.style.cursor = 'pointer';
      editBtn.onclick = function() {
        isEditing = true;
        renderEdit();
      };
      li.appendChild(editBtn);
      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.title = 'Delete';
      delBtn.style.marginLeft = '0.5em';
      delBtn.style.background = '#e74c3c';
      delBtn.style.color = '#fff';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '3px';
      delBtn.style.padding = '0.2em 0.7em';
      delBtn.style.fontSize = '0.95em';
      delBtn.style.cursor = 'pointer';
      delBtn.onclick = async function() {
        await deleteMenuItem(currentCategory, item.id || item._id);
      };
      li.appendChild(delBtn);
    }
    // Persist these during editing
    let sizesArr = Array.isArray(item.sizes) ? [...item.sizes] : [];
    let toppingsArr = Array.isArray(item.toppings) ? [...item.toppings] : [];
    function renderEdit() {
      li.innerHTML = '';
      // Name field
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = item.name;
      nameInput.style.fontWeight = 'bold';
      nameInput.style.marginRight = '0.5em';
      li.appendChild(nameInput);
      let priceInput;
      if (currentCategory === 'PIZZAS') {
        // Sizes
        const sizesDiv = document.createElement('div');
        sizesDiv.style.display = 'flex';
        sizesDiv.style.flexDirection = 'column';
        sizesDiv.style.margin = '0.5em 0';
        sizesDiv.innerHTML = '<strong>Sizes:</strong>';
        sizesArr.forEach((sz, idx) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          const sizeInput = document.createElement('input');
          sizeInput.type = 'text';
          sizeInput.value = sz.size;
          sizeInput.style.width = '5em';
          sizeInput.style.marginRight = '0.5em';
          sizeInput.oninput = function() {
            sizesArr[idx].size = sizeInput.value;
          };
          const priceInputSz = document.createElement('input');
          priceInputSz.type = 'number';
          priceInputSz.value = sz.price;
          priceInputSz.step = '0.01';
          priceInputSz.min = '0';
          priceInputSz.style.width = '5em';
          priceInputSz.style.marginRight = '0.5em';
          priceInputSz.oninput = function() {
            sizesArr[idx].price = parseFloat(priceInputSz.value) || 0;
          };
          const removeBtn = document.createElement('button');
          removeBtn.textContent = '✕';
          removeBtn.title = 'Remove Size';
          removeBtn.style.background = '#e74c3c';
          removeBtn.style.color = '#fff';
          removeBtn.style.border = 'none';
          removeBtn.style.borderRadius = '50%';
          removeBtn.style.width = '1.5em';
          removeBtn.style.height = '1.5em';
          removeBtn.style.fontSize = '1em';
          removeBtn.style.cursor = 'pointer';
          removeBtn.onclick = function() {
            sizesArr.splice(idx, 1);
            renderEdit();
          };
          row.appendChild(sizeInput);
          row.appendChild(priceInputSz);
          row.appendChild(removeBtn);
          sizesDiv.appendChild(row);
        });
        // Add size
        const addSizeRow = document.createElement('div');
        addSizeRow.style.display = 'flex';
        addSizeRow.style.alignItems = 'center';
        const newSizeInput = document.createElement('input');
        newSizeInput.type = 'text';
        newSizeInput.placeholder = 'Size';
        newSizeInput.style.width = '5em';
        newSizeInput.style.marginRight = '0.5em';
        const newPriceInput = document.createElement('input');
        newPriceInput.type = 'number';
        newPriceInput.placeholder = 'Price';
        newPriceInput.step = '0.01';
        newPriceInput.min = '0';
        newPriceInput.style.width = '5em';
        newPriceInput.style.marginRight = '0.5em';
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Size';
        addBtn.style.background = '#27ae60';
        addBtn.style.color = '#fff';
        addBtn.style.border = 'none';
        addBtn.style.borderRadius = '3px';
        addBtn.style.padding = '0.2em 0.7em';
        addBtn.style.fontSize = '0.95em';
        addBtn.style.cursor = 'pointer';
        addBtn.onclick = function() {
          if (newSizeInput.value && newPriceInput.value) {
            sizesArr.push({ size: newSizeInput.value, price: parseFloat(newPriceInput.value) });
            renderEdit();
          }
        };
        addSizeRow.appendChild(newSizeInput);
        addSizeRow.appendChild(newPriceInput);
        addSizeRow.appendChild(addBtn);
        sizesDiv.appendChild(addSizeRow);
        li.appendChild(sizesDiv);
        // Toppings
        const toppingsDiv = document.createElement('div');
        toppingsDiv.style.display = 'flex';
        toppingsDiv.style.flexDirection = 'column';
        toppingsDiv.style.margin = '0.5em 0';
        toppingsDiv.innerHTML = '<strong>Toppings:</strong>';
        toppingsArr.forEach((tp, idx) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          const toppingInput = document.createElement('input');
          toppingInput.type = 'text';
          toppingInput.value = typeof tp === 'object' && tp !== null ? tp.name : tp;
          toppingInput.style.width = '8em';
          toppingInput.style.marginRight = '0.5em';
          toppingInput.oninput = function() {
            if (typeof toppingsArr[idx] === 'object' && toppingsArr[idx] !== null) {
              toppingsArr[idx].name = toppingInput.value;
            } else {
              toppingsArr[idx] = toppingInput.value;
            }
          };
          const removeBtn = document.createElement('button');
          removeBtn.textContent = '✕';
          removeBtn.title = 'Remove Topping';
          removeBtn.style.background = '#e74c3c';
          removeBtn.style.color = '#fff';
          removeBtn.style.border = 'none';
          removeBtn.style.borderRadius = '50%';
          removeBtn.style.width = '1.5em';
          removeBtn.style.height = '1.5em';
          removeBtn.style.fontSize = '1em';
          removeBtn.style.cursor = 'pointer';
          removeBtn.onclick = function() {
            toppingsArr.splice(idx, 1);
            renderEdit();
          };
          row.appendChild(toppingInput);
          row.appendChild(removeBtn);
          toppingsDiv.appendChild(row);
        });
        // Add topping
        const addToppingRow = document.createElement('div');
        addToppingRow.style.display = 'flex';
        addToppingRow.style.alignItems = 'center';
        const newToppingInput = document.createElement('input');
        newToppingInput.type = 'text';
        newToppingInput.placeholder = 'Topping';
        newToppingInput.style.width = '8em';
        newToppingInput.style.marginRight = '0.5em';
        const addToppingBtn = document.createElement('button');
        addToppingBtn.textContent = 'Add Topping';
        addToppingBtn.style.background = '#27ae60';
        addToppingBtn.style.color = '#fff';
        addToppingBtn.style.border = 'none';
        addToppingBtn.style.borderRadius = '3px';
        addToppingBtn.style.padding = '0.2em 0.7em';
        addToppingBtn.style.fontSize = '0.95em';
        addToppingBtn.style.cursor = 'pointer';
        addToppingBtn.onclick = function() {
          if (newToppingInput.value) {
            toppingsArr.push(newToppingInput.value);
            renderEdit();
          }
        };
        addToppingRow.appendChild(newToppingInput);
        addToppingRow.appendChild(addToppingBtn);
        toppingsDiv.appendChild(addToppingRow);
        li.appendChild(toppingsDiv);
      } else {
        priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.value = item.price || 0;
        priceInput.step = '0.01';
        priceInput.min = '0';
        priceInput.style.marginLeft = '0.5em';
        priceInput.style.width = '5em';
        li.appendChild(priceInput);
      }
      // Save button
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.style.marginLeft = '0.7em';
      saveBtn.style.background = '#27ae60';
      saveBtn.style.color = '#fff';
      saveBtn.style.border = 'none';
      saveBtn.style.borderRadius = '3px';
      saveBtn.style.padding = '0.2em 0.7em';
      saveBtn.style.fontSize = '0.95em';
      saveBtn.style.cursor = 'pointer';
      saveBtn.onclick = async function() {
        const updated = { ...item, name: nameInput.value };
        if (currentCategory === 'PIZZAS') {
          updated.sizes = sizesArr.map(sz => ({
            size: sz.size || (sz["size"] !== undefined ? sz["size"] : ""),
            price: sz.price !== undefined ? parseFloat(sz.price) : 0
          }));
          updated.toppings = toppingsArr.map(tp => (typeof tp === 'object' && tp !== null && tp.name ? tp.name : tp));
        } else if (priceInput) {
          updated.price = parseFloat(priceInput.value);
        }
  await updateMenuItem(currentCategory, Number(item.id), updated);
        isEditing = false;
        await loadMenuData();
      };
      li.appendChild(saveBtn);
      // Cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.marginLeft = '0.5em';
      cancelBtn.style.background = '#bbb';
      cancelBtn.style.color = '#222';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '3px';
      cancelBtn.style.padding = '0.2em 0.7em';
      cancelBtn.style.fontSize = '0.95em';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.onclick = function() {
        isEditing = false;
        renderView();
      };
      li.appendChild(cancelBtn);
    }
    if (isEditing) {
      renderEdit();
    } else {
      renderView();
    }
    list.appendChild(li);
  });
}

async function updateMenuItem(category, id, updatedItem) {
  try {
    await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedItem, category })
    });
  } catch (err) {
    alert('Failed to update menu item.');
  }
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


document.addEventListener('DOMContentLoaded', function() {
  // Set all sections to hidden/none first
  document.getElementById('pizza-sizes-section').style.display = 'none';
  document.getElementById('salad-ingredients-section').classList.add('hidden');
  document.getElementById('side-types-section').classList.add('hidden');
  document.getElementById('chicken-sizes-section').style.display = 'none';
  document.getElementById('new-item-price').style.display = '';
  const cyo = document.getElementById('create-your-own-section');
  if (cyo) cyo.style.display = 'none';

  if (currentCategory === 'PIZZAS') {
    document.getElementById('pizza-sizes-section').style.display = 'flex';
    document.getElementById('new-item-price').classList.add('hide-price');
    document.getElementById('new-item-price').style.display = '';
    if (cyo) cyo.style.display = 'block';
  } else if (currentCategory === 'SALADS') {
    document.getElementById('salad-ingredients-section').classList.remove('hidden');
  } else if (currentCategory === 'SIDES') {
    document.getElementById('side-types-section').classList.remove('hidden');
    document.getElementById('new-item-price').classList.add('hide-price');
    document.getElementById('new-item-price').style.display = 'none';
  } else if (currentCategory === 'CHICKEN') {
    document.getElementById('chicken-sizes-section').style.display = 'block';
    document.getElementById('new-item-price').style.display = 'none';
  }
  renderPizzaSizesList();
  renderToppingsList();
  renderSaladIngredientsList();
  renderSideTypesList();
  renderChickenSizesList();
  loadMenuData();
});
