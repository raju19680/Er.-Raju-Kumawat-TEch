const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/forum/[postId]/comments/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix GET
content = content.replace(
  /export async function GET\(req: NextRequest, \{ params \}: \{ params: \{ id: string, postId: string \} \}\)/g,
  "export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, postId: string }> })"
).replace(
  /where: \{ postId: params\.postId \},/g,
  "where: { postId: (await params).postId },"
);

content = content.replace(
  /include: \{\s*student: \{ select: \{ name: true, profileImage: true \} \}\s*\},/g,
  ""
);

// Fix POST
content = content.replace(
  /export async function POST\(req: NextRequest, \{ params \}: \{ params: \{ id: string, postId: string \} \}\)/g,
  "export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, postId: string }> })"
).replace(
  /postId: params\.postId,/g,
  "postId: (await params).postId,"
);

content = content.replace(
  /studentId: student\?\.id,/g,
  "authorId: student?.id || auth.id,\n        authorName: student?.name || auth.name || 'Student',\n        authorRole: 'student',"
);

fs.writeFileSync(file, content);
