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
  document.getElementById('applyFiltersBtn')?.addEventListener('click', function () {
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

  // Search input
  document.getElementById("searchInput").addEventListener("input", () => fetchProducts());

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
async function fetchProducts(page = 1) {
  currentPage = page;
  let url =  'https://1c9610707762.ngrok-free.app/api/products?page=' + page + '&limit=100';

  // build up url with search, category, sort, filters...
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  if (search)       url += `&search=${encodeURIComponent(search)}`;
  if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
  if (currentSort) url += `&sortType=${currentSort}`;
  if (currentOrder) url += `&orderBy=${currentOrder}`;
  if (currentSizes.length) url += `&size=${encodeURIComponent(currentSizes.join(','))}`;
  if (currentStock)       url += `&stock=${encodeURIComponent(currentStock)}`;

  try {
    const res = await fetch(url);
    // if the server returns a 404, 500, etc., read the body as text so you can see what HTML it actually sent:
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error ${res.status} loading products:`, text);
      return alert("Could not load products. Check console for details.");
    }

    // Now we *know* it’s JSON:
    const data = await res.json();
    const products = data.products || [];

    // 1️⃣ Render product cards
    const container = document.getElementById('productList');
    container.innerHTML = '';
    products.forEach(p => {
      const imageUrl = p.image ? `${BACKEND_URL}/uploads/${p.image}` : 'default.jpg';
      container.innerHTML += `
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
              <button class="btn btn-success mt-auto" onclick='addToCart(${JSON.stringify(p)})'>
                <i class="bi bi-cart-plus"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    });

    // 2️⃣ Render pagination
    renderPagination(data.currentPage, data.totalPages);
  }
  catch (err) {
    console.error("Network or parsing error:", err);
    alert("Network error. See console for details.");
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
        <img src="/uploads/${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px;" />
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
