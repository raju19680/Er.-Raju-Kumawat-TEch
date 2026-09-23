export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { ALL_ACCESS_KEYS, buildFullAccessMap } from '@/lib/module-registry'
import { PRESETS } from '@/lib/module-registry'

type AccessKey = (typeof ALL_ACCESS_KEYS)[number]

/**
 * POST /api/admin/module-access/bulk
 *
 * Apply bulk actions to teacher access.
 * Format 1: { action: 'enable_all' | 'disable_all' | 'apply_preset', presetId?: string, teacherIds?: string[] }
 * Format 2: { teacherIds: string[], modules: Record<accessKey, boolean> } — direct module map
 *
 * If teacherIds is omitted, applies to all teachers.
 * Uses batch delete+create for performance (instead of sequential upserts).
 *
 * Returns: { success: true, message: string, affectedCount: number }
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
    const { action, presetId, teacherIds, modules } = body as {
      action?: string
      presetId?: string
      teacherIds?: string[]
      modules?: Record<string, boolean>
    }

    // ── Determine if this is Format 2 (direct modules map) ──
    const isDirectModules = !action && modules && typeof modules === 'object' && teacherIds && teacherIds.length > 0

    if (!isDirectModules && (!action || !['enable_all', 'disable_all', 'apply_preset'].includes(action))) {
      return Response.json(
        { success: false, message: 'Invalid request. Provide either {action, teacherIds?} or {teacherIds, modules}.' },
        { status: 400 }
      )
    }

    if (!isDirectModules && action === 'apply_preset' && (!presetId || !PRESETS.find(p => p.id === presetId))) {
      return Response.json(
        { success: false, message: 'Invalid or missing presetId.' },
        { status: 400 }
      )
    }

    // ── Get target teachers ──
    const where = teacherIds && teacherIds.length > 0
      ? { id: { in: teacherIds }, role: 'teacher' as const }
      : { role: 'teacher' as const }

    const teachers = await db.user.findMany({
      where,
      select: { id: true, name: true },
    })

    if (teachers.length === 0) {
      return Response.json(
        { success: false, message: 'No teachers found.' },
        { status: 404 }
      )
    }

    // ── Determine the target access map ──
    let targetMap: Record<string, boolean>
    let logAction: string

    if (isDirectModules) {
      // Format 2: direct modules map
      targetMap = {}
      for (const key of ALL_ACCESS_KEYS) {
        targetMap[key] = modules[key] === true
      }
      logAction = 'bulk:apply_modules'
    } else {
      // Format 1: action-based
      const preset = action === 'apply_preset' ? PRESETS.find(p => p.id === presetId) : null

      if (action === 'enable_all') {
        targetMap = buildFullAccessMap(true)
      } else if (action === 'disable_all') {
        targetMap = buildFullAccessMap(false)
      } else if (preset) {
        targetMap = buildFullAccessMap(false)
        for (const key of preset.features) targetMap[key] = true
      } else {
        targetMap = buildFullAccessMap(false)
      }
      logAction = action === 'apply_preset' ? `preset:${presetId}` : `bulk:${action}`
    }

    const adminId = authResult.user.id
    const now = new Date()
    let totalChanges = 0

    // ── Build valid entries from target map ──
    const validEntries: [string, boolean][] = []
    for (const key of ALL_ACCESS_KEYS) {
      validEntries.push([key, targetMap[key] === true])
    }

    // ── Apply to each teacher using batch delete+create ──
    for (const teacher of teachers) {
      // Get current access for diffing
      const currentAccess = await db.teacherModuleAccess.findMany({
        where: { teacherId: teacher.id },
      })
      const currentMap = new Map<string, boolean>()
      for (const record of currentAccess) {
        currentMap.set(record.moduleKey, record.enabled)
      }

      // Compute changes for logging
      const logEntries: { moduleKey: string; action: string; details: string | null }[] = []
      for (const [key, enabled] of validEntries) {
        const wasEnabled = currentMap.get(key)
        if (wasEnabled === undefined || wasEnabled !== enabled) {
          logEntries.push({
            moduleKey: key,
            action: enabled ? 'enabled' : 'disabled',
            details: logAction,
          })
        }
      }

      // Batch delete + create in a transaction
      await db.$transaction(async (tx) => {
        await tx.teacherModuleAccess.deleteMany({
          where: { teacherId: teacher.id },
        })

        if (validEntries.length > 0) {
          await tx.teacherModuleAccess.createMany({
            data: validEntries.map(([moduleKey, enabled]) => ({
              teacherId: teacher.id,
              moduleKey,
              enabled,
              updatedBy: adminId,
              updatedAt: now,
            })),
          })
        }
      })

      // Batch create log entries
      if (logEntries.length > 0) {
        await db.moduleAccessLog.createMany({
          data: logEntries.map((entry) => ({
            teacherId: teacher.id,
            teacherName: teacher.name,
            moduleKey: entry.moduleKey,
            action: entry.action,
            changedBy: adminId,
            changedAt: now,
            details: entry.details,
          })),
        })
        totalChanges += logEntries.length
      }
    }

    const actionLabel = isDirectModules
      ? 'Applied custom modules to'
      : action === 'enable_all' ? 'Enabled all for'
      : action === 'disable_all' ? 'Disabled all for'
      : `Applied "${presetId}" preset to`

    return Response.json({
      success: true,
      message: `${actionLabel} ${teachers.length} teacher(s). ${totalChanges} change(s) logged.`,
      affectedCount: teachers.length,
    })
  } catch (error) {
    console.error('[ModuleAccess/Bulk] POST error:', error)
    return Response.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
