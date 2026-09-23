const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const orgs = await prisma.organization.findMany();
  console.log("Organizations:");
  console.table(orgs.map(o => ({ id: o.id, name: o.name, code: o.code })));

  const teachers = await prisma.user.findMany({ where: { role: 'teacher' } });
  console.log("\nTeachers:");
  console.table(teachers.map(t => ({ id: t.id, name: t.name, email: t.email, orgId: t.organizationId })));
  
  const courses = await prisma.course.findMany({ select: { id: true, title: true, organizationId: true } });
  console.log("\nCourses:");
  console.table(courses);
}

run().catch(console.error).finally(() => prisma.$disconnect());
