import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
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

    const student = await db.student.findFirst({ where: { userId: auth.id } })
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }

    const { courseId } = await params

    // Verify purchase
    const purchase = await db.purchasedCourse.findFirst({
      where: { studentId: student?.id || 'admin-bypass', courseId },
      include: {
        course: true,
      }
    })

    if (!purchase) {
      return NextResponse.json({ success: false, message: 'Course not purchased' }, { status: 403 })
    }

    // Check completion progress
    const allLessons = await db.courseLesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    })

    const completedCount = await db.lessonProgress.count({
      where: {
        studentId: student?.id || 'admin-bypass',
        courseId,
        status: 'completed',
      },
    })

    const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0

    if (progressPercent < 100) {
      return NextResponse.json({ success: false, message: 'Course not fully completed yet.' }, { status: 400 })
    }

    // Check if certificate already exists
    let certificate = await db.certificate.findFirst({
      where: {
        studentId: student?.id || 'admin-bypass',
        courseId,
      }
    })

    if (!certificate) {
      // Create new certificate
      certificate = await db.certificate.create({
        data: {
          studentId: student?.id || 'admin-bypass',
          courseId,
          organizationId: purchase.course.organizationId,
        }
      })
    }

    return NextResponse.json({
      success: true,
      certificate
    })
  } catch (error) {
    console.error('Fetch certificate error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
