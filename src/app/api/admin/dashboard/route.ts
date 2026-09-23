export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Admin Dashboard API — returns aggregate stats and recent teachers.
 * Only accessible by platform_admin.
 * Excludes the PLATFORM org from stats (it's the super admin's own org, not a teacher org).
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // Find the PLATFORM org so we can exclude it from stats
    const platformOrg = await db.organization.findFirst({
      where: { code: '9680177120' },
    })
    const platformOrgId = platformOrg?.id

    // ── Aggregate stats (exclude PLATFORM org) ──
    const [totalTeachers, totalStudents, totalPlatforms, revenueResult] = await Promise.all([
      db.user.count({ where: { role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } } }),
      db.student.count(),
      db.organization.count({
        where: platformOrgId ? { id: { not: platformOrgId } } : {},
      }),
      db.payment.aggregate({
        where: { status: 'success' },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = revenueResult._sum.amount ?? 0

    // ── Recent teachers (last 10, newest first) with org + student count ──
    const recentTeacherRows = await db.user.findMany({
      where: { role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Count students per org for the recent teachers
    const orgIds = recentTeacherRows
      .map((t) => t.organizationId)
      .filter((id): id is string => id !== null)

    const studentCounts = await db.student.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: orgIds } },
      _count: { id: true },
    })

    const studentCountMap = new Map<string, number>()
    for (const sc of studentCounts) {
      studentCountMap.set(sc.organizationId, sc._count.id)
    }

    const recentTeachers = recentTeacherRows.map((teacher) => ({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      platformName: teacher.organization?.name ?? '—',
      platformId: teacher.organization?.code ?? '—',
      accentColor: teacher.organization?.accentColor ?? '#D97706',
      status: teacher.organization?.status ?? 'trial',
      studentCount: teacher.organizationId
        ? (studentCountMap.get(teacher.organizationId) ?? 0)
        : 0,
      createdAt: teacher.createdAt.toISOString(),
    }))

    // ── Org status breakdown ──
    const activeOrgs = await db.organization.count({
      where: { status: 'active', ...(platformOrgId ? { id: { not: platformOrgId } } : {}) },
    })
    const trialOrgs = await db.organization.count({
      where: { status: 'trial' },
    })
    const inactiveOrgs = await db.organization.count({
      where: { status: 'inactive' },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalTeachers,
        totalStudents,
        totalPlatforms,
        totalRevenue,
        activeOrgs,
        trialOrgs,
        inactiveOrgs,
      },
      recentTeachers,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
