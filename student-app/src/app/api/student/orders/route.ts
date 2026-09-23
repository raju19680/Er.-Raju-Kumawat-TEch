import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const orders = await db.order.findMany({
      where: {
        studentId: student?.id || 'admin-bypass',
      },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedOrders = orders.map((order) => {
      let parsedItems = []
      try {
        parsedItems = JSON.parse(order.items)
      } catch {
        parsedItems = []
      }

      return {
        id: order.id,
        items: parsedItems,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        status: order.status,
        couponCode: order.couponCode,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        createdAt: order.createdAt,
        payments: order.payments,
        organization: order.organization,
      }
    })

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    })
  } catch (error) {
    console.error('Student orders fetch error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
