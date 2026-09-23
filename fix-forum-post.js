const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/forum/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'studentId: student?.id,',
  "authorId: student?.id || auth.id,\n        authorName: student?.name || auth.name || 'Student',\n        authorRole: 'student',"
);

fs.writeFileSync(file, content);
