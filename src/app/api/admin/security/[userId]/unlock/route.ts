import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const { userId } = await params

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.lockedUntil) {
      return NextResponse.json(
        { success: false, error: 'User account is not locked' },
        { status: 400 }
      )
    }

    // Unlock the account
    await db.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Account for ${user.name || user.email} has been unlocked successfully`,
    })
  } catch (error) {
    console.error('[ADMIN SECURITY UNLOCK] Error unlocking user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unlock user account' },
      { status: 500 }
    )
  }
}
