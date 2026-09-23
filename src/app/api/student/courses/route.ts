import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const orgId = auth.orgId
    const searchParams = req.nextUrl.searchParams
    const parentId = searchParams.get('parentId')

    const whereConditions: Record<string, unknown>[] = [
      { organizationId: orgId },
      { status: 'published' }
    ]

    if (parentId !== null && parentId !== undefined) {
      whereConditions.push({ parentId: parentId === 'null' ? null : parentId })
    } else {
      whereConditions.push({ parentId: null })
    }

    // 1. Fetch student's purchased courses
    const purchasedCourses = await db.purchasedCourse.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true, isFree: true, videoDuration: true }
                }
              }
            },
            _count: { select: { children: true } }
          }
        },
      },
      orderBy: { purchasedAt: 'desc' },
    })

    const purchasedCourseIds = new Set(purchasedCourses.map((pc) => pc.courseId))

    // 2. Fetch published courses for the organization matching parentId
    const allCourses = await db.course.findMany({
      where: { AND: whereConditions },
      include: {
        modules: {
          include: {
            lessons: {
              select: { id: true, isFree: true, videoDuration: true }
            }
          }
        },
        _count: {
          select: {
            purchasedBy: true,
            children: true,
          }
        }
      },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // Format purchased courses
    const formattedPurchased = purchasedCourses.map((pc) => {
      const course = pc.course || {} as any
      const modules = course.modules || []
      const allLessons = modules.flatMap((m: any) => m.lessons || [])
      const totalDuration = allLessons.reduce((sum: number, l: any) => sum + (l.videoDuration || 0), 0)
      return {
        id: pc.id,
        courseId: course.id,
        purchasedAt: pc.purchasedAt,
        expiresAt: pc.expiresAt,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          language: course.language,
          level: course.level,
          price: course.price,
          mrp: course.mrp,
          status: course.status,
          totalLessons: allLessons.length,
          totalModules: modules.length,
          totalDuration,
        },
      }
    })

    // Format explore courses
    const formattedExplore = allCourses.map((c) => {
      const allLessons = c.modules.flatMap(m => m.lessons)
      const totalDuration = allLessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        demoVideo: c.demoVideo,
        price: c.price,
        mrp: c.mrp,
        category: c.category,
        language: c.language,
        level: c.level,
        featured: c.featured,
        status: c.status,
        totalLessons: allLessons.length,
        totalModules: c.modules.length,
        totalDuration,
        parentId: c.parentId,
        subCourseCount: c._count.children,
        enrolledCount: c._count.purchasedBy,
        isPurchased: purchasedCourseIds.has(c.id),
      }
    })

    return NextResponse.json({
      success: true,
      courses: formattedPurchased,
      allCourses: formattedExplore,
      enrolledCount: formattedPurchased.length,
      totalAvailable: formattedExplore.length,
      currentParentId: parentId || null,
    })
  } catch (error) {
    console.error('Student courses list error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

