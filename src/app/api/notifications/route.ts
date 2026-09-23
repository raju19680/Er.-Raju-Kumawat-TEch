import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'
import { resolveOrgId } from '@/lib/demo-org'

const VALID_TARGET_ROLES = ['all', 'teacher', 'student', 'platform_admin']

export async function GET(request: NextRequest) {
  try {
    // ── Auth check ──
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const isRead = searchParams.get('isRead') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const targetRole = searchParams.get('targetRole') || ''
    const senderRole = searchParams.get('senderRole') || ''
    const skip = (page - 1) * limit

    // Resolve orgCode to actual orgId
    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (type) {
      where.type = type
    }

    if (isRead !== '') {
      where.isRead = isRead === 'true'
    }

    if (targetRole) {
      where.OR = [
        { targetRole: 'all' },
        { targetRole },
      ]
    }

    if (senderRole) {
      where.senderRole = senderRole
    }

    const [items, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          organizationId: orgId || undefined,
          isRead: false,
          ...(targetRole ? {
            OR: [
              { targetRole: 'all' },
              { targetRole },
            ],
          } : {}),
        },
      }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request comes from a platform_admin
    const authUser = await getAuthUser(request)
    const isPlatformAdmin = authUser?.role === 'platform_admin'

    // Skip checkModuleAccess for platform_admin; enforce it for everyone else
    if (!isPlatformAdmin) {
      const accessCheck = await checkModuleAccess(request, 'notifications')
      if (!accessCheck.allowed) {
        return NextResponse.json(
          { success: false, message: accessCheck.error },
          { status: accessCheck.status }
        )
      }
    }

    const body = await request.json()

    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Validate targetRole if provided
    if (body.targetRole && !VALID_TARGET_ROLES.includes(body.targetRole)) {
      return NextResponse.json(
        { error: `Invalid targetRole. Must be one of: ${VALID_TARGET_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // organizationId is required unless the sender is a platform_admin
    if (!body.organizationId && !isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Resolve orgCode to orgId (if provided)
    const orgId = body.organizationId ? await resolveOrgId(request, body.organizationId) : null

    // Determine sender info: use provided fields or fall back to auth user
    const senderId = body.senderId || authUser?.id || null
    const senderRole = body.senderRole || authUser?.role || null
    const senderName = body.senderName || authUser?.name || null

    const notification = await db.notification.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type || 'info',
        targetRole: body.targetRole || 'all',
        organizationId: orgId || '',
        senderId,
        senderRole,
        senderName,
      },
    })

    // Also emit via WebSocket notification service
    try {
      await fetch(`http://localhost:3003/emit?XTransformPort=3003`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'notification:new',
          orgId: orgId || '',
          payload: notification,
        }),
      })
    } catch {
      // Silently fail if notification service is not running
    }

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ── Auth check ──
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Mark as read: single or multiple
    if (body.notificationIds && Array.isArray(body.notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: body.notificationIds },
        },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Notifications marked as read' })
    }

    // Mark all as read for an org
    if (body.markAllRead && body.organizationId) {
      // Resolve orgCode to orgId
      const orgId = await resolveOrgId(request, body.organizationId)
      await db.notification.updateMany({
        where: {
          organizationId: orgId,
          isRead: false,
        },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide notificationIds or markAllRead with organizationId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to update notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
