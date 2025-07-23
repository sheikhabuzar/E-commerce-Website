document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

const BACKEND_URL = 'https://blissful-dream-production.up.railway.app';
const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: form.email.value,
    password: form.password.value
  })
});

const result = await res.json();
if (res.ok) {
  const token = result.token;
  localStorage.setItem('jwtToken', token);
  localStorage.setItem('token', token);
  const tokenData = JSON.parse(atob(token.split('.')[1]));
  const userId = tokenData.id;
  localStorage.setItem('currentUserId', userId);
  const savedCart = localStorage.getItem('cart_' + userId);
  localStorage.setItem('cart', savedCart || JSON.stringify([]));
  alert('Login successful');
  if (tokenData.role === 'admin') {
    window.location.href = '/admin.html';
  } else {
    window.location.href = '/products.html';
  }
} else {
  alert(result.error || 'Login failed');
}
});