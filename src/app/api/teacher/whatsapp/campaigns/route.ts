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
        { title: { contains: search,  } },
        { message: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.whatsAppCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.whatsAppCampaign.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch WhatsApp campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp campaigns' },
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

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    const campaign = await db.whatsAppCampaign.create({
      data: {
        title: body.title,
        message: body.message,
        templateName: body.templateName || null,
        targetAudience: body.targetAudience || 'all',
        targetFilter: body.targetFilter || null,
        status: body.status || 'draft',
        totalRecipients: body.totalRecipients || 0,
        deliveredCount: body.deliveredCount || 0,
        readCount: body.readCount || 0,
        repliedCount: body.repliedCount || 0,
        failedCount: body.failedCount || 0,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: campaign }, { status: 201 })
  } catch (error) {
    console.error('Failed to create WhatsApp campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create WhatsApp campaign' },
      { status: 500 }
    )
  }
}

