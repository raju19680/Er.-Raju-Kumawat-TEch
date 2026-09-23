const fs = require('fs');
const file = 'student-app/src/components/student-portal/take-test.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  allowPdfDownload?: boolean\n  pdfPasswordProtected?: boolean',
  '  allowPdfDownload?: boolean\n  pdfPasswordProtected?: boolean\n  themeSnapshot?: string | null\n  theme?: any'
);

fs.writeFileSync(file, content);
