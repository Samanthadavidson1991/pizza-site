// Menu data loaded from backend
let menuData = {
  PIZZAS: [],
  SALADS: [],
  SIDES: [],
  DRINKS: [],
  DESSERTS: [],
  CHICKEN: []
};

const API_BASE = window.location.origin; // Use same server as admin panel
async function loadMenuData() {
  try {
    console.log('Loading menu data from:', `${API_BASE}/menu`);
    const res = await fetch(`${API_BASE}/menu`);
    console.log('Menu fetch response status:', res.status);
    const items = await res.json();
    console.log('Loaded menuData:', items);
    console.log('First few items with IDs:');
    items.slice(0, 3).forEach((item, i) => {
      console.log(`Item ${i}:`, { 
        name: item.name, 
        id: item.id, 
        _id: item._id, 
        keys: Object.keys(item)
      });
    });
    // Reset
    menuData = { PIZZAS: [], SALADS: [], SIDES: [], DRINKS: [], DESSERTS: [], CHICKEN: [] };
    // Assign sortOrder if missing and update backend if needed
    const updateSortOrderPromises = [];
    const catKeys = Object.keys(menuData);
    catKeys.forEach(cat => {
      let catItems = items.filter(i => i.category === cat);
      catItems.forEach((item, idx) => {
        if (item.sortOrder === undefined) {
          item.sortOrder = idx + 1;
          // Update backend with new sortOrder
          updateSortOrderPromises.push(updateMenuItem(cat, item.id || item._id, { ...item, sortOrder: item.sortOrder }));
        }
        menuData[cat].push(item);
      });
    });
    // Wait for all sortOrder updates before rendering
    Promise.all(updateSortOrderPromises).then(() => {
      renderMenuItems();
    });
  } catch (err) {
    alert('Failed to load menu from server.');
  }
}

async function addMenuItem(category, item) {
  try {
    // Set sortOrder to end of list if not set
    if (item.sortOrder === undefined) {
      const arr = menuData[category] || [];
      item.sortOrder = arr.length > 0 ? Math.max(...arr.map(i => i.sortOrder || 0)) + 1 : 1;
    }
    // Assign a unique numeric id if not present
    if (!item.id) {
      // Find max id in all categories
      let maxId = 0;
      Object.values(menuData).forEach(arr => {
        arr.forEach(i => { if (i.id && i.id > maxId) maxId = i.id; });
      });
      item.id = maxId + 1;
    }
    console.log('About to POST to:', `${API_BASE}/menu`);
    console.log('API_BASE is:', API_BASE);
    console.log('Item to add:', { ...item, category });
    
    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, category })
    });
    
    console.log('POST response status:', response.status);
    const result = await response.json();
    console.log('POST response:', result);
    
    await loadMenuData();
  } catch (err) {
    alert('Failed to add menu item.');
  }
}

