import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Get a specific test series with tests and questions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const testSeries = await db.testSeries.findFirst({
      where: { id, teacherId: session.id },
      include: {
        tests: {
          include: { _count: { select: { questions: true, attempts: true } } },
          orderBy: { order: 'asc' },
        },
        _count: { select: { purchases: true } },
      },
    })

    if (!testSeries) {
      return NextResponse.json({ error: 'Test series not found' }, { status: 404 })
    }

    return NextResponse.json({ testSeries })
  } catch (error) {
    console.error('Get test series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a test series
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, price, category, isPublished } = body

    const existing = await db.testSeries.findFirst({ where: { id, teacherId: session.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Test series not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price) || 0
    if (category !== undefined) updateData.category = category
    if (isPublished !== undefined) updateData.isPublished = isPublished

    const testSeries = await db.testSeries.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ testSeries })
  } catch (error) {
    console.error('Update test series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a test series
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.testSeries.findFirst({ where: { id, teacherId: session.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Test series not found' }, { status: 404 })
    }

    await db.testSeries.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete test series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
