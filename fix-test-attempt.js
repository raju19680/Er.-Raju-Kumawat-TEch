const fs = require('fs');
const file = 'student-app/src/app/api/student/test-attempts/[id]/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /omrImageUrl: true,/g,
  'omrImageUrl: true,\n        timePerQuestion: true,\n        themeSnapshot: true,'
);

fs.writeFileSync(file, content);
