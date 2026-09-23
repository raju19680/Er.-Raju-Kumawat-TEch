import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PUT - Update lesson progress (mark lesson as complete)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, lessonId } = body

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'Course ID and lesson ID are required' },
        { status: 400 }
      )
    }

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.id, courseId } },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    const completedLessons: string[] = JSON.parse(enrollment.completedLessons)
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    }

    const totalLessons = await db.lesson.count({ where: { courseId } })
    const progress = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0

    const updated = await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        completedLessons: JSON.stringify(completedLessons),
        progress,
      },
    })

    return NextResponse.json({ enrollment: updated })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
