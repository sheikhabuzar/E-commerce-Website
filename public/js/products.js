
const currentUserId = localStorage.getItem('currentUserId');

// Helpers to get/set cart for current user
function getCartForUser() {
  const data = localStorage.getItem('cart_' + currentUserId);
  return data ? JSON.parse(data) : [];
}
function saveCartForUser(cart) {
  localStorage.setItem('cart_' + currentUserId, JSON.stringify(cart));
  localStorage.setItem('cart', JSON.stringify(cart)); // optional for backward use
}

// Global filters & pagination variables
let currentCategory = '';
let currentPage = 1;
let currentSort = '';
let currentOrder = '';
let currentSizes = [];
let currentStock = '';

// Event listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Sort dropdown click (new)
  document.querySelectorAll('#sortDropdownMenu .dropdown-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const val = this.getAttribute('data-value');
      if (val === "price_asc") {
        currentSort = "price";
        currentOrder = "asc";
      } else if (val === "price_desc") {
        currentSort = "price";
        currentOrder = "desc";
      } else if (val === "date_asc") {
        currentSort = "createdAt";
        currentOrder = "asc";
      } else if (val === "date_desc") {
        currentSort = "createdAt";
        currentOrder = "desc";
      } else if (val === "best_selling") {
        currentSort = "bestSelling";
        currentOrder = "desc";
      } else {
        currentSort = "";
        currentOrder = "";
      }
      document.getElementById('sortDropdownBtn').textContent = this.textContent;
      fetchProducts();
    });
  });

  // Filter apply button
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function () {
      // Sizes (multi-select)
      currentSizes = [];
      document.querySelectorAll('.size-filter:checked').forEach(cb => {
        currentSizes.push(cb.value);
      });
      // Stock
      currentStock = document.getElementById('stockFilter').value;
      fetchProducts();
      // Optionally close dropdown
      document.getElementById('filterDropdownBtn')?.click();
    });
  }

  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => fetchProducts());
  }

  // Category click
  document.querySelectorAll('.nav-category').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      currentCategory = this.getAttribute('data-category');
      const dropdownBtn = document.getElementById("categoriesDropdown");
      if (dropdownBtn) dropdownBtn.textContent = currentCategory || "All Categories";
      fetchProducts();
    });
  });

  // Initial fetch
  fetchProducts();
});
const BACKEND_URL = 'https://blissful-dream-production.up.railway.app';
async function fetchProducts(page = 1) {
  currentPage = page;
  let url = `${BACKEND_URL}/api/products?page=${currentPage}&limit=100`;
  console.log("Fetching products from:", url);
  
  const searchInput = document.getElementById("searchInput");
  const search = searchInput ? searchInput.value.toLowerCase() : "";
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
  if (currentSort) url += `&sortType=${currentSort}`;
  if (currentOrder) url += `&orderBy=${currentOrder}`;
  if (currentSizes.length) url += `&size=${encodeURIComponent(currentSizes.join(','))}`;
  if (currentStock) url += `&stock=${encodeURIComponent(currentStock)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error: ${res.status} ${res.statusText}\n${text}`);
    }

    const data = await res.json();
    
    // ✅ Fix: use Array.isArray to check
    if (!Array.isArray(data.products)) {
      throw new Error("API did not return products array.");
    }
    
    const container = document.getElementById('productList');
    container.innerHTML = '';

    if (data.products.length === 0) {
      container.innerHTML = `<div class="col-12"><p class="text-center text-muted">No products found.</p></div>`;
    }

    data.products.forEach(p => {
      const imageUrl = p.image && p.image.startsWith('http')
        ? p.image
        : `${BACKEND_URL}/uploads/${p.image}`;
      const card = `
        <div class="col-md-4">
          <div class="card product-card">
            <img src="${imageUrl}" class="product-image" alt="${p.name}" />
            <div class="card-body d-flex flex-column">
              <div class="product-title">${p.name}</div>
              <div class="product-size text-muted">Size: ${p.sizes ? p.sizes.join(', ') : 'N/A'}</div>
              <div class="product-price">PKR ${p.price}</div>
              <div class="product-description">${p.description}</div>
              <div class="text-muted small mt-2">Stock: ${p.stock}</div>
              <a class="btn btn-info my-2" href="/product-detail.html?id=${p.id}">
                <i class="bi bi-eye"></i> View Details
              </a>
              <a href="/product-detail.html?id=${p.id}" class="btn btn-success mt-auto">
                <i class="bi bi-cart-plus"></i> Add to Cart
              </a>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });

    renderPagination(data.currentPage, data.totalPages);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    alert("Failed to load products. See console for details.");
  }
}

function renderPagination(current, total) {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  let html = '';

  // Always show first page
  if (current > 2) {
    html += `<button class="btn btn-sm btn-outline-primary mx-1" onclick="fetchProducts(1)">1</button>`;
    if (current > 3) html += `<span class="mx-1">...</span>`;
  }

  // Previous page
  if (current > 1) {
    html += `<button class="btn btn-sm btn-outline-primary mx-1" onclick="fetchProducts(${current - 1})">&lt;</button>`;
  }

  // Current page
  html += `<button class="btn btn-sm btn-primary mx-1">${current}</button>`;

  // Next page
  if (current < total) {
    html += `<button class="btn btn-sm btn-outline-primary mx-1" onclick="fetchProducts(${current + 1})">&gt;</button>`;
  }

  // Always show last page
  if (current < total - 1) {
    if (current < total - 2) html += `<span class="mx-1">...</span>`;
    html += `<button class="btn btn-sm btn-outline-primary mx-1" onclick="fetchProducts(${total})">${total}</button>`;
  }

  container.innerHTML = html;
}
function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  loadCart();
}

function addToCart(product) {
  let cart = getCartForUser();
  const exists = cart.find(item => item.id === product.id);
  if (exists) {
    exists.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCartForUser(cart);
  openCart();
}

function loadCart() {
  const cartItems = getCartForUser();
  const cartContainer = document.getElementById('cartItems');
  const totalEl = document.getElementById('totalAmount');

  cartContainer.innerHTML = '';
  let total = 0;

  cartItems.forEach((item, index) => {
    total += item.price * item.quantity;
    cartContainer.innerHTML += `
      <div class="cart-item d-flex mb-3 align-items-center">
        <img src="${BACKEND_URL}/uploads/${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px;" />
        <div class="flex-grow-1">
          <div><strong>${item.name}</strong> <small class="text-muted">(Size: ${item.size || 'N/A'})</small></div>
          <div>Price: PKR ${item.price}</div>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateQuantity(${index}, -1)">➖</button>
            <span>${item.quantity}</span>
            <button class="btn btn-sm btn-outline-secondary ms-1" onclick="updateQuantity(${index}, 1)">➕</button>
          </div>
        </div>
        <button class="btn btn-sm btn-danger ms-2" onclick="removeItem(${index})">❌</button>
      </div>
    `;
  });

  totalEl.textContent = total.toFixed(2);
}

function updateQuantity(index, change) {
  let cart = getCartForUser();
  if (cart[index]) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCartForUser(cart);
    loadCart();
  }
}

function removeItem(index) {
  let cart = getCartForUser();
  if (cart[index]) {
    cart.splice(index, 1);
    saveCartForUser(cart);
    loadCart();
  }
}

window.fetchProducts = fetchProducts;
