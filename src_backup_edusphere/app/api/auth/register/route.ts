import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, setSessionCookie, type SessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, username, password, name, role } = body

    if (!email || !username || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Only student and teacher self-registration allowed.' },
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
    
    let organisationId: string | null = null
    let websiteSlug: string | null = null
    let teacherStatus: string = 'NONE'

    if (role === 'TEACHER') {
      teacherStatus = 'PENDING'
      const slugBase = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
      organisationId = `ORG-${slugBase}-${Date.now().toString(36).toUpperCase()}`
      websiteSlug = slugBase
      
      let suffix = 1
      let testSlug = websiteSlug
      while (await db.user.findFirst({ where: { websiteSlug: testSlug } })) {
        testSlug = `${slugBase}-${suffix}`
        suffix++
      }
      websiteSlug = testSlug
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        name: name || username,
        role,
        organisationId,
        websiteSlug,
        teacherStatus,
      },
    })

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role as 'ADMIN' | 'TEACHER' | 'STUDENT',
      organisationId: user.organisationId,
      websiteSlug: user.websiteSlug,
      teacherStatus: user.teacherStatus,
    }

    const token = createToken(sessionUser)
    await setSessionCookie(token)

    return NextResponse.json({ user: sessionUser })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
