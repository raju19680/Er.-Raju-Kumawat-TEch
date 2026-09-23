import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth || auth.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await req.json()
    if (!courseId) {
      return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 })
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

    // Check if already purchased
    const existingPurchase = await db.purchasedCourse.findFirst({
      where: { studentId: student.id, courseId: course.id }
    })

    if (existingPurchase) {
      return NextResponse.json({ success: false, message: 'Course already purchased' }, { status: 400 })
    }

    if (course.price <= 0) {
      // Direct enrollment for free courses
      const purchase = await db.purchasedCourse.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          organizationId: course.organizationId,
        }
      })
      return NextResponse.json({ success: true, isFree: true, purchaseId: purchase.id })
    }

    // Initialize Razorpay
    const keyId = course.organization.razorpayKeyId || process.env.RAZORPAY_KEY_ID
    const keySecret = course.organization.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: 'Payment gateway not configured' }, { status: 500 })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // Calculate effective price (could apply coupons here later)
    const amountInPaise = Math.round(course.price * 100)

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_c_${course.id.slice(0, 8)}_${student.id.slice(0, 8)}`,
      notes: {
        courseId: course.id,
        studentId: student.id,
        orgId: course.organizationId
      }
    }

    const order = await razorpay.orders.create(orderOptions)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      keyId, // Safe to send public key to frontend
      course: {
        name: course.title,
        description: course.description?.slice(0, 100)
      },
      prefill: {
        name: student.name,
        email: student.email,
        contact: student.phone || ''
      }
    })

  } catch (error) {
    console.error('Razorpay Create Order Error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 })
  }
}
