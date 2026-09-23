import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // ── Auth check ──
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    let organizationId = searchParams.get('organizationId') || ''

    // SECURITY: If no organizationId in query, use the authenticated user's orgId
    if (!organizationId && authUser.orgId) {
      organizationId = authUser.orgId
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // SECURITY: Non-admin users can only access their own organization's data
    // Admin (platform_admin) can access any organization
    if (authUser.role !== 'platform_admin') {
      // Resolve the requested org to its ID
      let requestedOrgId = organizationId
      const requestedOrg = await db.organization.findUnique({
        where: { code: organizationId },
        select: { id: true },
      })
      if (requestedOrg) {
        requestedOrgId = requestedOrg.id
      }

      // Check if the requested org matches the user's org
      if (requestedOrgId !== authUser.orgId) {
        return NextResponse.json(
          { error: 'Access denied. You can only access your own organization.' },
          { status: 403 }
        )
      }
    }

    // Try to find org by ID or by code
    let orgId = organizationId
    const orgByCode = await db.organization.findUnique({
      where: { code: organizationId },
      select: { id: true },
    })
    if (orgByCode) {
      orgId = orgByCode.id
    }

    // Fetch real counts from the database
    const [
      totalStudents,
      activeTests,
      totalCourses,
      totalTestSeries,
      totalBlogs,
      totalQuestions,
      totalTestAttempts,
      completedTestAttempts,
      recentStudents,
      recentTests,
      recentBlogs,
      pendingReportedQuestions,
      pendingOmrCount,
    ] = await Promise.all([
      db.student.count({ where: { organizationId: orgId } }),
      db.test.count({ where: { organizationId: orgId, isLive: true } }),
      db.course.count({ where: { organizationId: orgId } }),
      db.testSeries.count({ where: { organizationId: orgId } }),
      db.blog.count({ where: { organizationId: orgId } }),
      db.question.count({
        where: {
          test: { organizationId: orgId },
        },
      }),
      db.testAttempt.count({
        where: {
          test: { organizationId: orgId },
        },
      }),
      db.testAttempt.count({
        where: {
          test: { organizationId: orgId },
          status: 'completed',
        },
      }),
      db.student.findMany({
        where: { organizationId: orgId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      db.test.findMany({
        where: { organizationId: orgId, isLive: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true },
      }),
      db.blog.findMany({
        where: { organizationId: orgId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      db.reportedQuestion.count({
        where: { 
          status: 'pending',
          question: { test: { organizationId: orgId } }
        }
      }),
      // Assuming OMR table or status exists. For now, we will mock pendingOmr if it doesn't exist, or just use 0.
      Promise.resolve(0), // Placeholder for pending OMR
    ])

    // Calculate completion rate
    const completionRate =
      totalTestAttempts > 0
        ? Math.round((completedTestAttempts / totalTestAttempts) * 100)
        : 0

    // Build recent activities from real data
    const recentActivities: Array<{
      id: string
      type: string
      description: string
      timestamp: string
    }> = []

    recentStudents.forEach((student) => {
      recentActivities.push({
        id: student.id,
        type: 'student_registered',
        description: `${student.name} registered as a student`,
        timestamp: student.createdAt.toISOString(),
      })
    })

    recentTests.forEach((test) => {
      recentActivities.push({
        id: test.id,
        type: 'test_published',
        description: `Test "${test.title}" is now live`,
        timestamp: test.createdAt.toISOString(),
      })
    })

    recentBlogs.forEach((blog) => {
      recentActivities.push({
        id: blog.id,
        type: 'blog_created',
        description: `Blog "${blog.title}" was created (${blog.status})`,
        timestamp: blog.createdAt.toISOString(),
      })
    })

    // Sort by most recent first
    recentActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // ── Real revenue from payments ──
    const revenueResult = await db.payment.aggregate({
      where: { status: 'success', organizationId: orgId },
      _sum: { teacherAmount: true },
    })
    const revenue = revenueResult._sum.teacherAmount ?? 0

    // ── Calculate month-over-month changes ──
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // Revenue change
    const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      db.payment.aggregate({
        where: { status: 'success', organizationId: orgId, createdAt: { gte: thisMonthStart } },
        _sum: { teacherAmount: true },
      }),
      db.payment.aggregate({
        where: { status: 'success', organizationId: orgId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { teacherAmount: true },
      }),
    ])
    const revThis = thisMonthRevenue._sum.teacherAmount ?? 0
    const revLast = lastMonthRevenue._sum.teacherAmount ?? 0
    const revenueChange = revLast > 0 ? Math.round(((revThis - revLast) / revLast) * 100) : revThis > 0 ? 100 : 0

    // Student change
    const [thisMonthStudents, lastMonthStudents] = await Promise.all([
      db.student.count({ where: { organizationId: orgId, createdAt: { gte: thisMonthStart } } }),
      db.student.count({ where: { organizationId: orgId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ])
    const studentChange = lastMonthStudents > 0 ? Math.round(((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100) : thisMonthStudents > 0 ? 100 : 0

    // Active tests change
    const [thisMonthTests, lastMonthTests] = await Promise.all([
      db.test.count({ where: { organizationId: orgId, isLive: true, createdAt: { gte: thisMonthStart } } }),
      db.test.count({ where: { organizationId: orgId, isLive: true, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ])
    const activeTestsChange = lastMonthTests > 0 ? Math.round(((thisMonthTests - lastMonthTests) / lastMonthTests) * 100) : thisMonthTests > 0 ? 100 : 0

    // Completion rate change
    const [thisMonthAttempts, thisMonthCompleted, lastMonthAttempts, lastMonthCompleted] = await Promise.all([
      db.testAttempt.count({ where: { test: { organizationId: orgId }, startedAt: { gte: thisMonthStart } } }),
      db.testAttempt.count({ where: { test: { organizationId: orgId }, status: 'completed', completedAt: { gte: thisMonthStart } } }),
      db.testAttempt.count({ where: { test: { organizationId: orgId }, startedAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      db.testAttempt.count({ where: { test: { organizationId: orgId }, status: 'completed', completedAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ])
    const thisRate = thisMonthAttempts > 0 ? Math.round((thisMonthCompleted / thisMonthAttempts) * 100) : 0
    const lastRate = lastMonthAttempts > 0 ? Math.round((lastMonthCompleted / lastMonthAttempts) * 100) : 0
    const completionRateChange = lastRate > 0 ? thisRate - lastRate : 0

    return NextResponse.json({
      stats: {
        totalStudents,
        totalStudentsChange: studentChange,
        activeTests,
        activeTestsChange: activeTestsChange,
        revenue,
        revenueChange,
        completionRate,
        completionRateChange,
        pendingReportedQuestions,
        pendingOmrCount,
      },
      counts: {
        totalCourses,
        totalTestSeries,
        totalBlogs,
        totalQuestions,
        totalTestAttempts,
        completedTestAttempts,
      },
      recentActivities: recentActivities.slice(0, 10),
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
