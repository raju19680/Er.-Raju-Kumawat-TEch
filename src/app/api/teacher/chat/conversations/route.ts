export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const organizationId = searchParams.get('organizationId') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { visitorName: { contains: search,  } },
        { visitorEmail: { contains: search,  } },
        { subject: { contains: search,  } },
        { assignedName: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.chatConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      db.chatConversation.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'chat_manager')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    // If conversationId is provided, add a message to existing conversation
    if (body.conversationId) {
      if (!body.content) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 }
        )
      }

      const existing = await db.chatConversation.findUnique({
        where: { id: body.conversationId },
      })
      if (!existing) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      const message = await db.chatMessage.create({
        data: {
          conversationId: body.conversationId,
          content: body.content,
          sender: body.sender || 'agent',
          senderName: body.senderName || null,
          type: body.type || 'text',
        },
      })

      return NextResponse.json({ success: true, item: message }, { status: 201 })
    }

    // Otherwise create a new conversation
    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const conversation = await db.chatConversation.create({
      data: {
        visitorName: body.visitorName || null,
        visitorEmail: body.visitorEmail || null,
        visitorPhone: body.visitorPhone || null,
        subject: body.subject || null,
        assignedTo: body.assignedTo || null,
        assignedName: body.assignedName || null,
        status: body.status || 'waiting',
        priority: body.priority || 'normal',
        tags: body.tags || null,
        organizationId: orgId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, item: conversation }, { status: 201 })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

