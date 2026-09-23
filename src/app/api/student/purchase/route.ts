import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST - Purchase notes or test series
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await db.student.findFirst({
      where: { userId: session.id }
    })
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

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
        where: { studentId_digitalProductId: { studentId: student.id, digitalProductId: itemId } },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }

      await db.purchasedDigitalProduct.create({
        data: { studentId: student.id, digitalProductId: itemId },
      })

      // We should create a real payment order here via Razorpay in the future.
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
        where: { studentId_testSeriesId: { studentId: student.id, testSeriesId: itemId } },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }

      await db.purchasedTestSeries.create({
        data: { studentId: student.id, testSeriesId: itemId, organizationId: ts.organizationId },
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
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await db.student.findFirst({
      where: { userId: session.id }
    })
    
    if (!student) {
      return NextResponse.json({ digitalProductPurchases: [], testSeriesPurchases: [] })
    }

    const [digitalProductPurchases, testSeriesPurchases] = await Promise.all([
      db.purchasedDigitalProduct.findMany({
        where: { studentId: student.id },
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
        where: { studentId: student.id },
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
