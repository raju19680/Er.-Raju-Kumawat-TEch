import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List teacher's test series
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testSeries = await db.testSeries.findMany({
      where: { teacherId: session.id },
      include: {
        _count: { select: { tests: true, purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ testSeries })
  } catch (error) {
    console.error('Get test series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a test series
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, price, category } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const testSeries = await db.testSeries.create({
      data: {
        title,
        description,
        price: parseFloat(price) || 0,
        category: category || 'General',
        teacherId: session.id,
      },
    })

    return NextResponse.json({ testSeries }, { status: 201 })
  } catch (error) {
    console.error('Create test series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
