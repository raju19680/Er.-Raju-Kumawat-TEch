import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

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
    if (attempt.studentId !== student.id) {
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
