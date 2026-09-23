export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversation = await db.chatConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: conversation })
  } catch (error) {
    console.error('Failed to fetch conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'chat_manager')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.chatConversation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    let orgId = existing.organizationId
    if (body.organizationId) {
      orgId = await resolveOrgId(request, body.organizationId)
    }

    const conversation = await db.chatConversation.update({
      where: { id },
      data: {
        ...(body.visitorName !== undefined && { visitorName: body.visitorName || null }),
        ...(body.visitorEmail !== undefined && { visitorEmail: body.visitorEmail || null }),
        ...(body.visitorPhone !== undefined && { visitorPhone: body.visitorPhone || null }),
        ...(body.subject !== undefined && { subject: body.subject || null }),
        ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo || null }),
        ...(body.assignedName !== undefined && { assignedName: body.assignedName || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.tags !== undefined && { tags: body.tags || null }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.organizationId && { organizationId: orgId }),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, item: conversation })
  } catch (error) {
    console.error('Failed to update conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'chat_manager')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.chatConversation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    await db.chatConversation.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}

