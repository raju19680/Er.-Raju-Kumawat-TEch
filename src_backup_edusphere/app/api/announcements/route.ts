import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List announcements for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    let where: Record<string, unknown> = { isActive: true }
    
    if (teacherId) {
      // Teacher's own announcements
      where.teacherId = teacherId
    } else if (session.role === 'STUDENT') {
      // Students see: global announcements targeted at ALL or STUDENTS, plus their teacher's announcements
      const student = await db.user.findUnique({
        where: { id: session.id },
        select: { teacherId: true },
      })
      where.OR = [
        { teacherId: null, targetType: { in: ['ALL', 'STUDENTS'] } },
        ...(student?.teacherId ? [{ teacherId: student.teacherId }] : []),
      ]
    } else if (session.role === 'TEACHER') {
      // Teachers see: global announcements targeted at ALL or TEACHERS, plus their own
      where.OR = [
        { teacherId: null, targetType: { in: ['ALL', 'TEACHERS'] } },
        { teacherId: session.id },
      ]
    }
    // Admin sees all

    const announcements = await db.announcement.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create announcement (admin or teacher)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, content, type, targetType, isPinned } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        targetType: targetType || (session.role === 'TEACHER' ? 'STUDENTS' : 'ALL'),
        isPinned: isPinned || false,
        teacherId: session.role === 'TEACHER' ? session.id : null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete announcement
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const announcementId = searchParams.get('id')

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Teachers can only delete their own announcements
    if (session.role === 'TEACHER' && announcement.teacherId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.announcement.delete({ where: { id: announcementId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
