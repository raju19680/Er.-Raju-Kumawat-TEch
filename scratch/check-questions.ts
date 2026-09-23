import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const tests = await db.test.findMany({
    select: { id: true, title: true, showSolution: true }
  })
  console.log('Tests:', tests)

  const questions = await db.question.findMany({
    where: {
      solutionText: { not: null }
    },
    select: { id: true, title: true, solutionText: true }
  })
  
  console.log('Questions with solutionText count:', questions.length)
  if (questions.length > 0) {
    console.log('Sample question with solutionText:', questions[0])
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
