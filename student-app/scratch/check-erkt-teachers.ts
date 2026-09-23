import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.findUnique({
    where: { code: 'ERKTACADEMY' }
  });

  if (!org) {
    console.log("ERKTACADEMY not found");
    return;
  }

  const teachers = await prisma.user.findMany({
    where: { organizationId: org.id, role: 'teacher' },
    select: {
      id: true,
      name: true,
      email: true,
      organizationId: true
    }
  });

  console.log("Teachers in ERKTACADEMY:");
  console.table(teachers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
