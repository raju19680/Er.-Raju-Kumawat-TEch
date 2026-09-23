const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/forum/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /student: \{ select: \{ name: true, profileImage: true \} \},/g,
  ''
).replace(
  /student: true, /g,
  ''
);

fs.writeFileSync(file, content);
