const currentUserId = localStorage.getItem('currentUserId');

function getCartForUser() {
  const data = localStorage.getItem('cart_' + currentUserId);
  return data ? JSON.parse(data) : [];
}

function saveCartForUser(cart) {
  localStorage.setItem('cart_' + currentUserId, JSON.stringify(cart));
  localStorage.setItem('cart', JSON.stringify(cart)); // optional
}

function renderCart() {
  const cart = getCartForUser();
  const container = document.getElementById('cartItems');
  const totalAmount = document.getElementById('totalAmount');
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    totalAmount.innerText = "0";
    return;
  }

  container.innerHTML = cart.map((item, index) => {
    total += item.price * item.quantity;
    return `
      <div class="card mb-3 p-3">
        <h5>${item.name}</h5>
        <p>Size: ${item.size}</p>
        <p>Price: PKR${item.price}</p>
        <label>Qty:</label>
        <input type="number" min="1" value="${item.quantity}" onchange="updateQty(${index}, this.value)" />
        <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">Remove</button>
      </div>
    `;
  }).join('');

  totalAmount.innerText = total.toFixed(2);
}
function updateQty(index, newQty) {
  let cart = getCartForUser();
  newQty = parseInt(newQty);
  cart[index].quantity = newQty;
  saveCartForUser(cart);
  renderCart();
}
function removeItem(index) {
  let cart = getCartForUser();
  cart.splice(index, 1);
  saveCartForUser(cart);
  renderCart();
}


renderCart();
