const fs = require('fs');

const files = [
'src/app/api/student/attempts/route.ts',
'src/app/api/student/certificates/[courseId]/route.ts',
'src/app/api/student/courses/[id]/chat/route.ts',
'src/app/api/student/courses/[id]/forum/route.ts',
'src/app/api/student/enroll/route.ts',
'src/app/api/student/lesson-progress/route.ts',
'src/app/api/student/offerings/route.ts',
'src/app/api/student/orders/route.ts',
'src/app/api/student/progress/route.ts',
'src/app/api/student/purchase/route.ts',
'src/app/api/student/stats/route.ts',
'src/app/api/student/tests/[id]/start/route.ts',
'src/app/api/student/tests/[id]/submit/route.ts',
'src/app/api/student/test-series/route.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // First, fix `studentId || 'admin-bypass'` -> `student?.id || 'admin-bypass'`
  let newContent = content.replace(/studentId \|\| 'admin-bypass'/g, "student?.id || 'admin-bypass'");
  
  // Then fix isolated `studentId` -> `student?.id` (but only when it's a value, e.g. `authorId: studentId` -> `authorId: student?.id`)
  newContent = newContent.replace(/:\s*studentId\b/g, ": student?.id");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
});
