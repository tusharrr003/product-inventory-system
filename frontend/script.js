/**
 * script.js — Product Inventory System
 * Author : Tejaswini (tejaswini-logic branch)
 * Features: Add / Update / Delete / View products
 *           Real-time search, category filter, sortable table
 *           Pagination, low-stock alerts, toast notifications
 *           LocalStorage persistence
 */

'use strict';

/* ============================================================
   CONSTANTS
   ============================================================ */
const STORAGE_KEY  = 'inventoryProducts';
const LOW_STOCK_QTY = 5;
const ITEMS_PER_PAGE = 8;

/* ============================================================
   STATE
   ============================================================ */
let products    = [];          // master list (loaded from localStorage)
let editingId   = null;        // id of product currently being edited
let currentPage = 1;
let sortField   = 'name';
let sortAsc     = true;

/* ============================================================
   UTILITIES
   ============================================================ */

/** Generate a unique id */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Read from localStorage */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist products to localStorage */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/** Format number as Indian Rupee string */
function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

  toast.addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);

  setTimeout(() => removeToast(toast), 3500);
}

function removeToast(toast) {
  toast.classList.add('toast-out');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* ============================================================
   BANNER
   ============================================================ */
function closeBanner() {
  document.getElementById('lowStockBanner').style.display = 'none';
}

function updateBanner(lowItems) {
  const banner  = document.getElementById('lowStockBanner');
  const message = document.getElementById('lowStockMessage');

  if (lowItems.length === 0) {
    banner.style.display = 'none';
    return;
  }

  const names = lowItems.slice(0, 3).map(p => `<strong>${p.name}</strong>`).join(', ');
  const extra = lowItems.length > 3 ? ` and ${lowItems.length - 3} more` : '';
  message.innerHTML = `⚠️ Low stock alert: ${names}${extra} — quantity ≤ ${LOW_STOCK_QTY}`;
  banner.style.display = 'flex';
}

/* ============================================================
   HEADER STATS
   ============================================================ */
function updateStats() {
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowItems   = products.filter(p => p.quantity > 0 && p.quantity <= LOW_STOCK_QTY);

  document.getElementById('totalProductCount').textContent  = products.length;
  document.getElementById('totalInventoryValue').textContent = formatCurrency(totalValue);
  document.getElementById('lowStockCount').textContent       = lowItems.length;

  updateBanner(lowItems);
}

/* ============================================================
   FILTER & SORT HELPERS
   ============================================================ */
function getFilteredProducts() {
  const query    = document.getElementById('searchInput').value.trim().toLowerCase();
  const category = document.getElementById('filterCategory').value;

  return products
    .filter(p => {
      const matchSearch   = !query    || p.name.toLowerCase().includes(query);
      const matchCategory = !category || p.category === category;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 :  1;
      if (valA > valB) return sortAsc ?  1 : -1;
      return 0;
    });
}

/* ============================================================
   RENDER TABLE
   ============================================================ */
function renderTable() {
  const filtered    = getFilteredProducts();
  const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start  = (currentPage - 1) * ITEMS_PER_PAGE;
  const paged  = filtered.slice(start, start + ITEMS_PER_PAGE);

  const tbody  = document.getElementById('productTableBody');
  const empty  = document.getElementById('emptyState');
  const count  = document.getElementById('resultsCount');
  const pgInfo = document.getElementById('pageInfo');
  const prevBtn= document.getElementById('prevPageBtn');
  const nextBtn= document.getElementById('nextPageBtn');

  // Results count
  count.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  // Pagination controls
  pgInfo.textContent  = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled    = currentPage === 1;
  nextBtn.disabled    = currentPage === totalPages;
  document.getElementById('paginationContainer').style.display =
    filtered.length > ITEMS_PER_PAGE ? 'flex' : 'none';

  // Empty state
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    empty.style.flexDirection = 'column';
    empty.style.alignItems = 'center';
    return;
  }
  empty.style.display = 'none';

  // Build rows
  tbody.innerHTML = paged.map((p, idx) => {
    const isLow     = p.quantity > 0 && p.quantity <= LOW_STOCK_QTY;
    const isOut     = p.quantity === 0;
    const rowClass  = isLow ? 'low-stock-row' : '';
    const stockBadge = isOut
      ? `<span class="stock-badge out-of-stock">📭 Out of Stock</span>`
      : isLow
        ? `<span class="stock-badge low-stock">⚠️ Low Stock</span>`
        : `<span class="stock-badge in-stock">✅ In Stock</span>`;

    return `
      <tr class="${rowClass}" data-id="${p.id}">
        <td class="row-index">${start + idx + 1}</td>
        <td class="product-name-cell">${escapeHtml(p.name)}</td>
        <td><span class="category-badge">${escapeHtml(p.category)}</span></td>
        <td class="price-cell">${formatCurrency(p.price)}</td>
        <td class="qty-cell">${p.quantity}</td>
        <td>${stockBadge}</td>
        <td>
          <div class="action-cell">
            <button class="btn btn-success btn-sm" onclick="startEdit('${p.id}')" id="edit-btn-${p.id}" title="Edit product">
              ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${p.id}')" id="delete-btn-${p.id}" title="Delete product">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/** Simple HTML escape to prevent XSS */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   SORT
   ============================================================ */
function toggleSortOrder() {
  sortAsc = !sortAsc;
  document.getElementById('sortOrderIcon').textContent = sortAsc ? '↑' : '↓';
  currentPage = 1;
  renderTable();
}

/* ============================================================
   PAGINATION
   ============================================================ */
function changePage(delta) {
  const filtered   = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  currentPage = Math.min(Math.max(1, currentPage + delta), totalPages);
  renderTable();
}

/* ============================================================
   FORM VALIDATION
   ============================================================ */
function validateForm() {
  const name     = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const price    = parseFloat(document.getElementById('productPrice').value);
  const quantity = parseInt(document.getElementById('productQuantity').value, 10);

  let valid = true;

  // Name
  const nameError = document.getElementById('nameError');
  const nameInput = document.getElementById('productName');
  if (!name) {
    nameError.textContent = 'Product name is required.';
    nameInput.classList.add('input-error');
    valid = false;
  } else if (name.length < 2) {
    nameError.textContent = 'Name must be at least 2 characters.';
    nameInput.classList.add('input-error');
    valid = false;
  } else {
    nameError.textContent = '';
    nameInput.classList.remove('input-error');
  }

  // Category
  const catError = document.getElementById('categoryError');
  const catInput = document.getElementById('productCategory');
  if (!category) {
    catError.textContent = 'Please select a category.';
    catInput.classList.add('input-error');
    valid = false;
  } else {
    catError.textContent = '';
    catInput.classList.remove('input-error');
  }

  // Price
  const priceError = document.getElementById('priceError');
  const priceInput = document.getElementById('productPrice');
  if (isNaN(price) || price < 0) {
    priceError.textContent = 'Enter a valid price (≥ 0).';
    priceInput.classList.add('input-error');
    valid = false;
  } else {
    priceError.textContent = '';
    priceInput.classList.remove('input-error');
  }

  // Quantity
  const qtyError = document.getElementById('quantityError');
  const qtyInput = document.getElementById('productQuantity');
  if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    qtyError.textContent = 'Enter a valid whole number (≥ 0).';
    qtyInput.classList.add('input-error');
    valid = false;
  } else {
    qtyError.textContent = '';
    qtyInput.classList.remove('input-error');
  }

  return valid;
}

/* ============================================================
   ADD / UPDATE PRODUCT
   ============================================================ */
document.getElementById('productForm').addEventListener('submit', function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const name     = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const price    = parseFloat(parseFloat(document.getElementById('productPrice').value).toFixed(2));
  const quantity = parseInt(document.getElementById('productQuantity').value, 10);

  if (editingId) {
    // --- UPDATE ---
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, category, price, quantity, updatedAt: Date.now() };
    }
    showToast(`"${name}" updated successfully!`, 'success');
    cancelEdit();
  } else {
    // --- ADD ---
    const newProduct = {
      id:        generateId(),
      name,
      category,
      price,
      quantity,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    products.unshift(newProduct);
    showToast(`"${name}" added to inventory!`, 'success');
    this.reset();
    clearErrors();
  }

  saveToStorage();
  updateStats();
  currentPage = 1;
  renderTable();
});

function clearErrors() {
  ['nameError', 'categoryError', 'priceError', 'quantityError'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['productName', 'productCategory', 'productPrice', 'productQuantity'].forEach(id => {
    document.getElementById(id).classList.remove('input-error');
  });
}

function clearForm() {
  clearErrors();
}

/* ============================================================
   EDIT (startEdit)
   ============================================================ */
function startEdit(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingId = id;

  document.getElementById('productName').value     = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value    = product.price;
  document.getElementById('productQuantity').value = product.quantity;

  document.getElementById('formTitle').textContent   = '✏️ Edit Product';
  document.getElementById('submitBtn').innerHTML     = '<span class="btn-icon">💾</span> Save Changes';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  document.getElementById('clearFormBtn').style.display  = 'none';

  // Scroll form into view smoothly
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  editingId = null;

  document.getElementById('productForm').reset();
  clearErrors();

  document.getElementById('formTitle').textContent    = '➕ Add New Product';
  document.getElementById('submitBtn').innerHTML      = '<span class="btn-icon">➕</span> Add Product';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('clearFormBtn').style.display  = 'inline-flex';
}

/* ============================================================
   DELETE (deleteProduct + modal)
   ============================================================ */
let pendingDeleteId = null;

function openDeleteModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  pendingDeleteId = id;
  document.getElementById('deleteModalMessage').textContent =
    `Delete "${product.name}"? This action cannot be undone.`;

  const modal = document.getElementById('deleteModal');
  modal.style.display = 'flex';

  // Focus trap — focus confirm button
  setTimeout(() => document.getElementById('confirmDeleteBtn').focus(), 50);
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('deleteModal').style.display = 'none';
}

function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  products = products.filter(p => p.id !== id);

  // If we were editing this product, cancel edit
  if (editingId === id) cancelEdit();

  saveToStorage();
  updateStats();

  // Adjust page if needed
  const filtered   = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  renderTable();
  showToast(`"${product.name}" removed from inventory.`, 'error');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (pendingDeleteId) {
    deleteProduct(pendingDeleteId);
    closeDeleteModal();
  }
});

// Close modal on overlay click
document.getElementById('deleteModal').addEventListener('click', function (e) {
  if (e.target === this) closeDeleteModal();
});

// ESC key closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDeleteModal();
});

/* ============================================================
   SEARCH & FILTER — live update
   ============================================================ */
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1;
  renderTable();
});

document.getElementById('filterCategory').addEventListener('change', () => {
  currentPage = 1;
  renderTable();
});

document.getElementById('sortField').addEventListener('change', function () {
  sortField   = this.value;
  currentPage = 1;
  renderTable();
});

/* ============================================================
   SEED DATA (shown only when localStorage is empty)
   ============================================================ */
function seedData() {
  return [
    { id: generateId(), name: 'Wireless Mouse',      category: 'Electronics', price: 799,   quantity: 15, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'USB-C Hub',            category: 'Electronics', price: 1499,  quantity: 4,  createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Mechanical Keyboard',  category: 'Electronics', price: 3499,  quantity: 8,  createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Cotton T-Shirt',       category: 'Clothing',    price: 349,   quantity: 50, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Denim Jeans',          category: 'Clothing',    price: 1299,  quantity: 3,  createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Notebook A4',          category: 'Stationery',  price: 89,    quantity: 0,  createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Ballpoint Pen Set',    category: 'Stationery',  price: 149,   quantity: 30, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Protein Bar (10 pck)', category: 'Food',        price: 599,   quantity: 20, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Yoga Mat',             category: 'Sports',      price: 899,   quantity: 5,  createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), name: 'Office Chair',         category: 'Furniture',   price: 8999,  quantity: 2,  createdAt: Date.now(), updatedAt: Date.now() },
  ];
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  products = loadFromStorage();

  // Seed demo data only if storage was empty
  if (products.length === 0) {
    products = seedData();
    saveToStorage();
  }

  // Set default sort icon
  document.getElementById('sortOrderIcon').textContent = '↑';

  updateStats();
  renderTable();
}

// Bootstrap
init();
