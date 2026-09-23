import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * CMS (Teacher) Analytics API — returns org-specific analytics data.
 * Takes orgId from the authenticated user's session.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const orgId = auth.orgId
    if (!orgId) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Generate last 6 month boundaries
    const months: { label: string; start: Date; end: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      })
    }

    // ── Monthly revenue for last 6 months ──
    const revenuePromises = months.map(async (m) => {
      const result = await db.payment.aggregate({
        where: {
          status: 'success',
          organizationId: orgId,
          createdAt: { gte: m.start, lte: m.end },
        },
        _sum: { teacherAmount: true },
      })
      return {
        month: m.label,
        revenue: result._sum.teacherAmount ?? 0,
      }
    })
    const revenueData = await Promise.all(revenuePromises)

    // ── Student enrollment trend ──
    const enrollmentPromises = months.map(async (m) => {
      const count = await db.student.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: m.start, lte: m.end },
        },
      })
      return { month: m.label, students: count }
    })
    const enrollmentData = await Promise.all(enrollmentPromises)

    // ── Test attempt statistics ──
    // Attempts per month
    const attemptPromises = months.map(async (m) => {
      const [total, completed] = await Promise.all([
        db.testAttempt.count({
          where: {
            test: { organizationId: orgId },
            startedAt: { gte: m.start, lte: m.end },
          },
        }),
        db.testAttempt.count({
          where: {
            test: { organizationId: orgId },
            status: 'completed',
            completedAt: { gte: m.start, lte: m.end },
          },
        }),
      ])
      return { month: m.label, attempts: total, completed }
    })
    const testAttemptData = await Promise.all(attemptPromises)

    // Completion rate trend
    const completionRateTrend = testAttemptData.map((m) => ({
      month: m.month,
      rate: m.attempts > 0 ? Math.round((m.completed / m.attempts) * 100) : 0,
    }))

    // ── Top tests by attempts ──
    const topTestsRaw = await db.testAttempt.groupBy({
      by: ['testId'],
      where: {
        test: { organizationId: orgId },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const topTestIds = topTestsRaw.map((t) => t.testId)
    const topTestsInfo = await db.test.findMany({
      where: { id: { in: topTestIds } },
      select: { id: true, title: true },
    })

    const topTests = topTestsRaw.map((t) => {
      const info = topTestsInfo.find((i) => i.id === t.testId)
      return {
        testId: t.testId,
        title: info?.title || 'Unknown Test',
        attempts: t._count.id,
      }
    })

    // ── Revenue by test series ──
    const orgPayments = await db.payment.findMany({
      where: { status: 'success', organizationId: orgId },
      include: { order: { select: { items: true } } },
    })

    const revenueBySeries: Record<string, number> = {}
    for (const payment of orgPayments) {
      try {
        const items = JSON.parse(payment.order?.items || '[]')
        for (const item of items) {
          if (item.itemType === 'test_series' && item.itemId) {
            revenueBySeries[item.itemId] = (revenueBySeries[item.itemId] || 0) + (item.finalAmount || item.amount || 0)
          }
        }
      } catch {
        // Skip unparseable items
      }
    }

    const seriesIds = Object.keys(revenueBySeries)
    const seriesInfo = await db.testSeries.findMany({
      where: { id: { in: seriesIds } },
      select: { id: true, title: true },
    })

    const revenueByTestSeries = Object.entries(revenueBySeries)
      .map(([id, revenue]) => {
        const info = seriesInfo.find((s) => s.id === id)
        return {
          id,
          title: info?.title || 'Unknown Series',
          revenue,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // ── Recent activity ──
    const recentActivity: Array<{
      id: string
      type: string
      description: string
      timestamp: string
    }> = []

    // Recent students
    const recentStudents = await db.student.findMany({
      where: { organizationId: orgId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    for (const s of recentStudents) {
      recentActivity.push({
        id: s.id,
        type: 'student_registered',
        description: `${s.name} registered as a student`,
        timestamp: s.createdAt.toISOString(),
      })
    }

    // Recent test attempts
    const recentAttempts = await db.testAttempt.findMany({
      where: { test: { organizationId: orgId }, status: 'completed' },
      include: { test: { select: { title: true } }, student: { select: { name: true } } },
      take: 5,
      orderBy: { completedAt: 'desc' },
    })
    for (const a of recentAttempts) {
      recentActivity.push({
        id: a.id,
        type: 'test_attempt',
        description: `${a.student?.name || 'Student'} completed "${a.test?.title || 'Test'}" (Score: ${a.score}/${a.totalMarks})`,
        timestamp: (a.completedAt || a.startedAt).toISOString(),
      })
    }

    // Recent payments
    const recentPayments = await db.payment.findMany({
      where: { status: 'success', organizationId: orgId },
      include: { order: { include: { student: { select: { name: true } } } } },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
    for (const p of recentPayments) {
      recentActivity.push({
        id: p.id,
        type: 'payment',
        description: `Payment of ₹${p.amount.toLocaleString('en-IN')} from ${p.order?.student?.name || 'Student'}`,
        timestamp: p.createdAt.toISOString(),
      })
    }

    // Sort by most recent
    recentActivity.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // ── Calculate change percentages ──
    // Compare last month vs previous month
    const lastMonth = months[5]
    const prevMonth = months[4]

    // Revenue change
    const lastMonthRevenue = revenueData[5]?.revenue || 0
    const prevMonthRevenue = revenueData[4]?.revenue || 0
    const revenueChange = prevMonthRevenue > 0
      ? Math.round(((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : lastMonthRevenue > 0 ? 100 : 0

    // Student change
    const lastMonthStudents = enrollmentData[5]?.students || 0
    const prevMonthStudents = enrollmentData[4]?.students || 0
    const studentChange = prevMonthStudents > 0
      ? Math.round(((lastMonthStudents - prevMonthStudents) / prevMonthStudents) * 100)
      : lastMonthStudents > 0 ? 100 : 0

    // Completion rate
    const totalAttempts = await db.testAttempt.count({
      where: { test: { organizationId: orgId } },
    })
    const completedAttempts = await db.testAttempt.count({
      where: { test: { organizationId: orgId }, status: 'completed' },
    })
    const completionRate = totalAttempts > 0
      ? Math.round((completedAttempts / totalAttempts) * 100)
      : 0

    // Total revenue
    const totalRevenueResult = await db.payment.aggregate({
      where: { status: 'success', organizationId: orgId },
      _sum: { teacherAmount: true },
    })
    const totalRevenue = totalRevenueResult._sum.teacherAmount ?? 0

    // ── Pre-compute async stats before building response ──
    const [totalStudents, activeTests, activeTestsChange, completionRateChange] = await Promise.all([
      db.student.count({ where: { organizationId: orgId } }),
      db.test.count({ where: { organizationId: orgId, isLive: true } }),
      (async () => {
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        const [thisMonthTests, lastMonthTests] = await Promise.all([
          db.test.count({ where: { organizationId: orgId, isLive: true, createdAt: { gte: thisMonthStart } } }),
          db.test.count({ where: { organizationId: orgId, isLive: true, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
        ])
        return lastMonthTests > 0 ? Math.round(((thisMonthTests - lastMonthTests) / lastMonthTests) * 100) : thisMonthTests > 0 ? 100 : 0
      })(),
      (async () => {
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        const [thisAtt, thisComp, lastAtt, lastComp] = await Promise.all([
          db.testAttempt.count({ where: { test: { organizationId: orgId }, startedAt: { gte: thisMonthStart } } }),
          db.testAttempt.count({ where: { test: { organizationId: orgId }, status: 'completed', completedAt: { gte: thisMonthStart } } }),
          db.testAttempt.count({ where: { test: { organizationId: orgId }, startedAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
          db.testAttempt.count({ where: { test: { organizationId: orgId }, status: 'completed', completedAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
        ])
        const thisRate = thisAtt > 0 ? Math.round((thisComp / thisAtt) * 100) : 0
        const lastRate = lastAtt > 0 ? Math.round((lastComp / lastAtt) * 100) : 0
        return lastRate > 0 ? thisRate - lastRate : 0
      })(),
    ])

    return NextResponse.json({
      success: true,
      revenueData,
      enrollmentData,
      testAttemptData,
      completionRateTrend,
      topTests,
      revenueByTestSeries,
      recentActivity: recentActivity.slice(0, 10),
      // For dashboard cards
      stats: {
        revenue: totalRevenue,
        revenueChange,
        totalStudents,
        totalStudentsChange: studentChange,
        activeTests,
        activeTestsChange,
        completionRate,
        completionRateChange,
      },
    })
  } catch (error) {
    console.error('CMS analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
