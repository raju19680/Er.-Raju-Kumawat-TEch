import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const [
      totalEnrollments,
      totalTestSeries,
      totalTestsTaken,
      completedAttempts,
      totalNotesPurchased,
      orders,
      recentEnrollments,
      recentAttempts,
    ] = await Promise.all([
      db.purchasedCourse.count({ where: { studentId: student.id } }),
      db.purchasedTestSeries.count({ where: { studentId: student.id } }),
      db.testAttempt.count({ where: { studentId: student.id } }),
      db.testAttempt.findMany({
        where: { studentId: student.id, status: 'completed' },
        select: { score: true, totalMarks: true },
      }),
      db.purchasedDigitalProduct.count({ where: { studentId: student.id } }),
      db.order.findMany({
        where: { studentId: student.id, status: 'completed' },
        select: { finalAmount: true },
      }),
      db.purchasedCourse.findMany({
        where: { studentId: student.id },
        take: 4,
        orderBy: { purchasedAt: 'desc' },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true, category: true },
          },
        },
      }),
      db.testAttempt.findMany({
        where: { studentId: student.id },
        take: 5,
        orderBy: { startedAt: 'desc' },
        include: {
          test: {
            select: { id: true, title: true, totalDuration: true },
          },
        },
      }),
    ])

    // Calculate percentage average score
    let avgScorePercent = 0
    if (completedAttempts.length > 0) {
      const validScores = completedAttempts.filter(a => a.totalMarks > 0)
      if (validScores.length > 0) {
        const sumPercent = validScores.reduce((sum, a) => sum + (a.score / a.totalMarks) * 100, 0)
        avgScorePercent = Math.round(sumPercent / validScores.length)
      }
    }

    const totalSpent = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0)

    return NextResponse.json({
      success: true,
      stats: {
        totalEnrollments,
        totalTestSeries,
        totalTestsTaken,
        completedTests: completedAttempts.length,
        totalNotesPurchased,
        totalSpent,
        avgScore: avgScorePercent,
      },
      recentEnrollments,
      recentAttempts,
    })
  } catch (error) {
    console.error('Student stats error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

