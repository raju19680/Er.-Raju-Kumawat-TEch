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

    const { id } = await params

    const test = await db.test.findUnique({
      where: { id: id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (test.organizationId !== student.organizationId) {
      return NextResponse.json({ error: 'Unauthorized access to this test' }, { status: 403 })
    }

    // Find or create attempt
    let attempt = await db.testAttempt.findFirst({
      where: {
        studentId: student?.id || 'admin-bypass',
        testId: test.id,
        status: 'in_progress',
      }
    })

    if (!attempt) {
      attempt = await db.testAttempt.create({
        data: {
          studentId: student?.id || 'admin-bypass',
          testId: test.id,
          status: 'in_progress',
          timeTaken: 0,
        }
      })
    }

    // Remove correctOption from questions for the client
    const safeQuestions = test.questions.map(q => {
      const { correctOption, ...rest } = q
      return rest
    })

    const { questions, ...testWithoutQuestions } = test

    return NextResponse.json({
      success: true,
      test: testWithoutQuestions,
      attempt,
      questions: safeQuestions,
    })
  } catch (error) {
    console.error('[TEST_START_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
