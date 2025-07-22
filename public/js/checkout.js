async function checkout() {
  const token = localStorage.getItem('token');
  const decoded = JSON.parse(atob(token.split('.')[1])); // decode JWT payload
  const userId = decoded.id;
  const cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const name = prompt("Enter your full name");
  if (name === null) return;
  const address = prompt("Enter your address");
  if (address === null) return;
  const city = prompt("Enter city");
  if (city === null) return;
  const zip = prompt("Enter zip code");
  if (zip === null) return;

  const shippingInfo = { name, address, city, zip };

const BACKEND_URL = 'https://e-commerce-website-production-e831.up.railway.app';
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
