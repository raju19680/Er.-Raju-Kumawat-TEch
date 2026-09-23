export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * POST /api/teacher/courses/[id]/modules/lessons/reorder
 * Body: { items: [{ id: string, sortOrder: number, moduleId?: string }] }
 * Reorders lessons in bulk. Optionally moves lessons to a different module.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const auth = await getAuthUser(request)
    const { id: courseId } = await params
    const body = await request.json()

    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }

    // Cross-tenant guard: verify course belongs to caller
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
      },
      select: { id: true },
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Bulk update sortOrder (and optionally moduleId) for each lesson in a transaction
    await db.$transaction(
      body.items.map((item: { id: string; sortOrder: number; moduleId?: string }) => {
        const data: { sortOrder: number; moduleId?: string } = { sortOrder: item.sortOrder }
        if (item.moduleId) data.moduleId = item.moduleId
        return db.courseLesson.update({
          where: { id: item.id },
          data,
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder lessons:', error)
    return NextResponse.json({ error: 'Failed to reorder lessons' }, { status: 500 })
  }
}

