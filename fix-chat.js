const fs = require('fs');
const file = 'student-app/src/app/api/student/courses/[id]/chat/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix GET
content = content.replace(
  'let chat = await db.courseChat.findUnique({',
  'let chat = await db.courseChat.findFirst({'
);

content = content.replace(
  /include: \{\s*student: \{ select: \{ name: true, profileImage: true \} \}\s*\}/g,
  ''
).replace(
  /, \}/g,
  ' }'
);

content = content.replace(
  'chat = await db.courseChat.create({',
  'chat = await db.courseChat.create({'
).replace(
  /organizationId: student\.organizationId/g,
  ''
).replace(
  /courseId, /g,
  'courseId'
).replace(
  /include: \{ messages: \{ include: \{ student: true \} \} \}/g,
  'include: { messages: true }'
);

// Fix POST
content = content.replace(
  'let chat = await db.courseChat.findUnique({ where: { courseId } })',
  'let chat = await db.courseChat.findFirst({ where: { courseId } })'
);

content = content.replace(
  /studentId: student\?\.id/g,
  "authorId: student?.id || auth.id,\n        authorName: student?.name || auth.name || 'Student',\n        authorRole: 'student'"
);

content = content.replace(
  /export async function GET\(req: NextRequest, \{ params \}: \{ params: \{ id: string \} \}\)/g,
  "export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> })"
).replace(
  /export async function POST\(req: NextRequest, \{ params \}: \{ params: \{ id: string \} \}\)/g,
  "export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> })"
).replace(
  /const courseId = params\.id/g,
  "const { id: courseId } = await params"
);


fs.writeFileSync(file, content);
