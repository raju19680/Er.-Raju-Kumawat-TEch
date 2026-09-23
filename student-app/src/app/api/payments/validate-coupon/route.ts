import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orgCode, productId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Coupon code is required' },
        { status: 400 }
      )
    }

    if (!orgCode || typeof orgCode !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Organization code is required' },
        { status: 400 }
      )
    }

    // Find the organization
    const org = await db.organization.findUnique({
      where: { code: orgCode },
      select: { id: true },
    })

    if (!org) {
      return NextResponse.json(
        { valid: false, message: 'Invalid organization code' },
        { status: 404 }
      )
    }

    // Find the coupon
    const coupon = await db.coupon.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        organizationId: org.id,
      },
    })

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid coupon code',
      })
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        message: 'This coupon is no longer active',
      })
    }

    // Check date range
    const now = new Date()
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({
        valid: false,
        message: 'This coupon is not yet active',
      })
    }

    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return NextResponse.json({
        valid: false,
        message: 'This coupon has expired',
      })
    }

    // Check usage count
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({
        valid: false,
        message: 'This coupon has reached its maximum usage limit',
      })
    }

        // Check applicable products
    if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      if (!productId || !coupon.applicableProductIds.includes(productId)) {
        return NextResponse.json({
          valid: false,
          message: 'This coupon is not valid for this product',
        })
      }
    }
    return NextResponse.json({
      valid: true,
      discount: coupon.discount,
      discountType: coupon.discountType,
      message: `Coupon applied! ${coupon.discountType === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} off`}`,
    })
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
