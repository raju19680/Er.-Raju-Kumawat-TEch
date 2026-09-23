const fs = require('fs');
const path = 'student-app/src/components/student-portal/course/course-drilldown.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/if \(courseId\) \{/g, 'if (selectedCourseId) {');
content = content.replace(/productId: courseId,/g, 'productId: selectedCourseId,');
content = content.replace(/}, \[courseId\]\)/g, '}, [selectedCourseId])');

fs.writeFileSync(path, content, 'utf8');
