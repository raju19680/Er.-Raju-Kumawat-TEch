import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, setSessionCookie, ensureAdminExists, type SessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await ensureAdminExists()
    
    const body = await req.json()
    const { identifier, password } = body // identifier can be email or username

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.role === 'TEACHER' && user.teacherStatus === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact the administrator.' },
        { status: 403 }
      )
    }

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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
