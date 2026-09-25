import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student) {
      return NextResponse.json({ error }, { status })
    }

    const { id: testId } = await params
    const { answers, timeTaken, isTimeout, omrImageUrl } = await req.json()

    const test = await db.test.findUnique({
      where: { id: testId },
      include: { questions: true }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (test.organizationId !== student.organizationId) {
      return NextResponse.json({ error: 'Unauthorized access to this test' }, { status: 403 })
    }

    // Find active attempt
    let attempt = await db.testAttempt.findFirst({
      where: {
        studentId: student?.id || 'admin-bypass',
        testId: test.id,
        status: 'in_progress',
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'No active attempt found' }, { status: 400 })
    }

    // If the student uploaded a physical OMR sheet photo
    if (omrImageUrl) {
      attempt = await db.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'omr_pending',
          completedAt: new Date(),
          score: 0,
          totalMarks: test.totalMarks || 0,
          timeTaken: timeTaken || attempt.timeTaken,
          answers: JSON.stringify({ omrImageUrl, ...answers }),
          omrImageUrl: omrImageUrl,
        }
      })

      return NextResponse.json({
        success: true,
        isOmrPending: true,
        attempt,
        result: {
          score: 0,
          totalMarks: test.totalMarks,
          totalQuestions: test.questions.length,
          correctAnswers: 0,
          wrongAnswers: 0,
          status: 'omr_pending',
          omrImageUrl: attempt.omrImageUrl,
        }
      })
    }

    // Calculate score
    let score = 0
    let totalMarks = 0
    let correctAnswersCount = 0
    let wrongAnswersCount = 0
    const totalQuestions = test.questions.length

    for (const q of test.questions) {
      totalMarks += q.positiveMarks || 1
      
      const selectedOption = answers && answers[q.id]
      if (selectedOption) {
        if (selectedOption === q.correctOption) {
          score += q.positiveMarks || 1
          correctAnswersCount++
        } else {
          score -= q.negativeMarks || 0
          wrongAnswersCount++
        }
      }
    }

    // Update attempt
    attempt = await db.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        score,
        totalMarks,
        timeTaken: timeTaken || attempt.timeTaken,
        answers: JSON.stringify(answers || {}),
      }
    })

    return NextResponse.json({
      success: true,
      attempt,
      result: {
        score,
        totalMarks,
        totalQuestions,
        correctAnswers: correctAnswersCount,
        wrongAnswers: wrongAnswersCount,
      }
    })
  } catch (error) {
    console.error('[TEST_SUBMIT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
