const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/chat/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '        messages: {\n          ,\n          orderBy: { createdAt: \'asc\' }\n        }',
  '        messages: {\n          orderBy: { createdAt: \'asc\' }\n        }'
);

fs.writeFileSync(file, content);
