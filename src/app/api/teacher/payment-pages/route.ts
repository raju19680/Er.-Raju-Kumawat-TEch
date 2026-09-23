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
        { description: { contains: search,  } },
        { slug: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.paymentPage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.paymentPage.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch payment pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'payment_pages')
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

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const paymentPage = await db.paymentPage.create({
      data: {
        title: body.title,
        description: body.description || null,
        amount: body.amount ?? 0,
        currency: body.currency || 'INR',
        buttonLabel: body.buttonLabel || 'Pay Now',
        redirectUrl: body.redirectUrl || null,
        customFields: body.customFields || null,
        template: body.template || 'default',
        imageUrl: body.imageUrl || null,
        status: body.status || 'draft',
        slug: body.slug || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: paymentPage }, { status: 201 })
  } catch (error) {
    console.error('Failed to create payment page:', error)
    return NextResponse.json(
      { error: 'Failed to create payment page' },
      { status: 500 }
    )
  }
}

