import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, orgCode, itemType, itemId, couponCode } = body

    // Validate required fields
    if (amount === undefined || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { success: false, message: 'Valid amount is required (minimum ₹0)' },
        { status: 400 }
      )
    }

    if (!orgCode || typeof orgCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Organization code is required' },
        { status: 400 }
      )
    }

    // Find the organization
    const org = await db.organization.findUnique({
      where: { code: orgCode },
    })

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Invalid organization code' },
        { status: 404 }
      )
    }

    // ── Razorpay configuration ──
    const razorpayKeyId = (org as any).razorpayKeyId || process.env.RAZORPAY_KEY_ID || ''
    const razorpayKeySecret = (org as any).razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || ''
    const hasRazorpayKeys = !!(razorpayKeyId && razorpayKeySecret)
    let razorpayKey = razorpayKeyId
    let orderId = ''

    // ── Coupon validation ──
    let discountAmount = 0
    let validatedCouponCode: string | null = null

    if (couponCode && typeof couponCode === 'string') {
      const coupon = await db.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase().trim(),
          organizationId: org.id,
        },
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        const isValidDate = (!coupon.validFrom || new Date(coupon.validFrom) <= now) &&
                           (!coupon.validTo || new Date(coupon.validTo) >= now)
        const isValidUsage = !coupon.maxUses || coupon.usedCount < coupon.maxUses
        const isProductValid = !coupon.applicableProductIds || coupon.applicableProductIds.length === 0 || coupon.applicableProductIds.includes(itemId)

        if (isValidDate && isValidUsage && isProductValid) {
          if (coupon.discountType === 'percentage') {
            discountAmount = parseFloat((amount * (coupon.discount / 100)).toFixed(2))
          } else {
            discountAmount = Math.min(coupon.discount, amount)
          }
          validatedCouponCode = coupon.code
        }
      }
    }

    // ── Calculate final amount ──
    const finalAmount = parseFloat(Math.max(amount - discountAmount, 0).toFixed(2))

    // ── Calculate payment split on final amount ──
    const gatewayCharge = parseFloat((finalAmount * (org.gatewayCharge / 100)).toFixed(2))
    const netAfterGateway = parseFloat((finalAmount - gatewayCharge).toFixed(2))
    const adminCommission = parseFloat((netAfterGateway * (org.adminCommission / 100)).toFixed(2))
    const teacherAmount = parseFloat((netAfterGateway - adminCommission).toFixed(2))

    const split = {
      totalAmount: amount,
      discountAmount,
      finalAmount,
      gatewayCharge,
      adminCommission,
      teacherAmount,
    }

    // Amount in paise for Razorpay
    const amountInPaise = Math.round(finalAmount * 100)

    if (finalAmount > 0) {
      if (hasRazorpayKeys) {
        // Create real Razorpay order
        const rzpAuth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')

        const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${rzpAuth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: Object.fromEntries(Object.entries({

              orgCode,
              itemType: itemType || 'general',
              itemId: itemId || '',
              discountAmount: discountAmount.toString(),
              finalAmount: finalAmount.toString(),
              adminCommission: adminCommission.toString(),
              teacherAmount: teacherAmount.toString(),
              gatewayCharge: gatewayCharge.toString(),
              couponCode: validatedCouponCode || undefined,
            
}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)),
          }),
        })

        if (!razorpayResponse.ok) {
          const errorData = await razorpayResponse.json()
          console.error('Razorpay order creation failed:', errorData)
          return NextResponse.json(
            { success: false, message: 'Failed to create Razorpay order', error: errorData },
            { status: 500 }
          )
        }

        const razorpayOrder = await razorpayResponse.json()
        orderId = razorpayOrder.id
      } else {
        // Demo/mock order when Razorpay is not configured
        orderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        razorpayKey = 'rzp_test_demo_key'
      }
    } else {
      orderId = `free_enroll_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    }

    // Build items JSON for the order
    const itemsData = JSON.stringify([
      {
        itemType: itemType || 'general',
        itemId: itemId || '',
        amount,
        discountAmount,
        finalAmount,
      },
    ])

    // Find or create a student record for this user
    let student = await db.student.findFirst({
      where: {
        email: auth.email,
        organizationId: org.id,
      },
    })

    if (!student) {
      // Auto-create student record
      student = await db.student.create({
        data: {
          name: auth.name || 'Student',
          email: auth.email,
          organizationId: org.id,
          userId: auth.id,
        },
      })
    }

    // Store the order in the database
    const order = await db.order.create({
      data: {
        studentId: student.id,
        items: itemsData,
        totalAmount: amount,
        discountAmount,
        finalAmount,
        status: 'pending',
        couponCode: validatedCouponCode,
        razorpayOrderId: orderId,
        organizationId: org.id,
      },
    })

    // Store the payment record with split details
    await db.payment.create({
      data: {
        orderId: order.id,
        amount: finalAmount,
        gatewayCharge,
        adminCommission,
        teacherAmount,
        method: finalAmount === 0 ? 'free' : 'razorpay',
        status: finalAmount === 0 ? 'success' : 'pending',
        transactionId: orderId, // Store Razorpay order ID as transaction reference
        organizationId: org.id,
      },
    })

    // If buying a course, we'll create PurchasedCourse after payment verification
    // (in the verify route). But we track it here in the order items.
    
    // Auto-enroll if free
    if (finalAmount === 0) {
      if (itemType === 'course' && itemId) {
        await db.purchasedCourse.create({
          data: { studentId: student.id, courseId: itemId, organizationId: org.id }
        })
      }
      if (itemType === 'test_series' && itemId) {
        await db.purchasedTestSeries.create({
          data: { studentId: student.id, testSeriesId: itemId, organizationId: org.id }
        })
      }
      if (itemType === 'digital_product' && itemId) {
        const digitalProduct = await db.digitalProduct.findUnique({
          where: { id: itemId },
          select: { file: true },
        })
        await db.purchasedDigitalProduct.create({
          data: {
            studentId: student.id,
            digitalProductId: itemId,
            orderItemId: order.id,
            accessUrl: digitalProduct?.file || null,
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        amount: amountInPaise,
        currency: 'INR',
        key: razorpayKey,
        dbOrderId: order.id,
        isDemo: !hasRazorpayKeys && finalAmount > 0,
        isFree: finalAmount === 0,
        split,
        couponCode: validatedCouponCode,
        discountAmount,
        finalAmount,
      },
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
