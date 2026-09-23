export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // ── Parallel queries for stats ──
    const [
      totalLoginAttempts,
      failedAttempts,
      lockedAccountsCount,
      usersWith2FA,
      totalUsers,
      recentAttempts,
      lockedUsers,
    ] = await Promise.all([
      // Total login attempts (last 30 days)
      db.loginAttempt.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Failed attempts (last 30 days)
      db.loginAttempt.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          success: false,
        },
      }),

      // Locked accounts count
      db.user.count({
        where: {
          lockedUntil: { gt: new Date() },
        },
      }),

      // Users with 2FA enabled
      db.user.count({
        where: { twoFactorEnabled: true },
      }),

      // Total users
      db.user.count(),

      // Recent 50 login attempts with user info
      db.loginAttempt.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              organization: {
                select: { name: true, code: true },
              },
            },
          },
        },
      }),

      // Locked users with details
      db.user.findMany({
        where: {
          lockedUntil: { gt: new Date() },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
          organization: {
            select: { name: true, code: true },
          },
        },
        orderBy: { lockedUntil: 'desc' },
      }),
    ])

    // ── Security events aggregated by day (last 30 days) ──
    const dailyAttempts = await db.loginAttempt.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        createdAt: true,
        success: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Aggregate by day
    const eventsByDay: Record<string, { successful: number; failed: number }> = {}
    for (const attempt of dailyAttempts) {
      const dayKey = attempt.createdAt.toISOString().split('T')[0] // YYYY-MM-DD
      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = { successful: 0, failed: 0 }
      }
      if (attempt.success) {
        eventsByDay[dayKey].successful++
      } else {
        eventsByDay[dayKey].failed++
      }
    }

    // Fill in missing days with zeros
    const securityEvents: Array<{ date: string; successful: number; failed: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toISOString().split('T')[0]
      const dayData = eventsByDay[dayKey] || { successful: 0, failed: 0 }
      securityEvents.push({
        date: dayKey,
        successful: dayData.successful,
        failed: dayData.failed,
      })
    }

    // ── Format recent attempts ──
    const formattedRecentAttempts = recentAttempts.map((attempt) => ({
      id: attempt.id,
      email: attempt.email,
      ipAddress: attempt.ipAddress,
      userAgent: attempt.userAgent,
      success: attempt.success,
      createdAt: attempt.createdAt.toISOString(),
      user: attempt.user
        ? {
            id: attempt.user.id,
            name: attempt.user.name,
            email: attempt.user.email,
            role: attempt.user.role,
            organization: attempt.user.organization
              ? { name: attempt.user.organization.name, code: attempt.user.organization.code }
              : null,
          }
        : null,
    }))

    // ── Format locked users ──
    const formattedLockedUsers = lockedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      organization: user.organization
        ? { name: user.organization.name, code: user.organization.code }
        : null,
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalLoginAttempts,
        failedAttempts,
        lockedAccounts: lockedAccountsCount,
        usersWith2FA,
        totalUsers,
      },
      recentAttempts: formattedRecentAttempts,
      lockedUsers: formattedLockedUsers,
      securityEvents,
    })
  } catch (error) {
    console.error('[ADMIN SECURITY] Error fetching security data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}
