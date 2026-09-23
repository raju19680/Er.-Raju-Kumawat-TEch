import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { encode } from 'next-auth/jwt'
import { db } from '@/lib/db'
import {
  sanitizeEmail,
  checkAccountLock,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MINUTES,
} from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/auth/direct-login
 *
 * Direct login endpoint that bypasses the NextAuth callback redirect.
 * This solves the issue where NextAuth's 302 redirect goes to an
 * inaccessible URL when behind a reverse proxy (Caddy).
 *
 * Flow:
 * 1. Validates credentials (same logic as NextAuth's authorize)
 * 2. Creates a NextAuth-compatible JWT using next-auth/jwt encode()
 * 3. Sets the session cookie directly
 * 4. Returns user data as JSON
 *
 * The client calls this instead of next-auth/react's signIn().
 */
export async function POST(req: NextRequest) {
  // Rate limit with brute force cooldown
  const clientIp = getClientIp(req.headers)
  const rateLimitResult = checkRateLimit(clientIp, 'auth')
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many login attempts. Security lockout active. Please wait ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter),
        },
      }
    )
  }

  try {
    const body = await req.json()
    const { email: rawEmail, password, orgId: rawOrgId, twoFactorCode } = body

    if (!rawEmail || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!rawOrgId || !rawOrgId.trim()) {
      return NextResponse.json(
        { success: false, message: 'Institute ID is required' },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(rawEmail)
    const providedOrgId = rawOrgId.trim()

    // ── Step 1: Verify Organization exists ──
    const orgByCode = await db.organization.findUnique({
      where: { code: providedOrgId },
    })
    const orgById = !orgByCode ? await db.organization.findUnique({
      where: { id: providedOrgId },
    }) : null
    const matchedOrg = orgByCode || orgById

    if (!matchedOrg) {
      await new Promise(r => setTimeout(r, 100))
      return NextResponse.json(
        { success: false, message: 'Invalid Institute ID. Please check and try again.' },
        { status: 401 }
      )
    }

    // ── Step 2: Find user ──
    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    if (!user) {
      await new Promise(r => setTimeout(r, 100))
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ── Step 3: Verify user belongs to this organization ──
    if (user.role !== 'platform_admin' && user.organizationId !== matchedOrg.id) {
      await new Promise(r => setTimeout(r, 100))
      return NextResponse.json(
        { success: false, message: 'You are not authorized to access this institute.' },
        { status: 401 }
      )
    }

    // ── Step 4: Check account lock ──
    const lockCheck = checkAccountLock(user.failedLoginAttempts, user.lockedUntil)
    if (lockCheck.locked) {
      if (lockCheck.remainingMinutes === 0) {
        await db.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        })
      } else {
        return NextResponse.json(
          { success: false, message: `Account temporarily locked. Try again in ${lockCheck.remainingMinutes} minute${lockCheck.remainingMinutes !== 1 ? 's' : ''}.` },
          { status: 403 }
        )
      }
    }

    // ── Step 5: Verify password ──
    const isValid = await compare(password, user.password)

    if (!isValid) {
      await new Promise(r => setTimeout(r, 100))

      const newFailedCount = user.failedLoginAttempts + 1
      const lockUntil =
        newFailedCount >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
          : user.lockedUntil

      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedCount,
          lockedUntil: lockUntil,
        },
      })

      await db.loginAttempt.create({
        data: { email: user.email, success: false, ipAddress: clientIp, userAgent: req.headers.get('user-agent')?.slice(0, 500) || null },
      })

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json(
          { success: false, message: `Account temporarily locked. Try again in ${LOCK_DURATION_MINUTES} minutes.` },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ── Step 6: Check Two-Factor Authentication ──
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { success: false, message: '2FA_REQUIRED', requires2FA: true },
          { status: 200 }
        )
      }

      const { verifyTOTP, verifyBackupCode } = await import('@/lib/totp')
      const isValidTOTP = verifyTOTP(user.twoFactorSecret, twoFactorCode)

      if (!isValidTOTP) {
        if (user.twoFactorBackupCodes) {
          const result = verifyBackupCode(twoFactorCode, user.twoFactorBackupCodes)
          if (result.valid) {
            await db.user.update({
              where: { id: user.id },
              data: { twoFactorBackupCodes: JSON.stringify(result.remainingCodes) },
            })
          } else {
            await db.loginAttempt.create({
              data: { email: user.email, success: false, ipAddress: clientIp, userAgent: req.headers.get('user-agent')?.slice(0, 500) || null },
            })
            return NextResponse.json(
              { success: false, message: 'Invalid 2FA verification code' },
              { status: 401 }
            )
          }
        } else {
          await db.loginAttempt.create({
            data: { email: user.email, success: false, ipAddress: clientIp, userAgent: req.headers.get('user-agent')?.slice(0, 500) || null },
          })
          return NextResponse.json(
            { success: false, message: 'Invalid 2FA verification code' },
            { status: 401 }
          )
        }
      }
    }

    // ── Step 7: Successful login ──
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    })

    await db.loginAttempt.create({
      data: { email: user.email, success: true, ipAddress: clientIp, userAgent: req.headers.get('user-agent')?.slice(0, 500) || null },
    })

    // ── Step 8: Prepare user data ──
    const effectiveOrg = user.organization || matchedOrg

    if (!effectiveOrg) {
      return NextResponse.json(
        { success: false, message: 'Your account is not linked to any institute. Please contact support.' },
        { status: 400 }
      )
    }

    // Auto-fix: If platform_admin has no organizationId, link them
    if (user.role === 'platform_admin' && !user.organizationId && matchedOrg) {
      await db.user.update({
        where: { id: user.id },
        data: { organizationId: matchedOrg.id },
      })
    }

    const normalizedRole = user.role.toLowerCase()
    const loginMode = (normalizedRole === 'platform_admin' || normalizedRole === 'admin' || normalizedRole === 'org_admin') ? 'admin' : (normalizedRole === 'student' || normalizedRole === 'user') ? 'student' : 'cms'

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: effectiveOrg.id,
      orgCode: effectiveOrg.code,
      orgName: effectiveOrg.name,
      orgAccent: effectiveOrg.accentColor,
      loginMode,
    }

    // ── Step 9: Create NextAuth session cookie using NextAuth's encode() ──
    // This is the KEY FIX: Use NextAuth's own encode() function to create the JWT,
    // ensuring 100% format compatibility with NextAuth's decode() and session reading.
    try {
      const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'er-raju-kumawat-tech-secret-key-2024'

      // Create the JWT token using NextAuth's encode() — this ensures the exact same
      // format that NextAuth creates during its normal signIn() flow, including the
      // correct claims structure that jwt/session callbacks expect.
      const token = await encode({
        token: {
          // Standard NextAuth claims (needed for session.user base fields)
          name: userData.name,
          email: userData.email,
          picture: null,
          sub: userData.id,
          // Custom claims (added by our jwt callback)
          id: userData.id,
          role: userData.role,
          orgId: userData.orgId,
          orgCode: userData.orgCode,
          orgName: userData.orgName,
          orgAccent: userData.orgAccent,
          loginMode: userData.loginMode,
        },
        secret: AUTH_SECRET,
        maxAge: 8 * 60 * 60, // 8 hours — must match session.maxAge in auth-options.ts
      })

      // Set the session cookie — same settings NextAuth uses internally
      const response = NextResponse.json({
        success: true,
        user: userData,
        apiToken: token,  // Return token directly so client can save to localStorage
      })

      response.cookies.set('next-auth.session-token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        secure: false,
      })

      // Also set a non-httpOnly cookie with the token so middleware can read it
      // This is the KEY fix for cross-origin preview environments
      response.cookies.set('erkt_api_token', token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        secure: false,
      })

      // Also set the callback URL cookie that NextAuth expects
      response.cookies.set('next-auth.callback-url', '/', {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60,
        secure: false,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log(`[DIRECT-LOGIN] Session cookie set for: ${userData.email} | Role: ${userData.role} | LoginMode: ${userData.loginMode}`)
      }

      return response
    } catch (jwtError) {
      console.error('[DIRECT-LOGIN] JWT creation error:', jwtError)
      // Still return user data even if JWT creation fails — the client can still
      // function using the Zustand store, just without persistent sessions
      return NextResponse.json({
        success: true,
        user: userData,
        warning: 'Session cookie could not be set. Your session will not persist after page refresh.',
      })
    }
  } catch (error) {
    console.error('[DIRECT-LOGIN] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    )
  }
}
