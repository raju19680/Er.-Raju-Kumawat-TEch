import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { verifyTOTP, verifyBackupCode } from '@/lib/totp'

// POST /api/auth/2fa/disable — Disable 2FA after verifying current code or password
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required to disable 2FA' },
        { status: 400 }
      )
    }

    // Get the user's 2FA secret
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true, twoFactorBackupCodes: true, twoFactorEnabled: true },
    })

    if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
      return NextResponse.json({ error: '2FA is not enabled on this account' }, { status: 400 })
    }

    // Verify the code
    const isValidTOTP = verifyTOTP(dbUser.twoFactorSecret, code)
    let updatedBackupCodes: string[] | null = null

    if (!isValidTOTP) {
      // Try backup code
      if (dbUser.twoFactorBackupCodes) {
        const result = verifyBackupCode(code, dbUser.twoFactorBackupCodes)
        if (!result.valid) {
          return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
        }
        updatedBackupCodes = result.remainingCodes
      } else {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
      }
    }

    // Disable 2FA
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })

    console.log(`[2FA] Disabled for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled.',
    })
  } catch (error) {
    console.error('[2FA Disable] Error:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
