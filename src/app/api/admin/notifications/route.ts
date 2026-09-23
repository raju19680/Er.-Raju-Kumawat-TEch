export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

const VALID_TARGET_ROLES = ['all', 'teacher', 'student', 'platform_admin']
const VALID_TYPES = ['info', 'warning', 'success', 'error']

/**
 * POST /api/admin/notifications
 *
 * Create a notification as the platform admin.
 * - If organizationId is provided: create one notification for that org.
 * - If organizationId is NOT provided: broadcast to ALL organizations.
 * - Auto-sets senderRole to 'platform_admin' and senderName from the user DB.
 */
export async function POST(request: NextRequest) {
  try {
    // Require platform_admin role
    const authResult = await requirePlatformAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const adminUser = authResult.user

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Validate type
    const type = body.type || 'info'
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate targetRole
    const targetRole = body.targetRole || 'all'
    if (!VALID_TARGET_ROLES.includes(targetRole)) {
      return NextResponse.json(
        { error: `Invalid targetRole. Must be one of: ${VALID_TARGET_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the admin's name from the user DB for senderName
    const dbUser = await db.user.findUnique({
      where: { id: adminUser.id },
      select: { name: true },
    })
    const senderName = dbUser?.name || adminUser.name || 'Platform Admin'

    const sharedData = {
      title: body.title,
      message: body.message,
      type,
      targetRole,
      senderId: adminUser.id,
      senderRole: 'platform_admin' as const,
      senderName,
    }

    let createdCount = 0

    if (body.organizationId) {
      // Send to a specific organization
      // Resolve orgCode to orgId if needed
      let orgId = body.organizationId
      if (orgId.length < 20) {
        const org = await db.organization.findUnique({
          where: { code: orgId },
          select: { id: true },
        })
        orgId = org?.id || orgId
      }

      await db.notification.create({
        data: {
          ...sharedData,
          organizationId: orgId,
        },
      })
      createdCount = 1

      // Emit via WebSocket notification service
      try {
        await fetch(`http://localhost:3003/emit?XTransformPort=3003`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'notification:new',
            orgId,
            payload: { ...sharedData, organizationId: orgId },
          }),
        })
      } catch {
        // Silently fail if notification service is not running
      }
    } else {
      // Broadcast to ALL organizations
      const allOrgs = await db.organization.findMany({
        select: { id: true },
      })

      if (allOrgs.length === 0) {
        return NextResponse.json(
          { error: 'No organizations found to broadcast to' },
          { status: 400 }
        )
      }

      const notifications = await db.notification.createMany({
        data: allOrgs.map((org) => ({
          ...sharedData,
          organizationId: org.id,
        })),
      })
      createdCount = notifications.count

      // Emit via WebSocket for each org
      for (const org of allOrgs) {
        try {
          await fetch(`http://localhost:3003/emit?XTransformPort=3003`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'notification:new',
              orgId: org.id,
              payload: { ...sharedData, organizationId: org.id },
            }),
          })
        } catch {
          // Silently fail if notification service is not running
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      message: `Notification created for ${createdCount} organization(s)`,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create admin notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/notifications
 *
 * List all notifications across all organizations (admin view).
 * Supports pagination, type filter, and search.
 */
export async function GET(request: NextRequest) {
  try {
    // Require platform_admin role
    const authResult = await requirePlatformAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { message: { contains: search,  } },
        { senderName: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      db.notification.count({ where }),
    ])

    // Flatten organization name into each item for convenience
    const enrichedItems = items.map((item) => ({
      ...item,
      organizationName: item.organization?.name || null,
      organizationCode: item.organization?.code || null,
    }))

    return NextResponse.json({
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch admin notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
