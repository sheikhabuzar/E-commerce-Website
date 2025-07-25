document.getElementById('adminRegisterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value
  };

  const BACKEND_URL = 'https://blissful-dream-production.up.railway.app';
  const res = await fetch(`${BACKEND_URL}/api/auth/admin/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (res.ok) {
    alert('Admin registered successfully');
    window.location.href = '/login.html';
  } else {
    alert(result.error || 'Error during admin registration');
  }
});
