const http = require('http');
async function testApi() {
  const res = await fetch('http://localhost:3000/api/auth/direct-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kumawatrajulal96@gmail.com', password: 'password123', orgId: '9680177120' })
  });
  const loginData = await res.json();
  const token = loginData.apiToken;
  const dashRes = await fetch('http://localhost:3000/api/admin/dashboard', { headers: { 'x-auth-token': token } });
  console.log(await dashRes.json());
}
testApi();
