// ─── Forgot Password API Route ─────────────────────────────────────────────
// Accepts email + orgId, generates a secure reset token, and sends a reset email.
// Rate-limited to 5 requests per minute per IP to prevent abuse.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeEmail } from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

// Stricter rate limit for password reset: 5 requests per minute
const RESET_RATE_LIMIT_WINDOW = 60_000
const RESET_RATE_LIMIT_MAX = 5
const resetRateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkResetRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = resetRateLimitMap.get(key)

  if (!entry || now >= entry.resetTime) {
    resetRateLimitMap.set(key, { count: 1, resetTime: now + RESET_RATE_LIMIT_WINDOW })
    return true
  }

  entry.count += 1
  return entry.count <= RESET_RATE_LIMIT_MAX
}

// Token expiry: 1 hour
const TOKEN_EXPIRY_HOURS = 1

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──
    const clientIp = getClientIp(req.headers)
    if (!checkResetRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Also check the general rate limiter
    const rateLimitResult = checkRateLimit(`forgot-password:${clientIp}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { email: rawEmail, orgId: rawOrgId, source } = body

    // ── Validate required fields ──
    if (!rawEmail || !rawOrgId) {
      return NextResponse.json(
        { success: false, error: 'Email and Institute ID are required.' },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(rawEmail)
    const orgId = rawOrgId.trim()

    if (!email || !orgId) {
      return NextResponse.json(
        { success: false, error: 'Please provide valid email and Institute ID.' },
        { status: 400 }
      )
    }

    // ── Find the organization (by code first, then by ID) ──
    let organization = await db.organization.findUnique({
      where: { code: orgId },
    })
    if (!organization) {
      organization = await db.organization.findUnique({
        where: { id: orgId },
      })
    }

    if (!organization) {
      // Don't reveal whether the org exists — always return success-like message
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
      })
    }

    // ── Find the user ──
    const user = await db.user.findFirst({
      where: {
        email,
        organizationId: organization.id,
      },
    })

    if (!user) {
      // Don't reveal whether the user exists — always return same message
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
      })
    }

    // ── Check if account is locked ──
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      // Don't reveal lock status directly, just say reset link sent
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
      })
    }

    // ── Generate secure reset token ──
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // ── Save token to user record ──
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // ── Build reset link ──
    // The reset link points to the same app with a ?reset_token= query parameter
    // If source is provided (e.g., 'student'), include it so the frontend can redirect back
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '/'
    const sourceParam = source ? `&source=${encodeURIComponent(source)}` : ''
    const resetLink = `${baseUrl}?reset_token=${resetToken}${sourceParam}`

    // ── Send reset email ──
    try {
      await sendPasswordResetEmail(
        email,
        user.name,
        resetLink,
        organization.name,
        organization.id
      )
      console.log(`[FORGOT-PASSWORD] Reset email sent to ${email}, token: ${resetToken.slice(0, 8)}...`)
    } catch (emailError) {
      console.error('[FORGOT-PASSWORD] Failed to send reset email:', emailError)
      // Don't reveal email failure to user for security
    }

    // ── Log to audit ──
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'auth.forgot-password',
          category: 'auth',
          details: JSON.stringify({ email, orgId: organization.code }),
          ipAddress: clientIp,
          organizationId: organization.id,
        },
      })
    } catch {
      // Audit logging is non-critical
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
      ...( !process.env.SMTP_HOST ? { resetLink } : {} )
    })
  } catch (error) {
    console.error('[FORGOT-PASSWORD] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
