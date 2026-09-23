import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check ──
    const accessCheck = await checkModuleAccess(request, 'notifications')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify notification exists
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Mark as read
    const notification = await db.notification.update({
      where: { id },
      data: {
        ...(body.isRead !== undefined && { isRead: body.isRead }),
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'notifications')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    // Verify notification exists
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await db.notification.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
