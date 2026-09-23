import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Get test with questions (for students who purchased the test series)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await db.test.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { createdAt: 'asc' } },
        testSeries: {
          select: { id: true, title: true, price: true, teacherId: true },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if student purchased the test series (or it's free)
    let hasAccess = test.testSeries.price === 0
    if (!hasAccess) {
      const purchase = await db.testSeriesPurchase.findUnique({
        where: { userId_testSeriesId: { userId: session.id, testSeriesId: test.testSeries.id } },
      })
      hasAccess = !!purchase
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You need to purchase this test series to access the test' },
        { status: 403 }
      )
    }

    // Get previous attempts
    const attempts = await db.testAttempt.findMany({
      where: { userId: session.id, testId: id },
      orderBy: { attemptedAt: 'desc' },
    })

    // For questions, don't send correct answers to client
    const safeQuestions = test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: JSON.parse(q.options),
      marks: q.marks,
    }))

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        testSeries: test.testSeries,
        questions: safeQuestions,
      },
      attempts,
    })
  } catch (error) {
    console.error('Get test detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
