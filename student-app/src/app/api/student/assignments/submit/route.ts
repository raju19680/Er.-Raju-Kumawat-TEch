import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { assignmentId, content, fileUrl } = await req.json()

    if (!assignmentId) {
      return NextResponse.json({ success: false, message: 'Assignment/Lesson ID is required' }, { status: 400 })
    }

    // Check if assignmentId corresponds to an actual Assignment.
    // If not, it might be a lesson ID, so we lazy-create the Assignment record.
    let assignment = await db.assignment.findUnique({ where: { id: assignmentId } })
    
    if (!assignment) {
      const lesson = await db.courseLesson.findUnique({
        where: { id: assignmentId },
        include: { module: true }
      })
      if (!lesson) {
         return NextResponse.json({ success: false, message: 'Invalid assignment or lesson ID' }, { status: 404 })
      }
      
      // Lazily create the Assignment using the lesson's ID
      assignment = await db.assignment.create({
        data: {
          id: lesson.id,
          title: lesson.title,
          courseId: lesson.module.courseId,
          moduleId: lesson.moduleId,
          organizationId: auth.orgId || student.organizationId,
          totalMarks: 100
        }
      })
    }

    const submission = await db.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id
        }
      },
      update: {
        content,
        fileUrl,
        status: 'submitted',
        submittedAt: new Date()
      },
      create: {
        assignmentId,
        studentId: student.id,
        content,
        fileUrl,
        status: 'submitted'
      }
    })

    return NextResponse.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Student assignment submission POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
