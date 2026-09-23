export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Scheduled Notifications API
 *
 * GET  — List all scheduled notifications with stats. Support ?status=xxx filter
 * POST — Create new scheduled notification
 * PUT  — Update notification (cancel, mark as sent, edit)
 * DELETE — Delete notification (only scheduled ones)
 */

// ── GET: List all scheduled notifications ──
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') || undefined

    const where = statusFilter && statusFilter !== 'all'
      ? { status: statusFilter }
      : {}

    const [notifications, scheduledCount, sentCount, cancelledCount, totalCount] = await Promise.all([
      db.scheduledNotification.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
      }),
      db.scheduledNotification.count({ where: { status: 'scheduled' } }),
      db.scheduledNotification.count({ where: { status: 'sent' } }),
      db.scheduledNotification.count({ where: { status: 'cancelled' } }),
      db.scheduledNotification.count(),
    ])

    // Fetch organization names for notifications that have an organizationId
    const orgIds = [...new Set(notifications.map(n => n.organizationId).filter(Boolean))] as string[]
    const orgMap = new Map<string, string>()

    if (orgIds.length > 0) {
      const orgs = await db.organization.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, name: true },
      })
      for (const org of orgs) {
        orgMap.set(org.id, org.name)
      }
    }

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      targetRole: n.targetRole,
      organizationId: n.organizationId,
      organizationName: n.organizationId ? (orgMap.get(n.organizationId) || 'Unknown') : null,
      scheduledAt: n.scheduledAt.toISOString(),
      sentAt: n.sentAt?.toISOString() ?? null,
      status: n.status,
      sentCount: n.sentCount,
      createdBy: n.createdBy,
      createdByName: n.createdByName,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      stats: {
        scheduled: scheduledCount,
        sent: sentCount,
        cancelled: cancelledCount,
        total: totalCount,
      },
    })
  } catch (error) {
    console.error('ScheduledNotifications GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new scheduled notification ──
export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { title, message, type, targetRole, organizationId, scheduledAt, createdBy, createdByName } = body

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title and message are required.' },
        { status: 400 }
      )
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { success: false, message: 'Scheduled date and time are required.' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid scheduled date.' },
        { status: 400 }
      )
    }

    const notification = await db.scheduledNotification.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        type: type || 'info',
        targetRole: targetRole || 'all',
        organizationId: organizationId || null,
        scheduledAt: scheduledDate,
        createdBy: createdBy || authResult.user.id,
        createdByName: createdByName || authResult.user.name,
      },
    })

    // Fetch organization name if applicable
    let organizationName: string | null = null
    if (notification.organizationId) {
      const org = await db.organization.findUnique({
        where: { id: notification.organizationId },
        select: { name: true },
      })
      organizationName = org?.name || null
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetRole: notification.targetRole,
        organizationId: notification.organizationId,
        organizationName,
        scheduledAt: notification.scheduledAt.toISOString(),
        sentAt: notification.sentAt?.toISOString() ?? null,
        status: notification.status,
        sentCount: notification.sentCount,
        createdBy: notification.createdBy,
        createdByName: notification.createdByName,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('ScheduledNotifications POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// ── PUT: Update a scheduled notification ──
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { id, status, title, message, scheduledAt, sentCount } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.scheduledNotification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Notification not found.' },
        { status: 404 }
      )
    }

    // Validate status transitions
    if (status) {
      const validStatuses = ['scheduled', 'sent', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status. Must be scheduled, sent, or cancelled.' },
          { status: 400 }
        )
      }
      // Can't modify sent notifications except to view them
      if (existing.status === 'sent' && status !== 'sent') {
        return NextResponse.json(
          { success: false, message: 'Cannot modify a notification that has already been sent.' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (title !== undefined) updateData.title = title.trim()
    if (message !== undefined) updateData.message = message.trim()
    if (scheduledAt !== undefined) {
      const date = new Date(scheduledAt)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { success: false, message: 'Invalid scheduled date.' },
          { status: 400 }
        )
      }
      updateData.scheduledAt = date
    }

    // When marking as sent, set sentAt and sentCount
    if (status === 'sent') {
      updateData.sentAt = new Date()
      if (sentCount !== undefined) updateData.sentCount = sentCount
    }

    const updated = await db.scheduledNotification.update({
      where: { id },
      data: updateData,
    })

    // Fetch organization name if applicable
    let organizationName: string | null = null
    if (updated.organizationId) {
      const org = await db.organization.findUnique({
        where: { id: updated.organizationId },
        select: { name: true },
      })
      organizationName = org?.name || null
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: updated.id,
        title: updated.title,
        message: updated.message,
        type: updated.type,
        targetRole: updated.targetRole,
        organizationId: updated.organizationId,
        organizationName,
        scheduledAt: updated.scheduledAt.toISOString(),
        sentAt: updated.sentAt?.toISOString() ?? null,
        status: updated.status,
        sentCount: updated.sentCount,
        createdBy: updated.createdBy,
        createdByName: updated.createdByName,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('ScheduledNotifications PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete a scheduled notification (only scheduled ones) ──
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.scheduledNotification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Notification not found.' },
        { status: 404 }
      )
    }

    // Only allow deleting scheduled notifications
    if (existing.status === 'sent') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete a notification that has already been sent.' },
        { status: 400 }
      )
    }

    await db.scheduledNotification.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Notification deleted.' })
  } catch (error) {
    console.error('ScheduledNotifications DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
