const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const qCount = await prisma.question.count();
    console.log('Total questions:', qCount);
    
    const rCount = await prisma.reportedQuestion.count();
    console.log('Total reported questions:', rCount);
    
    // Check if we can fetch reported questions with nested where
    const items = await prisma.reportedQuestion.findMany({
      where: {
        question: {
          test: {
            organizationId: 'fake-org'
          }
        }
      }
    });
    console.log('Test nested where works:', items.length);
  } catch (e) {
    console.error('Prisma Error:', e);
  }
}
main().finally(() => prisma.$disconnect());
