const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const ts = await prisma.testSeries.findUnique({ where: { id: 'cm0s1zznt0013h7b5q30n680j' } })
  console.log(ts ? "IT IS A TEST SERIES" : "NOT A TEST SERIES")
}
run()
