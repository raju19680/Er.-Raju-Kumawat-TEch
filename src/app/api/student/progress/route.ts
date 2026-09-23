import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

// PUT - Update lesson progress (mark lesson as complete)
export async function PUT(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const body = await req.json()
    const { courseId, lessonId } = body

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'Course ID and lesson ID are required' },
        { status: 400 }
      )
    }

    const enrollment = await db.purchasedCourse.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    const updated = await db.lessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: student.id,
          lessonId,
        }
      },
      update: {
        status: 'completed',
        completedAt: new Date(),
      },
      create: {
        studentId: student.id,
        lessonId,
        courseId,
        status: 'completed',
        completedAt: new Date(),
      }
    })

    // Compute progress
    const completedLessons = await db.lessonProgress.count({
      where: { studentId: student.id, courseId, status: 'completed' }
    })
    
    const totalLessons = await db.courseLesson.count({
      where: { module: { courseId } }
    })
    
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    return NextResponse.json({ progressData: updated, progress })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
