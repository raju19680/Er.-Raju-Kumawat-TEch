export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth || (auth.role !== 'platform_admin' && auth.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalTeachers,
      totalStudents,
      totalCourses,
      totalTestSeries,
      totalNotes,
      totalEnrollments,
      totalRevenue,
      pendingTeachers,
      recentUsers,
    ] = await Promise.all([
      db.user.count({ where: { role: 'teacher' } }),
      db.user.count({ where: { role: 'student' } }),
      db.course.count(),
      db.testSeries.count(),
      db.digitalProduct.count(),
      db.purchasedCourse.count(),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      0, // pendingTeachers (no longer tracked on User)
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ])

    // Revenue by month for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const payments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    })

    const monthlyRevenue: Record<string, number> = {}
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`
      monthlyRevenue[key] = 0
    }
    
    payments.forEach((p) => {
      const key = `${monthNames[p.createdAt.getMonth()]} ${p.createdAt.getFullYear().toString().slice(2)}`
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += p.amount
      }
    })

    return NextResponse.json({
      stats: {
        totalTeachers,
        totalStudents,
        totalCourses,
        totalTestSeries,
        totalNotes,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingTeachers,
      },
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
      recentUsers,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
