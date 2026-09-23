export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'test-series')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: testSeriesId } = await params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Find tests in this test series
    const tests = await db.test.findMany({
      where: { testSeriesId },
      select: { id: true },
    })
    const testIds = tests.map((t) => t.id)

    if (testIds.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        limit,
      })
    }

    // Find unique student IDs who have attempted these tests
    const attempts = await db.testAttempt.findMany({
      where: { testId: { in: testIds } },
      select: { studentId: true },
      distinct: ['studentId'],
    })
    const studentIds = attempts.map((a) => a.studentId)

    if (studentIds.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        limit,
      })
    }

    // Build search filter
    const where: Record<string, unknown> = { id: { in: studentIds } }
    if (search) {
      where.OR = [
        { name: { contains: search,  } },
        { email: { contains: search,  } },
        { phone: { contains: search } },
      ]
    }

    const [items, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          testAttempts: {
            where: { testId: { in: testIds } },
            select: { id: true, testId: true, startedAt: true, status: true },
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
          orders: {
            where: { status: 'completed' },
            select: { id: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      db.student.count({ where }),
    ])

    const mappedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      avatar: item.avatar,
      isActive: item.isActive,
      isBlocked: item.isBlocked,
      purchaseDate: item.orders[0]?.createdAt || item.testAttempts[0]?.startedAt || item.createdAt,
      status: item.isBlocked ? 'blocked' : item.isActive ? 'active' : 'inactive',
      testAttemptCount: item.testAttempts.length,
    }))

    return NextResponse.json({
      items: mappedItems,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Failed to fetch test series students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

