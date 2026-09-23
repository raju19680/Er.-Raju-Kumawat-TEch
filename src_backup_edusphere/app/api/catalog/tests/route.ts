import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List all published test series (catalog)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const teacherId = searchParams.get('teacherId')

    const where: Record<string, unknown> = { isPublished: true }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (teacherId) {
      where.teacherId = teacherId
    }

    const testSeries = await db.testSeries.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, username: true, avatar: true, organisationId: true },
        },
        _count: { select: { tests: true, purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const categories = await db.testSeries.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    })

    // Check purchases for logged-in student
    const session = await getSession()
    let purchasedIds: string[] = []
    if (session && session.role === 'STUDENT') {
      const purchases = await db.testSeriesPurchase.findMany({
        where: { userId: session.id },
        select: { testSeriesId: true },
      })
      purchasedIds = purchases.map((p) => p.testSeriesId)
    }

    return NextResponse.json({
      testSeries: testSeries.map((t) => ({ ...t, isPurchased: purchasedIds.includes(t.id) })),
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (error) {
    console.error('Get catalog test series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
