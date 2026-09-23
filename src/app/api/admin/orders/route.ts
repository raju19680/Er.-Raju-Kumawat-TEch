export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (dateFrom) {
      where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(dateFrom) }
    }

    if (dateTo) {
      where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(dateTo + 'T23:59:59') }
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { couponCode: { contains: search } },
        { razorpayOrderId: { contains: search } },
        { razorpayPaymentId: { contains: search } },
        { student: { name: { contains: search,  } } },
        { student: { email: { contains: search,  } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, email: true } },
          payments: { select: { id: true, amount: true, method: true, status: true, adminCommission: true, teacherAmount: true, gatewayCharge: true, createdAt: true } },
        },
      }),
      db.order.count({ where }),
    ])

    // Compute summary stats
    const [totalRevenue, totalOrders, pendingOrders, refundedOrders] = await Promise.all([
      db.payment.aggregate({ where: { status: 'success' }, _sum: { amount: true } }),
      db.order.count({ where: { status: 'completed' } }),
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'refunded' } }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      stats: {
        totalRevenue: totalRevenue._sum.amount || 0,
        completedOrders: totalOrders,
        pendingOrders,
        refundedOrders,
      },
    })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'Order ID and status are required.' },
        { status: 400 }
      )
    }

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      )
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update order.' },
      { status: 500 }
    )
  }
}
