const http = require('http');

function get(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
  });
}

async function main() {
  const coursesRes = await get('http://localhost:3002/api/student/courses');
  console.log('--- /api/student/courses ---');
  console.log('Status:', coursesRes.status);
  console.log('Data:', coursesRes.data.substring(0, 300));
  
  const portalRes = await get('http://localhost:3002/api/public/portal-data');
  console.log('\n--- /api/public/portal-data ---');
  console.log('Status:', portalRes.status);
  console.log('Data:', portalRes.data.substring(0, 300));
}

main();
