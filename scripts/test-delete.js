(async () => {
  const base = 'http://localhost:3001';
  const adminEmail = 'admin@example.com';
  const adminPass = 'adminpass';
  const headers = { 'Content-Type': 'application/json' };

  async function post(path, body, token) {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: Object.assign({}, headers, token ? { Authorization: `Bearer ${token}` } : {}),
      body: JSON.stringify(body)
    });
    return res.json();
  }

  async function get(path, token) {
    const res = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.json();
  }

  try {
    // try login
    let loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST', headers, body: JSON.stringify({ email: adminEmail, password: adminPass })
    });
    if (loginRes.status !== 200) {
      console.log('Admin login failed, creating admin...');
      await post('/api/auth/register', { nombre: 'Admin', email: adminEmail, password: adminPass, nivel: 'admin' });
      loginRes = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: adminEmail, password: adminPass }) });
    }
    const loginJson = await loginRes.json();
    const token = loginJson.token;
    console.log('Token:', token);

    let products = await get('/api/products', token);
    console.log('Products before:', products);

    if (!Array.isArray(products) || products.length === 0) {
      console.log('No products, creating sample');
      await post('/api/products', { nombre: 'Sample', codigo: 'SAMPLE1', precio: 9.99, descripcion: 'Sample' }, token);
      products = await get('/api/products', token);
      console.log('Products after creating sample:', products);
    }

    const id = products[0].id;
    console.log('Deleting id:', id);
    const delRes = await fetch(base + `/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    console.log('Delete status:', delRes.status);
    const after = await get('/api/products', token);
    console.log('Products after:', after);
  } catch (err) {
    console.error('Test script error:', err);
  }
})();
