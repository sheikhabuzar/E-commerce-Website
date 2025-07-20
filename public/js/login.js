document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: form.email.value,
      password: form.password.value
    })
  });

  const result = await res.json();
  if (res.ok) {
    const token = result.token;

    // ✅ Store with proper key for compatibility
    localStorage.setItem('jwtToken', token); // was 'token' before
    localStorage.setItem('token', token);    // keep legacy key (optional)

    // ✅ Decode token to get user ID and role
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenData.id; // not userId, it's just 'id' in your JWT payload

    localStorage.setItem('currentUserId', userId);

    // ✅ Load this user's cart
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