async function deleteMenuItem(category, id) {
  try {
    console.log('Attempting to delete item:', { category, id, url: `${API_BASE}/menu/${id}` });
    console.log('Full item details being deleted:', menuData[category].find(item => (item.id || item._id) == id));
    
    if (!id) {
      throw new Error('No ID provided for deletion');
    }
    
    const response = await fetch(`${API_BASE}/menu/${id}`, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Delete response status:', response.status);
    console.log('Delete response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete failed with response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Delete response body:', result);
    console.log('Delete successful, reloading menu data...');
    await loadMenuData();
    console.log('Menu data reloaded successfully');
    
  } catch (err) {
    console.error('Delete error:', err);
    throw err; // Re-throw so the caller can handle it
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
  // Sort by sortOrder if present, else fallback to name
  menuData[currentCategory].sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    } else if (a.sortOrder !== undefined) {
      return -1;
    } else if (b.sortOrder !== undefined) {
      return 1;
    } else {
      return (a.name || '').localeCompare(b.name || '');
    }
  });
  // Persist typesArr for each SIDES item being edited
  let persistentTypesArrMap = {};
  menuData[currentCategory].forEach((item, idx) => {
    if (currentCategory === 'SIDES') {
      console.log('Rendering SIDES item:', item);
    }
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
  } else if (currentCategory === 'SALADS') {
        let html = `<span style='font-weight:500;'>${item.name}</span><span style='margin-left:0.5em; color:#7a5a00;'>£${item.price ? item.price.toFixed(2) : ''}</span>`;
        if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
          html += `<div style='margin-top:0.3em; color:#555; font-size:0.97em;'><strong>Ingredients:</strong> ${item.ingredients.map(ing => `<span style='margin-right:0.5em;'>${ing}</span>`).join('')}</div>`;
        }
        li.innerHTML = html;
      } else if (currentCategory === 'SIDES') {
        let html = `<span style='font-weight:500;'>${item.name}</span>`;
        if (Array.isArray(item.types) && item.types.length > 0) {
          html += `<div style='margin-top:0.3em; color:#555; font-size:0.97em;'><strong>Types:</strong> ` +
            item.types.map(typeObj => `<span style='margin-right:0.5em;'>${typeObj.name} (£${Number(typeObj.price).toFixed(2)})</span>`).join('') + `</div>`;
        }
        // Always show price if present, even if 0
        if (typeof item.price !== 'undefined') {
          html += `<span style='margin-left:0.5em; color:#7a5a00;'>£${Number(item.price).toFixed(2)}</span>`;
        }
        li.innerHTML = html;
      } else {
        li.innerHTML = `<span style='font-weight:500;'>${item.name}</span><span style='margin-left:0.5em; color:#7a5a00;'>£${item.price ? item.price.toFixed(2) : ''}</span>`;
      }
      // Move Up button
      const moveUpBtn = document.createElement('button');
      moveUpBtn.textContent = '↑';
      moveUpBtn.title = 'Move Up';
      moveUpBtn.style.marginLeft = '0.7em';
      moveUpBtn.style.background = '#bbb';
      moveUpBtn.style.color = '#222';
      moveUpBtn.style.border = 'none';
      moveUpBtn.style.borderRadius = '3px';
      moveUpBtn.style.padding = '0.2em 0.7em';
      moveUpBtn.style.fontSize = '0.95em';
      moveUpBtn.style.cursor = 'pointer';
      moveUpBtn.disabled = idx === 0;
      moveUpBtn.onclick = function() {
        moveMenuItem(currentCategory, idx, -1);
      };
      li.appendChild(moveUpBtn);
      // Move Down button
      const moveDownBtn = document.createElement('button');
      moveDownBtn.textContent = '↓';
      moveDownBtn.title = 'Move Down';
      moveDownBtn.style.marginLeft = '0.3em';
      moveDownBtn.style.background = '#bbb';
      moveDownBtn.style.color = '#222';
      moveDownBtn.style.border = 'none';
      moveDownBtn.style.borderRadius = '3px';
      moveDownBtn.style.padding = '0.2em 0.7em';
      moveDownBtn.style.fontSize = '0.95em';
      moveDownBtn.style.cursor = 'pointer';
      moveDownBtn.disabled = idx === menuData[currentCategory].length - 1;
      moveDownBtn.onclick = function() {
        moveMenuItem(currentCategory, idx, 1);
      };
      li.appendChild(moveDownBtn);
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
        console.log('=== DELETE BUTTON CLICKED ===');
        console.log('Full item object:', JSON.stringify(item, null, 2));
        console.log('Category:', currentCategory);
        console.log('Item ID field:', item.id);
        console.log('Item _ID field:', item._id);
        console.log('Final ID to use:', item.id || item._id);
        console.log('Item has keys:', Object.keys(item));
        
        const itemId = item.id || item._id;
        if (!itemId) {
          alert('Error: Item has no ID. Cannot delete. Item keys: ' + Object.keys(item).join(', '));
          console.error('Item without ID:', item);
          return;
        }
        
        if (confirm(`Are you sure you want to delete "${item.name}"? (ID: ${itemId})`)) {
          try {
            console.log('Calling deleteMenuItem with:', { category: currentCategory, id: itemId });
            await deleteMenuItem(currentCategory, itemId);
            alert('Item deleted successfully!');
          } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete item: ' + error.message);
          }
        }
      };
      li.appendChild(delBtn);
