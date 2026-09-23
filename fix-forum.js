const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/forum/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'forum = await db.forum.create({',
  'forum = await db.forum.create({'
).replace(
  /organizationId: auth\.orgId/g,
  ''
).replace(
  /, \}/g,
  ' }'
).replace(
  /courseId, /g,
  'courseId'
);

fs.writeFileSync(file, content);
