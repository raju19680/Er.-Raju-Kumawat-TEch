const fs = require('fs');
const file = 'student-app/src/components/student-portal/test-result.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  section: string | null\n  solution: {',
  '  section: string | null\n  timeTaken?: number\n  solution: {'
);

fs.writeFileSync(file, content);
