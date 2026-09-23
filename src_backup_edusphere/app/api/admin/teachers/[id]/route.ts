import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'

// GET - Get a specific teacher
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const teacher = await db.user.findFirst({
      where: { id, role: 'TEACHER' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        bio: true,
        avatar: true,
        organisationId: true,
        websiteSlug: true,
        teacherStatus: true,
        createdAt: true,
        _count: {
          select: {
            coursesTaught: true,
            testSeriesCreated: true,
            notesCreated: true,
            students: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json({ teacher })
  } catch (error) {
    console.error('Get teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a teacher
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, username, phone, bio, teacherStatus, password, websiteSlug } = body

    const existing = await db.user.findFirst({ where: { id, role: 'TEACHER' } })
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (email || username) {
      const conflict = await db.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(username ? [{ username }] : []),
          ],
          NOT: { id },
        },
      })
      if (conflict) {
        return NextResponse.json(
          { error: 'Email or username already in use' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email.toLowerCase()
    if (username !== undefined) updateData.username = username
    if (phone !== undefined) updateData.phone = phone
    if (bio !== undefined) updateData.bio = bio
    if (teacherStatus !== undefined) updateData.teacherStatus = teacherStatus
    if (websiteSlug !== undefined) updateData.websiteSlug = websiteSlug
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }
      updateData.password = await hashPassword(password)
    }

    const teacher = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        bio: true,
        organisationId: true,
        websiteSlug: true,
        teacherStatus: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ teacher })
  } catch (error) {
    console.error('Update teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a teacher
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.user.findFirst({ where: { id, role: 'TEACHER' } })
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
