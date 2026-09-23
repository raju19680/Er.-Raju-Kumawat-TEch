export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = auth.orgId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const searchParams = req.nextUrl.searchParams
    const dateFromStr = searchParams.get('dateFrom')
    let dateFrom: Date | undefined
    if (dateFromStr) {
      dateFrom = new Date(dateFromStr)
    }

    const [
      totalCourses,
      totalTestSeries,
      totalNotes,
      totalStudents,
      totalEnrollments,
      enrollmentsData,
      contentRevenue,
    ] = await Promise.all([
      db.course.count({ where: { organizationId } }),
      db.testSeries.count({ where: { organizationId } }),
      db.digitalProduct.count({ where: { organizationId } }),
      db.user.count({ where: { role: 'student', organizationId } }),
      db.purchasedCourse.count({ where: { course: { organizationId } } }),
      db.purchasedCourse.findMany({
        where: { course: { organizationId } },
        select: { purchasedAt: true },
        orderBy: { purchasedAt: 'desc' },
        take: 100,
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { 
          organizationId, 
          status: 'success',
          ...(dateFrom ? { createdAt: { gte: dateFrom } } : {})
        },
      })
    ])

    // Rank Logic
    const allOrgRevenues = await db.payment.groupBy({
      by: ['organizationId'],
      where: {
        status: 'success',
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {})
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } }
    })

    let rank = 0
    let totalOrgs = allOrgRevenues.length
    for (let i = 0; i < allOrgRevenues.length; i++) {
      if (allOrgRevenues[i].organizationId === organizationId) {
        rank = i + 1
        break
      }
    }
    // If not found in payments, they have 0 revenue, so they are tied for last
    if (rank === 0) rank = totalOrgs + 1

    // Daily revenue for the chart
    const paymentsInRange = await db.payment.findMany({
      where: {
        organizationId,
        status: 'success',
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {})
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    })

    const dailyRevenueMap: Record<string, number> = {}
    paymentsInRange.forEach(p => {
      const dateStr = p.createdAt.toISOString().split('T')[0]
      dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + p.amount
    })
    const dailyEarnings = Object.entries(dailyRevenueMap).map(([date, amount]) => ({ date, amount }))

    // Enrollment trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const enrollmentTrend: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`
      enrollmentTrend[key] = 0
    }
    enrollmentsData.forEach((e) => {
      const key = `${monthNames[e.purchasedAt.getMonth()]} ${e.purchasedAt.getFullYear().toString().slice(2)}`
      if (key in enrollmentTrend) {
        enrollmentTrend[key] += 1
      }
    })

    // Top courses by enrollment
    const topCourses = await db.course.findMany({
      where: { organizationId },
      select: {
        id: true,
        title: true,
        price: true,
        _count: { select: { purchasedBy: true } },
      },
      orderBy: { purchasedBy: { _count: 'desc' } },
      take: 5,
    })

    return NextResponse.json({
      stats: {
        totalCourses,
        totalTestSeries,
        totalNotes,
        totalStudents,
        totalEnrollments,
        totalRevenue: contentRevenue._sum?.amount || 0,
        rank,
        totalPlatformTeachers: await db.organization.count()
      },
      enrollmentTrend: Object.entries(enrollmentTrend).map(([month, count]) => ({ month, count })),
      dailyEarnings,
      topCourses,
    })
  } catch (error) {
    console.error('Teacher stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

