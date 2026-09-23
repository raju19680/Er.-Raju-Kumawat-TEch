import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { id: questionId } = await params
    const { reason } = await req.json()

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ success: false, message: 'Reason is required' }, { status: 400 })
    }

    await db.reportedQuestion.create({
      data: {
        studentId: student.id,
        questionId: questionId,
        reason: reason,
      }
    })

    return NextResponse.json({ success: true, message: 'Question reported successfully' })

  } catch (error) {
    console.error('Report question error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
