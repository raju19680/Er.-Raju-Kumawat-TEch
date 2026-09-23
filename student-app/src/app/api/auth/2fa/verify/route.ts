import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyTOTP, verifyBackupCode } from '@/lib/totp'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/auth/2fa/verify — Verify a 2FA code during login
// Rate limited: max 5 attempts per email per 5 minutes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // ── Rate limiting: 5 attempts per email per 5 minutes ──
    const emailKey = `2fa-verify:${email.toLowerCase().trim()}`
    const ipKey = `2fa-verify-ip:${getClientIp(req.headers)}`

    const emailRateLimit = checkRateLimit(emailKey)
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const ipRateLimit = checkRateLimit(ipKey)
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Verify TOTP code
    const isValidTOTP = verifyTOTP(user.twoFactorSecret, code)

    if (isValidTOTP) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[2FA Verify] TOTP code verified for: ${email}`)
      }
      return NextResponse.json({ valid: true })
    }

    // Try backup code
    if (user.twoFactorBackupCodes) {
      const result = verifyBackupCode(code, user.twoFactorBackupCodes)
      if (result.valid) {
        // Remove the used backup code
        await db.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(result.remainingCodes) },
        })
        if (process.env.NODE_ENV === 'development') {
          console.log(`[2FA Verify] Backup code used for: ${email}. Remaining: ${result.remainingCodes.length}`)
        }
        return NextResponse.json({ valid: true, backupUsed: true, remainingCodes: result.remainingCodes.length })
      }
    }

    return NextResponse.json({ valid: false, error: 'Invalid verification code' })
  } catch (error) {
    console.error('[2FA Verify] Error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
