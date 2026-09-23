import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

// POST - Submit a test attempt
export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Unauthorized' }, { status: status || 401 })
    }

    const body = await req.json()
    const { testId, answers, timeTaken } = body

    if (!testId || !answers) {
      return NextResponse.json(
        { success: false, message: 'Test ID and answers are required' },
        { status: 400 }
      )
    }

    const test = await db.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    })

    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 })
    }

    // Calculate score
    let score = 0
    let totalMarks = 0
    test.questions.forEach((q: any) => {
      const positiveMarks = q.positiveMarks ?? q.marks ?? 1
      totalMarks += positiveMarks
      const correct = q.correctOption ?? q.correctAnswer
      if (answers[q.id] === correct) {
        score += positiveMarks
      }
    })

    const attempt = await db.testAttempt.create({
      data: {
        studentId: student?.id || 'admin-bypass',
        testId,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
        score,
        totalMarks,
        status: 'completed',
        completedAt: new Date(),
        timeTaken: timeTaken || 0,
      },
    })

    return NextResponse.json({ success: true, attempt }, { status: 201 })
  } catch (error) {
    console.error('Submit attempt error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// GET - List student's test attempts
export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Unauthorized' }, { status: status || 401 })
    }

    const attempts = await db.testAttempt.findMany({
      where: { studentId: student?.id || 'admin-bypass' },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            testSeries: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json({ success: true, attempts })
  } catch (error) {
    console.error('Get attempts error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
