import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuthStudent(req)
    // Allow unauthenticated browsing (just mark purchased status)
    const student = authResult.student

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') || ''

    const offerings = await db.offering.findMany({
      where: {
        status: 'published',
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        mrp: true,
        validityMode: true,
        validityDays: true,
        endDate: true,
        featuredBullets: true,
        sortOrder: true,
        includedCourses: true,
        includedTestSeries: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // Check which offerings the student has purchased
    let purchasedOfferingIds: Set<string> = new Set()
    if (student) {
      const orders = await db.order.findMany({
        where: {
          studentId: student?.id || 'admin-bypass',
          status: 'completed',
        },
        select: { items: true },
      })
      orders.forEach(order => {
        try {
          const items = JSON.parse(order.items)
          items.forEach((item: any) => {
            if (item.type === 'offering' && item.id) {
              purchasedOfferingIds.add(item.id)
            }
          })
        } catch {
          // ignore parsing error
        }
      })
    }

    const result = offerings.map(o => ({
      ...o,
      featuredBulletsList: (() => {
        try {
          const b = (o as any).featuredBullets
          if (!b) return []
          if (typeof b === 'string') return JSON.parse(b)
          if (Array.isArray(b)) return b
          return []
        } catch { return [] }
      })(),
      purchased: purchasedOfferingIds.has(o.id),
    }))

    return NextResponse.json({ success: true, offerings: result })
  } catch (error) {
    console.error('Student offerings GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load offerings' }, { status: 500 })
  }
}
