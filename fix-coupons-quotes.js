const fs = require('fs');
const path = 'src/components/teacher/coupons-page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/apiFetch\(\/api\/courses\?organizationId=\)/g, 'apiFetch("/api/courses?organizationId=" + orgCode)');
content = content.replace(/apiFetch\(\/api\/test-series\?organizationId=\)/g, 'apiFetch("/api/test-series?organizationId=" + orgCode)');

fs.writeFileSync(path, content, 'utf8');
