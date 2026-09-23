export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import fs from 'fs'
import path from 'path'

/**
 * System Health API — returns database stats, error counts, active users, and system info.
 * Only accessible by platform_admin.
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // ── Database stats: record counts per model ──
    const [
      userCount,
      studentCount,
      orgCount,
      orderCount,
      courseCount,
      testCount,
      testSeriesCount,
      questionCount,
      blogCount,
      paymentCount,
      loginAttemptCount,
      notificationCount,
      couponCount,
      leadCount,
      supportQueryCount,
      bannerCount,
      quickLinkCount,
      digitalProductCount,
      payoutCount,
      categoryCount,
      purchasedCourseCount,
      testAttemptCount,
      deviceSessionCount,
      auditLogCount,
      emailLogCount,
      platformSettingCount,
      teacherModuleAccessCount,
      moduleAccessLogCount,
    ] = await Promise.all([
      db.user.count(),
      db.student.count(),
      db.organization.count(),
      db.order.count(),
      db.course.count(),
      db.test.count(),
      db.testSeries.count(),
      db.question.count(),
      db.blog.count(),
      db.payment.count(),
      db.loginAttempt.count(),
      db.notification.count(),
      db.coupon.count(),
      db.lead.count(),
      db.supportQuery.count(),
      db.banner.count(),
      db.quickLink.count(),
      db.digitalProduct.count(),
      db.payout.count(),
      db.category.count(),
      db.purchasedCourse.count(),
      db.testAttempt.count(),
      db.deviceSession.count(),
      db.auditLog.count(),
      db.emailLog.count(),
      db.platformSetting.count(),
      db.teacherModuleAccess.count(),
      db.moduleAccessLog.count(),
    ])

    const dbRecords: Record<string, number> = {
      Users: userCount,
      Students: studentCount,
      Organizations: orgCount,
      Orders: orderCount,
      Courses: courseCount,
      Tests: testCount,
      'Test Series': testSeriesCount,
      Questions: questionCount,
      Blogs: blogCount,
      Payments: paymentCount,
      'Login Attempts': loginAttemptCount,
      Notifications: notificationCount,
      Coupons: couponCount,
      Leads: leadCount,
      'Support Queries': supportQueryCount,
      Banners: bannerCount,
      'Quick Links': quickLinkCount,
      'Digital Products': digitalProductCount,
      Payouts: payoutCount,
      Categories: categoryCount,
      'Purchased Courses': purchasedCourseCount,
      'Test Attempts': testAttemptCount,
      'Device Sessions': deviceSessionCount,
      'Audit Logs': auditLogCount,
      'Email Logs': emailLogCount,
      'Platform Settings': platformSettingCount,
      'Module Access': teacherModuleAccessCount,
      'Module Access Logs': moduleAccessLogCount,
    }

    // ── DB file size ──
    let dbFileSize = 0
    let dbFileSizeFormatted = '0 B'
    try {
      const dbPath = path.join(process.cwd(), 'db', 'custom.db')
      const stats = fs.statSync(dbPath)
      dbFileSize = stats.size
      dbFileSizeFormatted = formatBytes(dbFileSize)
    } catch {
      dbFileSizeFormatted = 'Unknown'
    }

    // ── Recent errors (failed login attempts in last 24h) ──
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentErrorCount = await db.loginAttempt.count({
      where: {
        success: false,
        createdAt: { gte: twentyFourHoursAgo },
      },
    })

    const recentErrors = await db.loginAttempt.findMany({
      where: {
        success: false,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // ── Active users (lastLoginAt within 24h) ──
    const activeUsers = await db.user.count({
      where: {
        lastLoginAt: { gte: twentyFourHoursAgo },
      },
    })

    // ── System info ──
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    const health = {
      db: {
        totalRecords: Object.values(dbRecords).reduce((sum, count) => sum + count, 0),
        fileSize: dbFileSize,
        fileSizeFormatted: dbFileSizeFormatted,
        records: dbRecords,
      },
      errors: {
        last24h: recentErrorCount,
        recent: recentErrors.map((e) => ({
          id: e.id,
          email: e.email,
          ipAddress: e.ipAddress,
          createdAt: e.createdAt.toISOString(),
        })),
      },
      activeUsers,
      system: {
        uptime,
        uptimeFormatted: formatUptime(uptime),
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external),
          arrayBuffers: formatBytes(memoryUsage.arrayBuffers),
          rssBytes: memoryUsage.rss,
          heapTotalBytes: memoryUsage.heapTotal,
          heapUsedBytes: memoryUsage.heapUsed,
          heapUsagePercent: Math.round(
            (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
          ),
        },
      },
    }

    return NextResponse.json({ success: true, health })
  } catch (error) {
    console.error('Admin health error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)

  return parts.join(' ')
}
