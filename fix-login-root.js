const fs = require('fs');
const file = 'src/components/student-portal/student-login.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add to store extraction
content = content.replace(
  'const { login, orgCode, orgName, setStudentPage, setApiToken } = useAppStore()',
  'const { login, orgCode, orgName, setStudentPage, setApiToken, checkoutIntent, setCheckoutIntent, openCheckout } = useAppStore()'
);

// Add to success block
content = content.replace(
  'login(orgCode, orgName, name, email, role, loginMode)',
  login(orgCode, orgName, name, email, role, loginMode)
        
        // Handle checkout intent
        if (checkoutIntent && (role === 'student' || role === 'user')) {
          const intent = checkoutIntent;
          setCheckoutIntent(null);
          setTimeout(() => {
            openCheckout(intent);
          }, 500);
        }
);

fs.writeFileSync(file, content);
