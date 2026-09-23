import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await db.payment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalRevenue = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
    })

    // Revenue by type
    const courseRevenue = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED', type: 'COURSE' },
    })
    const testRevenue = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED', type: 'TEST_SERIES' },
    })
    const notesRevenue = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED', type: 'NOTES' },
    })

    // Top teachers by revenue
    const teachers = await db.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true,
        name: true,
        username: true,
        coursesTaught: { select: { id: true, title: true, price: true, _count: { select: { enrollments: true } } } },
        testSeriesCreated: { select: { id: true, title: true, price: true, _count: { select: { purchases: true } } } },
        notesCreated: { select: { id: true, title: true, price: true, _count: { select: { purchases: true } } } },
      },
    })

    const teacherRevenue = teachers.map((t) => {
      const courseRev = t.coursesTaught.reduce((sum, c) => sum + (c.price * c._count.enrollments), 0)
      const testRev = t.testSeriesCreated.reduce((sum, ts) => sum + (ts.price * ts._count.purchases), 0)
      const notesRev = t.notesCreated.reduce((sum, n) => sum + (n.price * n._count.purchases), 0)
      return {
        id: t.id,
        name: t.name,
        username: t.username,
        revenue: courseRev + testRev + notesRev,
        courseCount: t.coursesTaught.length,
        testCount: t.testSeriesCreated.length,
        notesCount: t.notesCreated.length,
      }
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    return NextResponse.json({
      payments,
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueByType: {
        COURSE: courseRevenue._sum.amount || 0,
        TEST_SERIES: testRevenue._sum.amount || 0,
        NOTES: notesRevenue._sum.amount || 0,
      },
      teacherRevenue,
    })
  } catch (error) {
    console.error('Admin revenue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
