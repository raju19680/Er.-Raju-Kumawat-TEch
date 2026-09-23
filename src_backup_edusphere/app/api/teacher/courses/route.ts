import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List teacher's courses
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await db.course.findMany({
      where: { teacherId: session.id },
      include: {
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new course
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, price, category, level, language, duration, thumbnail } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const course = await db.course.create({
      data: {
        title,
        description,
        price: parseFloat(price) || 0,
        category: category || 'General',
        level: level || 'Beginner',
        language: language || 'English',
        duration: parseInt(duration) || 0,
        thumbnail: thumbnail || null,
        teacherId: session.id,
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
