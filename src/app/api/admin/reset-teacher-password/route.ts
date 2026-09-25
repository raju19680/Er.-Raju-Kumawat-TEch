export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Reset a teacher's password.
 * Only accessible by platform_admin.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { teacherId, newPassword } = await req.json()

    // ── Validate inputs ──
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'Teacher ID is required.' },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: 'New password is required.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    // ── Find the teacher ──
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found.' },
        { status: 404 }
      )
    }

    const allowedRoles = ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin']
    if (!allowedRoles.includes(teacher.role)) {
      return NextResponse.json(
        { success: false, message: 'User is not a teacher.' },
        { status: 400 }
      )
    }

    // ── Hash the new password ──
    const hashedPassword = await hash(newPassword, 12)

    // ── Update the teacher's password ──
    await db.user.update({
      where: { id: teacherId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Password for "${teacher.name}" has been reset successfully.`,
    })
  } catch (error) {
    console.error('Reset teacher password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

