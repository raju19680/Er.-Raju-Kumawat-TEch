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
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { contactName: { contains: search,  } },
        { contactPhone: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.whatsAppConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      db.whatsAppConversation.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch WhatsApp conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'whatsapp')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    // If conversationId is provided, add a message to an existing conversation
    if (body.conversationId) {
      if (!body.content) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 }
        )
      }

      const conversation = await db.whatsAppConversation.findUnique({
        where: { id: body.conversationId },
      })

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      const message = await db.whatsAppMessage.create({
        data: {
          conversationId: body.conversationId,
          content: body.content,
          type: body.type || 'text',
          sender: body.sender || 'agent',
          status: body.status || 'sent',
          templateName: body.templateName || null,
        },
      })

      // Update conversation's lastMessage and lastMessageAt
      await db.whatsAppConversation.update({
        where: { id: body.conversationId },
        data: {
          lastMessage: body.content,
          lastMessageAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, item: message }, { status: 201 })
    }

    // Otherwise, create a new conversation
    if (!body.contactName) {
      return NextResponse.json(
        { error: 'Contact name is required' },
        { status: 400 }
      )
    }

    if (!body.contactPhone) {
      return NextResponse.json(
        { error: 'Contact phone is required' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const conversation = await db.whatsAppConversation.create({
      data: {
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        lastMessage: body.lastMessage || null,
        lastMessageAt: body.lastMessageAt ? new Date(body.lastMessageAt) : null,
        unreadCount: body.unreadCount || 0,
        status: body.status || 'open',
        tags: body.tags || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: conversation }, { status: 201 })
  } catch (error) {
    console.error('Failed to create WhatsApp conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create WhatsApp conversation' },
      { status: 500 }
    )
  }
}

