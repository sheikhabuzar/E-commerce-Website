document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value
  };

const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (res.ok) {
    alert('Registration successful!');
    window.location.href = '/login.html';
  } else {
    alert(result.error || 'Error occurred');
  }
});