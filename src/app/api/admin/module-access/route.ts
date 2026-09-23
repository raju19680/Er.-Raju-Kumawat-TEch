export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { ALL_ACCESS_KEYS, ALL_MODULE_KEYS, buildFullAccessMap } from '@/lib/module-registry'

type AccessKey = (typeof ALL_ACCESS_KEYS)[number]

/**
 * Build a default modules map with only top-level module keys.
 */
function buildDefaultModules(enabled: boolean): Record<string, boolean> {
  const modules: Record<string, boolean> = {}
  for (const key of ALL_MODULE_KEYS) {
    modules[key] = enabled
  }
  return modules
}

/**
 * GET /api/admin/module-access
 *
 * Fetch module access for all teachers or a specific teacher.
 * Query params:
 *   teacherId (optional) — if provided, returns data for one teacher only
 *
 * Returns ALL access records from the database (both module-level and sub-feature keys),
 * without filtering to a predefined key list.
 *
 * Returns: { success: true, data: Record<teacherId, Record<accessKey, boolean>>, teachers: { id, name, email, phone, avatar, organization }[] }
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
    const teacherId = url.searchParams.get('teacherId')

    // ── Fetch all teachers with org info ──
    const teachers = await db.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, code: true, accentColor: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ── Fetch module access records ──
    const accessWhere = teacherId ? { teacherId } : {}
    const accessRecords = await db.teacherModuleAccess.findMany({
      where: accessWhere,
    })

    // ── Build the response data map ──
    const data: Record<string, Record<string, boolean>> = {}

    // Initialize all teachers with default (all false)
    const relevantTeachers = teacherId
      ? teachers.filter((t) => t.id === teacherId)
      : teachers

    for (const teacher of relevantTeachers) {
      data[teacher.id] = buildFullAccessMap(true)
    }

    // Override with actual access records (includes sub-feature keys from DB)
    for (const record of accessRecords) {
      if (!data[record.teacherId]) {
        data[record.teacherId] = buildFullAccessMap(true)
      }
      data[record.teacherId][record.moduleKey] = record.enabled
    }

    return Response.json({
      success: true,
      data,
      teachers: relevantTeachers,
    })
  } catch (error) {
    console.error('[ModuleAccess] GET error:', error)
    return Response.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/module-access
 *
 * Save module access for a teacher.
 * Body: { teacherId: string, modules: Record<accessKey, boolean>, changedBy?: string }
 *
 * Accepts both module-level keys (e.g., 'tests') and sub-feature keys (e.g., 'tests.create').
 * Uses batch delete+create for performance (instead of sequential upserts).
 * Logs changes to ModuleAccessLog.
 * Returns: { success: true, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return Response.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { teacherId, modules, changedBy } = body as {
      teacherId?: string
      modules?: Record<string, boolean>
      changedBy?: string
    }

    // ── Validate required fields ──
    if (!teacherId) {
      return Response.json(
        { success: false, message: 'teacherId is required.' },
        { status: 400 }
      )
    }

    if (!modules || typeof modules !== 'object') {
      return Response.json(
        { success: false, message: 'modules object is required.' },
        { status: 400 }
      )
    }

    // ── Verify teacher exists ──
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true },
    })

    if (!teacher) {
      return Response.json(
        { success: false, message: 'Teacher not found.' },
        { status: 404 }
      )
    }

    // ── Fetch current access records for diffing ──
    const currentAccess = await db.teacherModuleAccess.findMany({
      where: { teacherId },
    })
    const currentMap = new Map<string, boolean>()
    for (const record of currentAccess) {
      currentMap.set(record.moduleKey, record.enabled)
    }

    const adminId = changedBy || authResult.user.id
    const now = new Date()
    const logEntries: { moduleKey: string; action: string }[] = []

    // ── Filter to only valid access keys and compute changes ──
    const validEntries: [string, boolean][] = []
    for (const [moduleKey, enabled] of Object.entries(modules)) {
      if (!ALL_ACCESS_KEYS.includes(moduleKey as AccessKey)) continue
      const isEnabled = Boolean(enabled)
      validEntries.push([moduleKey, isEnabled])

      // Prepare log entries for changes
      const wasEnabled = currentMap.get(moduleKey)
      if (wasEnabled === undefined || wasEnabled !== isEnabled) {
        logEntries.push({
          moduleKey,
          action: isEnabled ? 'enabled' : 'disabled',
        })
      }
    }

    // ── Batch operation: delete all existing + recreate ──
    // This is MUCH faster than individual upserts (was taking 22+ seconds)
    await db.$transaction(async (tx) => {
      // Delete all existing records for this teacher
      await tx.teacherModuleAccess.deleteMany({
        where: { teacherId },
      })

      // Create all new records in one batch
      if (validEntries.length > 0) {
        await tx.teacherModuleAccess.createMany({
          data: validEntries.map(([moduleKey, enabled]) => ({
            teacherId,
            moduleKey,
            enabled,
            updatedBy: adminId,
            updatedAt: now,
          })),
        })
      }
    })

    // ── Batch create log entries ──
    if (logEntries.length > 0) {
      await db.moduleAccessLog.createMany({
        data: logEntries.map((entry) => ({
          teacherId,
          teacherName: teacher.name,
          moduleKey: entry.moduleKey,
          action: entry.action,
          changedBy: adminId,
          changedAt: now,
          details: null,
        })),
      })

      // ── Send access change email (fire and forget) ──
      ;(async () => {
        try {
          const teacherFull = await db.user.findUnique({
            where: { id: teacherId },
            select: { email: true, name: true, organizationId: true, organization: { select: { name: true } } },
          })
          if (teacherFull) {
            const enabled = logEntries.filter(e => e.action === 'enabled').map(e => e.moduleKey)
            const disabled = logEntries.filter(e => e.action === 'disabled').map(e => e.moduleKey)
            const { sendAccessChangeEmail } = await import('@/lib/email')
            sendAccessChangeEmail(
              teacherFull.email,
              teacherFull.name,
              { enabled, disabled },
              teacherFull.organization?.name || 'Er. Raju Kumawat Tech',
              teacherFull.organizationId || undefined
            )
          }
        } catch (emailErr) {
          console.log('[ModuleAccess] Access change email failed:', emailErr)
        }
      })()
    }

    return Response.json(
      {
        success: true,
        message: `Module access updated for ${teacher.name}. ${logEntries.length} change(s) logged.`,
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[ModuleAccess] POST error:', error)
    return Response.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
