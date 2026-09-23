export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDemoOrgId } from '@/lib/demo-org'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'reports')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const tab = searchParams.get('tab') || 'sales'
    const period = searchParams.get('period') || '30d'
    const orgId = await getDemoOrgId(request)

    // Calculate date filter
    const now = new Date()
    let dateFrom: Date | null = null
    if (period === '7d') dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else if (period === '30d') dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    else if (period === '90d') dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    else if (period === '12m') dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    // 'all' => no date filter

    if (tab === 'sales') {
      // Payment data for revenue
      const paymentWhere: Record<string, unknown> = {
        organizationId: orgId,
        status: 'success',
      }
      if (dateFrom) paymentWhere.createdAt = { gte: dateFrom }

      const payments = await db.payment.findMany({
        where: paymentWhere,
        orderBy: { createdAt: 'desc' },
      })

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
      const avgOrderValue = payments.length > 0 ? totalRevenue / payments.length : 0

      // Top test series by revenue
      const orders = await db.order.findMany({
        where: {
          organizationId: orgId,
          status: 'completed',
          ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { name: true, email: true } } },
      })

      // Revenue by month for chart (last 12 months)
      const monthlyRevenue: { month: string; revenue: number; orders: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthPayments = payments.filter(p => {
          const pd = new Date(p.createdAt)
          return pd >= d && pd <= monthEnd
        })
        monthlyRevenue.push({
          month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: monthPayments.reduce((s, p) => s + p.amount, 0),
          orders: monthPayments.length,
        })
      }

      // Top products (courses, test series, digital products)
      const [courses, testSeries, digitalProducts] = await Promise.all([
        db.course.findMany({ where: { organizationId: orgId }, select: { id: true, title: true, price: true } }),
        db.testSeries.findMany({ where: { organizationId: orgId }, select: { id: true, title: true, price: true } }),
        db.digitalProduct.findMany({ where: { organizationId: orgId }, select: { id: true, title: true, price: true } }),
      ])

      const allProducts = [
        ...courses.map(c => ({ ...c, type: 'Course' })),
        ...testSeries.map(t => ({ ...t, type: 'Test Series' })),
        ...digitalProducts.map(d => ({ ...d, type: 'Digital Product' })),
      ]

      const topSeries = allProducts.map(prod => {
        const matchingOrders = orders.filter(o => {
          try {
            const items = JSON.parse(o.items || '[]')
            return items.some((item: any) => item.courseId === prod.id || item.testSeriesId === prod.id || item.digitalProductId === prod.id || item.title === prod.title)
          } catch { return false }
        })
        return {
          id: prod.id,
          title: `${prod.title} (${prod.type})`,
          revenue: matchingOrders.reduce((s, o) => s + o.finalAmount, 0),
          orders: matchingOrders.length,
        }
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      return NextResponse.json({
        success: true,
        tab: 'sales',
        data: {
          totalRevenue,
          avgOrderValue,
          totalOrders: orders.length,
          monthlyRevenue,
          topSeries,
          recentOrders: orders.slice(0, 20).map(o => ({
            id: o.id,
            studentName: o.student?.name || 'Unknown',
            studentEmail: o.student?.email || '',
            items: o.items,
            totalAmount: o.totalAmount,
            finalAmount: o.finalAmount,
            status: o.status,
            createdAt: o.createdAt,
          })),
        },
      })
    }

    if (tab === 'orders') {
      const orderWhere: Record<string, unknown> = { organizationId: orgId }
      if (dateFrom) orderWhere.createdAt = { gte: dateFrom }

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where: orderWhere,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { student: { select: { name: true, email: true } } },
        }),
        db.order.count({ where: orderWhere }),
      ])

      const orderStats = {
        total,
        completed: orders.filter(o => o.status === 'completed').length,
        pending: orders.filter(o => o.status === 'pending').length,
        failed: orders.filter(o => o.status === 'failed').length,
        totalAmount: orders.reduce((s, o) => s + o.finalAmount, 0),
      }

      return NextResponse.json({
        success: true,
        tab: 'orders',
        data: {
          stats: orderStats,
          orders: orders.map(o => ({
            id: o.id,
            studentName: o.student?.name || 'Unknown',
            studentEmail: o.student?.email || '',
            items: o.items,
            totalAmount: o.totalAmount,
            discountAmount: o.discountAmount,
            finalAmount: o.finalAmount,
            status: o.status,
            couponCode: o.couponCode,
            createdAt: o.createdAt,
          })),
          total,
        },
      })
    }

    if (tab === 'students') {
      const studentWhere: Record<string, unknown> = { organizationId: orgId }
      if (dateFrom) studentWhere.createdAt = { gte: dateFrom }

      const [students, totalStudents] = await Promise.all([
        db.student.findMany({
          where: studentWhere,
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            _count: { select: { testAttempts: true, orders: true } },
          },
        }),
        db.student.count({ where: studentWhere }),
      ])

      // Student growth by month
      const allStudents = await db.student.findMany({
        where: { organizationId: orgId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })

      const monthlyGrowth: { month: string; count: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const count = allStudents.filter(s => {
          const sd = new Date(s.createdAt)
          return sd >= d && sd <= monthEnd
        }).length
        monthlyGrowth.push({
          month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count,
        })
      }

      // Cumulative growth
      let cumulative = 0
      const cumulativeGrowth = monthlyGrowth.map(m => {
        cumulative += m.count
        return { ...m, cumulative }
      })

      const activeStudents = await db.student.count({
        where: { organizationId: orgId, isActive: true, isBlocked: false },
      })

      const newSignups = await db.student.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      })

      return NextResponse.json({
        success: true,
        tab: 'students',
        data: {
          totalStudents,
          activeStudents,
          newSignups,
          monthlyGrowth: cumulativeGrowth,
          students: students.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            isActive: s.isActive,
            isBlocked: s.isBlocked,
            testAttempts: s._count.testAttempts,
            orders: s._count.orders,
            createdAt: s.createdAt,
          })),
        },
      })
    }

    if (tab === 'progress') {
      const studentWhere: Record<string, unknown> = { organizationId: orgId }
      
      const [students, courses, allAttempts] = await Promise.all([
        db.student.findMany({
          where: studentWhere,
          include: {
            testAttempts: {
              where: { status: 'completed' },
              include: { test: { select: { title: true, totalMarks: true } } }
            },
            lessonProgress: true,
            purchasedCourses: true,
          },
        }),
        db.course.findMany({
          where: { organizationId: orgId },
          include: { modules: { include: { _count: { select: { lessons: true } } } } }
        }),
        db.testAttempt.findMany({
          where: {
            status: 'completed',
            test: { organizationId: orgId }
          },
          include: { test: { select: { id: true, title: true, totalMarks: true } } }
        })
      ])

      const courseLessonCount: Record<string, number> = {}
      courses.forEach(c => {
        courseLessonCount[c.id] = c.modules.reduce((sum, m) => sum + m._count.lessons, 0)
      })

      let totalTestScores = 0
      let totalTestPossible = 0
      let totalCompletedLessons = 0
      let totalPossibleLessons = 0

      const studentProgressData = students.map(s => {
        let studentCompletedLessons = s.lessonProgress.filter(lp => lp.status === 'completed').length
        let studentPossibleLessons = 0
        s.purchasedCourses.forEach(pc => {
          studentPossibleLessons += (courseLessonCount[pc.courseId] || 0)
        })
        const courseCompletionPercent = studentPossibleLessons > 0 ? Math.round((studentCompletedLessons / studentPossibleLessons) * 100) : 0
        
        totalCompletedLessons += studentCompletedLessons
        totalPossibleLessons += studentPossibleLessons

        let studentScore = 0
        let studentPossibleScore = 0
        s.testAttempts.forEach(ta => {
          studentScore += ta.score
          studentPossibleScore += ta.totalMarks || ta.test?.totalMarks || 100
          
          totalTestScores += ta.score
          totalTestPossible += ta.totalMarks || ta.test?.totalMarks || 100
        })
        const testScorePercent = studentPossibleScore > 0 ? Math.round((studentScore / studentPossibleScore) * 100) : 0

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          courseCompletionPercent,
          testScorePercent,
          lastActive: s.lessonProgress.length > 0 ? s.lessonProgress.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0].updatedAt : s.createdAt
        }
      })

      const avgCompletionRate = totalPossibleLessons > 0 ? Math.round((totalCompletedLessons / totalPossibleLessons) * 100) : 0
      const avgTestScore = totalTestPossible > 0 ? Math.round((totalTestScores / totalTestPossible) * 100) : 0
      const activeStudents = students.filter(s => s.isActive && !s.isBlocked).length

      const testStats: Record<string, { title: string, totalScore: number, totalPossible: number, count: number }> = {}
      allAttempts.forEach(a => {
        if (!testStats[a.testId]) {
          testStats[a.testId] = { title: a.test.title, totalScore: 0, totalPossible: 0, count: 0 }
        }
        testStats[a.testId].totalScore += a.score
        testStats[a.testId].totalPossible += a.totalMarks || a.test.totalMarks || 100
        testStats[a.testId].count++
      })

      const topTests = Object.values(testStats).map(t => ({
        title: t.title,
        avgScore: Math.round((t.totalScore / t.totalPossible) * 100),
        attempts: t.count
      })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5)

      return NextResponse.json({
        success: true,
        tab: 'progress',
        data: {
          overall: { avgCompletionRate, avgTestScore, activeStudents },
          topTests,
          studentProgress: studentProgressData.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()).slice(0, 50)
        }
      })
    }

    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

