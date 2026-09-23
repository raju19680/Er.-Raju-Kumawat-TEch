import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { generateSecret, generateOTPAuthURL, generateBackupCodes } from '@/lib/totp'

// POST /api/auth/2fa/setup — Generate new TOTP secret for setup
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Generate new secret
    const secret = generateSecret()
    const otpauthUrl = generateOTPAuthURL(secret, user.email)
    const backupCodes = generateBackupCodes(10)

    // Check if 2FA is already enabled
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    })

    return NextResponse.json({
      success: true,
      secret,
      otpauthUrl,
      backupCodes,
      alreadyEnabled: dbUser?.twoFactorEnabled || false,
    })
  } catch (error) {
    console.error('[2FA Setup] Error:', error)
    return NextResponse.json({ error: 'Failed to generate 2FA setup' }, { status: 500 })
  }
}
