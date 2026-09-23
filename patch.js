const fs = require('fs');
const file = 'src/components/admin/admin-layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookInsert = 
  const userRole = useAppStore((s) => s.userRole)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  React.useEffect(() => {
    const role = (userRole || '').toLowerCase()
    if (!['platform_admin', 'admin', 'org_admin'].includes(role)) {
      if (role === 'student' || role === 'user') {
        setCurrentView('student')
      } else {
        setCurrentView('cms')
      }
    }
  }, [userRole, setCurrentView])
;

content = content.replace(
  'export default function AdminLayout() {',
  'export default function AdminLayout() {\n' + hookInsert
);
fs.writeFileSync(file, content);
