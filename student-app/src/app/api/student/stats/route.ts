import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const normalizedRole = String(auth.role).toLowerCase()
    const isStudent = normalizedRole === 'student'
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    // Find student record linked to this user
    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })

    if (!student) {
      // Return empty stats if no student record found
      return NextResponse.json({
        success: true,
        stats: {
          purchasedCourses: 0,
          completedTests: 0,
          totalTestAttempts: 0,
          avgScore: 0,
          totalOrders: 0,
          totalSpent: 0,
        },
      })
    }

    // Fetch all stats in parallel using actual Prisma models
    const [
      purchasedCourses,
      completedTests,
      totalTestAttempts,
      totalOrders,
      totalSpentAgg,
      testAttempts,
    ] = await Promise.all([
      db.purchasedCourse.count({ where: { studentId: student?.id || 'admin-bypass' } }),
      db.testAttempt.count({ where: { studentId: student?.id || 'admin-bypass', status: 'completed' } }),
      db.testAttempt.count({ where: { studentId: student?.id || 'admin-bypass' } }),
      db.order.count({ where: { studentId: student?.id || 'admin-bypass', status: 'completed' } }),
      db.order.aggregate({
        where: { studentId: student?.id || 'admin-bypass', status: 'completed' },
        _sum: { finalAmount: true },
      }),
      // Get completed test attempts for avg score calculation
      db.testAttempt.findMany({
        where: { studentId: student?.id || 'admin-bypass', status: 'completed' },
        select: { score: true, totalMarks: true },
      }),
    ])

    // Calculate average score percentage
    const avgScore = testAttempts.length > 0
      ? Math.round(
          testAttempts.reduce((sum, a) => {
            if (a.totalMarks > 0) {
              return sum + (a.score / a.totalMarks) * 100
            }
            return sum
          }, 0) / testAttempts.length
        )
      : 0

    return NextResponse.json({
      success: true,
      stats: {
        purchasedCourses,
        completedTests,
        totalTestAttempts,
        avgScore,
        totalOrders,
        totalSpent: totalSpentAgg._sum.finalAmount || 0,
      },
    })
  } catch (error) {
    console.error('Student stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
