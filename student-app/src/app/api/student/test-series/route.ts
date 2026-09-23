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

    let studentId: string | null = null

    // Find student by userId if role is student
    if (isStudent) {
      const student = await db.student.findFirst({
        where: { userId: auth.id },
      })
      if (!student) {
        return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
      }
      studentId = student.id
    }

    const whereClause: any = { organizationId: auth.orgId, parentId: null }
    if (isStudent) {
      whereClause.status = 'published'
    }

    // Get test series for the student's org (only root folders)
    const testSeries = await db.testSeries.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        mrp: true,
        category: true,
        isCombo: true,
        status: true,
        tests: {
          select: { id: true, isLive: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Get purchased test series IDs from PurchasedTestSeries table
    const purchasedTestSeriesIds = new Set<string>()
    
    if (studentId) {
      const purchasedTestSeries = await db.purchasedTestSeries.findMany({
        where: { studentId },
        select: { testSeriesId: true },
      })
      for (const p of purchasedTestSeries) {
        purchasedTestSeriesIds.add(p.testSeriesId)
      }

      // Also check completed orders as fallback (for purchases made before PurchasedTestSeries was added)
      const completedOrders = await db.order.findMany({
        where: {
          studentId,
          status: 'completed',
        },
        select: { items: true },
      })

      for (const order of completedOrders) {
        try {
          const items = JSON.parse(order.items)
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.itemType === 'test_series' && item.itemId) {
                purchasedTestSeriesIds.add(item.itemId)
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }


    const formatted = testSeries.map((ts) => ({
      id: ts.id,
      title: ts.title,
      description: ts.description,
      thumbnail: ts.thumbnail,
      price: ts.price,
      mrp: ts.mrp,
      category: ts.category,
      isCombo: ts.isCombo,
      status: ts.status,
      testCount: ts.tests?.length || 0,
      liveTestCount: (ts.tests || []).filter((t: any) => t.isLive).length,
      purchased: isTeacher ? true : purchasedTestSeriesIds.has(ts.id),
    }))

    return NextResponse.json({ success: true, testSeries: formatted })
  } catch (error) {
    console.error('Student test-series list error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

// force recompile
