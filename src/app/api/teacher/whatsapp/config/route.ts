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
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search,  } },
        { displayName: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.whatsAppConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.whatsAppConfig.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch WhatsApp configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp configs' },
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

    if (!body.phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    const config = await db.whatsAppConfig.create({
      data: {
        phoneNumber: body.phoneNumber,
        displayName: body.displayName || null,
        apiKey: body.apiKey || null,
        webhookUrl: body.webhookUrl || null,
        isDefault: body.isDefault || false,
        status: body.status || 'disconnected',
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: config }, { status: 201 })
  } catch (error) {
    console.error('Failed to create WhatsApp config:', error)
    return NextResponse.json(
      { error: 'Failed to create WhatsApp config' },
      { status: 500 }
    )
  }
}

