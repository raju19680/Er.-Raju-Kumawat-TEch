const fs = require('fs');
const file = 'src/components/student-portal/public-portal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const { isAuthenticated, openCheckout, userRole } = useAppStore()',
  'const { isAuthenticated, openCheckout, userRole, setCheckoutIntent } = useAppStore()'
);

fs.writeFileSync(file, content);