// Move menu item up or down in the list (UI only for now)
async function moveMenuItem(category, idx, direction) {
  const arr = menuData[category];
  if (!arr || arr.length < 2) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= arr.length) return;
  // Ensure both items have sortOrder
  if (arr[idx].sortOrder === undefined) arr[idx].sortOrder = idx + 1;
  if (arr[newIdx].sortOrder === undefined) arr[newIdx].sortOrder = newIdx + 1;
  // Swap sortOrder values
  const a = arr[idx];
  const b = arr[newIdx];
  const tempOrder = a.sortOrder;
  a.sortOrder = b.sortOrder;
  b.sortOrder = tempOrder;
  // Swap in array
  arr[idx] = b;
  arr[newIdx] = a;
  // Always send sortOrder in update
  await updateMenuItem(category, Number(a.id || a._id), { ...a, sortOrder: a.sortOrder });
  await updateMenuItem(category, Number(b.id || b._id), { ...b, sortOrder: b.sortOrder });
  await loadMenuData();
}
    }
    // Persist these during editing
  let sizesArr = Array.isArray(item.sizes) ? [...item.sizes] : [];
  let toppingsArr = Array.isArray(item.toppings) ? [...item.toppings] : [];
  // For SIDES, persist typesArr across renders
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
  } else if (currentCategory === 'SALADS') {
        priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.value = item.price || 0;
        priceInput.step = '0.01';
        priceInput.min = '0';
        priceInput.style.marginLeft = '0.5em';
        priceInput.style.width = '5em';
        li.appendChild(priceInput);
        // Ingredients list
        const ingredientsDiv = document.createElement('div');
        ingredientsDiv.style.margin = '0.5em 0';
        ingredientsDiv.innerHTML = '<strong>Ingredients:</strong>';
        let ingredientsArr = Array.isArray(item.ingredients) ? [...item.ingredients] : [];
        ingredientsArr.forEach((ing, idx) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          const ingInput = document.createElement('input');
          ingInput.type = 'text';
          ingInput.value = ing;
          ingInput.style.width = '10em';
          ingInput.style.marginRight = '0.5em';
          ingInput.oninput = function() {
            ingredientsArr[idx] = ingInput.value;
          };
          const removeBtn = document.createElement('button');
          removeBtn.textContent = '✕';
          removeBtn.title = 'Remove Ingredient';
          removeBtn.style.background = '#e74c3c';
          removeBtn.style.color = '#fff';
          removeBtn.style.border = 'none';
          removeBtn.style.borderRadius = '50%';
          removeBtn.style.width = '1.5em';
          removeBtn.style.height = '1.5em';
          removeBtn.style.fontSize = '1em';
          removeBtn.style.cursor = 'pointer';
          removeBtn.onclick = function() {
            ingredientsArr.splice(idx, 1);
            renderEdit();
          };
          row.appendChild(ingInput);
          row.appendChild(removeBtn);
          ingredientsDiv.appendChild(row);
        });
        // Add ingredient
        const addIngRow = document.createElement('div');
        addIngRow.style.display = 'flex';
        addIngRow.style.alignItems = 'center';
        const newIngInput = document.createElement('input');
        newIngInput.type = 'text';
        newIngInput.placeholder = 'Ingredient';
        newIngInput.style.width = '10em';
        newIngInput.style.marginRight = '0.5em';
        const addIngBtn = document.createElement('button');
        addIngBtn.textContent = 'Add Ingredient';
        addIngBtn.style.background = '#27ae60';
        addIngBtn.style.color = '#fff';
        addIngBtn.style.border = 'none';
        addIngBtn.style.borderRadius = '3px';
        addIngBtn.style.padding = '0.2em 0.7em';
        addIngBtn.style.fontSize = '0.95em';
        addIngBtn.style.cursor = 'pointer';
        addIngBtn.onclick = function() {
          if (newIngInput.value) {
            ingredientsArr.push(newIngInput.value);
            renderEdit();
          }
        };
        addIngRow.appendChild(newIngInput);
        addIngRow.appendChild(addIngBtn);
        ingredientsDiv.appendChild(addIngRow);
        li.appendChild(ingredientsDiv);
      } else if (currentCategory === 'SIDES') {
        // Price input for sides (not required)
        priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.value = item.price || '';
        priceInput.step = '0.01';
        priceInput.min = '0';
        priceInput.placeholder = 'Price (£)';
        priceInput.style.marginLeft = '0.5em';
        priceInput.style.width = '5em';
        li.appendChild(priceInput);

        // Use persistent typesArr for this item
        let key = item.id || item._id || idx;
        if (!persistentTypesArrMap[key]) {
          persistentTypesArrMap[key] = Array.isArray(item.types) ? [...item.types] : [];
        }
        let typesArr = persistentTypesArrMap[key];
        const typesDiv = document.createElement('div');
        typesDiv.style.margin = '0.5em 0';
        typesDiv.innerHTML = '<strong>Types:</strong>';
        typesArr.forEach((typeObj, tIdx) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.value = typeObj.name;
          nameInput.style.width = '8em';
          nameInput.style.marginRight = '0.5em';
          nameInput.oninput = function() {
            typesArr[tIdx].name = nameInput.value;
          };
          const priceInputType = document.createElement('input');
          priceInputType.type = 'number';
          priceInputType.value = typeObj.price;
          priceInputType.step = '0.01';
          priceInputType.min = '0';
          priceInputType.style.width = '5em';
          priceInputType.style.marginRight = '0.5em';
          priceInputType.oninput = function() {
            typesArr[tIdx].price = parseFloat(priceInputType.value) || 0;
          };
          const removeBtn = document.createElement('button');
          removeBtn.textContent = '✕';
          removeBtn.title = 'Remove Type';
          removeBtn.style.background = '#e74c3c';
          removeBtn.style.color = '#fff';
          removeBtn.style.border = 'none';
          removeBtn.style.borderRadius = '50%';
          removeBtn.style.width = '1.5em';
          removeBtn.style.height = '1.5em';
          removeBtn.style.fontSize = '1em';
          removeBtn.style.cursor = 'pointer';
          removeBtn.onclick = function() {
            typesArr.splice(tIdx, 1);
            renderEdit();
          };
          row.appendChild(nameInput);
          row.appendChild(priceInputType);
          row.appendChild(removeBtn);
          typesDiv.appendChild(row);
        });
        // Add type
        const addTypeRow = document.createElement('div');
        addTypeRow.style.display = 'flex';
        addTypeRow.style.alignItems = 'center';
        const newTypeInput = document.createElement('input');
        newTypeInput.type = 'text';
        newTypeInput.placeholder = 'Type name';
        newTypeInput.style.width = '8em';
        newTypeInput.style.marginRight = '0.5em';
        const newPriceInput = document.createElement('input');
        newPriceInput.type = 'number';
        newPriceInput.placeholder = 'Price';
        newPriceInput.step = '0.01';
        newPriceInput.min = '0';
        newPriceInput.style.width = '5em';
        newPriceInput.style.marginRight = '0.5em';
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Type';
        addBtn.style.background = '#27ae60';
        addBtn.style.color = '#fff';
        addBtn.style.border = 'none';
        addBtn.style.borderRadius = '3px';
        addBtn.style.padding = '0.2em 0.7em';
        addBtn.style.fontSize = '0.95em';
        addBtn.style.cursor = 'pointer';
        addBtn.onclick = function() {
          alert('Add Type button clicked');
          console.log('Add Type button clicked', newTypeInput.value, newPriceInput.value);
          if (newTypeInput.value && newPriceInput.value) {
            typesArr.push({ name: newTypeInput.value, price: parseFloat(newPriceInput.value) });
            console.log('typesArr after push:', typesArr);
            renderEdit();
          }
        };
        addTypeRow.appendChild(newTypeInput);
        addTypeRow.appendChild(newPriceInput);
        addTypeRow.appendChild(addBtn);
        typesDiv.appendChild(addTypeRow);
        li.appendChild(typesDiv);
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
      // Save button (create and attach handler at the end)
      setTimeout(() => {
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
          alert('Save button clicked for ' + currentCategory + ': ' + (item && item.name));
          console.log('Save button clicked for', currentCategory, item);
          const updated = { ...item, name: nameInput.value };
          if (currentCategory === 'PIZZAS') {
            updated.sizes = sizesArr.map(sz => ({
              size: sz.size || (sz["size"] !== undefined ? sz["size"] : ""),
              price: sz.price !== undefined ? parseFloat(sz.price) : 0
            }));
            updated.toppings = toppingsArr.map(tp => (typeof tp === 'object' && tp !== null && tp.name ? tp.name : tp));
          } else if (currentCategory === 'SALADS') {
            updated.price = parseFloat(priceInput.value);
            updated.ingredients = ingredientsArr;
          } else if (currentCategory === 'SIDES') {
            // Use persistent typesArr for this item
            let key = item.id || item._id || idx;
            updated.types = persistentTypesArrMap[key];
            // Save price if set (not required)
            if (priceInput && priceInput.value !== '') {
              updated.price = parseFloat(priceInput.value);
            } else {
              delete updated.price;
            }
          } else if (priceInput) {
            updated.price = parseFloat(priceInput.value);
          }
          // Remove _id if present to avoid MongoDB update errors
          if (updated._id) delete updated._id;
          // Always ensure id is present and numeric in update body
          let updateId = item.id;
          if (!updateId && item._id) updateId = item._id;
          updateId = Number(updateId);
          if (!updateId || isNaN(updateId)) {
            alert('Menu item is missing a valid id and cannot be updated.');
            return;
          }
          updated.id = updateId;
          // Debug: log update payload
          console.log('Updating menu item:', updated);
          await updateMenuItem(currentCategory, updateId, updated);
          isEditing = false;
          // Reset persistent typesArr for this item
          if (currentCategory === 'SIDES') {
            let key = item.id || item._id || idx;
            delete persistentTypesArrMap[key];
          }
          await loadMenuData();
        };
        li.appendChild(saveBtn);
      }, 0);
      // Add a visible test button for SIDES
      if (currentCategory === 'SIDES') {
        const testBtn = document.createElement('button');
        testBtn.textContent = 'TEST SIDES BUTTON';
        testBtn.style.background = '#e67e22';
        testBtn.style.color = '#fff';
        testBtn.style.marginLeft = '0.7em';
        testBtn.onclick = function() { alert('TEST SIDES BUTTON CLICKED'); };
        li.appendChild(testBtn);
      }
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
        // Reset persistent typesArr for this item if SIDES
        if (currentCategory === 'SIDES') {
          let key = item.id || item._id || idx;
          delete persistentTypesArrMap[key];
        }
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
    console.log('Calling updateMenuItem:', { category, id, updatedItem });
    await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedItem, category })
    });
    console.log('UpdateMenuItem success:', id);
  } catch (err) {
    console.error('Failed to update menu item:', err);
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
          document.getElementById('new-item-price').classList.remove('hide-price');
          document.getElementById('new-item-price').style.display = '';
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
  // Debug: log menuData after every load
  console.log('menuData after load:', menuData);
  // Extra debug: log all items and highlight SIDES
  let allItems = [];
  Object.keys(menuData).forEach(cat => menuData[cat].forEach(i => allItems.push({cat, ...i})));
  console.log('All menu items:', allItems);
  const sides = allItems.filter(i => i.cat === 'SIDES');
  console.log('SIDES items after load:', sides);
  });
});

