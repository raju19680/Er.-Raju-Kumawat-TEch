const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function main() {
  const tests = await db.test.findMany({
    select: { id: true, title: true, showSolution: true }
  })
  console.log('Tests with showSolution:')
  for (const t of tests) {
    if (!t.showSolution) console.log(t.id, t.title, 'showSolution = false')
  }

  const questions = await db.question.findMany({
    where: {
      solutionText: { not: null }
    },
    select: { id: true, title: true, solutionText: true, solutionHeading: true, solutionImage1: true }
  })
  
  console.log('Questions with solutionText count:', questions.length)
  if (questions.length > 0) {
    console.log('Sample question with solution:', questions[questions.length-1])
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
