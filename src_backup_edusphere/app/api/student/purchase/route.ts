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

    const body = await req.json()
    const { itemType, itemId } = body // itemType: 'NOTES' | 'TEST_SERIES'

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'Item type and item ID are required' },
        { status: 400 }
      )
    }

    if (itemType === 'NOTES') {
      const notes = await db.notes.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, price: true, isPublished: true },
      })

      if (!notes || !notes.isPublished) {
        return NextResponse.json({ error: 'Notes not available' }, { status: 404 })
      }

      const existing = await db.notesPurchase.findUnique({
        where: { userId_notesId: { userId: session.id, notesId: itemId } },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }

      await db.notesPurchase.create({
        data: { userId: session.id, notesId: itemId },
      })

      if (notes.price > 0) {
        await db.payment.create({
          data: {
            userId: session.id,
            amount: notes.price,
            type: 'NOTES',
            itemId: notes.id,
            itemName: notes.title,
            status: 'COMPLETED',
          },
        })
      }

      return NextResponse.json({ success: true }, { status: 201 })
    }

    if (itemType === 'TEST_SERIES') {
      const ts = await db.testSeries.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, price: true, isPublished: true },
      })

      if (!ts || !ts.isPublished) {
        return NextResponse.json({ error: 'Test series not available' }, { status: 404 })
      }

      const existing = await db.testSeriesPurchase.findUnique({
        where: { userId_testSeriesId: { userId: session.id, testSeriesId: itemId } },
      })

      if (existing) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }

      await db.testSeriesPurchase.create({
        data: { userId: session.id, testSeriesId: itemId },
      })

      if (ts.price > 0) {
        await db.payment.create({
          data: {
            userId: session.id,
            amount: ts.price,
            type: 'TEST_SERIES',
            itemId: ts.id,
            itemName: ts.title,
            status: 'COMPLETED',
          },
        })
      }

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

    const [notesPurchases, testSeriesPurchases] = await Promise.all([
      db.notesPurchase.findMany({
        where: { userId: session.id },
        include: {
          notes: {
            include: {
              teacher: { select: { id: true, name: true, username: true } },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      }),
      db.testSeriesPurchase.findMany({
        where: { userId: session.id },
        include: {
          testSeries: {
            include: {
              teacher: { select: { id: true, name: true, username: true } },
              _count: { select: { tests: true } },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      }),
    ])

    return NextResponse.json({ notesPurchases, testSeriesPurchases })
  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
