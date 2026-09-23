const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const lessons = await prisma.courseLesson.findMany({
    where: { module: { course: { organizationId: 'cmsep4dt400039ml0c82daaup' } } }
  });
  console.log(lessons.map(l => ({ title: l.title, videoUrl: l.videoUrl })));
}
run().catch(console.error).finally(() => prisma.$disconnect());
