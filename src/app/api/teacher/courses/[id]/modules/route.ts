export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * Helper: verify that a course belongs to the caller's org (or caller is platform_admin).
 * Returns the course if accessible, otherwise null.
 */
async function getOwnedCourse(courseId: string, request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return null
  return db.course.findFirst({
    where: {
      id: courseId,
      ...(auth.role !== 'platform_admin' && auth.orgId ? { organizationId: auth.orgId } : {}),
    },
    select: { id: true, organizationId: true },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    // Cross-tenant guard
    const owned = await getOwnedCourse(id, request)
    if (!owned) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const modules = await db.courseModule.findMany({
      where: { courseId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { lessons: true } },
      },
    })
    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Failed to fetch modules:', error)
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    // Cross-tenant guard
    const owned = await getOwnedCourse(id, request)
    if (!owned) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: 'Module title is required' }, { status: 400 })
    }

    // Get current max sortOrder
    const maxSort = await db.courseModule.findFirst({
      where: { courseId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const courseModule = await db.courseModule.create({
      data: {
        title: String(body.title).trim(),
        description: body.description || null,
        sortOrder: body.sortOrder ?? (maxSort?.sortOrder ?? -1) + 1,
        courseId: id,
      },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { lessons: true } },
      },
    })

    return NextResponse.json({ success: true, module: courseModule }, { status: 201 })
  } catch (error) {
    console.error('Failed to create module:', error)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
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

    const { id: courseId } = await params
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Cross-tenant guard: verify the module belongs to a course the caller owns
    const existing = await db.courseModule.findFirst({
      where: {
        id: body.id,
        course: {
          id: courseId,
          ...(await (async () => {
            const auth = await getAuthUser(request)
            return auth?.role !== 'platform_admin' && auth?.orgId
              ? { organizationId: auth.orgId }
              : {}
          })()),
        },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder

    const courseModule = await db.courseModule.update({
      where: { id: body.id },
      data,
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { lessons: true } },
      },
    })

    return NextResponse.json({ success: true, module: courseModule })
  } catch (error) {
    console.error('Failed to update module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
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

    const { id: courseId } = await params
    const moduleId = request.nextUrl.searchParams.get('id')
    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Cross-tenant guard
    const auth = await getAuthUser(request)
    const existing = await db.courseModule.findFirst({
      where: {
        id: moduleId,
        course: {
          id: courseId,
          ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
        },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Cascade delete lessons first
    await db.courseLesson.deleteMany({ where: { moduleId } })
    await db.courseModule.delete({ where: { id: moduleId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}

