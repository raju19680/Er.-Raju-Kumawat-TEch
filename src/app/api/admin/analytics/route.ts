export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Admin Analytics API — returns REAL aggregated analytics data.
 * Only accessible by platform_admin.
 * Excludes the PLATFORM org from stats.
 *
 * Query params:
 *   range — 7D | 30D | 90D | 12M | All  (default: 12M)
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // Find the PLATFORM org so we can exclude it from stats
    const platformOrg = await db.organization.findFirst({
      where: { code: '9680177120' },
    })
    const platformOrgId = platformOrg?.id

    // ── Parse range parameter ────────────────────────────────────────────────
    const rangeParam = (req.nextUrl.searchParams.get('range') || '12M').toUpperCase()
    const validRanges = ['7D', '30D', '90D', '12M', 'ALL']
    const range = validRanges.includes(rangeParam) ? rangeParam : '12M'

    const now = new Date()

    // ── Helper: calculate period start date ──────────────────────────────────
    function getPeriodStart(r: string): Date {
      switch (r) {
        case '7D':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        case '30D':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        case '90D':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
        case '12M':
          return new Date(now.getFullYear(), now.getMonth() - 12, 1)
        case 'ALL':
          return new Date(2020, 0, 1) // far enough back
        default:
          return new Date(now.getFullYear(), now.getMonth() - 12, 1)
      }
    }

    // ── Helper: calculate previous period start date (same length, shifted back) ──
    function getPreviousPeriodStart(r: string): { start: Date; end: Date } {
      const currentStart = getPeriodStart(r)
      const currentDurationMs = now.getTime() - currentStart.getTime()
      return {
        start: new Date(currentStart.getTime() - currentDurationMs),
        end: new Date(currentStart.getTime() - 1), // 1ms before current period
      }
    }

    const periodStart = getPeriodStart(range)

    // ── Generate time buckets based on range ─────────────────────────────────
    interface TimeBucket {
      label: string
      start: Date
      end: Date
    }

    function generateBuckets(r: string): TimeBucket[] {
      const buckets: TimeBucket[] = []

      if (r === '7D') {
        // Group by day for last 7 days
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
          const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999)
          const label = dayStart.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
          buckets.push({ label, start: dayStart, end: dayEnd })
        }
      } else if (r === '30D') {
        // Group by week for last 30 days
        for (let i = 4; i >= 0; i--) {
          const weekEnd = i === 0
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) + 6, 23, 59, 59, 999)
          const weekStart = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() - 6, 0, 0, 0, 0)
          const label = `Week ${5 - i}`
          buckets.push({ label, start: weekStart, end: weekEnd })
        }
      } else if (r === '90D') {
        // Group by month for last 90 days (3 months)
        for (let i = 2; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const start = new Date(d.getFullYear(), d.getMonth(), 1)
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
          const label = d.toLocaleDateString('en-US', { month: 'short' })
          buckets.push({ label, start, end })
        }
      } else if (r === '12M') {
        // Group by month for last 12 months
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const start = new Date(d.getFullYear(), d.getMonth(), 1)
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
          const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          buckets.push({ label, start, end })
        }
      } else {
        // All time — group by month. We'll generate from the earliest data point.
        // Start from 12 months ago and go to now, then we can extend if needed.
        // For "All", let's do last 24 months to keep chart readable
        for (let i = 23; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const start = new Date(d.getFullYear(), d.getMonth(), 1)
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
          const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          buckets.push({ label, start, end })
        }
      }

      return buckets
    }

    const buckets = generateBuckets(range)

    // ── Revenue data per bucket ──────────────────────────────────────────────
    const revenuePromises = buckets.map(async (b) => {
      const result = await db.payment.aggregate({
        where: {
          status: 'success',
          createdAt: { gte: b.start, lte: b.end },
        },
        _sum: { adminCommission: true },
      })
      return {
        month: b.label,
        revenue: result._sum.adminCommission ?? 0,
      }
    })
    const revenueData = await Promise.all(revenuePromises)

    // ── Teacher signups per bucket ───────────────────────────────────────────
    const teacherPromises = buckets.map(async (b) => {
      const count = await db.user.count({
        where: {
          role: 'teacher',
          createdAt: { gte: b.start, lte: b.end },
        },
      })
      return { month: b.label, teachers: count }
    })
    const teacherGrowthData = await Promise.all(teacherPromises)

    // ── Student registrations per bucket ─────────────────────────────────────
    const studentPromises = buckets.map(async (b) => {
      const count = await db.student.count({
        where: {
          createdAt: { gte: b.start, lte: b.end },
        },
      })
      return { month: b.label, students: count }
    })
    const studentGrowthData = await Promise.all(studentPromises)

    // ── Change percentage calculations ───────────────────────────────────────
    const prevPeriod = getPreviousPeriodStart(range)

    // Current period totals
    const [currentRevenue, currentTeachers, currentStudents, currentActiveOrgs] = await Promise.all([
      db.payment.aggregate({
        where: { status: 'success', createdAt: { gte: periodStart, lte: now } },
        _sum: { adminCommission: true },
      }),
      db.user.count({
        where: { role: 'teacher', createdAt: { gte: periodStart, lte: now } },
      }),
      db.student.count({
        where: { createdAt: { gte: periodStart, lte: now } },
      }),
      db.organization.count({
        where: {
          status: 'active',
          ...(platformOrgId ? { id: { not: platformOrgId } } : {}),
          createdAt: { gte: periodStart, lte: now },
        },
      }),
    ])

    // Previous period totals
    const [prevRevenue, prevTeachers, prevStudents, prevActiveOrgs] = await Promise.all([
      db.payment.aggregate({
        where: { status: 'success', createdAt: { gte: prevPeriod.start, lte: prevPeriod.end } },
        _sum: { adminCommission: true },
      }),
      db.user.count({
        where: { role: 'teacher', createdAt: { gte: prevPeriod.start, lte: prevPeriod.end } },
      }),
      db.student.count({
        where: { createdAt: { gte: prevPeriod.start, lte: prevPeriod.end } },
      }),
      db.organization.count({
        where: {
          status: 'active',
          ...(platformOrgId ? { id: { not: platformOrgId } } : {}),
          createdAt: { gte: prevPeriod.start, lte: prevPeriod.end },
        },
      }),
    ])

    function calcChange(current: number, previous: number): string {
      if (previous === 0) {
        if (current === 0) return '0%'
        return `+${current > 0 ? '' : ''}${((current / 1) * 100).toFixed(1)}%` // from 0 base, just show raw
      }
      const pct = ((current - previous) / previous) * 100
      const sign = pct >= 0 ? '+' : ''
      return `${sign}${pct.toFixed(1)}%`
    }

    const totalCurrentRevenue = currentRevenue._sum.adminCommission ?? 0
    const totalPrevRevenue = prevRevenue._sum.adminCommission ?? 0

    const changes = {
      revenueChange: calcChange(totalCurrentRevenue, totalPrevRevenue),
      teacherChange: calcChange(currentTeachers, prevTeachers),
      studentChange: calcChange(currentStudents, prevStudents),
      platformChange: calcChange(currentActiveOrgs, prevActiveOrgs),
    }

    // ── Payment method distribution (within the selected period) ─────────────
    const paymentsInRange = await db.payment.findMany({
      where: { status: 'success', createdAt: { gte: periodStart, lte: now } },
      select: { method: true },
    })
    const methodDistribution: Record<string, number> = {}
    for (const p of paymentsInRange) {
      const method = p.method || 'other'
      methodDistribution[method] = (methodDistribution[method] || 0) + 1
    }

    // ── Top performing organizations (by revenue within selected period) ─────
    const orgRevenueData = await db.payment.groupBy({
      by: ['organizationId'],
      where: { status: 'success', createdAt: { gte: periodStart, lte: now } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    })

    const topOrgIds = orgRevenueData.map((o) => o.organizationId)
    const topOrgs = topOrgIds.length > 0
      ? await db.organization.findMany({
          where: { id: { in: topOrgIds } },
          select: { id: true, name: true, code: true, accentColor: true, status: true },
        })
      : []

    const topOrganizations = orgRevenueData.map((o) => {
      const org = topOrgs.find((t) => t.id === o.organizationId)
      return {
        id: o.organizationId,
        name: org?.name || 'Unknown',
        code: org?.code || '',
        accentColor: org?.accentColor || '#D97706',
        status: org?.status || 'trial',
        revenue: o._sum.amount ?? 0,
      }
    })

    // ── Recent activity from real data ───────────────────────────────────────
    const recentActivity: Array<{
      type: string
      text: string
      time: string
      color: string
      icon: string
    }> = []

    // Recent teachers
    const recentTeachers = await db.user.findMany({
      where: {
        role: 'teacher',
        ...(platformOrgId ? { organizationId: { not: platformOrgId } } : {}),
      },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    for (const t of recentTeachers) {
      recentActivity.push({
        type: 'teacher_signup',
        text: `New teacher "${t.name}" signed up with "${t.organization?.name || 'Unknown'}"`,
        time: t.createdAt.toISOString(),
        color: 'text-emerald-600',
        icon: 'UserPlus',
      })
    }

    // Recent successful payments
    const recentPayments = await db.payment.findMany({
      where: { status: 'success', createdAt: { gte: periodStart, lte: now } },
      include: { order: { include: { student: true } }, organization: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    for (const p of recentPayments) {
      recentActivity.push({
        type: 'payment',
        text: `Payment of ₹${p.amount.toLocaleString('en-IN')} received from ${p.order?.student?.name || 'Student'}`,
        time: p.createdAt.toISOString(),
        color: 'text-sky-600',
        icon: 'CreditCard',
      })
    }

    // Recent student registrations
    const recentStudents = await db.student.findMany({
      where: { createdAt: { gte: periodStart, lte: now } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { organization: true },
    })
    for (const s of recentStudents) {
      recentActivity.push({
        type: 'student_registered',
        text: `Student "${s.name}" registered on "${s.organization?.name || 'Unknown'}"`,
        time: s.createdAt.toISOString(),
        color: 'text-violet-600',
        icon: 'GraduationCap',
      })
    }

    // Sort by most recent
    recentActivity.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    )

    return NextResponse.json({
      success: true,
      range,
      revenueData,
      teacherGrowthData,
      studentGrowthData,
      methodDistribution,
      topOrganizations,
      recentActivity: recentActivity.slice(0, 10),
      changes,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
