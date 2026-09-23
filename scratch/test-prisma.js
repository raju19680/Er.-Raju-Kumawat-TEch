const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const data = await prisma.testSeries.findFirst({
      include: {
        _count: {
          select: { tests: true }
        }
      }
    });
    console.log(data);
  } catch(e) {
    console.error(e)
  } finally {
    await prisma.$disconnect();
  }
}
main();
