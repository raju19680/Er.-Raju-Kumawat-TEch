export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDemoOrgId } from '@/lib/demo-org'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'coupons')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const orgId = await getDemoOrgId(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const activeOnly = searchParams.get('active') === 'true'

    const where: Record<string, unknown> = { organizationId: orgId }
    if (search) {
      where.code = { contains: search, mode: 'insensitive' }
    }
    if (activeOnly) {
      where.isActive = true
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      db.coupon.count({ where }),
    ])

    // Enrich with usage stats from orders
    const enriched = coupons.map((coupon) => ({
      ...coupon,
      isExpired: coupon.validTo ? new Date() > new Date(coupon.validTo) : false,
      isExhausted: coupon.maxUses ? coupon.usedCount >= coupon.maxUses : false,
    }))

    return NextResponse.json({ success: true, coupons: enriched, total })
  } catch (error) {
    console.error('Failed to fetch coupons:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'coupons')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const orgId = await getDemoOrgId(request)

    if (!body.code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }
    if (!body.discount || body.discount <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 })
    }

    // Check for duplicate code in same org
    const existing = await db.coupon.findFirst({
      where: { code: body.code.toUpperCase(), organizationId: orgId },
    })
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
    }

    const coupon = await db.coupon.create({
      data: {
        code: body.code.toUpperCase().trim(),
        discount: parseFloat(body.discount),
        discountType: body.discountType || 'percentage',
        maxUses: body.maxUses ? parseInt(body.maxUses) : null,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validTo: body.validTo ? new Date(body.validTo) : null,
        isActive: body.isActive ?? true,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, coupon }, { status: 201 })
  } catch (error) {
    console.error('Failed to create coupon:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'coupons')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        code: data.code?.toUpperCase().trim(),
        discount: data.discount ? parseFloat(data.discount) : undefined,
        discountType: data.discountType,
        maxUses: data.maxUses !== undefined ? (data.maxUses ? parseInt(data.maxUses) : null) : undefined,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ success: true, coupon })
  } catch (error) {
    console.error('Failed to update coupon:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'coupons')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    }

    await db.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Coupon deleted' })
  } catch (error) {
    console.error('Failed to delete coupon:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}

