import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { createHmac } from 'crypto'

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment verification fields' },
        { status: 400 }
      )
    }

    // Find the payment record by Razorpay order ID (stored in transactionId)
    const payment = await db.payment.findFirst({
      where: { transactionId: razorpay_order_id },
      include: { order: true },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Get the organization for Razorpay keys
    const org = await db.organization.findUnique({
      where: { id: payment.organizationId },
    })

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Verify the payment signature
    const keyId = org.razorpayKeyId || process.env.RAZORPAY_KEY_ID
    const keySecret = org.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET
    const hasRazorpayKeys = !!(keyId && keySecret)
    
    let isSignatureValid = false

    if (hasRazorpayKeys) {
      // Real Razorpay signature verification using HMAC SHA256
      const expectedSignature = createHmac('sha256', keySecret!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      isSignatureValid = expectedSignature === razorpay_signature
    } else {
      // Demo mode: accept any signature for demo orders
      if (razorpay_order_id.startsWith('order_demo_')) {
        isSignatureValid = true
      }
    }

    if (!isSignatureValid) {
      // Update payment status to failed
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })

      // Update order status to failed
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: 'failed' },
      })

      return NextResponse.json(
        { success: false, message: 'Payment verification failed - invalid signature' },
        { status: 400 }
      )
    }

    // Signature is valid — update payment and order status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        transactionId: razorpay_payment_id, // Update with actual payment ID
      },
    })

    await db.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
      },
    })

    // ── Create Student record if not exists ──
    let student = await db.student.findFirst({
      where: {
        email: auth.email,
        organizationId: org.id,
      },
    })

    if (!student) {
      student = await db.student.create({
        data: {
          name: auth.name || 'Student',
          email: auth.email,
          organizationId: org.id,
          userId: auth.id,
        },
      })
    }

    // ── Create purchase records for course and test series purchases ──
    try {
      const items = JSON.parse(payment.order.items)
      for (const item of items) {
        if (item.itemType === 'course' && item.itemId) {
          // Check if not already purchased
          const existing = await db.purchasedCourse.findUnique({
            where: {
              studentId_courseId: {
                studentId: student.id,
                courseId: item.itemId,
              },
            },
          })
          if (!existing) {
            await db.purchasedCourse.create({
              data: {
                studentId: student.id,
                courseId: item.itemId,
                organizationId: org.id,
              },
            })
          }
        }

        if (item.itemType === 'test_series' && item.itemId) {
          // Check if not already purchased
          const existing = await db.purchasedTestSeries.findUnique({
            where: {
              studentId_testSeriesId: {
                studentId: student.id,
                testSeriesId: item.itemId,
              },
            },
          })
          if (!existing) {
            await db.purchasedTestSeries.create({
              data: {
                studentId: student.id,
                testSeriesId: item.itemId,
                organizationId: org.id,
              },
            })
          }
        }

        if (item.itemType === 'digital_product' && item.itemId) {
          // Check if not already purchased
          const existing = await db.purchasedDigitalProduct.findUnique({
            where: {
              studentId_digitalProductId: {
                studentId: student.id,
                digitalProductId: item.itemId,
              },
            },
          })
          if (!existing) {
            // Get the digital product to access the file URL
            const digitalProduct = await db.digitalProduct.findUnique({
              where: { id: item.itemId },
              select: { file: true },
            })
            await db.purchasedDigitalProduct.create({
              data: {
                studentId: student.id,
                digitalProductId: item.itemId,
                orderItemId: payment.orderId,
                accessUrl: digitalProduct?.file || null,
              },
            })
          }
        }
      }
    } catch (e) {
      console.error('Error creating purchase records:', e)
    }

    // ── Increment coupon usedCount if coupon was used ──
    if (payment.order.couponCode) {
      try {
        await db.coupon.updateMany({
          where: {
            code: payment.order.couponCode,
            organizationId: org.id,
          },
          data: {
            usedCount: { increment: 1 },
          },
        })
      } catch (e) {
        console.error('Error incrementing coupon used count:', e)
      }
    }

    // ── Send payment receipt email (fire and forget) ──
    ;(async () => {
      try {
        const { sendPaymentReceiptEmail } = await import('@/lib/email')
        sendPaymentReceiptEmail(
          auth.email,
          auth.name || 'Student',
          {
            orderId: payment.orderId,
            items: payment.order.items,
            totalAmount: payment.order.totalAmount,
            discountAmount: payment.order.discountAmount,
            finalAmount: payment.order.finalAmount,
          },
          org.name,
          org.id
        )
      } catch (emailErr) {
        console.log('[Payment] Receipt email failed:', emailErr)
      }
    })()

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: 'success',
        razorpayPaymentId: razorpay_payment_id,
      },
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
