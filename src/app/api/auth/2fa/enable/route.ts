import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { verifyTOTP } from '@/lib/totp'

// POST /api/auth/2fa/enable — Enable 2FA after verifying the code
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { code, secret, backupCodes } = body

    if (!code || !secret || !backupCodes) {
      return NextResponse.json(
        { error: 'Code, secret, and backup codes are required' },
        { status: 400 }
      )
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(secret, code)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
    }

    // Enable 2FA on the user record
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    })

    console.log(`[2FA] Enabled for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully.',
    })
  } catch (error) {
    console.error('[2FA Enable] Error:', error)
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 })
  }
}
