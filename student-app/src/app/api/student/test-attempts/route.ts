import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    if (!['student', 'teacher', 'platform_admin'].includes(auth.role)) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    let studentId = student?.id || null;
    if (!studentId && auth.role !== 'student') {
      try {
        const newStudent = await db.student.create({
          data: {
            userId: auth.id,
            name: 'Admin Preview',
            phone: '0000000000'
          }
        });
        studentId = newStudent.id;
      } catch (e) {
        console.error('Failed to create dummy student for admin:', e);
      }
    }

    const testId = req.nextUrl.searchParams.get('testId')

    const where: any = { studentId: studentId }
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
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    if (!['student', 'teacher', 'platform_admin'].includes(auth.role)) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { testId } = await req.json()

    if (!testId) {
      return NextResponse.json({ success: false, message: 'Test ID is required' }, { status: 400 })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    let studentId = student?.id || null;
    if (!studentId && auth.role !== 'student') {
      try {
        const newStudent = await db.student.create({
          data: {
            userId: auth.id,
            name: 'Admin Preview',
            phone: '0000000000'
          }
        });
        studentId = newStudent.id;
      } catch (e) {
        console.error('Failed to create dummy student for admin:', e);
      }
    }

    // Check test exists and is live
    const test = await db.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        isLive: true,
        isLocked: true,
        maxAttempts: true,
        allowAttempt: true,
        totalMarks: true,
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

    if (!test.allowAttempt) {
      return NextResponse.json({ success: false, message: 'Attempts are disabled for this test' }, { status: 400 })
    }

    // Check for existing in-progress attempt
    const inProgress = await db.testAttempt.findFirst({
      where: { studentId: studentId, testId, status: 'in_progress' },
    })

    if (inProgress) {
      return NextResponse.json({
        success: true,
        attempt: inProgress,
        message: 'Resuming existing attempt',
      })
    }

    // Check max attempts
    const completedAttempts = await db.testAttempt.count({
      where: { studentId: studentId, testId, status: 'completed' },
    })

    if (test.maxAttempts !== -1 && completedAttempts >= test.maxAttempts) {
      return NextResponse.json({
        success: false,
        message: `Maximum attempts (${test.maxAttempts}) reached for this test`,
      }, { status: 400 })
    }

    // Create new attempt
    const attempt = await db.testAttempt.create({
      data: {
        studentId: studentId,
        testId,
        totalMarks: test.totalMarks,
        status: 'in_progress',
        answers: '{}',
      },
    })

    return NextResponse.json({ success: true, attempt })
  } catch (error) {
    console.error('Student test-attempts create error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

