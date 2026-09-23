import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    // Get courses the student is enrolled in
    const enrollments = await db.purchasedCourse.findMany({
      where: {
        studentId: student.id
      },
      select: { courseId: true }
    })
    
    const courseIds = enrollments.map(e => e.courseId)

    const classes = await db.liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: { not: 'ended' }
      },
      include: {
        course: {
          select: { title: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })

    return NextResponse.json({ success: true, data: classes })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
