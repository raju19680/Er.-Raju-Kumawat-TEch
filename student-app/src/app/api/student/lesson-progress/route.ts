import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

// POST — mark a lesson as completed / in_progress
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { lessonId, courseId, status } = body

    if (!lessonId || !courseId) {
      return NextResponse.json({ success: false, message: 'lessonId and courseId are required' }, { status: 400 })
    }

    // Verify the lesson belongs to the course
    const lesson = await db.courseLesson.findFirst({
      where: { id: lessonId },
      select: { id: true, moduleId: true },
    })
    if (!lesson) {
      return NextResponse.json({ success: false, message: 'Lesson not found' }, { status: 404 })
    }

    const courseModule = await db.courseModule.findFirst({
      where: { id: lesson.moduleId, courseId },
    })
    if (!courseModule) {
      return NextResponse.json({ success: false, message: 'Lesson does not belong to this course' }, { status: 400 })
    }

    // Verify student purchased this course
    const purchase = await db.purchasedCourse.findFirst({
      where: { studentId: student?.id || 'admin-bypass', courseId },
    })
    if (!purchase) {
      return NextResponse.json({ success: false, message: 'You have not purchased this course' }, { status: 403 })
    }

    const newStatus = status || 'completed'

    // Upsert progress
    const progress = await db.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId: student?.id || 'admin-bypass', lessonId },
      },
      create: {
        studentId: student?.id || 'admin-bypass',
        lessonId,
        courseId,
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null,
      },
      update: {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : undefined,
      },
    })

    // Recalculate course progress
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

    return NextResponse.json({
      success: true,
      progress,
      courseStats: {
        totalLessons: allLessons.length,
        completedLessons: completedCount,
        progressPercent: allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('Lesson progress error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
