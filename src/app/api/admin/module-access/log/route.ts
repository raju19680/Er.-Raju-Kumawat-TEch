export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * GET /api/admin/module-access/log
 *
 * Fetch the module access activity log.
 * Query params:
 *   limit (default 50) — max number of log entries to return
 *   teacherId (optional) — filter logs for a specific teacher
 *
 * Returns: { success: true, logs: ModuleAccessLog[] }
 * Ordered by changedAt desc
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return Response.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const teacherId = url.searchParams.get('teacherId')

    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 200)

    // ── Build where clause ──
    const where: { teacherId?: string } = {}
    if (teacherId) {
      where.teacherId = teacherId
    }

    // ── Fetch logs ordered by changedAt desc ──
    const logs = await db.moduleAccessLog.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      take: limit,
    })

    return Response.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error('[ModuleAccessLog] GET error:', error)
    return Response.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
