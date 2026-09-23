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
    const isActive = searchParams.get('isActive') || ''
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { code: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.coupon.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'marketing')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (body.discount === undefined || body.discount === null) {
      return NextResponse.json(
        { error: 'Discount is required' },
        { status: 400 }
      )
    }

    if (!body.discountType || !['percentage', 'flat'].includes(body.discountType)) {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "flat"' },
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

    // Check for duplicate code within same org
    const existing = await db.coupon.findFirst({
      where: {
        code: body.code,
        organizationId: orgId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists in this organization' },
        { status: 409 }
      )
    }

    const coupon = await db.coupon.create({
      data: {
        code: body.code,
        discount: body.discount,
        discountType: body.discountType,
        minPurchaseAmount: body.minPurchaseAmount || null,
        applicableProductIds: body.applicableProductIds || [],
        maxUses: body.maxUses || null,
        usedCount: body.usedCount || 0,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validTo: body.validTo ? new Date(body.validTo) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: coupon }, { status: 201 })
  } catch (error) {
    console.error('Failed to create coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}
