const API_URL = import.meta.env.VITE_API_URL;

fetch(`${API_URL}/api/your-endpoint`)
  .then(res => res.json())
  .then(data => console.log(data));