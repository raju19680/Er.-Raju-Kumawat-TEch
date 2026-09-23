import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const testId = req.nextUrl.searchParams.get('testId')

    const where: any = { studentId: student.id }
    if (testId) where.testId = testId

    const attempts = await db.testAttempt.findMany({
      where,
      select: {
        id: true,
        testId: true,
        score: true,
        totalMarks: true,
        rank: true,
        percentile: true,
        timeTaken: true,
        status: true,
        isPractice: true,
        startedAt: true,
        completedAt: true,
        test: {
          select: {
            id: true,
            title: true,
            totalDuration: true,
            numberOfQuestions: true,
            testSeries: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json({ success: true, attempts })
  } catch (error) {
    console.error('Student test-attempts list error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { testId, isPractice } = await req.json()

    if (!testId) {
      return NextResponse.json({ success: false, message: 'Test ID is required' }, { status: 400 })
    }

    // Check test exists and is live
    const test = await db.test.findFirst({
      where: { id: testId, organizationId: auth.orgId },
      select: {
        id: true,
        title: true,
        isLive: true,
        isLocked: true,
        maxAttempts: true,
        totalMarks: true,
        startDate: true,
        endDate: true,
      },
    })

    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 })
    }

    if (!test.isLive) {
      return NextResponse.json({ success: false, message: 'Test is not live yet' }, { status: 400 })
    }

    if (test.isLocked) {
      return NextResponse.json({ success: false, message: 'Test is locked' }, { status: 400 })
    }

    const now = new Date()
    if (test.startDate && now < test.startDate) {
      return NextResponse.json({ success: false, message: 'Test has not started yet' }, { status: 400 })
    }
    if (test.endDate && now > test.endDate) {
      return NextResponse.json({ success: false, message: 'Test has ended' }, { status: 400 })
    }

    // Check for existing in-progress attempt
    const inProgress = await db.testAttempt.findFirst({
      where: { studentId: student.id, testId, status: 'in_progress' },
    })

    if (inProgress) {
      return NextResponse.json({
        success: true,
        attempt: inProgress,
        message: 'Resuming existing attempt',
      })
    }

    // Check max attempts (only for ranked attempts, not practice)
    const completedAttempts = await db.testAttempt.count({
      where: { studentId: student.id, testId, status: 'completed', isPractice: false },
    })

    if (!isPractice && test.maxAttempts > 0 && completedAttempts >= test.maxAttempts) {
      return NextResponse.json({
        success: false,
        message: `Maximum ranked attempts (${test.maxAttempts}) reached for this test. You can still take it as practice.`,
      }, { status: 400 })
    }

    // Create new attempt
    const attempt = await db.testAttempt.create({
      data: {
        studentId: student.id,
        testId,
        totalMarks: test.totalMarks,
        status: 'in_progress',
        isPractice: isPractice === true,
        answers: '{}',
      },
    })

    return NextResponse.json({ success: true, attempt })
  } catch (error) {
    console.error('Student test-attempts create error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
