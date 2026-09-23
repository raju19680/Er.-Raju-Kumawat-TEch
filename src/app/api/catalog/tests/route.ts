import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List all published test series (catalog)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const organizationId = searchParams.get('organizationId')

    const where: Record<string, unknown> = { status: 'published' }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (organizationId) {
      where.organizationId = organizationId
    }

    const testSeries = await db.testSeries.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, logo: true, accentColor: true },
        },
        _count: { select: { tests: true, purchasedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const categories = await db.testSeries.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
    })

    // Check purchases for logged-in student
    const session = await getSession()
    let purchasedIds: string[] = []
    if (session && session.role === 'STUDENT') {
      const purchases = await db.purchasedTestSeries.findMany({
        where: { studentId: session.id },
        select: { testSeriesId: true },
      })
      purchasedIds = purchases.map((p) => p.testSeriesId)
    }

    return NextResponse.json({
      success: true,
      testSeries: testSeries.map((t) => ({ ...t, isPurchased: purchasedIds.includes(t.id) })),
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (error) {
    console.error('Get catalog test series error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
