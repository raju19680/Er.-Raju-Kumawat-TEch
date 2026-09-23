import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth || auth.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      courseId 
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
      return NextResponse.json({ success: false, message: 'Missing payment parameters' }, { status: 400 })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.id }
    })

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { organization: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 })
    }

    const keySecret = course.organization.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET

    if (!keySecret) {
      return NextResponse.json({ success: false, message: 'Payment gateway not configured' }, { status: 500 })
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 })
    }

    // Success - Create records
    // Use a transaction to ensure both payment and purchase are recorded
    const purchase = await db.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          organizationId: course.organizationId,
          studentId: student.id,
          items: JSON.stringify([{ itemType: 'course', itemId: course.id, name: course.title, price: course.price }]),
          totalAmount: course.price,
          finalAmount: course.price,
          status: 'completed',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id
        }
      })

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          organizationId: course.organizationId,
          amount: course.price,
          method: 'razorpay',
          status: 'success',
          transactionId: razorpay_payment_id,
          orderId: order.id,
        }
      })

      // 3. Create PurchasedCourse
      const purchasedCourse = await tx.purchasedCourse.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          organizationId: course.organizationId,
        }
      })

      return purchasedCourse
    })

    return NextResponse.json({ success: true, message: 'Payment successful', purchaseId: purchase.id })

  } catch (error) {
    console.error('Razorpay Verify Error:', error)
    return NextResponse.json({ success: false, message: 'Failed to verify payment' }, { status: 500 })
  }
}
