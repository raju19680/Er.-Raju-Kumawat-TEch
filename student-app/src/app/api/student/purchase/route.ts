import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

// POST - Purchase digital product or test series
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthStudent(req)
    if (!auth || !auth.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = auth.student
    const body = await req.json()
    const { itemType, itemId } = body // itemType: 'DIGITAL_PRODUCT' | 'TEST_SERIES'

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'Item type and item ID are required' },
        { status: 400 }
      )
    }

    if (itemType === 'DIGITAL_PRODUCT') {
      const product = await db.digitalProduct.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, price: true, status: true },
      })

      if (!product || product.status !== 'published') {
        return NextResponse.json({ error: 'Product not available' }, { status: 404 })
      }

      const existing = await db.purchasedDigitalProduct.findUnique({
        where: { studentId_digitalProductId: { studentId: student?.id || 'admin-bypass', digitalProductId: itemId } },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }

      await db.purchasedDigitalProduct.create({
        data: { studentId: student?.id || 'admin-bypass', digitalProductId: itemId },
      })

      return NextResponse.json({ success: true }, { status: 201 })
    }

    if (itemType === 'TEST_SERIES') {
      const ts = await db.testSeries.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, price: true, status: true, organizationId: true },
      })

      if (!ts || ts.status !== 'published') {
        return NextResponse.json({ error: 'Test series not available' }, { status: 404 })
      }

      const existing = await db.purchasedTestSeries.findUnique({
        where: { studentId_testSeriesId: { studentId: student?.id || 'admin-bypass', testSeriesId: itemId } },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }

      await db.purchasedTestSeries.create({
        data: { studentId: student?.id || 'admin-bypass', testSeriesId: itemId, organizationId: ts.organizationId },
      })

      return NextResponse.json({ success: true }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List student's purchases
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthStudent(req)
    if (!auth || !auth.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = auth.student

    const [digitalProductPurchases, testSeriesPurchases] = await Promise.all([
      db.purchasedDigitalProduct.findMany({
        where: { studentId: student?.id || 'admin-bypass' },
        include: {
          digitalProduct: {
            include: {
              organization: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.purchasedTestSeries.findMany({
        where: { studentId: student?.id || 'admin-bypass' },
        include: {
          testSeries: {
            include: {
              organization: { select: { id: true, name: true } },
              _count: { select: { tests: true } },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      }),
    ])

    return NextResponse.json({ digitalProductPurchases, testSeriesPurchases })
  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
