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
      totalMarks += q.positiveMarks
      if (answers[q.id] === q.correctOption) {
        score += q.positiveMarks
      }
    })

    const student = await db.student.findFirst({ where: { userId: session.id } })
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const attempt = await db.testAttempt.create({
      data: {
        studentId: student.id,
        testId,
        answers: JSON.stringify(answers),
        score,
        totalMarks,
        status: 'completed',
        completedAt: new Date(),
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

    const student = await db.student.findFirst({ where: { userId: session.id } })
    if (!student) {
      return NextResponse.json({ attempts: [] })
    }

    const attempts = await db.testAttempt.findMany({
      where: { studentId: student.id },
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

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('Get attempts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
