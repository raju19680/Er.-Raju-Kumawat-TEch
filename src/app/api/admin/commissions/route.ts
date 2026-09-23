export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

// ── Date range helper ────────────────────────────────────────────────────────
function getDateFilter(period: string): Date | null {
  const now = new Date()
  switch (period) {
    case '7D':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30D':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90D':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '12M':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case 'All':
    default:
      return null
  }
}

// ── GET /api/admin/commissions ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Auth check
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'All'
    const organizationId = searchParams.get('organizationId') || undefined

    const dateFilter = getDateFilter(period)
    const createdAtFilter: { gte?: Date } = {}
    if (dateFilter) {
      createdAtFilter.gte = dateFilter
    }

    // ── Build where clause ──────────────────────────────────────────────
    const paymentWhere: Record<string, unknown> = {
      status: 'success',
      createdAt: createdAtFilter,
    }
    if (organizationId) {
      paymentWhere.organizationId = organizationId
    }

    // ── Summary aggregations ────────────────────────────────────────────
    const [
      summaryAgg,
      totalTransactions,
      allOrgs,
      allPayments,
    ] = await Promise.all([
      db.payment.aggregate({
        where: paymentWhere,
        _sum: {
          amount: true,
          adminCommission: true,
          gatewayCharge: true,
          teacherAmount: true,
        },
        _count: true,
      }),
      db.payment.count({ where: paymentWhere }),
      db.organization.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          accentColor: true,
          status: true,
          adminCommission: true,
          gatewayCharge: true,
        },
        orderBy: { name: 'asc' },
      }),
      db.payment.findMany({
        where: paymentWhere,
        select: {
          id: true,
          amount: true,
          adminCommission: true,
          gatewayCharge: true,
          teacherAmount: true,
          status: true,
          method: true,
          createdAt: true,
          organizationId: true,
          order: {
            select: {
              student: {
                select: { name: true, email: true },
              },
            },
          },
          organization: {
            select: { name: true, code: true, accentColor: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // ── Compute summary ─────────────────────────────────────────────────
    const totalRevenue = summaryAgg._sum.amount ?? 0
    const totalAdminCommission = summaryAgg._sum.adminCommission ?? 0
    const totalGatewayCharge = summaryAgg._sum.gatewayCharge ?? 0
    const totalTeacherPayout = summaryAgg._sum.teacherAmount ?? 0

    // Avg commission rate: weighted by revenue
    let avgCommissionRate = 0
    if (totalRevenue > 0) {
      // Get all orgs that have payments in the period
      const orgsWithPayments = await db.payment.groupBy({
        by: ['organizationId'],
        where: paymentWhere,
        _sum: { amount: true },
      })
      let weightedSum = 0
      let totalAmt = 0
      for (const op of orgsWithPayments) {
        const org = allOrgs.find((o) => o.id === op.organizationId)
        if (org && op._sum.amount) {
          weightedSum += org.adminCommission * op._sum.amount
          totalAmt += op._sum.amount
        }
      }
      avgCommissionRate = totalAmt > 0 ? weightedSum / totalAmt : 0
    }

    // ── Organization breakdown ───────────────────────────────────────────
    const orgPaymentAgg = await db.payment.groupBy({
      by: ['organizationId'],
      where: paymentWhere,
      _sum: {
        amount: true,
        adminCommission: true,
        gatewayCharge: true,
        teacherAmount: true,
      },
      _count: true,
      _max: { createdAt: true },
    })

    // Get order counts per org
    const orderCountByOrg = await db.order.groupBy({
      by: ['organizationId'],
      where: {
        ...(organizationId ? { organizationId } : {}),
        status: 'completed',
        createdAt: createdAtFilter,
      },
      _count: true,
    })

    const orgBreakdown = allOrgs
      .map((org) => {
        const agg = orgPaymentAgg.find((a) => a.organizationId === org.id)
        const orderCount = orderCountByOrg.find((o) => o.organizationId === org.id)
        if (!agg || !agg._sum.amount) return null
        return {
          id: org.id,
          name: org.name,
          code: org.code,
          accentColor: org.accentColor,
          status: org.status,
          totalOrders: orderCount?._count ?? 0,
          totalRevenue: agg._sum.amount ?? 0,
          adminCommission: agg._sum.adminCommission ?? 0,
          gatewayCharge: agg._sum.gatewayCharge ?? 0,
          teacherAmount: agg._sum.teacherAmount ?? 0,
          commissionRate: org.adminCommission,
          recentPaymentDate: agg._max.createdAt,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.totalRevenue ?? 0) - (a?.totalRevenue ?? 0))

    // ── Monthly trend (last 12 months) ──────────────────────────────────
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyPayments = await db.payment.findMany({
      where: {
        status: 'success',
        createdAt: { gte: twelveMonthsAgo },
        ...(organizationId ? { organizationId } : {}),
      },
      select: {
        amount: true,
        adminCommission: true,
        gatewayCharge: true,
        teacherAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by month
    const monthlyMap = new Map<string, {
      month: string
      adminCommission: number
      gatewayCharge: number
      teacherAmount: number
      revenue: number
    }>()

    for (const p of monthlyPayments) {
      const date = new Date(p.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

      const existing = monthlyMap.get(key) ?? {
        month: monthLabel,
        adminCommission: 0,
        gatewayCharge: 0,
        teacherAmount: 0,
        revenue: 0,
      }
      existing.adminCommission += p.adminCommission
      existing.gatewayCharge += p.gatewayCharge
      existing.teacherAmount += p.teacherAmount
      existing.revenue += p.amount
      monthlyMap.set(key, existing)
    }

    // Fill missing months
    const monthlyTrend: typeof monthlyMap extends Map<string, infer V> ? V[] : never[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      const existing = monthlyMap.get(key)
      monthlyTrend.push(existing ?? {
        month: monthLabel,
        adminCommission: 0,
        gatewayCharge: 0,
        teacherAmount: 0,
        revenue: 0,
      })
    }

    // ── Top teachers (users with role=teacher, sorted by their org revenue) ──
    const topTeachersRaw = await db.user.findMany({
      where: {
        role: 'teacher',
        organizationId: { not: null },
      },
      select: {
        name: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
            adminCommission: true,
          },
        },
      },
      take: 50,
    })

    // Get org revenue for each teacher's org
    const orgRevenueMap = new Map<string, { revenue: number; commission: number }>()
    for (const t of topTeachersRaw) {
      if (!t.organizationId) continue
      if (orgRevenueMap.has(t.organizationId)) continue
      const agg = orgPaymentAgg.find((a) => a.organizationId === t.organizationId)
      orgRevenueMap.set(t.organizationId, {
        revenue: agg?._sum.amount ?? 0,
        commission: agg?._sum.adminCommission ?? 0,
      })
    }

    const topTeachers = topTeachersRaw
      .map((t) => ({
        name: t.name,
        orgName: t.organization?.name ?? 'Unknown',
        orgRevenue: orgRevenueMap.get(t.organizationId ?? '')?.revenue ?? 0,
        commissionEarned: orgRevenueMap.get(t.organizationId ?? '')?.commission ?? 0,
      }))
      .sort((a, b) => b.orgRevenue - a.orgRevenue)
      .slice(0, 5)

    // ── Recent transactions (last 20) ───────────────────────────────────
    const recentTransactions = allPayments.slice(0, 20).map((p) => ({
      id: p.id,
      date: p.createdAt,
      studentName: p.order?.student?.name ?? 'Unknown',
      studentEmail: p.order?.student?.email ?? '',
      orgName: p.organization?.name ?? 'Unknown',
      orgCode: p.organization?.code ?? '',
      amount: p.amount,
      adminCommission: p.adminCommission,
      gatewayCharge: p.gatewayCharge,
      teacherAmount: p.teacherAmount,
      status: p.status,
      method: p.method,
    }))

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalAdminCommission,
        totalGatewayCharge,
        totalTeacherPayout,
        avgCommissionRate: Math.round(avgCommissionRate * 100) / 100,
        totalTransactions,
      },
      orgBreakdown,
      monthlyTrend,
      topTeachers,
      recentTransactions,
    })
  } catch (error) {
    console.error('[COMMISSIONS_API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch commission data.' },
      { status: 500 }
    )
  }
}
