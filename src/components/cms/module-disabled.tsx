'use client'

import React from 'react'
import { ShieldOff, LayoutDashboard, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { getAccessKeyLabel, getModuleDef, getSubFeatureDef } from '@/lib/module-registry'

interface ModuleDisabledProps {
  moduleKey: string
}

export default function ModuleDisabled({ moduleKey }: ModuleDisabledProps) {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const displayName = getAccessKeyLabel(moduleKey)
  const isSubFeature = moduleKey.includes('.')

  // Get parent module info for sub-features
  const parentModuleKey = isSubFeature ? moduleKey.split('.')[0] : moduleKey
  const parentModule = getModuleDef(parentModuleKey)
  const subFeatureDef = isSubFeature ? getSubFeatureDef(moduleKey) : null

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Icon with animated ring */}
        <div className="relative mx-auto mb-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
            <ShieldOff className="size-10 text-gray-400" />
          </div>
          {/* Lock badge */}
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center size-7 rounded-full bg-red-100 border-2 border-white">
            <Lock className="size-3.5 text-red-500" />
          </div>
        </div>

        {/* Module/Feature name */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {displayName}
        </h2>

        {/* Breadcrumb for sub-features */}
        {isSubFeature && parentModule && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500 border-0">
              {parentModule.label}
            </Badge>
            <ArrowRight className="size-3 text-gray-400" />
            <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-0">
              {displayName}
            </Badge>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isSubFeature
            ? `The "${displayName}" feature within ${parentModule?.label || parentModuleKey} has been disabled by the platform admin. You don't have permission to access this feature.`
            : `The "${displayName}" module has been disabled by the platform admin. You don't have permission to access this module or any of its features.`
          }
        </p>

        {/* Help text */}
        <Card className="border-0 shadow-sm bg-gray-50 mb-6">
          <CardContent className="p-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              If you believe this is an error or need access to this {isSubFeature ? 'feature' : 'module'}, please contact your platform administrator or institute owner.
            </p>
          </CardContent>
        </Card>

        {/* Go to Dashboard button */}
        <Button
          onClick={() => setCurrentPage('dashboard')}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
        >
          <LayoutDashboard className="size-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
