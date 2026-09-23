const fs = require('fs');
const path = 'student-app/src/components/student-portal/student-layout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /function AuthenticatedPortal\(\) \{\s+const \{ studentPage, orgCode, checkoutOpen, checkoutItem, closeCheckout \} = useAppStore\(\)/,
  'function AuthenticatedPortal() {\n  const { studentPage, orgCode, checkoutOpen, checkoutItem, closeCheckout, checkoutIntent, setCheckoutIntent, openCheckout } = useAppStore()\n\n  React.useEffect(() => {\n    if (checkoutIntent) {\n      const intent = checkoutIntent;\n      setCheckoutIntent(null);\n      setTimeout(() => openCheckout(intent), 100);\n    }\n  }, [checkoutIntent, setCheckoutIntent, openCheckout]);'
);

fs.writeFileSync(path, content, 'utf8');
