import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { assignmentId } = await params
    
    if (!assignmentId) {
      return NextResponse.json({ success: false, message: 'Assignment ID is required' }, { status: 400 })
    }

    const submission = await db.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id
        }
      }
    })

    return NextResponse.json({
      success: true,
      submission
    })
  } catch (error) {
    console.error('Student assignment submission GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
