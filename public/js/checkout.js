async function checkout() {
  const token = localStorage.getItem('token');
  const decoded = JSON.parse(atob(token.split('.')[1])); // decode JWT payload
  const userId = decoded.userId;
  const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const shippingInfo = {
    name: prompt("Enter your full name"),
    address: prompt("Enter your address"),
    city: prompt("Enter city"),
    zip: prompt("Enter zip code")
  };

const res = await fetch(`${BACKEND_URL}/api/checkout/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ cart, shippingInfo })
  });

  const data = await res.json();
  if (data.url) {
    //  Clear cart after successful checkout initiation
    localStorage.removeItem(`cart_${userId}`);
    localStorage.removeItem('cart'); // optional backup clear
    window.location.href = data.url;
  } else {
    alert("Checkout failed");
  }
}
