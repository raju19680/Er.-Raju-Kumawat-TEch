const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const orgId = 'cmsep4dt400039ml0c82daaup';
  
  const courses = await prisma.course.findMany({ 
    where: { organizationId: orgId },
    include: {
      modules: {
        include: {
          lessons: true
        }
      }
    }
  });
  
  console.log(`\n--- COURSES for ${orgId} ---`);
  for (const course of courses) {
    console.log(`Course: ${course.title} (Modules: ${course.modules.length})`);
    for (const module of course.modules) {
      console.log(`  Module: ${module.title} (Lessons: ${module.lessons.length})`);
      for (const lesson of module.lessons) {
        console.log(`    Lesson: ${lesson.title} [${lesson.type}]`);
      }
    }
  }

  const testSeries = await prisma.testSeries.findMany({
    where: { organizationId: orgId },
    include: {
      tests: true
    }
  });

  console.log(`\n--- TEST SERIES for ${orgId} ---`);
  for (const ts of testSeries) {
    console.log(`Test Series: ${ts.title} (Tests: ${ts.tests.length})`);
    for (const test of ts.tests) {
      console.log(`  Test: ${test.title}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
