const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const testSeries = await prisma.testSeries.findFirst({
    where: { organizationId: 'cmsep4dt400039ml0c82daaup' }
  });
  
  if (testSeries) {
    console.log('Test Series ID:', testSeries.id);
    const tests = await prisma.test.findMany({
      where: { testSeriesId: testSeries.id }
    });
    console.log('Tests found:', tests.length);
    if(tests.length > 0) {
      console.log('Test sample:', tests[0]);
    }
  } else {
    console.log('No test series found for this org');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
