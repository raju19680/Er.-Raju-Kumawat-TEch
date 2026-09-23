import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List teacher's notes
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notes = await db.notes.findMany({
      where: { teacherId: session.id },
      include: {
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create notes
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, content, fileUrl, price, category, subject } = body

    if (!title || !description || !content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 }
      )
    }

    const notes = await db.notes.create({
      data: {
        title,
        description,
        content,
        fileUrl: fileUrl || null,
        price: parseFloat(price) || 0,
        category: category || 'General',
        subject: subject || null,
        teacherId: session.id,
      },
    })

    return NextResponse.json({ notes }, { status: 201 })
  } catch (error) {
    console.error('Create notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
