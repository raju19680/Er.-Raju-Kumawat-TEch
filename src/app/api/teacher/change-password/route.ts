export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { validatePasswordStrength } from '@/lib/auth-security'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * Change password for a teacher (or platform_admin changing a teacher's password).
 * Requires teacher or platform_admin authentication.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check: Must be teacher or platform_admin ──
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      )
    }

    if (authUser.role !== 'teacher' && authUser.role !== 'platform_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied.' },
        { status: 403 }
      )
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json()

    // ── Input validation ──
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password, new password, and confirm password are required.' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'New password and confirm password do not match.' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from the current password.' },
        { status: 400 }
      )
    }

    // ── Fetch the user ──
    const user = await db.user.findUnique({
      where: { id: authUser.id },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      )
    }

    // ── Verify current password ──
    const isCurrentPasswordValid = await compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 401 }
      )
    }

    // ── Validate new password strength ──
    const strength = validatePasswordStrength(newPassword)
    if (strength.score < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password is too weak. Please choose a stronger password.',
          passwordStrength: {
            score: strength.score,
            label: strength.label,
            feedback: strength.feedback,
          },
        },
        { status: 400 }
      )
    }

    // ── Hash and update password ──
    const hashedPassword = await hash(newPassword, 12)

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully!',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

