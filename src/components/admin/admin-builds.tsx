'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Globe,
  Smartphone,
  Download,
  Search,
  Building2,
  Users,
  Loader2,
  CheckCircle2,
  Package,
  Code2,
  RefreshCw,
  AlertCircle,
  FileArchive,
  Clock,
  ArrowDownToLine,
  Layers,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  MODULES,
  ALL_MODULE_KEYS,
  ALL_SUB_FEATURE_KEYS,
} from '@/lib/module-registry'

// ── Types ────────────────────────────────────────────────────────────────────
interface TeacherData {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  organization: {
    id: string
    name: string
    code: string
    accentColor: string
    status: string
    adminCommission: number
    gatewayCharge: number
    razorpayAccountId: string | null
    createdAt: string
  } | null
  studentCount: number
  createdAt: string
}

interface DownloadRecord {
  teacherId: string
  type: 'website' | 'app'
  timestamp: Date
  orgCode: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function countCategoryFeatures(
  accessMap: Record<string, boolean>,
  categoryPrefix: string
): { enabled: number; total: number } {
  const categoryModules = MODULES.filter(m => m.category === categoryPrefix)
  let enabled = 0
  let total = 0
  for (const mod of categoryModules) {
    total += mod.subFeatures.length
    for (const sf of mod.subFeatures) {
      if (accessMap[sf.key] !== false) {
        enabled++
      }
    }
  }
  return { enabled, total }
}

function countCmsFeatures(
  accessMap: Record<string, boolean>
): { enabled: number; total: number } {
  const cmsCategories = ['core', 'content', 'test-portal', 'business', 'support', 'custom']
  const cmsModules = MODULES.filter(m => cmsCategories.includes(m.category))
  let enabled = 0
  let total = 0
  for (const mod of cmsModules) {
    total += mod.subFeatures.length
    for (const sf of mod.subFeatures) {
      if (accessMap[sf.key] !== false) {
        enabled++
      }
    }
  }
  return { enabled, total }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  })
}

