import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Get specific notes
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
    const notes = await db.notes.findFirst({
      where: { id, teacherId: session.id },
      include: { _count: { select: { purchases: true } } },
    })

    if (!notes) {
      return NextResponse.json({ error: 'Notes not found' }, { status: 404 })
    }

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update notes
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
    const { title, description, content, fileUrl, price, category, subject, isPublished } = body

    const existing = await db.notes.findFirst({ where: { id, teacherId: session.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Notes not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (content !== undefined) updateData.content = content
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl
    if (price !== undefined) updateData.price = parseFloat(price) || 0
    if (category !== undefined) updateData.category = category
    if (subject !== undefined) updateData.subject = subject
    if (isPublished !== undefined) updateData.isPublished = isPublished

    const notes = await db.notes.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Update notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete notes
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
    const existing = await db.notes.findFirst({ where: { id, teacherId: session.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Notes not found' }, { status: 404 })
    }

    await db.notes.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
