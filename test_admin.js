const http = require('http');

async function testApi() {
  console.log('Testing with ADMIN user vikram@kumawatstudy.com');
  const res = await fetch('http://localhost:3000/api/auth/direct-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vikram@kumawatstudy.com', password: 'password123', orgId: '9680177120' })
  });
  
  if (!res.ok) {
    console.log('Login failed:', await res.text());
    return;
  }
  
  const loginData = await res.json();
  console.log('Login success, role:', loginData.user.role, 'loginMode:', loginData.user.loginMode);
  
  const token = loginData.apiToken;
  
  console.log('Fetching /api/admin/dashboard...');
  const dashRes = await fetch('http://localhost:3000/api/admin/dashboard', {
    headers: { 'x-auth-token': token }
  });
  
  console.log('Dashboard status:', dashRes.status);
  console.log('Dashboard response:', await dashRes.json());
}

testApi();
