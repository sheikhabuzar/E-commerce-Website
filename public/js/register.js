document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value
  };

const BACKEND_URL = 'https://blissful-dream-production.up.railway.app';
const res = await fetch(`