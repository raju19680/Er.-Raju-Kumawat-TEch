export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

// ── GET /api/admin/payouts ──────────────────────────────────────────────────
// List payouts with filtering + stats
export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status') || undefined
    const organizationId = searchParams.get('organizationId') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    const skip = (page - 1) * limit

    // ── Build where clause ──────────────────────────────────────────────
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (organizationId) where.organizationId = organizationId

    const createdAtFilter: { gte?: Date; lte?: Date } = {}
    if (dateFrom) createdAtFilter.gte = new Date(dateFrom)
    if (dateTo) createdAtFilter.lte = new Date(dateTo)
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter
    }

    // ── Fetch payouts + total count ─────────────────────────────────────
    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, code: true, accentColor: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.payout.count({ where }),
    ])

    // ── Stats ───────────────────────────────────────────────────────────
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      pendingAgg,
      paidAgg,
      pendingCount,
      thisMonthAgg,
    ] = await Promise.all([
      // Total pending amount
      db.payout.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
      }),
      // Total paid amount
      db.payout.aggregate({
        where: { status: 'completed' },
        _sum: { netAmount: true },
      }),
      // Pending count
      db.payout.count({
        where: { status: 'pending' },
      }),
      // This month total (all statuses)
      db.payout.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
      }),
    ])

    const stats = {
      totalPendingAmount: pendingAgg._sum.amount ?? 0,
      totalPaid: paidAgg._sum.netAmount ?? 0,
      pendingCount,
      thisMonthTotal: thisMonthAgg._sum.amount ?? 0,
    }

    // ── Pagination ──────────────────────────────────────────────────────
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      payouts: payouts.map((p) => ({
        id: p.id,
        teacherId: p.teacherId,
        teacherName: p.teacherName,
        organizationId: p.organizationId,
        orgName: p.organization?.name ?? 'Unknown',
        orgCode: p.organization?.code ?? '',
        orgAccentColor: p.organization?.accentColor ?? '#D97706',
        amount: p.amount,
        adminCommission: p.adminCommission,
        gatewayCharge: p.gatewayCharge,
        netAmount: p.netAmount,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        status: p.status,
        method: p.method,
        transactionId: p.transactionId,
        note: p.note,
        approvedBy: p.approvedBy,
        approvedAt: p.approvedAt,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('[PAYOUTS_API_GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts.' },
      { status: 500 }
    )
  }
}

// ── POST /api/admin/payouts ─────────────────────────────────────────────────
// Create a new payout
export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { teacherId, organizationId, amount, periodStart, periodEnd, method } = body

    // ── Validation ──────────────────────────────────────────────────────
    if (!teacherId || !organizationId || !amount || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: teacherId, organizationId, amount, periodStart, periodEnd' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0.' },
        { status: 400 }
      )
    }

    // Validate teacher exists
    const teacher = await db.user.findFirst({
      where: { id: teacherId, role: 'teacher' },
      select: { id: true, name: true },
    })

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found.' },
        { status: 404 }
      )
    }

    // Validate organization exists
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, adminCommission: true, gatewayCharge: true },
    })

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found.' },
        { status: 404 }
      )
    }

    // Calculate commission breakdown
    const adminCommission = Math.round(amount * (org.adminCommission / 100) * 100) / 100
    const gatewayCharge = Math.round(amount * (org.gatewayCharge / 100) * 100) / 100
    const netAmount = Math.round((amount - adminCommission - gatewayCharge) * 100) / 100

    const payout = await db.payout.create({
      data: {
        teacherId,
        teacherName: teacher.name,
        organizationId,
        amount,
        adminCommission,
        gatewayCharge,
        netAmount,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        method: method || 'bank_transfer',
        status: 'pending',
      },
      include: {
        organization: {
          select: { name: true, code: true, accentColor: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        teacherId: payout.teacherId,
        teacherName: payout.teacherName,
        organizationId: payout.organizationId,
        orgName: payout.organization?.name ?? 'Unknown',
        orgCode: payout.organization?.code ?? '',
        amount: payout.amount,
        adminCommission: payout.adminCommission,
        gatewayCharge: payout.gatewayCharge,
        netAmount: payout.netAmount,
        periodStart: payout.periodStart,
        periodEnd: payout.periodEnd,
        status: payout.status,
        method: payout.method,
        createdAt: payout.createdAt,
      },
    })
  } catch (error) {
    console.error('[PAYOUTS_API_POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payout.' },
      { status: 500 }
    )
  }
}

// ── PUT /api/admin/payouts ──────────────────────────────────────────────────
// Update payout status (approve/reject/mark paid)
export async function PUT(req: NextRequest) {
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { id, status, note, transactionId } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, status' },
        { status: 400 }
      )
    }

    const validStatuses = ['approved', 'rejected', 'completed', 'processing']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check payout exists
    const existing = await db.payout.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Payout not found.' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    if (note) updateData.note = note
    if (transactionId) updateData.transactionId = transactionId

    // Status-specific updates
    if (status === 'approved') {
      updateData.approvedBy = auth.user.id
      updateData.approvedAt = new Date()
    }

    if (status === 'completed') {
      updateData.paidAt = new Date()
      if (transactionId) updateData.transactionId = transactionId
    }

    const updated = await db.payout.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: { name: true, code: true, accentColor: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      payout: {
        id: updated.id,
        teacherId: updated.teacherId,
        teacherName: updated.teacherName,
        organizationId: updated.organizationId,
        orgName: updated.organization?.name ?? 'Unknown',
        orgCode: updated.organization?.code ?? '',
        amount: updated.amount,
        adminCommission: updated.adminCommission,
        gatewayCharge: updated.gatewayCharge,
        netAmount: updated.netAmount,
        periodStart: updated.periodStart,
        periodEnd: updated.periodEnd,
        status: updated.status,
        method: updated.method,
        transactionId: updated.transactionId,
        note: updated.note,
        approvedBy: updated.approvedBy,
        approvedAt: updated.approvedAt,
        paidAt: updated.paidAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    console.error('[PAYOUTS_API_PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payout.' },
      { status: 500 }
    )
  }
}
