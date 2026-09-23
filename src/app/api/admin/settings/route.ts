export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

/**
 * Admin Settings API — GET profile + platform settings, PUT update profile + platform settings.
 * Only accessible by platform_admin.
 */

// Default platform settings when no records exist in DB
const DEFAULT_PLATFORM_SETTINGS: Record<string, boolean> = {
  emailNotifications: true,
  pushNotifications: true,
  maintenanceMode: false,
  autoBackup: true,
}

// ── GET: Fetch admin profile + platform settings ──
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const user = await db.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      )
    }

    // Fetch all platform settings from DB
    const settings = await db.platformSetting.findMany()
    const platformSettings: Record<string, boolean> = { ...DEFAULT_PLATFORM_SETTINGS }
    for (const s of settings) {
      platformSettings[s.key] = s.value === 'true'
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      platformSettings,
    })
  } catch (error) {
    console.error('Fetch admin settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── PUT: Update admin profile + platform settings ──
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { name, phone, platformSettings, currentPassword, newPassword } = body

    // ── Handle password change if provided ──
    if (currentPassword && newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 8 characters.' },
          { status: 400 }
        )
      }

      // Fetch current password hash
      const userWithPassword = await db.user.findUnique({
        where: { id: authResult.user.id },
        select: { password: true },
      })

      if (!userWithPassword) {
        return NextResponse.json(
          { success: false, message: 'User not found.' },
          { status: 404 }
        )
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Current password is incorrect.' },
          { status: 400 }
        )
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await db.user.update({
        where: { id: authResult.user.id },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      })

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully!',
      })
    }

    // ── Update profile if name/phone provided ──
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null

    let updatedProfile: {
      id: string
      name: string
      email: string
      phone: string | null
      role: string
    } | null = null
    if (Object.keys(updateData).length > 0) {
      updatedProfile = await db.user.update({
        where: { id: authResult.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      })
    }

    // ── Update platform settings if provided ──
    if (platformSettings && typeof platformSettings === 'object') {
      for (const [key, value] of Object.entries(platformSettings)) {
        if (typeof value === 'boolean') {
          await db.platformSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        }
      }
    }

    // Fetch updated platform settings to return
    const settings = await db.platformSetting.findMany()
    const updatedPlatformSettings: Record<string, boolean> = { ...DEFAULT_PLATFORM_SETTINGS }
    for (const s of settings) {
      updatedPlatformSettings[s.key] = s.value === 'true'
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully!',
      profile: updatedProfile || undefined,
      platformSettings: updatedPlatformSettings,
    })
  } catch (error) {
    console.error('Update admin settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
