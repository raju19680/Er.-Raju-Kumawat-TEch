const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.findUnique({where: {email: 'kumawatrajulal96@gmail.com'}});
  console.log(user);
}
run().catch(console.error).finally(() => prisma.$disconnect());
