const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.user.findFirst({
    where: { email: 'kumawatrajulal96@gmail.com' }
  });
  console.log(t);
}
main().catch(console.error).finally(() => prisma.$disconnect());
