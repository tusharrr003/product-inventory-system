/**
 * script.js — Product Inventory System
 * Author: Janhavi (JavaScript Logic)
 *
 * Features:
 *  - Add / Update / Delete products
 *  - Search & Category filter
 *  - Low stock warning (qty ≤ 5)
 *  - Total inventory value
 *  - Persist data to localStorage
 */

/* ── Constants ──────────────────────────────── */
const LOW_STOCK_THRESHOLD = 5;
const STORAGE_KEY = 'inventory_products';

/* ── State ──────────────────────────────────── */
let products = [];          // master list
let editingId = null;       // null = adding, string = editing
let deleteTargetId = null;  // for confirm modal
let toastTimer = null;

/* ── DOM References ─────────────────────────── */
const form            = document.getElementById('product-form');
const nameInput       = document.getElementById('product-name');
const priceInput      = document.getElementById('product-price');
const qtyInput        = document.getElementById('product-qty');
const categoryInput   = document.getElementById('product-category');
const editIdInput     = document.getElementById('edit-id');
const submitBtn       = document.getElementById('submit-btn');
const submitBtnText   = document.getElementById('submit-btn-text');
const cancelEditBtn   = document.getElementById('cancel-edit-btn');
const formTitleText   = document.getElementById('form-title-text');
const submitBtnIcon   = submitBtn.querySelector('.btn-icon');

const searchInput     = document.getElementById('search-input');
const filterCategory  = document.getElementById('filter-category');

const inventoryBody   = document.getElementById('inventory-body');
const emptyState      = document.getElementById('empty-state');
const rowCount        = document.getElementById('row-count');
const clearAllBtn     = document.getElementById('clear-all-btn');
const lowStockBanner  = document.getElementById('low-stock-banner');
const lowStockNames   = document.getElementById('low-stock-names');

const toast           = document.getElementById('toast');
const modalBackdrop   = document.getElementById('modal-backdrop');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalBody       = document.getElementById('modal-body');

// Header stat elements
const statTotalProducts = document.querySelector('#stat-total-products .stat-num');
const statLowStock      = document.querySelector('#stat-low-stock .stat-num');
const statTotalValue    = document.querySelector('#stat-total-value .stat-num');

/* ── Utility Helpers ────────────────────────── */

/**
 * Generate a unique ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Format a number as Indian Rupee string
 * @param {number} n
 * @returns {string}
 */
function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ── LocalStorage ───────────────────────────── */

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    products = raw ? JSON.parse(raw) : [];
  } catch {
    products = [];
  }
}

/* ── Toast Notification ─────────────────────── */

/**
 * Show a short toast message
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast toast--${type} show`;
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/* ── Modal Confirm ──────────────────────────── */

function openDeleteModal(id, productName) {
  deleteTargetId = id;
  modalBody.textContent = `"${productName}" will be permanently removed from inventory.`;
  modalBackdrop.style.display = 'flex';
}

function closeModal() {
  modalBackdrop.style.display = 'none';
  deleteTargetId = null;
}

modalConfirmBtn.addEventListener('click', () => {
  if (deleteTargetId) {
    deleteProduct(deleteTargetId);
    closeModal();
  }
});

// Close modal on backdrop click
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

/* ── Stats Header Update ────────────────────── */

function updateStats() {
  const total      = products.length;
  const lowCount   = products.filter(p => p.quantity > 0 && p.quantity <= LOW_STOCK_THRESHOLD).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  statTotalProducts.textContent = total;
  statLowStock.textContent      = lowCount;
  statTotalValue.textContent    = formatCurrency(totalValue);
}

/* ── Low Stock Banner ───────────────────────── */

function updateLowStockBanner() {
  const lowItems = products.filter(p => p.quantity > 0 && p.quantity <= LOW_STOCK_THRESHOLD);
  if (lowItems.length === 0) {
    lowStockBanner.style.display = 'none';
    return;
  }
  lowStockNames.textContent = lowItems.map(p => `${p.name} (${p.quantity} left)`).join(', ');
  lowStockBanner.style.display = 'block';
}

/* ── Status Badge Helper ────────────────────── */

function getStatusBadge(qty) {
  if (qty === 0) {
    return `<span class="badge badge--out">🔴 Out of Stock</span>`;
  } else if (qty <= LOW_STOCK_THRESHOLD) {
    return `<span class="badge badge--low">⚠️ Low Stock</span>`;
  }
  return `<span class="badge badge--ok">✅ In Stock</span>`;
}

/* ── Render Table ───────────────────────────── */

