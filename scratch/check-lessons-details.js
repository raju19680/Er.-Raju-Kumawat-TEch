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
  if (course && course.modules.length) {
    console.log(JSON.stringify(course.modules[0].lessons, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
