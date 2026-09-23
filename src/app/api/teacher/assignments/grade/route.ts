export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { submissionId, marksObtained, feedback } = await req.json()

    if (!submissionId) {
      return NextResponse.json({ success: false, message: 'Submission ID is required' }, { status: 400 })
    }

    const submission = await db.assignmentSubmission.update({
      where: {
        id: submissionId
      },
      data: {
        marksObtained,
        feedback,
        status: 'graded',
        gradedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Teacher grading POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

