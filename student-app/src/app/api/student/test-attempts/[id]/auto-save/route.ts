import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const normalizedRole = String(auth.role).toLowerCase()
    const isStudent = normalizedRole === 'student'
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || 'admin-bypass'

    const { id } = await params
    const body = await req.json()
    const { answers, timeTaken, markedForReview, timePerQuestion } = body

    const attempt = await db.testAttempt.findUnique({
      where: { id },
      select: { studentId: true, status: true },
    })

    if (!attempt) {
      return NextResponse.json({ success: false, message: 'Attempt not found' }, { status: 404 })
    }
    if (attempt.studentId !== studentId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }
    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ success: false, message: 'Test already submitted' }, { status: 400 })
    }

    const answersPayload = {
      answers: answers || {},
      markedForReview: markedForReview || [],
      timePerQuestion: timePerQuestion || {},
    }

    await db.testAttempt.update({
      where: { id },
      data: {
        answers: JSON.stringify(answersPayload),
        timeTaken: timeTaken !== undefined ? timeTaken : undefined,
      },
    })

    return NextResponse.json({ success: true, message: 'Progress saved' })
  } catch (error) {
    console.error('Auto-save test attempt error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
