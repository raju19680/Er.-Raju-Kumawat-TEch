
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    // Find the student record
    const student = await db.student.findFirst({
      where: {
        userId: auth.id,
      },
      include: {
        purchasedCourses: true
      }
    })

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student record not found' }, { status: 404 })
    }

    // Get accessible course IDs
    let accessibleCourseIds = student.purchasedCourses.map((pc: any) => pc.courseId)
    
    // If filtering by specific course
    if (courseId) {
      if (!accessibleCourseIds.includes(courseId)) {
        return NextResponse.json({ success: false, message: 'You do not have access to this course' }, { status: 403 })
      }
      accessibleCourseIds = [courseId]
    }

    // Fetch assignments for accessible courses
    const assignments = await db.assignment.findMany({
      where: {
        courseId: { in: accessibleCourseIds },
      },
      include: {
        course: { select: { title: true } },
        submissions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    console.error('Student assignments GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { assignmentId, content, fileUrl } = body

    if (!assignmentId) {
      return NextResponse.json({ success: false, message: 'Assignment ID is required' }, { status: 400 })
    }

    if (!content && !fileUrl) {
      return NextResponse.json({ success: false, message: 'Submission content or file is required' }, { status: 400 })
    }

    // Find the student
    const student = await db.student.findFirst({
      where: { userId: auth.id }
    })

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student record not found' }, { status: 404 })
    }

    // Check if assignment exists and student has access
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 })
    }

    const hasAccess = await db.purchasedCourse.findFirst({
      where: {
        studentId: student.id,
        courseId: assignment.courseId
      }
    })

    if (!hasAccess) {
      return NextResponse.json({ success: false, message: 'You do not have access to this course' }, { status: 403 })
    }

    // Upsert submission
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
      data: submission,
      message: 'Assignment submitted successfully'
    })
  } catch (error) {
    console.error('Student assignments POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
