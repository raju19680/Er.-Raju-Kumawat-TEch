export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params

    // Verify test exists
    const test = await db.test.findUnique({ where: { id } })
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Re-evaluate all completed attempts for this test
    const attempts = await db.testAttempt.findMany({
      where: { testId: id, status: 'completed' },
    })

    let reevaluated = 0
    for (const attempt of attempts) {
      // Parse the answers JSON string
      let answersMap: Record<string, string> = {}
      if (attempt.answers) {
        try {
          answersMap = JSON.parse(attempt.answers)
        } catch {
          continue
        }
      }

      // Get all questions for this test
      const questions = await db.question.findMany({
        where: { testId: id },
      })

      let newScore = 0
      for (const question of questions) {
        const selectedOption = answersMap[question.id]
        if (selectedOption === question.correctOption) {
          newScore += question.positiveMarks
        } else if (selectedOption) {
          newScore -= question.negativeMarks
        }
      }
      newScore = Math.max(0, newScore)

      if (Math.abs(newScore - attempt.score) > 0.001) {
        await db.testAttempt.update({
          where: { id: attempt.id },
          data: { score: newScore },
        })
        reevaluated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Re-evaluation completed. ${reevaluated} attempt(s) updated out of ${attempts.length} total.`,
      totalAttempts: attempts.length,
      updatedAttempts: reevaluated,
    })
  } catch (error) {
    console.error('Failed to re-evaluate:', error)
    return NextResponse.json({ error: 'Failed to re-evaluate attempts' }, { status: 500 })
  }
}

