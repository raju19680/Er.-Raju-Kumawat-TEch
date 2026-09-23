import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalEnrollments,
      totalCompleted,
      totalTestsTaken,
      totalNotesPurchased,
      totalSpent,
      avgScore,
      recentEnrollments,
    ] = await Promise.all([
      db.enrollment.count({ where: { userId: session.id } }),
      db.enrollment.count({ where: { userId: session.id, progress: { gte: 100 } } }),
      db.testAttempt.count({ where: { userId: session.id } }),
      db.notesPurchase.count({ where: { userId: session.id } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { userId: session.id, status: 'COMPLETED' },
      }),
      db.testAttempt.aggregate({
        _avg: { percentage: true },
        where: { userId: session.id },
      }),
      db.enrollment.findMany({
        where: { userId: session.id },
        take: 5,
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true, teacher: { select: { name: true } } },
          },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalEnrollments,
        totalCompleted,
        totalTestsTaken,
        totalNotesPurchased,
        totalSpent: totalSpent._sum.amount || 0,
        avgScore: avgScore._avg.percentage || 0,
      },
      recentEnrollments,
    })
  } catch (error) {
    console.error('Student stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
