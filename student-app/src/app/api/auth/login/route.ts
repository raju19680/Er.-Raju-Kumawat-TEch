import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, setSessionCookie, ensureAdminExists, type SessionUser } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rateCheck = checkRateLimit(ip, 'auth')
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many rapid login attempts. Security lockout active. Please wait ${rateCheck.retryAfter} seconds.`,
          retryAfter: rateCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfter),
          },
        }
      )
    }

    await ensureAdminExists()
    
    const body = await req.json()
    const { identifier, email, password } = body
    const loginEmail = (identifier || email || '').toLowerCase().trim()

    if (!loginEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: {
        email: loginEmail,
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

    const roleMapping: Record<string, 'ADMIN' | 'TEACHER' | 'STUDENT'> = {
      platform_admin: 'ADMIN',
      teacher: 'TEACHER',
      student: 'STUDENT',
    }

    // Generate a unique session ID for single-device login enforcement
    const sessionId = `sess_${Math.random().toString(36).substring(2)}_${Date.now()}`

    // Update activeSessionId on user to invalidate any other device sessions in real-time
    await db.user.update({
      where: { id: user.id },
      data: {
        activeSessionId: sessionId,
        lastLoginAt: new Date(),
      },
    })

    // If student, also update student record and track DeviceSession
    if (user.role === 'student') {
      const student = await db.student.findFirst({
        where: { userId: user.id },
      })
      if (student) {
        await db.student.update({
          where: { id: student.id },
          data: { activeSessionId: sessionId },
        })
        // Invalidate older active device sessions for this student
        await db.deviceSession.updateMany({
          where: { studentId: student.id, isActive: true },
          data: { isActive: false, logoutAt: new Date() },
        })
        // Register current device session
        const userAgent = req.headers.get('user-agent') || 'Mobile App'
        await db.deviceSession.create({
          data: {
            studentId: student.id,
            deviceId: sessionId,
            userAgent,
            deviceType: userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
            isActive: true,
            loginAt: new Date(),
          },
        })
      }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleMapping[user.role] || 'STUDENT',
      organizationId: user.organizationId,
      sessionId,
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
