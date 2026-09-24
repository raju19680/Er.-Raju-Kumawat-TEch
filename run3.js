const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const t = await prisma.test.findMany({ take: 5, select: { id: true } })
  console.log(t)
}
run()
