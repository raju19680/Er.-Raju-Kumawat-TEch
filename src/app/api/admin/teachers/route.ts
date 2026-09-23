export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Fetch all teachers with their organization data and student counts.
 * Only accessible by platform_admin.
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

    // ── Fetch all teachers and org admins with their organization ──
    const teachers = await db.user.findMany({
      where: { 
        role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } 
      },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    })

    // ── Count students per organization ──
    const orgIds = teachers
      .map((t) => t.organizationId)
      .filter((id): id is string => id !== null)

    const studentCounts = await db.student.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: orgIds } },
      _count: { id: true },
    })

    // Build a map of orgId -> student count
    const studentCountMap = new Map<string, number>()
    for (const sc of studentCounts) {
      studentCountMap.set(sc.organizationId, sc._count.id)
    }

    // ── Format response ──
    const formattedTeachers = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      avatar: teacher.avatar,
      organization: teacher.organization
        ? {
            id: teacher.organization.id,
            name: teacher.organization.name,
            code: teacher.organization.code,
            accentColor: teacher.organization.accentColor,
            status: teacher.organization.status,
            adminCommission: teacher.organization.adminCommission,
            gatewayCharge: teacher.organization.gatewayCharge,
            razorpayAccountId: teacher.organization.razorpayAccountId,
            createdAt: teacher.organization.createdAt,
          }
        : null,
      studentCount: teacher.organizationId
        ? (studentCountMap.get(teacher.organizationId) || 0)
        : 0,
      createdAt: teacher.createdAt,
    }))

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers,
    })
  } catch (error) {
    console.error('Fetch teachers error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
