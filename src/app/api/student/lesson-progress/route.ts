import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

// POST — mark a lesson as completed / in_progress
export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status: authStatus } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: authStatus || 401 })
    }

    const body = await req.json()
    const { lessonId, courseId, status: requestedStatus, lastPosition } = body

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
      where: { studentId: student.id, courseId },
    })
    if (!purchase) {
      return NextResponse.json({ success: false, message: 'You have not purchased this course' }, { status: 403 })
    }

    const newStatus = requestedStatus || 'in_progress'

    // Upsert progress
    const progress = await db.lessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId: student.id, lessonId },
      },
      create: {
        studentId: student.id,
        lessonId,
        courseId,
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null,
        lastPosition: lastPosition !== undefined ? String(lastPosition) : null,
      },
      update: {
        ...(requestedStatus ? { status: newStatus } : {}),
        ...(requestedStatus === 'completed' ? { completedAt: new Date() } : {}),
        ...(lastPosition !== undefined ? { lastPosition: String(lastPosition) } : {}),
      },
    })

    // Recalculate course progress
    const allLessons = await db.courseLesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    })
    const completedCount = await db.lessonProgress.count({
      where: {
        studentId: student.id,
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
