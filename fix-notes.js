const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/notes/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export async function GET\(req: NextRequest, \{ params \}: \{ params: \{ id: string \} \}\)/g,
  "export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> })"
).replace(
  /const courseId = params\.id/g,
  "const { id: courseId } = await params"
);

fs.writeFileSync(file, content);
