const fs = require('fs');
const file = 'student-app/src/components/student-portal/student-layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const { userName, logout, studentPage, setStudentPage, setStudentSidebarMobileOpen, toggleStudentSidebar } = useAppStore()',
  'const { userName, logout, studentPage, setStudentPage, setStudentSidebarMobileOpen, toggleStudentSidebar, studentPageHistory, goBackStudentPage } = useAppStore()'
);

content = content.replace(
  '            <h1 className="text-sm font-semibold text-gray-900">{currentLabel}</h1>',
              {studentPageHistory && studentPageHistory.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={goBackStudentPage} title="Go Back">
                <ArrowLeft className="size-4 text-gray-600" />
              </Button>
            )}
            <h1 className="text-sm font-semibold text-gray-900">{currentLabel}</h1>
);

content = content.replace(
  'import { ArrowRight, BookOpen, Clock, FileText, LayoutDashboard, LogOut, Menu, PlayCircle, Settings, ShoppingBag, Store, User } from \'lucide-react\'',
  'import { ArrowLeft, ArrowRight, BookOpen, Clock, FileText, LayoutDashboard, LogOut, Menu, PlayCircle, Settings, ShoppingBag, Store, User } from \'lucide-react\''
);

fs.writeFileSync(file, content);
console.log('Added Back button to StudentTopbar');
