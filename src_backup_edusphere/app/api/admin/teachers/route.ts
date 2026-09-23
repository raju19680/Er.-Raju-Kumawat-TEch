import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'

// GET - List all teachers
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teachers = await db.user.findMany({
      where: { role: 'TEACHER' },
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
        avatar: true,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('Get teachers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new teacher (admin adds teacher with credentials)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, username, password, name, phone, bio } = body

    if (!email || !username || !password || !name) {
      return NextResponse.json(
        { error: 'Email, username, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email or username already in use' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const slugBase = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const organisationId = `ORG-${slugBase}-${Date.now().toString(36).toUpperCase()}`
    
    let websiteSlug = slugBase
    let suffix = 1
    while (await db.user.findFirst({ where: { websiteSlug } })) {
      websiteSlug = `${slugBase}-${suffix}`
      suffix++
    }

    const teacher = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        name,
        phone,
        bio,
        role: 'TEACHER',
        organisationId,
        websiteSlug,
        teacherStatus: 'APPROVED', // Admin-created teachers are auto-approved
      },
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

    return NextResponse.json({ teacher }, { status: 201 })
  } catch (error) {
    console.error('Create teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
