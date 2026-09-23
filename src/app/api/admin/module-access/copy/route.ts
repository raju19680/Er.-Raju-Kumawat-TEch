export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { ALL_ACCESS_KEYS, buildFullAccessMap } from '@/lib/module-registry'

type AccessKey = (typeof ALL_ACCESS_KEYS)[number]

/**
 * POST /api/admin/module-access/copy
 *
 * Copy module access from one teacher to another.
 * Body: { sourceTeacherId: string, targetTeacherId: string, changedBy?: string }
 *
 * Returns: { success: true, message: string, changesCount: number }
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
    const { sourceTeacherId, targetTeacherId, changedBy } = body as {
      sourceTeacherId?: string
      targetTeacherId?: string
      changedBy?: string
    }

    // ── Validate required fields ──
    if (!sourceTeacherId || !targetTeacherId) {
      return Response.json(
        { success: false, message: 'Both sourceTeacherId and targetTeacherId are required.' },
        { status: 400 }
      )
    }

    if (sourceTeacherId === targetTeacherId) {
      return Response.json(
        { success: false, message: 'Source and target teacher cannot be the same.' },
        { status: 400 }
      )
    }

    // ── Verify both teachers exist ──
    const [sourceTeacher, targetTeacher] = await Promise.all([
      db.user.findUnique({ where: { id: sourceTeacherId }, select: { id: true, name: true } }),
      db.user.findUnique({ where: { id: targetTeacherId }, select: { id: true, name: true } }),
    ])

    if (!sourceTeacher) {
      return Response.json(
        { success: false, message: 'Source teacher not found.' },
        { status: 404 }
      )
    }

    if (!targetTeacher) {
      return Response.json(
        { success: false, message: 'Target teacher not found.' },
        { status: 404 }
      )
    }

    // ── Get source teacher's access ──
    const sourceAccess = await db.teacherModuleAccess.findMany({
      where: { teacherId: sourceTeacherId },
    })

    // Build source access map
    const sourceMap = new Map<string, boolean>()
    for (const record of sourceAccess) {
      sourceMap.set(record.moduleKey, record.enabled)
    }

    // Start with full access (true), then overlay with source teacher's settings
    const targetAccessMap = buildFullAccessMap(true)
    for (const key of ALL_ACCESS_KEYS) {
      if (sourceMap.has(key)) {
        targetAccessMap[key] = sourceMap.get(key)!
      }
    }

    // ── Get target teacher's current access ──
    const targetCurrentAccess = await db.teacherModuleAccess.findMany({
      where: { teacherId: targetTeacherId },
    })
    const targetCurrentMap = new Map<string, boolean>()
    for (const record of targetCurrentAccess) {
      targetCurrentMap.set(record.moduleKey, record.enabled)
    }

    const adminId = changedBy || authResult.user.id
    const now = new Date()
    const logEntries: { moduleKey: string; action: string; details: string | null }[] = []

    // ── Upsert each access key ──
    for (const [key, enabled] of Object.entries(targetAccessMap)) {
      const wasEnabled = targetCurrentMap.get(key)
      const isEnabled = Boolean(enabled)

      await db.teacherModuleAccess.upsert({
        where: {
          teacherId_moduleKey: {
            teacherId: targetTeacherId,
            moduleKey: key,
          },
        },
        create: {
          teacherId: targetTeacherId,
          moduleKey: key,
          enabled: isEnabled,
          updatedBy: adminId,
        },
        update: {
          enabled: isEnabled,
          updatedBy: adminId,
          updatedAt: now,
        },
      })

      // Log changes
      if (wasEnabled === undefined || wasEnabled !== isEnabled) {
        logEntries.push({
          moduleKey: key,
          action: isEnabled ? 'enabled' : 'disabled',
          details: `copied_from:${sourceTeacher.name}`,
        })
      }
    }

    // ── Batch create log entries ──
    if (logEntries.length > 0) {
      await db.moduleAccessLog.createMany({
        data: logEntries.map((entry) => ({
          teacherId: targetTeacherId,
          teacherName: targetTeacher.name,
          moduleKey: entry.moduleKey,
          action: entry.action,
          changedBy: adminId,
          changedAt: now,
          details: entry.details,
        })),
      })
    }

    return Response.json({
      success: true,
      message: `Access copied from ${sourceTeacher.name} to ${targetTeacher.name}. ${logEntries.length} change(s) logged.`,
      changesCount: logEntries.length,
    })
  } catch (error) {
    console.error('[ModuleAccess/Copy] POST error:', error)
    return Response.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
