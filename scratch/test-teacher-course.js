const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// We need to simulate the getAuthUser. NextAuth uses NEXTAUTH_SECRET.
// Let's just create a mock request object for getAuthUser.
// Wait, `getAuthUser` decodes the NextAuth token or standard JWT.

async function run() {
  const orgId = 'cmsep4dt400039ml0c82daaup';
  const email = 'kumawatrajulal96@gmail.com';
  
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("Teacher user:", user.id, user.role);

  // Let's see what a course fetch from teacher API looks like via Prisma.
  // The route does:
  const course = await prisma.course.findFirst({
    where: { organizationId: orgId },
    include: {
      _count: { select: { purchasedBy: true } },
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: { 
            orderBy: { sortOrder: 'asc' },
            include: { translations: true }
          },
        },
      },
    },
  });

  console.log("Course:", course?.id, course?.title);
  if (course) {
    const { _count, modules, ...courseData } = course;
    console.log("Modules count:", modules.length);
    for (const m of modules) {
      console.log(`Module: ${m.title}, Lessons count: ${m.lessons.length}`);
      if (m.lessons.length > 0) {
        console.log("First lesson:", m.lessons[0].title);
      }
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
