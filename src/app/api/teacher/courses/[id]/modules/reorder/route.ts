export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * POST /api/teacher/courses/[id]/modules/reorder
 * Body: { items: [{ id: string, sortOrder: number }] }
 * Reorders modules in bulk within a course.
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

    // Bulk update sortOrder for each module in a transaction
    await db.$transaction(
      body.items.map((item: { id: string; sortOrder: number }) =>
        db.courseModule.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder modules:', error)
    return NextResponse.json({ error: 'Failed to reorder modules' }, { status: 500 })
  }
}

