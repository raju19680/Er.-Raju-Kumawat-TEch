import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || null;

    // Check if student purchased this course (Teachers and Admins bypass)
    let isPurchased = false
    let purchase: any = null
    if (auth.role === 'teacher' || auth.role === 'platform_admin') {
      isPurchased = true
    } else {
      purchase = await db.purchasedCourse.findFirst({
        where: { studentId: studentId || 'admin-bypass', courseId: id },
      })
      isPurchased = !!purchase
    }

    // Get course with modules and lessons
    const course = await db.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        content: true,
        language: true,
        level: true,
        status: true,
        price: true,
        mrp: true,
        featured: true,
        validityType: true,
        validityMonths: true,
        validityEndDate: true,
        modules: {
          select: {
            id: true,
            title: true,
            description: true,
            sortOrder: true,
            lessons: {
              select: {
                id: true,
                title: true,
                type: true,
                content: true,
                videoUrl: true,
                videoDuration: true,
                fileUrl: true,
                notes: true,
                isFree: true,
                isOptional: true,
                allowPdfDownload: true,
                sortOrder: true,
              },
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

    // Strip premium content if not purchased
    if (!isPurchased) {
      course.modules.forEach(mod => {
        mod.lessons.forEach(lesson => {
          if (!lesson.isFree) {
            lesson.content = null
            lesson.videoUrl = null
            lesson.fileUrl = null
            lesson.notes = null
          }
        })
      })
    }

    // Get lesson progress for this student in this course
    const progress = await db.lessonProgress.findMany({
      where: { studentId: studentId || 'admin-bypass', courseId: id },
      select: {
        lessonId: true,
        status: true,
        completedAt: true,
      },
    })

    // Build progress map
    const progressMap: Record<string, { status: string; completedAt: string | null }> = {}
    for (const p of progress) {
      progressMap[p.lessonId] = { status: p.status, completedAt: p.completedAt?.toISOString() || null }
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
