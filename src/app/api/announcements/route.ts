import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List announcements for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const target = searchParams.get('targetRole')

    const userRole = session ? (session.role === 'TEACHER' ? 'teacher' : session.role === 'ADMIN' ? 'all' : 'student') : 'student'

    const where: Record<string, unknown> = { isActive: true }
    if (target) {
      where.targetRole = target
    } else if (session?.role !== 'ADMIN') {
      where.targetRole = { in: ['all', userRole] }
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, announcements })
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create announcement (admin or teacher)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, message, content, type, targetRole } = body

    const msg = message || content
    if (!title || !msg) {
      return NextResponse.json({ success: false, message: 'Title and message are required' }, { status: 400 })
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        message: msg,
        type: type || 'info',
        targetRole: targetRole || 'all',
        createdById: session.id,
        createdByName: session.name || undefined,
      },
    })

    return NextResponse.json({ success: true, announcement }, { status: 201 })
  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete announcement
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const announcementId = searchParams.get('id')

    if (!announcementId) {
      return NextResponse.json({ success: false, message: 'Announcement ID is required' }, { status: 400 })
    }

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ success: false, message: 'Announcement not found' }, { status: 404 })
    }

    await db.announcement.delete({ where: { id: announcementId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
