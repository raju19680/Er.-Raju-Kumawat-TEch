const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { email: { in: ['admin@edusphere.com', 'vikram@kumawatstudy.com', 'rajulal1995@gmail.com', 'rajulalkumawat1995@gmail.com'] } } });
  console.log(users.map(u => ({ email: u.email, role: "'" + u.role + "'" })));
}
main().finally(() => prisma.$disconnect());
