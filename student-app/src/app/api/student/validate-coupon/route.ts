import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, courseId, testSeriesId, offeringId } = body

    if (!code?.trim()) {
      return NextResponse.json({ success: false, valid: false, message: 'Coupon code is required' }, { status: 400 })
    }

    // Find the coupon (case-insensitive)
    const coupon = await db.coupon.findFirst({
      where: {
        code: { equals: code.trim().toUpperCase() },
        isActive: true,
      },
    })

    if (!coupon) {
      return NextResponse.json({ success: true, valid: false, message: 'Invalid or expired coupon code' })
    }

    const now = new Date()

    // Check date validity
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({ success: true, valid: false, message: 'This coupon is not yet active' })
    }
    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return NextResponse.json({ success: true, valid: false, message: 'This coupon has expired' })
    }

    // Check usage limit
    if (coupon.maxUses && coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ success: true, valid: false, message: 'This coupon has reached its usage limit' })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      discount: coupon.discount,
      discountType: coupon.discountType,
      code: coupon.code,
      message: coupon.discountType === 'percentage'
        ? `Coupon applied! ${coupon.discount}% off`
        : `Coupon applied! ₹${coupon.discount} off`,
    })
  } catch (error) {
    console.error('Coupon validate error:', error)
    return NextResponse.json({ success: false, valid: false, message: 'Failed to validate coupon' }, { status: 500 })
  }
}
