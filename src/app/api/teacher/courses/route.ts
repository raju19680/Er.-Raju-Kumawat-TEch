export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// resolveOrgId imported from demo-org

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const statusFilter = searchParams.get('status') || ''
    const categoryFilter = searchParams.get('category') || ''
    const sortBy = searchParams.get('sortBy') || ''
    const sort = searchParams.get('sort') || 'desc'
    const parentId = searchParams.get('parentId')
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, searchParams.get('organizationId') || undefined)

    const whereConditions: Record<string, unknown>[] = [{ organizationId: orgId }]
    if (statusFilter) whereConditions.push({ status: statusFilter })
    if (categoryFilter) whereConditions.push({ category: categoryFilter })
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ],
      })
    }

    if (search) {
      // Ignore parentId filter when searching
    } else if (parentId !== null) {
      whereConditions.push({ parentId: parentId === 'null' ? null : parentId })
    } else {
      whereConditions.push({ parentId: null }) // Default to root level
    }

    const where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions }

    const [items, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy === 'sortOrder' ? { sortOrder: sort === 'asc' ? 'asc' : 'desc' } : { createdAt: 'desc' },
        include: {
          _count: { select: { purchasedBy: true } },
          modules: {
            select: {
              id: true,
              title: true,
              sortOrder: true,
              _count: { select: { lessons: true } },
              lessons: { select: { videoDuration: true }, take: 1000 },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      db.course.count({ where }),
    ])

    // Compute total lesson count and total duration per course
    const formatted = items.map((item) => {
      const { _count, modules, ...rest } = item
      const totalLessons = modules.reduce((sum: number, m: { _count: { lessons: number } }) => sum + m._count.lessons, 0)
      const totalDuration = modules.reduce(
        (sum: number, m: { lessons: { videoDuration: number }[] }) =>
          sum + m.lessons.reduce((s: number, l: { videoDuration: number }) => s + (l.videoDuration || 0), 0),
        0
      )
      return {
        ...rest,
        purchaseCount: _count.purchasedBy,
        moduleCount: modules.length,
        totalLessons,
        totalDuration,
        modules: modules.map(m => ({ id: m.id, title: m.title, sortOrder: m.sortOrder, _count: m._count })),
      }
    })

    // Stats
    const allCourses = await db.course.findMany({
      where: { organizationId: orgId },
      select: { status: true, featured: true },
    })
    const stats = {
      total: allCourses.length,
      published: allCourses.filter((c) => c.status?.toLowerCase() === 'published').length,
      draft: allCourses.filter((c) => c.status?.toLowerCase() === 'draft').length,
      featured: allCourses.filter((c) => c.featured).length,
    }

    return NextResponse.json({ items: formatted, total, stats })
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const course = await db.course.create({
      data: {
        title: body.title,
        description: body.description || null,
        content: body.content || null,
        thumbnail: body.thumbnail || null,
        price: typeof body.price === 'string' ? parseFloat(body.price) || 0 : (body.price ?? 0),
        mrp: typeof body.mrp === 'string' ? parseFloat(body.mrp) || 0 : (body.mrp ?? 0),
        category: body.category || null,
        language: body.language || 'Hindi',
        level: body.level || 'All',
        featured: body.featured ?? false,
        status: body.status || 'draft',
        organizationId: orgId,
        demoVideo: body.demoVideo || null,
        validityType: body.validityType || 'lifetime',
        validityMonths: (() => {
          if (body.validityMonths === null || body.validityMonths === undefined || body.validityMonths === '') return null
          const monthsVal = typeof body.validityMonths === 'string' ? parseInt(body.validityMonths) : body.validityMonths
          return isNaN(monthsVal) ? null : monthsVal
        })(),
        validityEndDate: body.validityEndDate ? new Date(body.validityEndDate) : null,
        discountCode: body.discountCode || null,
        sortOrder: typeof body.sortOrder === 'string' ? parseInt(body.sortOrder) || 0 : (body.sortOrder ?? 0),
        parentId: body.parentId || null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        richSnippets: body.richSnippets ?? false,
      },
      include: {
        _count: { select: { purchasedBy: true } },
        modules: { select: { id: true, title: true, sortOrder: true, _count: { select: { lessons: true } } } },
      },
    })

    const { _count, modules, ...courseData } = course
    return NextResponse.json({
      success: true,
      course: {
        ...courseData,
        purchaseCount: _count.purchasedBy,
        moduleCount: modules.length,
        totalLessons: modules.reduce((sum: number, m: { _count: { lessons: number } }) => sum + m._count.lessons, 0),
        totalDuration: 0,
        modules,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const existing = await db.course.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.content !== undefined) data.content = body.content
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
    if (body.price !== undefined) data.price = body.price
    if (body.mrp !== undefined) data.mrp = body.mrp
    if (body.category !== undefined) data.category = body.category
    if (body.language !== undefined) data.language = body.language
    if (body.level !== undefined) data.level = body.level
    if (body.featured !== undefined) data.featured = body.featured
    if (body.status !== undefined) data.status = body.status
    if (body.demoVideo !== undefined) data.demoVideo = body.demoVideo
    if (body.validityType !== undefined) data.validityType = body.validityType
    if (body.validityMonths !== undefined) data.validityMonths = body.validityMonths
    if (body.validityEndDate !== undefined) data.validityEndDate = body.validityEndDate ? new Date(body.validityEndDate) : null
    if (body.discountCode !== undefined) data.discountCode = body.discountCode
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
    if (body.parentId !== undefined) data.parentId = body.parentId || null
    if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle
    if (body.seoDescription !== undefined) data.seoDescription = body.seoDescription
    if (body.richSnippets !== undefined) data.richSnippets = body.richSnippets

    const course = await db.course.update({
      where: { id: body.id },
      data,
      include: {
        _count: { select: { purchasedBy: true } },
        modules: { select: { id: true, title: true, sortOrder: true, _count: { select: { lessons: true } } } },
      },
    })

    const { _count, modules, ...courseData } = course
    return NextResponse.json({
      success: true,
      course: {
        ...courseData,
        purchaseCount: _count.purchasedBy,
        moduleCount: modules.length,
        totalLessons: modules.reduce((sum: number, m: { _count: { lessons: number } }) => sum + m._count.lessons, 0),
        totalDuration: 0,
        modules,
      },
    })
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Delete associated records (cascade should handle modules/lessons)
    await db.purchasedCourse.deleteMany({ where: { courseId: id } })
    await db.course.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}

