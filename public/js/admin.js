const token = localStorage.getItem('token');
const BACKEND_URL = 'https://e-commerce-website-production-e831.up.railway.app';

// Fetch & display all products
async function fetchAdminProducts() {
  const res = await fetch(`${BACKEND_URL}/api/products?page=1&limit=100`);
const data = await res.json();
const products = data.products;
  const container = document.getElementById('adminProductList');
  container.innerHTML = '';//Clear existing HTML

  products.forEach(p => {
    container.innerHTML += `
      <div class="col-md-4">
        <div class="card mb-3">
          <img src="/uploads/${p.image}" class="card-img-top" height="200">
          <div class="card-body">
            <h5>${p.name}</h5>
            <p>${p.description}</p>
            <p><strong>PKR ${p.price}</strong></p>
            <p><strong>Sizes:</strong> ${p.sizes ? p.sizes.join(', ') : 'None'}</p>
            <button class="btn btn-warning btn-sm" onclick="editProduct(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
          </div>
        </div>
      </div>`;
  });
}

// DELETE
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  if (res.ok) {
    alert('Product deleted ✅');
    fetchAdminProducts();
  } else {
    alert('Failed to delete product ❌');
  }
}

// EDIT
async function editProduct(id) {
  const res = await fetch(`${BACKEND_URL}/api/products/${id}`);
  const p = await res.json();

  const form = document.getElementById('productForm');//Load that product information automatically in form
  form.name.value = p.name;
  form.description.value = p.description;
  form.price.value = p.price;
  form.stock.value = p.stock;
  form.category.value = p.category;

  // Set selected sizes in the multi-select dropdown
  const sizeSelect = form.querySelector('[name="sizes"]');
  Array.from(sizeSelect.options).forEach(opt => {
    opt.selected = p.sizes && p.sizes.includes(opt.value);
  });

  alert('Please re-select the image file manually when editing.');//Beacuse for security reason browser did not allow pre filling file
  form.dataset.id = id; // Store ID for update
}

// CREATE or UPDATE
document.getElementById('productForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);//Gathers all input data
  const productId = form.dataset.id;//this is used to detect the mode
  //  Don't append sizes manually — FormData handles it already
  let url = `${BACKEND_URL}/api/products`;//we assume that its create new request
  let method = 'POST';
  if (productId) {
    url = `${BACKEND_URL}/api/products/${productId}`;
    method = 'PUT';
    formData.append('_method', 'PUT'); // depends on your server that allows post with override
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token
      // No need to set Content-Type manually when using FormData
    },
    body: formData
  });

  if (res.ok) {
    alert(productId ? 'Product updated ' : 'Product added ');
    form.reset();
    delete form.dataset.id; // Clear stored ID after update
    fetchAdminProducts();
  } else {
    const errData = await res.json();
    console.error("Server error:", errData);
    alert('Error saving product \n' + (errData.error || 'Unknown Error'));
  }
});
// Fetch products on page load
fetchAdminProducts();
