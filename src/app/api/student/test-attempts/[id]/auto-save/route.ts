import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth()
    const student = user ? await db.student.findUnique({ where: { phone: user.phone } }) : null
    const studentId = student?.id || null

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Validate attempt exists and belongs to student
    const attempt = await db.testAttempt.findFirst({
      where: {
        id,
        studentId,
        status: 'in_progress',
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'In-progress attempt not found' },
        { status: 404 }
      )
    }

    // Update answers and timeTaken
    await db.testAttempt.update({
      where: { id },
      data: {
        answers: JSON.stringify({ answers: body.answers || {}, markedForReview: body.markedForReview || [] }),
        timeTaken: body.timeTaken || attempt.timeTaken,
      },
    })

    return NextResponse.json({ success: true, message: 'Auto-saved successfully' })
  } catch (error) {
    console.error('Auto-save error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}