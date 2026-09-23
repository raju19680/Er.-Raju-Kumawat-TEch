export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const auth = await getAuthUser(request)
    const { id } = await params
    const course = await db.course.findUnique({
      where: { id },
      include: {
        _count: { select: { purchasedBy: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: { 
              orderBy: { sortOrder: 'asc' },
              include: { translations: true }
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Cross-tenant guard: platform_admin can access any org; teachers only their own
    if (auth?.role !== 'platform_admin' && auth?.orgId && course.organizationId !== auth.orgId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { _count, modules, ...courseData } = course
    const totalLessons = modules.reduce(
      (sum: number, m: { lessons: unknown[] }) => sum + m.lessons.length, 0
    )
    const totalDuration = modules.reduce(
      (sum: number, m: { lessons: { videoDuration: number }[] }) =>
        sum + m.lessons.reduce((s: number, l: { videoDuration: number }) => s + (l.videoDuration || 0), 0), 0
    )

    return NextResponse.json({
      ...courseData,
      purchaseCount: _count.purchasedBy,
      moduleCount: modules.length,
      totalLessons,
      totalDuration,
      modules,
    })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const auth = await getAuthUser(request)
    const { id } = await params
    const body = await request.json()

    // Cross-tenant guard: findUnique with org filter so teachers can only update their own courses
    const existing = await db.course.findFirst({
      where: {
        id,
        ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.content !== undefined) data.content = body.content
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
    if (body.demoVideo !== undefined) data.demoVideo = body.demoVideo
    if (body.price !== undefined) data.price = typeof body.price === 'string' ? parseFloat(body.price) || 0 : body.price
    if (body.mrp !== undefined) data.mrp = typeof body.mrp === 'string' ? parseFloat(body.mrp) || 0 : body.mrp
    if (body.category !== undefined) data.category = body.category
    if (body.language !== undefined) data.language = body.language
    if (body.level !== undefined) data.level = body.level
    if (body.featured !== undefined) data.featured = body.featured
    if (body.status !== undefined) data.status = body.status
    if (body.validityType !== undefined) data.validityType = body.validityType
    if (body.validityMonths !== undefined) {
      const monthsVal = typeof body.validityMonths === 'string' ? parseInt(body.validityMonths) : body.validityMonths
      // Fix: 0 months should be null (lifetime), not silently converted via `|| null`
      data.validityMonths = (monthsVal === null || monthsVal === undefined || isNaN(monthsVal)) ? null : monthsVal
    }
    if (body.validityEndDate !== undefined) {
      data.validityEndDate = body.validityEndDate ? new Date(body.validityEndDate) : null
    }
    if (body.discountCode !== undefined) data.discountCode = body.discountCode
    if (body.sortOrder !== undefined) {
      data.sortOrder = typeof body.sortOrder === 'string' ? parseInt(body.sortOrder) || 0 : body.sortOrder
    }

    const course = await db.course.update({
      where: { id },
      data,
      include: {
        _count: { select: { purchasedBy: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    })

    const { _count, modules, ...courseData } = course
    return NextResponse.json({
      success: true,
      course: {
        ...courseData,
        purchaseCount: _count.purchasedBy,
        moduleCount: modules.length,
        totalLessons: modules.reduce((sum: number, m: { lessons: unknown[] }) => sum + m.lessons.length, 0),
        totalDuration: modules.reduce((sum: number, m: { lessons: { videoDuration: number }[] }) =>
          sum + m.lessons.reduce((s: number, l: { videoDuration: number }) => s + (l.videoDuration || 0), 0), 0),
        modules,
      },
    })
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const auth = await getAuthUser(request)
    const { id } = await params

    // Cross-tenant guard
    const existing = await db.course.findFirst({
      where: {
        id,
        ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
      },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Cleanup dependent records BEFORE deleting the course (avoid FK constraint errors)
    // Order matters: lessons → modules → lesson progress → purchases → course
    const moduleIds = (await db.courseModule.findMany({
      where: { courseId: id },
      select: { id: true },
    })).map(m => m.id)

    if (moduleIds.length > 0) {
      await db.courseLesson.deleteMany({ where: { moduleId: { in: moduleIds } } })
    }
    await db.courseModule.deleteMany({ where: { courseId: id } })
    await db.lessonProgress.deleteMany({ where: { courseId: id } })
    await db.purchasedCourse.deleteMany({ where: { courseId: id } })
    await db.course.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}

