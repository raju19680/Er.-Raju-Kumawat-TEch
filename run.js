const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const t = await prisma.test.findUnique({ where: { id: 'cm0s1zznt0013h7b5q30n680j' } })
  console.log(t)
}
run()
