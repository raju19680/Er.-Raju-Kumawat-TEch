import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List all published notes / digital products (catalog)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const organizationId = searchParams.get('organizationId')

    const where: Record<string, unknown> = {
      status: 'published',
      type: { in: ['notes', 'ebook', 'course', 'other'] },
    }
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

    const notes = await db.digitalProduct.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, logo: true, accentColor: true },
        },
        _count: { select: { purchasedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const categories = await db.digitalProduct.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
    })

    const session = await getSession()
    let purchasedIds: string[] = []
    if (session && session.role === 'STUDENT') {
      const purchases = await db.purchasedDigitalProduct.findMany({
        where: { studentId: session.id },
        select: { digitalProductId: true },
      })
      purchasedIds = purchases.map((p) => p.digitalProductId)
    }

    return NextResponse.json({
      success: true,
      notes: notes.map((n) => ({ ...n, isPurchased: purchasedIds.includes(n.id) })),
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (error) {
    console.error('Get catalog notes error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
