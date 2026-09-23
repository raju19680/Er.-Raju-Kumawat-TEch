import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * GET /api/admin/students/[id]/devices
 * List all device sessions for a student, ordered by lastActive desc.
 * Only accessible by platform_admin.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params

    // ── Check student exists ──
    const student = await db.student.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found.' },
        { status: 404 }
      )
    }

    // ── Fetch device sessions ──
    const deviceSessions = await db.deviceSession.findMany({
      where: { studentId: id },
      orderBy: { lastActive: 'desc' },
    })

    // ── Summary counts ──
    const activeCount = deviceSessions.filter((s) => s.isActive).length
    const totalCount = deviceSessions.length

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
        deviceSessions,
        summary: {
          total: totalCount,
          active: activeCount,
          inactive: totalCount - activeCount,
        },
      },
    })
  } catch (error) {
    console.error('Fetch student devices error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
