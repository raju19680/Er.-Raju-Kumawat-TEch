// ─── Reset Password API Route ─────────────────────────────────────────────
// Accepts reset token + new password, validates the token, and updates the password.
// Rate-limited to prevent brute-force token guessing.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validatePasswordStrength, checkAccountLock } from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

// Rate limit: 5 attempts per minute per IP
const RESET_ATTEMPT_RATE_LIMIT = 5
const resetAttemptMap = new Map<string, { count: number; resetTime: number }>()

function checkResetAttemptLimit(key: string): boolean {
  const now = Date.now()
  const entry = resetAttemptMap.get(key)

  if (!entry || now >= entry.resetTime) {
    resetAttemptMap.set(key, { count: 1, resetTime: now + 60_000 })
    return true
  }

  entry.count += 1
  return entry.count <= RESET_ATTEMPT_RATE_LIMIT
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──
    const clientIp = getClientIp(req.headers)
    if (!checkResetAttemptLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { token, password } = body

    // ── Validate required fields ──
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Reset token and new password are required.' },
        { status: 400 }
      )
    }

    // ── Validate password strength ──
    const strengthResult = validatePasswordStrength(password)
    if (strengthResult.score < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Password is too weak. ${strengthResult.feedback.join('. ')}`,
          feedback: strengthResult.feedback,
        },
        { status: 400 }
      )
    }

    // ── Find user with this reset token ──
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token must not be expired
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // ── Check if account is locked ──
    const lockCheck = checkAccountLock(user.failedLoginAttempts, user.lockedUntil)
    if (lockCheck.locked) {
      return NextResponse.json(
        { success: false, error: 'Your account is temporarily locked. Please wait before resetting your password.' },
        { status: 403 }
      )
    }

    // ── Hash the new password ──
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // ── Update user: set new password, clear reset token, reset failed attempts ──
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    // ── Log to audit ──
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'auth.reset-password',
          category: 'auth',
          details: JSON.stringify({ email: user.email }),
          ipAddress: clientIp,
          organizationId: user.organizationId,
        },
      })
    } catch {
      // Audit logging is non-critical
    }

    console.log(`[RESET-PASSWORD] Password reset successful for ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    console.error('[RESET-PASSWORD] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── GET: Validate reset token ──────────────────────────────────────────────
// Allows the frontend to check if a token is still valid before showing the form.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Reset token is required.' },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        organization: {
          select: { code: true }
        }
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        orgCode: user.organization?.code,
      },
    })
  } catch (error) {
    console.error('[RESET-PASSWORD] Token validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}
