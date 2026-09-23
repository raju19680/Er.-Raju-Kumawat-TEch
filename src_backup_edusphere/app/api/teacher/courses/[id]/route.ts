import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Get a specific course with lessons
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
    const course = await db.course.findFirst({
      where: { id, teacherId: session.id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a course
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
    const { title, description, price, category, level, language, duration, thumbnail, isPublished } = body

    const existing = await db.course.findFirst({ where: { id, teacherId: session.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price) || 0
    if (category !== undefined) updateData.category = category
    if (level !== undefined) updateData.level = level
    if (language !== undefined) updateData.language = language
    if (duration !== undefined) updateData.duration = parseInt(duration) || 0
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (isPublished !== undefined) updateData.isPublished = isPublished

    const course = await db.course.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a course
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
    const existing = await db.course.findFirst({ where: { id, teacherId: session.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    await db.course.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
