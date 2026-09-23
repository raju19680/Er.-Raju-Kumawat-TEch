import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacherId = session.id

    const [
      totalCourses,
      totalTestSeries,
      totalNotes,
      totalStudents,
      totalEnrollments,
      totalRevenue,
      enrollmentsData,
    ] = await Promise.all([
      db.course.count({ where: { teacherId } }),
      db.testSeries.count({ where: { teacherId } }),
      db.notes.count({ where: { teacherId } }),
      db.user.count({ where: { role: 'STUDENT', teacherId } }),
      db.enrollment.count({ where: { course: { teacherId } } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { userId: { in: [] }, status: 'COMPLETED' }, // teacher revenue from their content
      }),
      db.enrollment.findMany({
        where: { course: { teacherId } },
        select: { enrolledAt: true },
        orderBy: { enrolledAt: 'desc' },
        take: 100,
      }),
    ])

    // Calculate real revenue from teacher's content purchases
    const teacherCourses = await db.course.findMany({
      where: { teacherId },
      select: { id: true, title: true, price: true },
    })
    const teacherTestSeries = await db.testSeries.findMany({
      where: { teacherId },
      select: { id: true, title: true, price: true },
    })
    const teacherNotes = await db.notes.findMany({
      where: { teacherId },
      select: { id: true, title: true, price: true },
    })

    const contentIds = [
      ...teacherCourses.map((c) => c.id),
      ...teacherTestSeries.map((t) => t.id),
      ...teacherNotes.map((n) => n.id),
    ]

    const contentRevenue = await db.payment.aggregate({
      _sum: { amount: true },
      where: { itemId: { in: contentIds }, status: 'COMPLETED' },
    })

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
      const key = `${monthNames[e.enrolledAt.getMonth()]} ${e.enrolledAt.getFullYear().toString().slice(2)}`
      if (key in enrollmentTrend) {
        enrollmentTrend[key] += 1
      }
    })

    // Top courses by enrollment
    const topCourses = await db.course.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        price: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
    })

    return NextResponse.json({
      stats: {
        totalCourses,
        totalTestSeries,
        totalNotes,
        totalStudents,
        totalEnrollments,
        totalRevenue: contentRevenue._sum.amount || 0,
      },
      enrollmentTrend: Object.entries(enrollmentTrend).map(([month, count]) => ({ month, count })),
      topCourses,
    })
  } catch (error) {
    console.error('Teacher stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
