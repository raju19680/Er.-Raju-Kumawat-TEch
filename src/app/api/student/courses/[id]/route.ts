import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req)
    
    // We allow unauthenticated access for viewing course details (syllabus etc)
    // but we will only return purchase info and progress if logged in as student/teacher
    if (auth) {
      const normalizedRole = String(auth.role).toLowerCase()
      const isStudent = normalizedRole === 'student'
      const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
      if (!isStudent && !isTeacher) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
      }
    }

    const { id } = await params

    let student = null
    if (auth) {
      student = await db.student.findFirst({
        where: { userId: auth.id },
      })
    }

    // Check if student purchased this course
    let purchase = null
    if (student) {
      purchase = await db.purchasedCourse.findFirst({
        where: { studentId: student.id, courseId: id },
      })
    }

    // Get course with modules and lessons
    const course = await db.course.findFirst({
      where: auth ? { id, organizationId: auth.orgId } : { id },
      include: {
        modules: {
          include: {
            lessons: {
              include: { translations: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 })
    }

    // Sanitize locked content if course is not purchased
    if (!purchase) {
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          if (!lesson.isFree) {
            lesson.videoUrl = null
            lesson.fileUrl = null
            lesson.content = null
          }
        }
      }
    }

    // Get lesson progress for this student in this course
    let progress: any[] = []
    if (student) {
      progress = await db.lessonProgress.findMany({
        where: { studentId: student.id, courseId: id },
        select: {
          lessonId: true,
          status: true,
          completedAt: true,
          lastPosition: true,
        },
      })
    }

    // Build progress map
    const progressMap: Record<string, { status: string; completedAt: string | null; lastPosition: string | null }> = {}
    for (const p of progress) {
      progressMap[p.lessonId] = { 
        status: p.status, 
        completedAt: p.completedAt?.toISOString() || null,
        lastPosition: p.lastPosition
      }
    }

    // Calculate stats
    const allLessons = course.modules.flatMap(m => m.lessons)
    const totalLessons = allLessons.length
    const completedLessons = allLessons.filter(l => progressMap[l.id]?.status === 'completed').length
    const totalDuration = allLessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0)

    return NextResponse.json({
      success: true,
      course,
      purchase: purchase ? {
        id: purchase.id,
        purchasedAt: purchase.purchasedAt,
        expiresAt: purchase.expiresAt,
      } : null,
      progress: progressMap,
      stats: {
        totalLessons,
        completedLessons,
        totalDuration,
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('Student course detail error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
