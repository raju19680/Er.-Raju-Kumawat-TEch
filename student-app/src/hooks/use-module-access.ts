'use client'

import { useAppStore } from '@/lib/store'

/**
 * Check if a specific sub-feature is accessible for the current user.
 *
 * Usage:
 *   const { canCreate, canEdit, canDelete } = useModuleAccess('tests')
 *
 *   // Or check individual features:
 *   const canCreateTest = useSubFeatureAccess('tests.create')
 */
export function useModuleAccess(moduleKey: string) {
  const moduleAccess = useAppStore((s) => s.moduleAccess)
  const moduleAccessLoaded = useAppStore((s) => s.moduleAccessLoaded)
  const userRole = useAppStore((s) => s.userRole)

  // Platform admins always have full access
  if (userRole === 'platform_admin') {
    return {
      moduleEnabled: true,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canPublish: true,
      canExport: true,
      canManage: true,
      isFeatureEnabled: (_subFeatureSuffix: string) => true,
    }
  }

  const moduleEnabled = moduleAccessLoaded ? moduleAccess[moduleKey] !== false : true

  const isFeatureEnabled = (suffix: string) => {
    if (!moduleAccessLoaded) return true
    const key = `${moduleKey}.${suffix}`
    return moduleAccess[key] !== false
  }

  return {
    moduleEnabled,
    canView: isFeatureEnabled('view'),
    canCreate: isFeatureEnabled('create'),
    canEdit: isFeatureEnabled('edit'),
    canDelete: isFeatureEnabled('delete'),
    canPublish: isFeatureEnabled('publish'),
    canExport: isFeatureEnabled('export'),
    canManage: isFeatureEnabled('manage'),
    isFeatureEnabled,
  }
}

/**
 * Check a single sub-feature key.
 * Usage: const canCreateTest = useSubFeatureAccess('tests.create')
 */
export function useSubFeatureAccess(subFeatureKey: string): boolean {
  const moduleAccess = useAppStore((s) => s.moduleAccess)
  const moduleAccessLoaded = useAppStore((s) => s.moduleAccessLoaded)
  const userRole = useAppStore((s) => s.userRole)

  if (userRole === 'platform_admin') return true
  if (!moduleAccessLoaded) return true

  // Also check parent module
  const [moduleKey] = subFeatureKey.split('.')
  if (moduleAccess[moduleKey] === false) return false

  return moduleAccess[subFeatureKey] !== false
}
