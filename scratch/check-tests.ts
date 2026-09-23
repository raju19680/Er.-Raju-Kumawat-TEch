import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'igsybegun@gmail.com' },
    include: { students: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));

  const tests = await prisma.test.findMany({ take: 2 });
  console.log('Tests:', JSON.stringify(tests, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
