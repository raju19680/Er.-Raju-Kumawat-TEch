import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * Check if a teacher has access to a specific module or sub-feature.
 * For sub-features (containing '.'), checks both parent module and sub-feature.
 * Returns { allowed: true } or { allowed: false, error: string, status: number }
 *
 * - Platform admins always have access.
 * - Non-teacher roles always have access.
 * - If no TeacherModuleAccess record exists, default to true (backward compatible).
 */
export async function checkModuleAccess(req: NextRequest, moduleKey: string): Promise<
  | { allowed: true; teacherId: string }
  | { allowed: false; error: string; status: number }
> {
  // 1. Authenticate
  const auth = await getAuthUser(req)
  if (!auth) {
    return { allowed: false, error: 'Authentication required.', status: 401 }
  }

  // 2. Platform admins always have access
  if (auth.role === 'platform_admin') {
    return { allowed: true, teacherId: auth.id }
  }

  // 3. Only teachers can be restricted
  if (auth.role !== 'teacher') {
    return { allowed: true, teacherId: auth.id }
  }

  // 4. Determine if this is a sub-feature key
  const isSubFeature = moduleKey.includes('.')
  const parentModuleKey = isSubFeature ? moduleKey.split('.')[0] : moduleKey

  // 5. Check parent module access first
  const parentRecord = await db.teacherModuleAccess.findUnique({
    where: {
      teacherId_moduleKey: {
        teacherId: auth.id,
        moduleKey: parentModuleKey,
      },
    },
  })

  if (parentRecord && !parentRecord.enabled) {
    return {
      allowed: false,
      error: `Access denied. The "${parentModuleKey}" module has been disabled for your account.`,
      status: 403,
    }
  }

  // 6. If checking a sub-feature, also check the sub-feature record
  if (isSubFeature) {
    const subRecord = await db.teacherModuleAccess.findUnique({
      where: {
        teacherId_moduleKey: {
          teacherId: auth.id,
          moduleKey,
        },
      },
    })

    if (subRecord && !subRecord.enabled) {
      return {
        allowed: false,
        error: `Access denied. The "${moduleKey}" feature has been disabled for your account.`,
        status: 403,
      }
    }
  }

  // 7. No disabling record = default allowed (backward compatible)
  return { allowed: true, teacherId: auth.id }
}