function renderTable() {
  const searchTerm     = searchInput.value.trim().toLowerCase();
  const selectedCat    = filterCategory.value;

  // Filter
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm);
    const matchCat    = selectedCat === 'All' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  // Clear body
  inventoryBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    rowCount.textContent = 'No products found';
    clearAllBtn.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    rowCount.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
    clearAllBtn.style.display = products.length > 0 ? 'inline-flex' : 'none';

    filtered.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      tr.innerHTML = `
        <td class="row-index">${idx + 1}</td>
        <td class="product-name-cell">${escapeHtml(p.name)}</td>
        <td><span class="cat-badge">${escapeHtml(p.category)}</span></td>
        <td class="price-cell">${formatCurrency(p.price)}</td>
        <td>${p.quantity}</td>
        <td class="value-cell">${formatCurrency(p.price * p.quantity)}</td>
        <td>${getStatusBadge(p.quantity)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn--edit btn--sm" onclick="startEdit('${p.id}')" title="Edit product">
              ✏️ Edit
            </button>
            <button class="btn btn--danger btn--sm" onclick="openDeleteModal('${p.id}', '${escapeHtml(p.name)}')" title="Delete product">
              🗑️
            </button>
          </div>
        </td>
      `;
      inventoryBody.appendChild(tr);
    });
  }

  updateStats();
  updateLowStockBanner();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/* ── Add / Update Product ───────────────────── */

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name     = nameInput.value.trim();
  const price    = parseFloat(priceInput.value);
  const quantity = parseInt(qtyInput.value, 10);
  const category = categoryInput.value;

  // Validation
  if (!name) {
    showToast('❌ Product name is required.', 'error');
    nameInput.focus();
    return;
  }
  if (isNaN(price) || price < 0) {
    showToast('❌ Please enter a valid price.', 'error');
    priceInput.focus();
    return;
  }
  if (isNaN(quantity) || quantity < 0) {
    showToast('❌ Please enter a valid quantity.', 'error');
    qtyInput.focus();
    return;
  }

  if (editingId) {
    // UPDATE existing product
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, price, quantity, category };
      saveToStorage();
      renderTable();
      showToast('✅ Product updated successfully!', 'success');
    }
    cancelEdit();
  } else {
    // ADD new product
    const newProduct = {
      id: generateId(),
      name,
      price,
      quantity,
      category,
      createdAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    saveToStorage();
    renderTable();
    showToast('✅ Product added successfully!', 'success');
    form.reset();
    nameInput.focus();
  }
});

/* ── Edit Product ───────────────────────────── */

function startEdit(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingId = id;
  editIdInput.value = id;

  nameInput.value           = product.name;
  priceInput.value          = product.price;
  qtyInput.value            = product.quantity;
  categoryInput.value       = product.category;

  formTitleText.textContent  = 'Edit Product';
  submitBtnText.textContent  = 'Update Product';
  submitBtnIcon.textContent  = '💾';
  cancelEditBtn.style.display = 'inline-flex';

  // Scroll to form
  document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  nameInput.focus();
}

function cancelEdit() {
  editingId = null;
  editIdInput.value = '';
  form.reset();

  formTitleText.textContent   = 'Add New Product';
  submitBtnText.textContent   = 'Add Product';
  submitBtnIcon.textContent   = '➕';
  cancelEditBtn.style.display = 'none';
}

/* ── Delete Product ─────────────────────────── */

function deleteProduct(id) {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return;

  const name = products[idx].name;
  products.splice(idx, 1);

  // If we were editing this product, cancel edit
  if (editingId === id) cancelEdit();

  saveToStorage();
  renderTable();
  showToast(`🗑️ "${name}" deleted.`, 'info');
}

/* ── Clear All ──────────────────────────────── */

function clearAll() {
  if (products.length === 0) return;
  deleteTargetId = '__ALL__';
  modalBody.textContent = `All ${products.length} product(s) will be permanently removed.`;
  document.getElementById('modal-title').textContent = 'Clear All Products?';
  modalBackdrop.style.display = 'flex';

  modalConfirmBtn.onclick = () => {
    products = [];
    saveToStorage();
    cancelEdit();
    renderTable();
    closeModal();
    showToast('🗑️ All products cleared.', 'info');

    // Reset modal confirm to default behavior
    modalConfirmBtn.onclick = () => {
      if (deleteTargetId) { deleteProduct(deleteTargetId); closeModal(); }
    };
    document.getElementById('modal-title').textContent = 'Delete Product?';
  };
}

/* ── Search & Filter ────────────────────────── */

searchInput.addEventListener('input', renderTable);
filterCategory.addEventListener('change', renderTable);

/* ── Keyboard Shortcuts ─────────────────────── */
document.addEventListener('keydown', (e) => {
  // Escape: cancel edit or close modal
  if (e.key === 'Escape') {
    if (modalBackdrop.style.display !== 'none') { closeModal(); return; }
    if (editingId) cancelEdit();
  }
});

/* ── Initialise ─────────────────────────────── */
(function init() {
  loadFromStorage();

  // Seed with demo data if storage is empty
  if (products.length === 0) {
    products = [
      { id: generateId(), name: 'Wireless Headphones',  price: 1499, quantity: 28,  category: 'Electronics', createdAt: new Date().toISOString() },
      { id: generateId(), name: 'Mechanical Keyboard',  price: 3299, quantity: 4,   category: 'Electronics', createdAt: new Date().toISOString() },
      { id: generateId(), name: 'Notebook (A4, 200pg)', price: 80,   quantity: 150, category: 'Stationery',  createdAt: new Date().toISOString() },
      { id: generateId(), name: 'Ergonomic Chair',      price: 8500, quantity: 0,   category: 'Furniture',   createdAt: new Date().toISOString() },
      { id: generateId(), name: 'USB-C Hub (7-in-1)',   price: 1199, quantity: 3,   category: 'Electronics', createdAt: new Date().toISOString() },
    ];
    saveToStorage();
  }

  renderTable();
  nameInput.focus();
})();
