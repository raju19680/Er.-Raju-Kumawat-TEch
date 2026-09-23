import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
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

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || null;

    // Get purchased courses with details
    let purchasedCourses: any[] = []
    
    if (isTeacher) {
      const whereClause: any = { organizationId: auth.orgId }
      // Teachers see all, students would only see published
      // but this block is only for teachers anyway
      const allOrgCourses = await db.course.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          category: true,
          status: true,
          price: true,
          mrp: true,
          level: true,
          language: true,
          modules: {
            select: {
              id: true,
              lessons: { select: { id: true, videoDuration: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      
      purchasedCourses = allOrgCourses.map(c => ({
        id: `mock-purchase-${c.id}`,
        purchasedAt: new Date(),
        expiresAt: null,
        course: c
      }))
    } else if (studentId) {
      purchasedCourses = await db.purchasedCourse.findMany({
        where: { studentId: studentId },
        select: {
          id: true,
          purchasedAt: true,
          expiresAt: true,
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              category: true,
              status: true,
              price: true,
              mrp: true,
              level: true,
              language: true,
              modules: {
                select: {
                  id: true,
                  lessons: {
                    select: { id: true, videoDuration: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      })
    }

    const formatted = purchasedCourses
      .filter((pc) => pc.course != null)
      .map((pc) => {
      const course = pc.course!
      const modules = course.modules || []
      const allLessons = modules.flatMap((m: any) => m.lessons || [])
      const totalDuration = allLessons.reduce((sum: number, l: any) => sum + (l.videoDuration || 0), 0)
      return {
        id: pc.id,
        purchasedAt: pc.purchasedAt,
        expiresAt: pc.expiresAt,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          status: course.status,
          price: course.price,
          mrp: course.mrp,
          level: course.level,
          language: course.language,
          totalLessons: allLessons.length,
          totalModules: modules.length,
          totalDuration,
        },
      }
    })

    const searchParams = req.nextUrl.searchParams
    const parentId = searchParams.get('parentId')

    const whereConditions: Record<string, unknown>[] = [
      { organizationId: auth.orgId },
      { status: 'published' }
    ]

    if (parentId !== null && parentId !== undefined) {
      whereConditions.push({ parentId: parentId === 'null' ? null : parentId })
    } else {
      whereConditions.push({ parentId: null })
    }

    // Get all published courses for the explore tab
    const allCourses = await db.course.findMany({
      where: { AND: whereConditions },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        price: true,
        mrp: true,
        status: true,
        featured: true,
        level: true,
        language: true,
        parentId: true,
        demoVideo: true,
        _count: {
          select: {
            children: true,
            purchasedBy: true,
          }
        }
      },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    const formattedAll = allCourses.map(c => ({
      ...c,
      subCourseCount: c._count.children,
      enrolledCount: c._count.purchasedBy,
    }))

    return NextResponse.json({ success: true, courses: formatted, allCourses: formattedAll, currentParentId: parentId || null })
  } catch (error) {
    console.error('Student courses list error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
