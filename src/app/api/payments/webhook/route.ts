import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/**
 * POST /api/payments/webhook
 *
 * Razorpay webhook handler for payment events.
 * Verifies the webhook signature and processes events:
 * - payment.captured: Update order status to completed
 * - payment.failed: Update order status to failed
 * - refund.created: Update order status to refunded
 *
 * Required env: RAZORPAY_WEBHOOK_SECRET (or per-org webhook secret)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      )
    }

    // Get webhook secret from env (platform-level) or check per-org
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      // SECURITY: Reject webhooks when secret is not configured
      console.error('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not configured - rejecting webhook')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 503 }
      )
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('[WEBHOOK] Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    console.log(`[WEBHOOK] Received event: ${eventType}`)

    switch (eventType) {
      case 'payment.captured': {
        const payment = payload.payment?.entity
        if (!payment) break

        const razorpayOrderId = payment.order_id
        const razorpayPaymentId = payment.id

        // Find order by razorpayOrderId
        const order = await db.order.findFirst({
          where: { razorpayOrderId },
        })

        if (!order) {
          console.error(`[WEBHOOK] Order not found for razorpayOrderId: ${razorpayOrderId}`)
          break
        }

        // Update order status
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            razorpayPaymentId,
          },
        })

        // Update payment record
        await db.payment.updateMany({
          where: { orderId: order.id },
          data: {
            status: 'success',
            transactionId: razorpayPaymentId,
          },
        })

        // Grant access to purchased items
        const items = JSON.parse(order.items || '[]')
        for (const item of items) {
          if (item.type === 'course') {
            await db.purchasedCourse.upsert({
              where: {
                studentId_courseId: {
                  studentId: order.studentId,
                  courseId: item.id,
                },
              },
              update: {},
              create: {
                studentId: order.studentId,
                courseId: item.id,
                organizationId: order.organizationId,
              },
            })
          }
          // Add other types (test_series, digital_product) as needed
        }

        console.log(`[WEBHOOK] Payment captured for order: ${order.id}`)
        break
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity
        if (!payment) break

        const razorpayOrderId = payment.order_id
        const order = await db.order.findFirst({
          where: { razorpayOrderId },
        })

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          })
          await db.payment.updateMany({
            where: { orderId: order.id },
            data: { status: 'failed' },
          })
          console.log(`[WEBHOOK] Payment failed for order: ${order.id}`)
        }
        break
      }

      case 'refund.created': {
        const refund = payload.refund?.entity
        if (!refund) break

        const paymentId = refund.payment_id
        const order = await db.order.findFirst({
          where: { razorpayPaymentId: paymentId },
        })

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { status: 'refunded' },
          })
          await db.payment.updateMany({
            where: { orderId: order.id },
            data: { status: 'refunded' },
          })
          console.log(`[WEBHOOK] Refund processed for order: ${order.id}`)
        }
        break
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
