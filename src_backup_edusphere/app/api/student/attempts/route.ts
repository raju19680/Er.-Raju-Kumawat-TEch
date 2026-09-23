import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST - Submit a test attempt
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { testId, answers, timeTaken } = body

    if (!testId || !answers) {
      return NextResponse.json(
        { error: 'Test ID and answers are required' },
        { status: 400 }
      )
    }

    const test = await db.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Calculate score
    let score = 0
    let totalMarks = 0
    test.questions.forEach((q) => {
      totalMarks += q.marks
      if (answers[q.id] === q.correctAnswer) {
        score += q.marks
      }
    })

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
    const passed = percentage >= test.passingMarks

    const attempt = await db.testAttempt.create({
      data: {
        userId: session.id,
        testId,
        answers: JSON.stringify(answers),
        score,
        totalMarks,
        percentage,
        passed,
        timeTaken: timeTaken || 0,
      },
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    console.error('Submit attempt error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List student's test attempts
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempts = await db.testAttempt.findMany({
      where: { userId: session.id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            passingMarks: true,
            testSeries: {
              select: { id: true, title: true, teacher: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { attemptedAt: 'desc' },
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('Get attempts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