document.getElementById('add-item-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('new-item-name').value.trim();
  const priceInput = document.getElementById('new-item-price');
  let price = null;
  if (priceInput && priceInput.value !== '') price = parseFloat(priceInput.value);

  if (!name) return;

  if (currentCategory === 'PIZZAS') {
    if (newPizzaSizes.length > 0) {
      addMenuItem('PIZZAS', { name, sizes: [...newPizzaSizes], toppings: [...newPizzaToppings] });
      newPizzaSizes = [];
      newPizzaToppings = [];
      renderPizzaSizesList();
      renderToppingsList();
      this.reset();
      document.getElementById('pizza-sizes-list').innerHTML = '';
      document.getElementById('new-item-name').value = '';
    }
  } else if (currentCategory === 'SALADS') {
    addMenuItem('SALADS', { name, price, ingredients: [...newSaladIngredients] });
    newSaladIngredients = [];
    renderSaladIngredientsList();
    this.reset();
  } else if (currentCategory === 'SIDES') {
    // Allow price without types, types without price, or both
    const item = { name };
    if (price !== null && !isNaN(price)) item.price = price;
    if (newSideTypes.length > 0) item.types = [...newSideTypes];
    addMenuItem('SIDES', item);
    newSideTypes = [];
    renderSideTypesList();
    this.reset();
  } else if (currentCategory === 'CHICKEN') {
    addMenuItem('CHICKEN', { name, sizes: [...newChickenSizes] });
    newChickenSizes = [];
    renderChickenSizesList();
    this.reset();
  } else if (currentCategory === 'DRINKS' || currentCategory === 'DESSERTS') {
    addMenuItem(currentCategory, { name, price });
    this.reset();
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
    document.getElementById('new-item-price').classList.remove('hide-price');
    document.getElementById('new-item-price').style.display = '';
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