// ── Loading Skeletons ────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="bg-white border-l-4 border-l-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="size-11 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card className="bg-white shadow-sm rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Mini Progress Ring ────────────────────────────────────────────────────────
function MiniProgressRing({
  value,
  max,
  color,
  label,
  icon: Icon,
}: {
  value: number
  max: number
  color: string
  label: string
  icon: React.ElementType
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const strokeDasharray = 2 * Math.PI * 18
  const strokeDashoffset = strokeDasharray - (pct / 100) * strokeDasharray

  const colorMap: Record<string, { stroke: string; bg: string; text: string }> = {
    cyan:   { stroke: '#06b6d4', bg: 'bg-cyan-50',  text: 'text-cyan-700' },
    pink:   { stroke: '#ec4899', bg: 'bg-pink-50',   text: 'text-pink-700' },
    amber:  { stroke: '#d97706', bg: 'bg-amber-50',  text: 'text-amber-700' },
  }

  const c = colorMap[color] || colorMap.amber

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={c.stroke}
            strokeWidth="3.5"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`size-4 ${c.text}`} />
        </div>
      </div>
      <div className="text-center">
        <p className={`text-xs font-semibold ${c.text}`}>{value}/{max}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ── Teacher Card ─────────────────────────────────────────────────────────────
function TeacherBuildCard({
  teacher,
  accessMap,
  generating,
  downloadHistory,
  onDownload,
}: {
  teacher: TeacherData
  accessMap: Record<string, boolean> | null
  generating: 'website' | 'app' | null
  downloadHistory: DownloadRecord[]
  onDownload: (teacherId: string, type: 'website' | 'app') => void
}) {
  const org = teacher.organization
  const accentColor = org?.accentColor || '#d97706'

  // Calculate feature counts
  const websiteFeatures = accessMap
    ? countCategoryFeatures(accessMap, 'student-website')
    : null
  const appFeatures = accessMap
    ? countCategoryFeatures(accessMap, 'mobile-app')
    : null
  const cmsFeatures = accessMap
    ? countCmsFeatures(accessMap)
    : null

  // Check recent downloads for this teacher
  const recentWebsiteDownload = downloadHistory.find(
    d => d.teacherId === teacher.id && d.type === 'website'
  )
  const recentAppDownload = downloadHistory.find(
    d => d.teacherId === teacher.id && d.type === 'app'
  )

  const isGeneratingWebsite = generating === 'website'
  const isGeneratingApp = generating === 'app'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-shadow border border-gray-100">
        <CardContent className="p-5">
          {/* Teacher Header */}
          <div className="flex items-start gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {getInitials(teacher.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {teacher.name}
                </h3>
                {org?.status && (
                  <Badge
                    className={`border-0 text-xs px-1.5 py-0 ${
                      org.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : org.status === 'trial'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {teacher.email}
              </p>
              {org && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 className="size-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {org.name}
                  </span>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                    {org.code}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Module Access Summary */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Module Access Summary
            </p>
            {accessMap ? (
              <div className="flex items-center justify-around gap-2">
                <MiniProgressRing
                  value={websiteFeatures?.enabled ?? 0}
                  max={websiteFeatures?.total ?? 1}
                  color="cyan"
                  label="Website"
                  icon={Globe}
                />
                <MiniProgressRing
                  value={appFeatures?.enabled ?? 0}
                  max={appFeatures?.total ?? 1}
                  color="pink"
                  label="App"
                  icon={Smartphone}
                />
                <MiniProgressRing
                  value={cmsFeatures?.enabled ?? 0}
                  max={cmsFeatures?.total ?? 1}
                  color="amber"
                  label="CMS"
                  icon={Layers}
                />
              </div>
            ) : (
              <div className="flex items-center justify-around gap-2">
                {[{ label: 'Website', Icon: Globe }, { label: 'App', Icon: Smartphone }, { label: 'CMS', Icon: Layers }].map(
                  ({ label, Icon: IconComp }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <div className="size-[44px] rounded-full bg-gray-100 flex items-center justify-center">
                        <Loader2 className="size-4 text-gray-400 animate-spin" />
                      </div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Download Buttons */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Download Website Button */}
            <Button
              onClick={() => onDownload(teacher.id, 'website')}
              disabled={isGeneratingWebsite || isGeneratingApp}
              className={`relative h-auto py-3 px-3 flex flex-col items-center gap-1 rounded-lg transition-all ${
                isGeneratingWebsite
                  ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                  : 'bg-gradient-to-br from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {isGeneratingWebsite ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-xs font-semibold">Generating...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Globe className="size-4" />
                    {recentWebsiteDownload && (
                      <CheckCircle2 className="size-3 opacity-70" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">Download Website</span>
                </>
              )}
            </Button>

            {/* Download App Button */}
            <Button
              onClick={() => onDownload(teacher.id, 'app')}
              disabled={isGeneratingWebsite || isGeneratingApp}
              className={`relative h-auto py-3 px-3 flex flex-col items-center gap-1 rounded-lg transition-all ${
                isGeneratingApp
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'bg-gradient-to-br from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {isGeneratingApp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-xs font-semibold">Generating...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="size-4" />
                    {recentAppDownload && (
                      <CheckCircle2 className="size-3 opacity-70" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">Download App</span>
                </>
              )}
            </Button>
          </div>

          {/* Recent Download Info */}
          {(recentWebsiteDownload || recentAppDownload) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentWebsiteDownload && (
                <div className="flex items-center gap-1 text-xs text-cyan-700 bg-cyan-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="size-3" />
                  <span>Website: {formatDateShort(recentWebsiteDownload.timestamp)} {formatTime(recentWebsiteDownload.timestamp)}</span>
                </div>
              )}
              {recentAppDownload && (
                <div className="flex items-center gap-1 text-xs text-pink-700 bg-pink-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="size-3" />
                  <span>App: {formatDateShort(recentAppDownload.timestamp)} {formatTime(recentAppDownload.timestamp)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminBuildsPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [accessData, setAccessData] = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [generating, setGenerating] = useState<Record<string, 'website' | 'app' | null>>({})
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([])

  // ── Fetch teachers ──
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError('')
      const res = await apiFetch('/api/admin/teachers')
      const data = await res.json()
      if (data.success) {
        setTeachers(data.teachers)
        // Fetch access data for all teachers
        const ids: string[] = (data.teachers as TeacherData[]).map((t: TeacherData) => t.id)
        await fetchAccessData(ids)
      } else {
        setFetchError(data.message || 'Failed to fetch teachers')
      }
    } catch {
      setFetchError('Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch module access for all teachers ──
  const fetchAccessData = useCallback(async (teacherIds: string[]) => {
    const data: Record<string, Record<string, boolean>> = {}
    await Promise.all(
      teacherIds.map(async (id) => {
        try {
          const res = await apiFetch(`/api/admin/module-access?teacherId=${id}`)
          const result = await res.json()
          if (result.success) {
            data[id] = result.modules || {}
          }
        } catch {
          // Silently fail for individual teacher access fetch
        }
      })
    )
    setAccessData(data)
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // ── Computed values ──
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.organization?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.organization?.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const websiteDownloadCount = downloadHistory.filter(d => d.type === 'website').length
  const appDownloadCount = downloadHistory.filter(d => d.type === 'app').length

  // ── Download handler ──
  const handleDownload = async (teacherId: string, type: 'website' | 'app') => {
    setGenerating(prev => ({ ...prev, [teacherId]: type }))

    try {
      const endpoint =
        type === 'website'
          ? `/api/admin/generate-website?teacherId=${teacherId}`
          : `/api/admin/generate-app?teacherId=${teacherId}`

      const response = await apiFetch(endpoint)

      if (!response.ok) {
        let errorMsg = 'Generation failed'
        try {
          const errorData = await response.json()
          errorMsg = errorData.message || errorMsg
        } catch {
          // If not JSON, use status text
          errorMsg = response.statusText || errorMsg
        }
        throw new Error(errorMsg)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/)
      a.download = filenameMatch?.[1] || `${type}-${teacherId}.zip`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Find teacher for org code
      const teacher = teachers.find(t => t.id === teacherId)

      // Add to history
      setDownloadHistory(prev =>
        [
          {
            teacherId,
            type,
            timestamp: new Date(),
            orgCode: teacher?.organization?.code || '',
          },
          ...prev,
        ].slice(0, 20)
      )

      toast.success(
        `${type === 'website' ? 'Website' : 'Mobile App'} code downloaded!`,
        {
          description: 'Unzip and follow the README to get started.',
        }
      )
    } catch (error) {
      toast.error('Generation failed', {
        description:
          error instanceof Error ? error.message : 'Something went wrong',
      })
    } finally {
      setGenerating(prev => ({ ...prev, [teacherId]: null }))
    }
  }

  // ── Stats config ──
  const statsConfig = [
    {
      label: 'Total Teachers',
      value: teachers.length,
      icon: Users,
      accentBg: 'bg-amber-50',
      accentText: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
      subtitle: 'Available for builds',
    },
    {
      label: 'Websites Generated',
      value: websiteDownloadCount,
      icon: Globe,
      accentBg: 'bg-cyan-50',
      accentText: 'text-cyan-600',
      accentBorder: 'border-l-cyan-500',
      subtitle: 'Downloaded this session',
    },
    {
      label: 'Apps Generated',
      value: appDownloadCount,
      icon: Smartphone,
      accentBg: 'bg-pink-50',
      accentText: 'text-pink-600',
      accentBorder: 'border-l-pink-500',
      subtitle: 'Downloaded this session',
    },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-amber-100">
              <Code2 className="size-5 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Code Generator</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 ml-[46px]">
            Generate &amp; download white-labeled website and mobile app code for each
            teacher. One click, ready to publish!
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0 self-start sm:self-auto"
          onClick={fetchTeachers}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats Row */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {statsConfig.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.label}
                className={`min-w-0 rounded-xl border-l-4 ${stat.accentBorder} bg-white shadow-sm transition-shadow hover:shadow-md`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.subtitle}
                      </p>
                    </div>
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${stat.accentBg}`}
                    >
                      <Icon className={`size-5 ${stat.accentText}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      )}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search teachers by name, email, org name, or org code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-white border-gray-200 focus:border-amber-300 focus:ring-amber-200"
        />
      </motion.div>

      {/* Error State */}
      {fetchError && !loading && (
        <Card className="bg-white shadow-sm rounded-xl border border-red-100">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center size-14 rounded-full bg-red-50">
              <AlertCircle className="size-7 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                Failed to load teachers
              </p>
              <p className="text-xs text-muted-foreground mt-1">{fetchError}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeachers}
              className="gap-2"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State - No Teachers */}
      {!loading && !fetchError && teachers.length === 0 && (
        <Card className="bg-white shadow-sm rounded-xl">
          <CardContent className="p-10 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-amber-50">
              <Package className="size-8 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">No teachers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add teachers first to generate their white-labeled code builds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Search Results */}
      {!loading && !fetchError && teachers.length > 0 && filteredTeachers.length === 0 && (
        <Card className="bg-white shadow-sm rounded-xl">
          <CardContent className="p-10 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-gray-50">
              <Search className="size-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search query to find what you&apos;re looking for.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="gap-2"
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teacher Cards Grid */}
      {!loading && !fetchError && filteredTeachers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTeachers.map((teacher) => (
              <TeacherBuildCard
                key={teacher.id}
                teacher={teacher}
                accessMap={accessData[teacher.id] || null}
                generating={generating[teacher.id] || null}
                downloadHistory={downloadHistory}
                onDownload={handleDownload}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Download History Section */}
      {!loading && downloadHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-white shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Recent Downloads
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-0 text-xs"
                >
                  This session
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {downloadHistory.map((record, idx) => {
                    const teacher = teachers.find(
                      t => t.id === record.teacherId
                    )
                    const isWebsite = record.type === 'website'

                    return (
                      <motion.div
                        key={`${record.teacherId}-${record.type}-${idx}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                            isWebsite ? 'bg-cyan-50' : 'bg-pink-50'
                          }`}
                        >
                          {isWebsite ? (
                            <Globe className="size-4 text-cyan-600" />
                          ) : (
                            <Smartphone className="size-4 text-pink-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {teacher?.name || 'Unknown Teacher'}
                            <span className="text-muted-foreground font-normal">
                              {' '}
                              — {isWebsite ? 'Website' : 'Mobile App'}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="font-mono">{record.orgCode}</span>
                            <span className="text-gray-300">•</span>
                            <span>
                              {formatDateShort(record.timestamp)}{' '}
                              {formatTime(record.timestamp)}
                            </span>
                          </p>
                        </div>
                        <div
                          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                            isWebsite
                              ? 'bg-cyan-50 text-cyan-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {isWebsite ? 'Website' : 'App'}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
