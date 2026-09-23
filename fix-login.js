const fs = require('fs');
const path = 'student-app/src/components/student-portal/student-login.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const storeState = useAppStore\.getState\(\)[\s\S]*?setTimeout\(\(\) => storeState\.openCheckout\(intent\), 100\)\s*\}/,
  ''
);

fs.writeFileSync(path, content, 'utf8');
