const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    where: { organizationId: 'cmsep4dt400039ml0c82daaup' },
    include: {
      modules: {
        include: { lessons: true }
      }
    }
  });
  console.log('Course ID:', course?.id);
  console.log('Modules length:', course?.modules?.length);
  if (course?.modules?.length) {
    console.log('Lessons in module 0:', course.modules[0].lessons.length);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
