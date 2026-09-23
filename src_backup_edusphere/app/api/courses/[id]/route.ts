import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Get course details with lessons (for enrolled students or preview)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    const course = await db.course.findFirst({
      where: { id, isPublished: true },
      include: {
        teacher: {
          select: { id: true, name: true, username: true, avatar: true, bio: true, organisationId: true },
        },
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check enrollment
    let enrollment = null
    let isEnrolled = false
    let progress = 0
    let completedLessons: string[] = []

    if (session && session.role === 'STUDENT') {
      enrollment = await db.enrollment.findUnique({
        where: { userId_courseId: { userId: session.id, courseId: id } },
      })
      isEnrolled = !!enrollment
      if (enrollment) {
        progress = enrollment.progress
        completedLessons = JSON.parse(enrollment.completedLessons)
      }
    }

    // Filter lessons: enrolled students see all, non-enrolled see only previews
    const visibleLessons = isEnrolled
      ? course.lessons
      : course.lessons.map((l) => ({
          ...l,
          content: l.isPreview ? l.content : '[Enroll to access this lesson]',
          videoUrl: l.isPreview ? l.videoUrl : null,
        }))

    return NextResponse.json({
      course: {
        ...course,
        lessons: visibleLessons,
      },
      isEnrolled,
      progress,
      completedLessons,
    })
  } catch (error) {
    console.error('Get course detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
