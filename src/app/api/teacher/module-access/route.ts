export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { ALL_ACCESS_KEYS, buildFullAccessMap, MODULES } from '@/lib/module-registry'

/**
 * GET /api/teacher/module-access
 *
 * Fetch module access for the current teacher.
 * Uses x-auth-token header or session to identify the teacher.
 *
 * Returns all access records for the teacher — both module-level keys (e.g., 'tests')
 * and sub-feature keys (e.g., 'tests.create'). If no records exist, returns full access.
 *
 * IMPORTANT: When a parent module is enabled, ALL its sub-features are automatically
 * enabled as well. This ensures that teachers who have a module enabled always see
 * the module's pages in the CMS (sub-features control granular operations, not page visibility).
 *
 * Returns: { success: true, modules: Record<accessKey, boolean> }
 */
export async function GET(req: NextRequest) {
  try {
    // ── Authenticate the teacher ──
    const auth = await getAuthUser(req)
    if (!auth) {
      return Response.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      )
    }

    // Determine the teacher ID
    // Priority: authenticated user's ID (if teacher), then organizationId query param
    let teacherId: string | null = null

    if (auth.role === 'teacher') {
      teacherId = auth.id
    } else if (auth.role === 'platform_admin') {
      // Platform admins can query a specific teacher's access via organizationId param
      const url = new URL(req.url)
      const orgId = url.searchParams.get('organizationId')
      if (orgId) {
        const teacher = await db.user.findFirst({
          where: { organizationId: orgId, role: 'teacher' },
          select: { id: true },
        })
        teacherId = teacher?.id || null
      }
    }

    if (!teacherId) {
      return Response.json(
        { success: false, message: 'Unable to identify teacher. Please authenticate as a teacher.' },
        { status: 400 }
      )
    }

    // ── Fetch ALL module access records for this teacher ──
    const accessRecords = await db.teacherModuleAccess.findMany({
      where: { teacherId },
    })

    // If no records exist, return full access (backward compatible)
    if (accessRecords.length === 0) {
      return Response.json({
        success: true,
        modules: buildFullAccessMap(true),
      })
    }

    // Build the access map from records
    // Start with all keys set to true (default allow), then overlay with actual records
    const modules = buildFullAccessMap(true)
    for (const record of accessRecords) {
      modules[record.moduleKey] = record.enabled
    }

    // ── Cascade: If a parent module is enabled, auto-enable all its sub-features ──
    // This ensures teachers who have a module enabled always see the module's pages
    // and can perform basic operations. Sub-features can be individually disabled
    // to restrict specific operations (e.g., disable courses.create but keep courses.view).
    for (const mod of MODULES) {
      if (modules[mod.key] === true) {
        // If the parent module is enabled, ensure at least the "view" sub-feature is enabled
        // This guarantees page access even if specific sub-features were not saved
        for (const sf of mod.subFeatures) {
          if (modules[sf.key] === false) {
            // Only auto-enable "view" sub-features when parent is enabled
            // Other sub-features (create, edit, delete) respect their individual settings
            if (sf.key.endsWith('.view')) {
              modules[sf.key] = true
            }
          }
        }
      }
    }

    return Response.json({
      success: true,
      modules,
    })
  } catch (error) {
    console.error('[TeacherModuleAccess] GET error:', error)
    return Response.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

