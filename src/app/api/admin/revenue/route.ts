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

    const payments = await db.payment.findMany({
      where: { status: 'completed' },
      include: {
        order: {
          include: {
            student: { select: { id: true, name: true, phone: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalRevenue = await db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'completed' },
    })

    // To properly calculate revenue by type we'd need to parse JSON items from orders
    // For now we'll return 0 or calculate from purchased records if prices were saved.
    const courseRevenue = 0
    const testRevenue = 0
    const notesRevenue = 0

    // Top teachers by revenue
    // Since we don't have teacher relation in Course/TestSeries in schema,
    // we'll just return an empty array for now or fetch users with TEACHER role.
    const teachers = await db.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10
    })

    const teacherRevenue = teachers.map((t) => {
      return {
        id: t.id,
        name: t.name,
        username: t.email,
        revenue: 0,
        courseCount: 0,
        testCount: 0,
        notesCount: 0,
      }
    })

    return NextResponse.json({
      payments,
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueByType: {
        COURSE: courseRevenue,
        TEST_SERIES: testRevenue,
        NOTES: notesRevenue,
      },
      teacherRevenue,
    })
  } catch (error) {
    console.error('Admin revenue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
