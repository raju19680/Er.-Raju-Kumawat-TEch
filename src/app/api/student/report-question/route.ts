import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { questionId, reason } = await req.json()

    if (!questionId || !reason) {
      return NextResponse.json({ success: false, message: 'Question ID and reason are required' }, { status: 400 })
    }

    // Verify question exists
    const question = await db.question.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 })
    }

    // Check if student already reported this question
    const existingReport = await db.reportedQuestion.findFirst({
      where: {
        questionId,
        studentId: student.id,
      },
    })

    if (existingReport) {
      return NextResponse.json({ success: false, message: 'You have already reported this question' }, { status: 400 })
    }

    const report = await db.reportedQuestion.create({
      data: {
        questionId,
        studentId: student.id,
        reason,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Question reported successfully. Our team will review it.',
      report,
    })
  } catch (err: any) {
    console.error('Report question error:', err)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
