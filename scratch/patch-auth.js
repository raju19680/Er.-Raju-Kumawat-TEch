const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  return results;
}

const apiStudentDir = path.join('h:/Er. Raju Kumawat APP/student-app/src/app/api/student');
const routes = walk(apiStudentDir);

let modifiedCount = 0;

for (const route of routes) {
  let content = fs.readFileSync(route, 'utf8');
  let originalContent = content;

  // Replace strict student role check
  content = content.replace(
    /if\s*\(\s*auth\.role\s*!==\s*'student'\s*\)\s*\{\s*return\s*NextResponse\.json\(\{\s*success:\s*false,\s*message:\s*'Access denied'\s*\},\s*\{\s*status:\s*403\s*\}\)\s*\}/g,
    `if (!['student', 'teacher', 'platform_admin'].includes(auth.role)) {\n      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })\n    }`
  );

  // For findFirst student check, we need to modify it so it doesn't crash later
  // If we just allow admins, `student.id` will be a TypeError if `student` is null
  // Let's replace the required student check:
  content = content.replace(
    /const student = await db\.student\.findFirst\(\{\s*where: \{ userId: auth\.id \},\s*\}\)\s*if \(!student\) \{\s*return NextResponse\.json\(\{\s*success: false, message: 'Student profile not found' \}, \{ status: 404 \}\)\s*\}/g,
    `const student = await db.student.findFirst({\n      where: { userId: auth.id },\n    })\n    if (!student && auth.role === 'student') {\n      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })\n    }\n    const studentId = student?.id || null;`
  );

  // Now replace all uses of student.id with studentId, but carefully.
  // "where: { studentId: student.id }" -> "where: { studentId: studentId }"
  content = content.replace(/student\.id/g, 'studentId');
  
  // also fix some `student?.id` just in case
  
  // But wait! If studentId is null, what happens to prisma queries like `where: { studentId: null }`?
  // Prisma allows it, but it searches for `studentId = NULL`. That's fine for admins as they shouldn't have purchases anyway.
  
  if (content !== originalContent) {
    console.log('Modifying:', route);
    fs.writeFileSync(route, content);
    modifiedCount++;
  }
}
console.log('Total routes modified:', modifiedCount);
