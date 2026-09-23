export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversation = await db.whatsAppConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'WhatsApp conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: conversation })
  } catch (error) {
    console.error('Failed to fetch WhatsApp conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp conversation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'whatsapp')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.whatsAppConversation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp conversation not found' },
        { status: 404 }
      )
    }

    const conversation = await db.whatsAppConversation.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.tags !== undefined && { tags: body.tags || null }),
        ...(body.unreadCount !== undefined && { unreadCount: body.unreadCount }),
        ...(body.lastMessage !== undefined && { lastMessage: body.lastMessage }),
        ...(body.lastMessageAt !== undefined && { lastMessageAt: body.lastMessageAt ? new Date(body.lastMessageAt) : null }),
      },
    })

    return NextResponse.json({ success: true, item: conversation })
  } catch (error) {
    console.error('Failed to update WhatsApp conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update WhatsApp conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'whatsapp')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.whatsAppConversation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp conversation not found' },
        { status: 404 }
      )
    }

    // Delete messages first (cascade), then conversation
    await db.whatsAppMessage.deleteMany({
      where: { conversationId: id },
    })

    await db.whatsAppConversation.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete WhatsApp conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete WhatsApp conversation' },
      { status: 500 }
    )
  }
}

