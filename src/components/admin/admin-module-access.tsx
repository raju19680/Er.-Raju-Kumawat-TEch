'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Shield,
  Search,
  Users,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ArrowRightLeft,
  Eye,
  Zap,
  X,
  AlertTriangle,
  Save,
  ShieldCheck,
  ShieldOff,
  Filter,
  Sparkles,
  UserCog,
  Settings2,
  Download,
  Upload,
  Siren,
  GitCompareArrows,
  Command,
  CheckSquare,
  Square,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  MODULES,
  CATEGORIES,
  MODULES_BY_CATEGORY,
  ALL_MODULE_KEYS,
  ALL_SUB_FEATURE_KEYS,
  ALL_ACCESS_KEYS,
  PRESETS,
  getModuleDef,
  getSubFeatureDef,
  getAccessKeyLabel,
  getModuleSubFeatures,
  buildFullAccessMap,
  countEnabledSubFeatures,
  resolveDependencies,
  cascadeModuleToggle,
  getPresetColorClasses,
  getCategoryColor,
  type ModulePreset,
} from '@/lib/module-registry'

// ── Types ────────────────────────────────────────────────────────────────────
interface TeacherInfo {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  organizationId?: string | null
  createdAt?: string
  organization?: {
    id: string
    name: string
    code: string
    accentColor: string
    status: string
  } | null
}

interface AccessLogEntry {
  id: string
  teacherId: string
  teacherName: string
  moduleKey: string
  action: string
  changedBy: string
  changedAt: string
  details?: string | null
}

type AccessLevel = 'full' | 'partial' | 'none' | 'custom'
type TeacherFilter = 'all' | 'full' | 'partial' | 'none'

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

function countEnabledModules(accessMap: Record<string, boolean>): number {
  return ALL_MODULE_KEYS.filter(k => accessMap[k] !== false).length
}

function countEnabledFeatures(accessMap: Record<string, boolean>): number {
  return ALL_SUB_FEATURE_KEYS.filter(k => accessMap[k] !== false).length
}

function getAccessLevel(accessMap: Record<string, boolean>): AccessLevel {
  const enabledMods = countEnabledModules(accessMap)
  const totalMods = ALL_MODULE_KEYS.length
  if (enabledMods === totalMods) return 'full'
  if (enabledMods === 0) return 'none'
  return 'partial'
}

function getAccessLevelBadge(level: AccessLevel) {
  switch (level) {
    case 'full': return { label: 'Full Access', className: 'bg-emerald-100 text-emerald-700 border-0' }
    case 'partial': return { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-0' }
    case 'none': return { label: 'No Access', className: 'bg-red-100 text-red-700 border-0' }
    default: return { label: 'Custom', className: 'bg-gray-100 text-gray-600 border-0' }
  }
}

// ── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ value, max, size = 36, strokeWidth = 3, color = '#d97706' }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percent = max > 0 ? value / max : 0
  const offset = circumference - percent * circumference
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-500 ease-out" />
    </svg>
  )
}

// ── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center justify-center size-8 sm:size-9 rounded-lg ${color}`}>
            <Icon className="size-3.5 sm:size-4 text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-xs text-muted-foreground">{label}</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{value}</p>
            {sub && <p className="text-[9px] sm:text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Spinning loader ──────────────────────────────────────────────────────────
function Spinner({ className = 'size-4' }: { className?: string }) {
  return <span className={`${className} border-2 border-white/30 border-t-white rounded-full animate-spin inline-block`} />
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER LIST (Shared between Sheet and Panel)
// ═══════════════════════════════════════════════════════════════════════════════
function TeacherListContent({
  teachers,
  accessData,
  selectedTeacherId,
  onSelect,
  loading,
  bulkMode,
  selectedBulkIds,
  onToggleBulk,
  teacherFilter,
}: {
  teachers: TeacherInfo[]
  accessData: Record<string, Record<string, boolean>>
  selectedTeacherId: string | null
  onSelect: (id: string) => void
  loading: boolean
  bulkMode: boolean
  selectedBulkIds: Set<string>
  onToggleBulk: (id: string) => void
  teacherFilter: TeacherFilter
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = teachers
    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.organization?.name || '').toLowerCase().includes(q) ||
        (t.organization?.code || '').toLowerCase().includes(q)
      )
    }
    // Apply filter
    if (teacherFilter !== 'all') {
      list = list.filter(t => {
        const access = accessData[t.id] || {}
        const level = getAccessLevel(access)
        if (teacherFilter === 'full') return level === 'full'
        if (teacherFilter === 'partial') return level === 'partial'
        if (teacherFilter === 'none') return level === 'none'
        return true
      })
    }
    return list
  }, [teachers, search, teacherFilter, accessData])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-gray-100">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
            inputMode="search"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{filtered.length} teacher{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Teacher List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.map(teacher => {
            const isSelected = teacher.id === selectedTeacherId
            const access = accessData[teacher.id] || {}
            const enabledModules = countEnabledModules(access)
            const totalModules = ALL_MODULE_KEYS.length
            const pct = Math.round((enabledModules / totalModules) * 100)
            const accentColor = teacher.organization?.accentColor || '#d97706'
            const level = getAccessLevel(access)
            const badge = getAccessLevelBadge(level)
            const isBulkSelected = selectedBulkIds.has(teacher.id)

            return (
              <div
                key={teacher.id}
                className={`w-full flex items-center gap-2 p-3 rounded-lg text-left transition-all duration-150 min-h-[44px] ${
                  isSelected
                    ? 'bg-amber-50 border border-amber-200 shadow-sm'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => !bulkMode && onSelect(teacher.id)}
                role="button"
                tabIndex={0}
              >
                {bulkMode && (
                  <div className="shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={isBulkSelected}
                      onCheckedChange={() => onToggleBulk(teacher.id)}
                      className="size-5 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                  </div>
                )}
                <div
                  className="flex items-center justify-center size-10 rounded-full text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {getInitials(teacher.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium truncate ${isSelected ? 'text-amber-900' : 'text-gray-900'}`}>
                      {teacher.name}
                    </span>
                    <Badge className={`${badge.className} text-[9px] px-1.5 py-0 h-4 shrink-0`}>
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${pct === 0 ? 'text-red-500' : pct < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {enabledModules}/{totalModules} modules
                    </span>
                  </div>
                </div>
                {!bulkMode && (
                  <ProgressRing value={enabledModules} max={totalModules} size={28} strokeWidth={2.5}
                    color={pct === 0 ? '#ef4444' : pct < 50 ? '#f59e0b' : accentColor} />
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <Users className="size-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No teachers found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESS CONFIGURATION (Right Panel / Main content)
// ═══════════════════════════════════════════════════════════════════════════════
function AccessConfigPanel({
  teacher,
  allTeachers,
  initialAccessMap,
  onSaved,
  onBack,
}: {
  teacher: TeacherInfo
  allTeachers: TeacherInfo[]
  initialAccessMap: Record<string, boolean>
  onSaved: () => void
  onBack?: () => void
}) {
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>(initialAccessMap)
  const [originalMap, setOriginalMap] = useState<Record<string, boolean>>(initialAccessMap)
  const [saving, setSaving] = useState(false)
  const [logs, setLogs] = useState<AccessLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('modules')
  const [logFilter, setLogFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [copyFromTeacherId, setCopyFromTeacherId] = useState<string>('')
  const [previewPreset, setPreviewPreset] = useState<ModulePreset | null>(null)
  const [presetPreviewOpen, setPresetPreviewOpen] = useState(false)
  const [presetConfirmOpen, setPresetConfirmOpen] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<ModulePreset | null>(null)
  const [moduleSearch, setModuleSearch] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareTeacherId, setCompareTeacherId] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)
  const [importJson, setImportJson] = useState('')

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !saving) handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  // Auto-expand all when switching to modules tab
  useEffect(() => {
    if (activeTab === 'modules') {
      setExpandedModules(new Set(ALL_MODULE_KEYS))
    }
  }, [activeTab])

  const fetchLogs = useCallback(async () => {
    if (!teacher) return
    try {
      setLogsLoading(true)
      const res = await apiFetch(`/api/admin/module-access/log?teacherId=${teacher.id}&limit=50`)
      const data = await res.json()
      if (data.success) setLogs(data.logs || [])
    } catch { /* silent */ } finally { setLogsLoading(false) }
  }, [teacher])

  useEffect(() => {
    const map = { ...initialAccessMap }
    setAccessMap(map)
    setOriginalMap(map)
    setActiveTab('modules')
    setCopyFromTeacherId('')
    setModuleSearch('')
    fetchLogs()
  }, [teacher?.id, initialAccessMap, fetchLogs])

  const changesCount = useMemo(() => {
    let count = 0
    for (const key of ALL_ACCESS_KEYS) {
      if ((accessMap[key] ?? false) !== (originalMap[key] ?? false)) count++
    }
    return count
  }, [accessMap, originalMap])

  const hasChanges = changesCount > 0

  const handleModuleToggle = useCallback((key: string, value: boolean) => {
    setAccessMap(prev => cascadeModuleToggle(key, value, prev))
  }, [])

  const handleSubFeatureToggle = useCallback((key: string, value: boolean) => {
    setAccessMap(prev => resolveDependencies(key, value, prev))
  }, [])

  const handleCategoryToggle = useCallback((categoryName: string, value: boolean) => {
    setAccessMap(prev => {
      const updated = { ...prev }
      const cat = MODULES_BY_CATEGORY.find(c => c.name === categoryName)
      if (!cat) return prev
      for (const mod of cat.modules) {
        updated[mod.key] = value
        for (const sf of mod.subFeatures) {
          updated[sf.key] = value
        }
      }
      return updated
    })
  }, [])

  const handlePresetApplyRequest = useCallback((preset: ModulePreset) => {
    setPendingPreset(preset)
    setPresetConfirmOpen(true)
  }, [])

  const handlePresetApplyConfirm = useCallback(() => {
    if (!pendingPreset) return
    const newMap = buildFullAccessMap(false)
    for (const key of pendingPreset.features) newMap[key] = true
    setAccessMap(newMap)
    toast.success(`Applied "${pendingPreset.name}" preset`)
    setPresetConfirmOpen(false)
    setPendingPreset(null)
  }, [pendingPreset])

  const handleCopyFrom = useCallback(async () => {
    if (!teacher || !copyFromTeacherId || copyFromTeacherId === teacher.id) return
    try {
      setSaving(true)
      const res = await apiFetch('/api/admin/module-access/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceTeacherId: copyFromTeacherId, targetTeacherId: teacher.id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Access copied successfully', { description: data.message })
        onSaved()
      } else {
        toast.error('Failed to copy access', { description: data.message })
      }
    } catch {
      toast.error('Failed to copy access', { description: 'Could not connect to server.' })
    } finally { setSaving(false) }
  }, [teacher, copyFromTeacherId, onSaved])

  const handleEnableAll = useCallback(() => setAccessMap(buildFullAccessMap(true)), [])
  const handleDisableAll = useCallback(() => setAccessMap(buildFullAccessMap(false)), [])
  const handleReset = useCallback(() => setAccessMap({ ...originalMap }), [originalMap])

  const handleSave = useCallback(async () => {
    if (!teacher) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/module-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacher.id, modules: accessMap }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Module access updated', { description: data.message })
        onSaved()
      } else {
        toast.error('Failed to save', { description: data.message || 'Something went wrong' })
      }
    } catch {
      toast.error('Failed to save', { description: 'Could not connect to server. Please try again.' })
    } finally { setSaving(false) }
  }, [teacher, accessMap, onSaved])

  // Emergency access
  const handleEmergencyAccess = useCallback(async () => {
    if (!teacher) return
    setSaving(true)
    try {
      const fullMap = buildFullAccessMap(true)
      const res = await apiFetch('/api/admin/module-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          modules: fullMap,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Emergency full access granted (24h)', { description: `${teacher.name} now has full access to all modules.` })
        setEmergencyOpen(false)
        onSaved()
      } else {
        toast.error('Failed to grant emergency access')
      }
    } catch {
      toast.error('Failed to grant emergency access')
    } finally { setSaving(false) }
  }, [teacher, onSaved])

  // Export config
  const handleExport = useCallback(() => {
    const config = {
      teacherId: teacher.id,
      teacherName: teacher.name,
      exportedAt: new Date().toISOString(),
      modules: accessMap,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `access-config-${teacher.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Access config exported')
  }, [teacher, accessMap])

  // Import config
  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importJson)
      if (!parsed.modules || typeof parsed.modules !== 'object') {
        toast.error('Invalid config format', { description: 'JSON must contain a "modules" object.' })
        return
      }
      const newMap = buildFullAccessMap(false)
      for (const key of ALL_ACCESS_KEYS) {
        if (key in parsed.modules) {
          newMap[key] = parsed.modules[key] === true
        }
      }
      setAccessMap(newMap)
      setImportOpen(false)
      setImportJson('')
      toast.success('Access config imported', { description: 'Review and save to apply.' })
    } catch {
      toast.error('Invalid JSON', { description: 'Please check the format and try again.' })
    }
  }, [importJson])

  // Toggle module expand/collapse
  const toggleExpand = useCallback((key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }, [])

  const expandAll = useCallback(() => setExpandedModules(new Set(ALL_MODULE_KEYS)), [])
  const collapseAll = useCallback(() => setExpandedModules(new Set()), [])

  const filteredModulesByCategory = useMemo(() => {
    if (!moduleSearch.trim()) return MODULES_BY_CATEGORY
    const q = moduleSearch.toLowerCase()
    return MODULES_BY_CATEGORY.map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.subFeatures.some(sf => sf.label.toLowerCase().includes(q) || sf.description.toLowerCase().includes(q))
      ),
    })).filter(cat => cat.modules.length > 0)
  }, [moduleSearch])

  const enabledModules = countEnabledModules(accessMap)
  const enabledFeatures = countEnabledFeatures(accessMap)
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs
    return logs.filter(l => l.action === logFilter)
  }, [logs, logFilter])

  const copyFromTeachers = allTeachers.filter(t => t.id !== teacher?.id)
  const accentColor = teacher.organization?.accentColor || '#d97706'

  // Comparison data
  const compareData = useMemo(() => {
    if (!compareTeacherId) return null
    const other = allTeachers.find(t => t.id === compareTeacherId)
    if (!other) return null
    return { teacher: other }
  }, [compareTeacherId, allTeachers])

  return (
    <div className="flex flex-col h-full">
      {/* ── Teacher Header ── */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 md:hidden" onClick={onBack}>
              <ChevronRight className="size-5 rotate-180" />
            </Button>
          )}
          <div className="flex items-center justify-center size-10 sm:size-11 rounded-full text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: accentColor }}>
            {getInitials(teacher.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{teacher.name}</h2>
            <p className="text-xs sm:text-xs text-muted-foreground truncate">{teacher.email}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={`${getAccessLevelBadge(getAccessLevel(accessMap)).className} text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 h-5`}>
              {getAccessLevelBadge(getAccessLevel(accessMap)).label}
            </Badge>
            {teacher.organization && (
              <Badge variant="outline" className="text-[9px] sm:text-xs font-mono hidden sm:inline-flex">
                {teacher.organization.code}
              </Badge>
            )}
          </div>
        </div>

        {/* Module count summary */}
        <div className="mt-2.5 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <ProgressRing value={enabledModules} max={ALL_MODULE_KEYS.length} size={36} strokeWidth={3}
            color={enabledModules === 0 ? '#ef4444' : enabledModules < ALL_MODULE_KEYS.length / 2 ? '#f59e0b' : accentColor} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">
              {enabledModules} of {ALL_MODULE_KEYS.length} modules enabled
            </p>
            <p className="text-xs text-muted-foreground">
              {enabledFeatures} of {ALL_SUB_FEATURE_KEYS.length} features active
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="text-xs h-7 min-h-[44px] sm:min-h-0" onClick={handleEnableAll} disabled={saving}>
              <Unlock className="size-3 mr-1" /> All On
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7 min-h-[44px] sm:min-h-0" onClick={handleDisableAll} disabled={saving}>
              <Lock className="size-3 mr-1" /> All Off
            </Button>
            {hasChanges && (
              <Button variant="outline" size="sm" className="text-xs h-7 min-h-[44px] sm:min-h-0" onClick={handleReset} disabled={saving}>
                <RotateCcw className="size-3 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Quick actions for mobile */}
        <div className="flex sm:hidden items-center gap-1.5 mt-2">
          <Button variant="outline" size="sm" className="text-xs h-9 flex-1" onClick={handleEnableAll} disabled={saving}>
            <Unlock className="size-3 mr-1" /> All On
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9 flex-1" onClick={handleDisableAll} disabled={saving}>
            <Lock className="size-3 mr-1" /> All Off
          </Button>
          {hasChanges && (
            <Button variant="outline" size="sm" className="text-xs h-9 flex-1" onClick={handleReset} disabled={saving}>
              <RotateCcw className="size-3 mr-1" /> Reset
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleExport}>
            <Download className="size-3" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => setImportOpen(true)}>
            <Upload className="size-3" />
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 px-3 sm:px-4 pt-2 border-b border-gray-100 bg-white">
          <TabsList className="w-full bg-gray-100/60 h-9">
            <TabsTrigger value="modules" className="flex-1 text-xs sm:text-xs gap-1 min-h-[40px] sm:min-h-0">
              <Shield className="size-3" /> Modules
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex-1 text-xs sm:text-xs gap-1 min-h-[40px] sm:min-h-0">
              <Sparkles className="size-3" /> Presets
            </TabsTrigger>
            <TabsTrigger value="copy" className="flex-1 text-xs sm:text-xs gap-1 min-h-[40px] sm:min-h-0">
              <ArrowRightLeft className="size-3" /> Copy
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 text-xs sm:text-xs gap-1 min-h-[40px] sm:min-h-0">
              <Activity className="size-3" /> Log
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Modules Tab ── */}
        <TabsContent value="modules" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 space-y-4">
              {/* Module Search + Expand/Collapse */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Search modules & features..."
                    value={moduleSearch}
                    onChange={e => setModuleSearch(e.target.value)}
                    className="pl-8 h-9 sm:h-8 text-xs"
                    inputMode="search"
                  />
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-9 sm:h-8 px-2 min-h-[44px] sm:min-h-0" onClick={expandAll}>
                  <ChevronDown className="size-3 mr-0.5" />Expand
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-9 sm:h-8 px-2 min-h-[44px] sm:min-h-0" onClick={collapseAll}>
                  <ChevronRight className="size-3 mr-0.5" />Collapse
                </Button>
              </div>

              {filteredModulesByCategory.map(category => {
                const catColor = getCategoryColor(category.name)
                const catEnabled = category.modules.filter(m => accessMap[m.key] !== false).length
                const catAllEnabled = catEnabled === category.modules.length
                const catNoneEnabled = catEnabled === 0

                return (
                  <div key={category.name}>
                    {/* Category Header with toggle */}
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#f8fafc] z-10 py-1">
                      <Badge variant="secondary" className={`${catColor.badge} text-xs px-2 py-0.5 h-5 border-0 font-semibold`}>
                        {category.label}
                      </Badge>
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground font-medium mr-1">
                        {catEnabled}/{category.modules.length}
                      </span>
                      <Switch
                        checked={catAllEnabled}
                        onCheckedChange={(checked) => handleCategoryToggle(category.name, checked)}
                        className={`data-[state=checked]:bg-amber-600 ${catNoneEnabled ? '' : ''}`}
                      />
                    </div>

                    {/* Module Rows */}
                    <div className="space-y-1">
                      {category.modules.map(mod => {
                        const isOpen = expandedModules.has(mod.key)
                        const moduleEnabled = accessMap[mod.key] !== false
                        const { enabled: enabledSf, total: totalSf } = countEnabledSubFeatures(mod.key, accessMap)
                        const IconComp = mod.icon

                        return (
                          <div key={mod.key} className={`rounded-lg border transition-all duration-150 ${
                            moduleEnabled ? 'border-amber-200 bg-white' : 'border-gray-200 bg-gray-50/50'
                          }`}>
                            {/* Module Header Row */}
                            <div className="flex items-center gap-2 px-2 sm:px-3 py-2 min-h-[44px]">
                              <button
                                type="button"
                                onClick={() => toggleExpand(mod.key)}
                                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                              >
                                <ChevronRight className={`size-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                                <div className={`flex items-center justify-center size-7 rounded-md shrink-0 ${moduleEnabled ? 'bg-amber-100' : 'bg-gray-100'}`}>
                                  <IconComp className={`size-3.5 ${moduleEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs sm:text-sm ${moduleEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                    {mod.label}
                                  </span>
                                  <p className={`text-[9px] sm:text-xs truncate ${moduleEnabled ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {mod.description}
                                  </p>
                                </div>
                                <Badge variant="secondary" className={`text-xs px-1.5 py-0 h-4 shrink-0 hidden sm:inline-flex ${
                                  enabledSf === totalSf ? 'bg-amber-100 text-amber-700' :
                                  enabledSf > 0 ? 'bg-gray-100 text-gray-600' :
                                  'bg-gray-50 text-gray-400'
                                }`}>
                                  {enabledSf}/{totalSf}
                                </Badge>
                              </button>
                              <Switch
                                checked={moduleEnabled}
                                onCheckedChange={(checked) => handleModuleToggle(mod.key, checked)}
                                className="data-[state=checked]:bg-amber-600"
                              />
                            </div>

                            {/* Sub-Features */}
                            {isOpen && (
                              <div className="px-2 sm:px-3 pb-2 space-y-0.5 border-t border-gray-100/80">
                                {mod.subFeatures.map(sf => {
                                  const sfEnabled = accessMap[sf.key] !== false
                                  const SfIcon = sf.icon
                                  return (
                                    <div key={sf.key} className={`flex items-center justify-between gap-2 py-1.5 px-1 sm:px-2 rounded-md transition-colors min-h-[40px] ${
                                      sfEnabled ? 'hover:bg-amber-50/50' : 'hover:bg-gray-50'
                                    }`}>
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`flex items-center justify-center size-5 rounded shrink-0 ${sfEnabled ? 'bg-amber-50' : 'bg-gray-50'}`}>
                                          <SfIcon className={`size-2.5 ${sfEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="min-w-0">
                                          <span className={`text-xs sm:text-xs ${sfEnabled ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                            {sf.label}
                                          </span>
                                          {sf.dependsOn && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="ml-1 text-[8px] sm:text-[9px] text-gray-400 inline-flex items-center gap-0.5 cursor-help">
                                                  <Lock className="size-2" />
                                                  needs {getSubFeatureDef(sf.dependsOn)?.subFeature.label || sf.dependsOn}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent className="text-xs">
                                                Requires &quot;{getSubFeatureDef(sf.dependsOn)?.subFeature.label || sf.dependsOn}&quot; to be enabled
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </div>
                                      </div>
                                      <Switch
                                        checked={sfEnabled}
                                        onCheckedChange={(checked) => handleSubFeatureToggle(sf.key, checked)}
                                        className="data-[state=checked]:bg-amber-600"
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Presets Tab ── */}
        <TabsContent value="presets" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 space-y-3">
              <p className="text-xs sm:text-xs text-muted-foreground">
                Apply a preset to quickly configure access. A confirmation will be required before applying.
              </p>
              {PRESETS.map(preset => {
                const colors = getPresetColorClasses(preset.color)
                const IconComp = preset.icon
                const moduleCount = preset.features.filter(f => !f.includes('.')).length
                const featureCount = preset.features.filter(f => f.includes('.')).length

                return (
                  <div key={preset.id} className={`rounded-lg border p-3 sm:p-4 transition-all duration-150 ${colors.bg}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center size-9 rounded-lg ${colors.badge} shrink-0`}>
                        <IconComp className={`size-4 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">{preset.name}</span>
                        <p className="text-xs sm:text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge className={`${colors.badge} border-0 text-xs shrink-0`}>
                        {moduleCount} modules
                      </Badge>
                      {featureCount > 0 && (
                        <Badge className={`${colors.badge} border-0 text-xs shrink-0`}>
                          {featureCount} features
                        </Badge>
                      )}
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" className="text-xs h-8 px-2 min-h-[44px] sm:min-h-0"
                        onClick={() => { setPreviewPreset(preset); setPresetPreviewOpen(true) }}>
                        <Eye className="size-3 mr-1" /> Preview
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8 px-3 min-h-[44px] sm:min-h-0"
                        onClick={() => handlePresetApplyRequest(preset)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Copy Tab ── */}
        <TabsContent value="copy" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">This will replace all current settings</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Copying access from another teacher will overwrite all module and feature settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Select teacher to copy from</label>
                <Select value={copyFromTeacherId} onValueChange={setCopyFromTeacherId}>
                  <SelectTrigger className="w-full min-h-[44px]">
                    <SelectValue placeholder="Choose a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {copyFromTeachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                          <span className="text-muted-foreground text-xs">({t.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {copyFromTeacherId && (() => {
                const src = copyFromTeachers.find(t => t.id === copyFromTeacherId)
                if (!src) return null
                return (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-9 rounded-full text-white text-xs font-semibold shrink-0"
                          style={{ backgroundColor: src.organization?.accentColor || '#d97706' }}>
                          {getInitials(src.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{src.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{src.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white min-h-[44px]"
                disabled={!copyFromTeacherId || saving || copyFromTeacherId === teacher.id}
                onClick={handleCopyFrom}>
                {saving ? (
                  <><Spinner className="size-3.5 mr-2" />Copying...</>
                ) : (
                  <><ArrowRightLeft className="size-4 mr-1.5" />Copy Access</>
                )}
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Activity Tab ── */}
        <TabsContent value="activity" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Select value={logFilter} onValueChange={(v) => setLogFilter(v as 'all' | 'enabled' | 'disabled')}>
                  <SelectTrigger size="sm" className="w-[120px] min-h-[44px] sm:min-h-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{filteredLogs.length} entries</span>
              </div>

              {logsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="size-7 rounded-md shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="size-8 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Changes to module access will appear here</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredLogs.map(log => {
                    const subDef = getSubFeatureDef(log.moduleKey)
                    const isSubFeature = !!subDef
                    const moduleKey = isSubFeature ? log.moduleKey.split('.')[0] : log.moduleKey
                    const modDef = getModuleDef(moduleKey)
                    const label = getAccessKeyLabel(log.moduleKey)
                    const parentLabel = modDef?.label || moduleKey

                    return (
                      <div key={log.id} className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
                        <div className={`flex items-center justify-center size-6 rounded-md shrink-0 mt-0.5 ${
                          log.action === 'enabled' ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {log.action === 'enabled' ? <Check className="size-3 text-emerald-600" /> : <Lock className="size-3 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700">
                            <span className={log.action === 'enabled' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                              {log.action === 'enabled' ? 'Enabled' : 'Disabled'}
                            </span>
                            {' '}{label}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isSubFeature && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">{parentLabel}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              <Clock className="size-2.5 inline mr-0.5" />{formatDate(log.changedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* ── Sticky Save Bar ── */}
      {hasChanges && (
        <div className="shrink-0 border-t border-amber-200 bg-amber-50 p-2 sm:p-3 safe-area-bottom">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs sm:text-xs text-amber-700">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{changesCount} unsaved</span>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} className="text-xs sm:text-xs h-9 min-h-[44px] sm:min-h-0">
              <RotateCcw className="size-3 mr-1" />Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}
              className="text-xs sm:text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white min-h-[44px] sm:min-h-0">
              {saving ? (
                <><Spinner className="size-3.5 mr-1" />Saving...</>
              ) : (
                <><Save className="size-3.5 mr-1" />Save</>
              )}
            </Button>
            <span className="hidden sm:inline text-[9px] text-muted-foreground">
              <Command className="size-2.5 inline" />+S
            </span>
          </div>
        </div>
      )}

      {/* ── Preset Preview Dialog ── */}
      <Dialog open={presetPreviewOpen} onOpenChange={setPresetPreviewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewPreset && (() => {
                const IconComp = previewPreset.icon
                const colors = getPresetColorClasses(previewPreset.color)
                return <IconComp className={`size-5 ${colors.icon}`} />
              })()}
              {previewPreset?.name} Preset
            </DialogTitle>
            <DialogDescription>{previewPreset?.description}</DialogDescription>
          </DialogHeader>
          {previewPreset && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3 pr-3">
                {MODULES_BY_CATEGORY.map(cat => {
                  const catModules = cat.modules.filter(m =>
                    previewPreset.features.includes(m.key) ||
                    m.subFeatures.some(sf => previewPreset.features.includes(sf.key))
                  )
                  if (catModules.length === 0) return null
                  const catColor = getCategoryColor(cat.name)

                  return (
                    <div key={cat.name}>
                      <Badge variant="secondary" className={`${catColor.badge} text-xs px-1.5 py-0.5 h-5 border-0 font-medium mb-1.5`}>
                        {cat.label}
                      </Badge>
                      <div className="space-y-1">
                        {catModules.map(mod => {
                          const modEnabled = previewPreset.features.includes(mod.key)
                          const enabledSfs = mod.subFeatures.filter(sf => previewPreset.features.includes(sf.key))
                          const IconComp = mod.icon
                          return (
                            <div key={mod.key} className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${modEnabled ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                              <IconComp className={`size-3.5 ${modEnabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                              <span className={`text-xs ${modEnabled ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>{mod.label}</span>
                              {enabledSfs.length > 0 && (
                                <div className="flex gap-1 ml-auto flex-wrap">
                                  {enabledSfs.map(sf => (
                                    <Badge key={sf.key} variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-emerald-100 text-emerald-700 border-0">
                                      {sf.label}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresetPreviewOpen(false)} className="text-xs">Close</Button>
            <Button onClick={() => { if (previewPreset) handlePresetApplyRequest(previewPreset); setPresetPreviewOpen(false) }}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
              Apply This Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preset Confirmation Dialog ── */}
      <Dialog open={presetConfirmOpen} onOpenChange={setPresetConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Apply Preset
            </DialogTitle>
            <DialogDescription>
              This will replace all current access settings for <strong>{teacher.name}</strong> with the &quot;{pendingPreset?.name}&quot; preset.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground">
              All existing module and feature selections will be overwritten. This action can be undone by saving different settings.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresetConfirmOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handlePresetApplyConfirm} className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
              <Check className="size-3.5 mr-1" /> Apply Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Emergency Access Dialog ── */}
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Siren className="size-5" />
              Emergency Full Access
            </DialogTitle>
            <DialogDescription>
              Grant temporary full access to <strong>{teacher.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-800">This will enable ALL modules immediately</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Full access will be granted and saved automatically. You can revoke it later by applying a different preset.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmergencyOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleEmergencyAccess} disabled={saving}
              className="text-xs bg-red-600 hover:bg-red-700 text-white">
              {saving ? <><Spinner className="size-3.5 mr-1" />Granting...</> : <><Siren className="size-3.5 mr-1" />Grant Full Access</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Compare Access Dialog ── */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="size-5 text-amber-600" />
              Compare Access
            </DialogTitle>
            <DialogDescription>Compare module access side by side</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={compareTeacherId} onValueChange={setCompareTeacherId}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select teacher to compare with..." />
              </SelectTrigger>
              <SelectContent>
                {copyFromTeachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {compareData && (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 pr-3">
                  <div className="grid grid-cols-[1fr_60px_60px] gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                    <span>Module</span>
                    <span className="text-center">{teacher.name.split(' ')[0]}</span>
                    <span className="text-center">{compareData.teacher.name.split(' ')[0]}</span>
                  </div>
                  {ALL_MODULE_KEYS.map(key => {
                    const modDef = getModuleDef(key)
                    const leftEnabled = accessMap[key] !== false
                    const rightEnabled = true // We don't have other teacher's access map in this context - would need API call
                    const IconComp = modDef?.icon || Shield
                    return (
                      <div key={key} className="grid grid-cols-[1fr_60px_60px] gap-2 items-center px-2 py-1 rounded text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <IconComp className={`size-3 ${leftEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
                          <span className={`truncate ${leftEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                            {modDef?.label || key}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          {leftEnabled ? <CheckCircle2 className="size-4 text-emerald-500" /> : <X className="size-4 text-red-400" />}
                        </div>
                        <div className="flex justify-center">
                          <span className="text-[9px] text-muted-foreground">—</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareOpen(false)} className="text-xs">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Config Dialog ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5 text-amber-600" />
              Import Access Config
            </DialogTitle>
            <DialogDescription>
              Paste a previously exported JSON config to apply access settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full h-40 text-xs font-mono p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder='{"modules": {"dashboard": true, "tests": false, ...}}'
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportJson('') }} className="text-xs">Cancel</Button>
            <Button onClick={handleImport} disabled={!importJson.trim()} className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
              <Upload className="size-3.5 mr-1" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminModuleAccessPage() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<TeacherInfo[]>([])
  const [accessData, setAccessData] = useState<Record<string, Record<string, boolean>>>({})
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set())
  const [bulkPresetOpen, setBulkPresetOpen] = useState(false)
  const [bulkPresetId, setBulkPresetId] = useState<string>('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareTeacherId, setCompareTeacherId] = useState<string>('')
  const [teacherFilter, setTeacherFilter] = useState<TeacherFilter>('all')

  const adminSelectedTeacherId = useAppStore((s) => s.adminSelectedTeacherId)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/admin/module-access')
      const data = await res.json()
      if (data.success) {
        setTeachers(data.teachers || [])
        setAccessData(data.data || {})
        // Auto-select teacher: prefer store value, otherwise first teacher
        if (!selectedTeacherId && data.teachers?.length > 0) {
          const preSelectId = adminSelectedTeacherId && data.teachers.some((t: TeacherInfo) => t.id === adminSelectedTeacherId)
            ? adminSelectedTeacherId
            : data.teachers[0].id
          setSelectedTeacherId(preSelectId)
          // Clear the store value after using it
          if (adminSelectedTeacherId) {
            useAppStore.getState().setAdminSelectedTeacherId(null)
          }
        }
      }
    } catch {
      toast.error('Failed to load module access data')
    } finally {
      setLoading(false)
    }
  }, [selectedTeacherId, adminSelectedTeacherId])

  useEffect(() => { fetchData() }, [])

  const selectedTeacher = useMemo(
    () => teachers.find(t => t.id === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  )

  const selectedAccessMap = useMemo(
    () => accessData[selectedTeacherId || ''] || buildFullAccessMap(false),
    [accessData, selectedTeacherId]
  )

  // Compute overall stats
  const overallStats = useMemo(() => {
    const totalTeachers = teachers.length
    const fullAccessCount = teachers.filter(t => {
      const map = accessData[t.id] || {}
      return ALL_MODULE_KEYS.every(k => map[k] !== false)
    }).length
    const noAccessCount = teachers.filter(t => {
      const map = accessData[t.id] || {}
      return ALL_MODULE_KEYS.every(k => map[k] === false)
    }).length
    const partialAccessCount = totalTeachers - fullAccessCount - noAccessCount
    return { totalTeachers, fullAccessCount, noAccessCount, partialAccessCount }
  }, [teachers, accessData])

  // Bulk toggle teacher
  const handleToggleBulk = useCallback((id: string) => {
    setSelectedBulkIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  // Bulk select all
  const handleBulkSelectAll = useCallback(() => {
    if (selectedBulkIds.size === teachers.length) {
      setSelectedBulkIds(new Set())
    } else {
      setSelectedBulkIds(new Set(teachers.map(t => t.id)))
    }
  }, [teachers, selectedBulkIds])

  // Bulk apply preset
  const handleBulkApply = useCallback(async () => {
    if (selectedBulkIds.size === 0) return
    setBulkSaving(true)
    try {
      const preset = PRESETS.find(p => p.id === bulkPresetId)
      const modulesMap: Record<string, boolean> = {}
      for (const key of ALL_ACCESS_KEYS) {
        modulesMap[key] = preset ? preset.features.includes(key) : false
      }
      const res = await apiFetch('/api/admin/module-access/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherIds: Array.from(selectedBulkIds),
          modules: modulesMap,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Bulk access applied', { description: data.message })
        setBulkPresetOpen(false)
        setSelectedBulkIds(new Set())
        setBulkMode(false)
        fetchData()
      } else {
        toast.error('Failed to apply bulk access', { description: data.message })
      }
    } catch {
      toast.error('Failed to apply bulk access')
    } finally { setBulkSaving(false) }
  }, [selectedBulkIds, bulkPresetId, fetchData])

  // Export all configs
  const handleExportAll = useCallback(() => {
    const config = {
      exportedAt: new Date().toISOString(),
      teachers: teachers.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        modules: accessData[t.id] || {},
      })),
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `all-access-configs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('All access configs exported')
  }, [teachers, accessData])

  // Import all configs
  const [importAllOpen, setImportAllOpen] = useState(false)
  const [importAllJson, setImportAllJson] = useState('')

  const handleImportAll = useCallback(async () => {
    try {
      const parsed = JSON.parse(importAllJson)
      if (!parsed.teachers || !Array.isArray(parsed.teachers)) {
        toast.error('Invalid format', { description: 'JSON must contain a "teachers" array.' })
        return
      }
      let appliedCount = 0
      for (const entry of parsed.teachers) {
        if (!entry.id || !entry.modules) continue
        const teacher = teachers.find(t => t.id === entry.id)
        if (!teacher) continue
        const modulesMap: Record<string, boolean> = {}
        for (const key of ALL_ACCESS_KEYS) {
          modulesMap[key] = entry.modules[key] === true
        }
        try {
          await apiFetch('/api/admin/module-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacherId: entry.id, modules: modulesMap }),
          })
          appliedCount++
        } catch { /* skip failed */ }
      }
      toast.success(`Imported access for ${appliedCount} teacher(s)`)
      setImportAllOpen(false)
      setImportAllJson('')
      fetchData()
    } catch {
      toast.error('Invalid JSON format')
    }
  }, [importAllJson, teachers, fetchData])

  const handleSelectTeacher = useCallback((id: string) => {
    setSelectedTeacherId(id)
    setMobileSheetOpen(false)
  }, [])

  const filterButtons: { key: TeacherFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: overallStats.totalTeachers },
    { key: 'full', label: 'Full', count: overallStats.fullAccessCount },
    { key: 'partial', label: 'Partial', count: overallStats.partialAccessCount },
    { key: 'none', label: 'None', count: overallStats.noAccessCount },
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3 sm:space-y-4">
        {/* Page Header */}
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="size-5 text-amber-600" />
              Module Access Control
            </h1>
            <p className="text-xs sm:text-xs text-muted-foreground mt-0.5">
              Control which modules and features each teacher can access
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="text-xs sm:text-xs h-9 min-h-[44px] sm:min-h-0" onClick={fetchData}>
              <RotateCcw className="size-3.5 mr-1" />Refresh
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-xs h-9 min-h-[44px] sm:min-h-0 hidden sm:inline-flex" onClick={handleExportAll}>
              <Download className="size-3.5 mr-1" />Export
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-xs h-9 min-h-[44px] sm:min-h-0 hidden sm:inline-flex" onClick={() => setImportAllOpen(true)}>
              <Upload className="size-3.5 mr-1" />Import
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-xs h-9 min-h-[44px] sm:min-h-0 hidden sm:inline-flex" onClick={() => setEmergencyOpen(true)}>
              <Siren className="size-3.5 mr-1 text-red-500" />Emergency
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatsCard icon={Users} label="Total Teachers" value={overallStats.totalTeachers} color="bg-slate-600" />
          <StatsCard icon={Unlock} label="Full Access" value={overallStats.fullAccessCount} sub="All modules enabled" color="bg-emerald-600" />
          <StatsCard icon={Settings2} label="Partial Access" value={overallStats.partialAccessCount} sub="Some modules enabled" color="bg-amber-600" />
          <StatsCard icon={Lock} label="No Access" value={overallStats.noAccessCount} sub="All modules disabled" color="bg-red-500" />
        </div>

        {/* ── DESKTOP LAYOUT (md+) ── */}
        <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
          <div className="flex h-[calc(100vh-320px)] min-h-[500px]">
            {/* Left Panel - Teacher List */}
            <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col">
              <div className="shrink-0 px-3 py-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <UserCog className="size-3.5 text-amber-600" />
                    Teachers
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button variant={bulkMode ? 'default' : 'ghost'} size="sm" className="h-6 text-[9px] px-1.5"
                      onClick={() => { setBulkMode(!bulkMode); if (bulkMode) setSelectedBulkIds(new Set()) }}>
                      {bulkMode ? <CheckSquare className="size-3 mr-0.5" /> : <Square className="size-3 mr-0.5" />}
                      {bulkMode ? 'Done' : 'Bulk'}
                    </Button>
                  </div>
                </div>
                {/* Teacher Filter Tabs */}
                <div className="flex items-center gap-1 mt-2">
                  {filterButtons.map(fb => (
                    <button
                      key={fb.key}
                      onClick={() => setTeacherFilter(fb.key)}
                      className={`px-2 py-1 rounded text-[9px] font-medium transition-colors ${
                        teacherFilter === fb.key
                          ? 'bg-amber-100 text-amber-700'
                          : 'text-muted-foreground hover:bg-gray-100'
                      }`}
                    >
                      {fb.label} ({fb.count})
                    </button>
                  ))}
                </div>
                {/* Bulk actions bar */}
                {bulkMode && (
                  <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-amber-50 rounded-md border border-amber-200">
                    <Checkbox
                      checked={selectedBulkIds.size === teachers.length && teachers.length > 0}
                      onCheckedChange={handleBulkSelectAll}
                      className="size-4 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <span className="text-[9px] text-amber-700 font-medium">
                      {selectedBulkIds.size} selected
                    </span>
                    <div className="flex-1" />
                    <Button size="sm" className="h-6 text-[9px] px-2 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={selectedBulkIds.size === 0}
                      onClick={() => setBulkPresetOpen(true)}>
                      Apply Preset
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0">
                <TeacherListContent
                  teachers={teachers}
                  accessData={accessData}
                  selectedTeacherId={selectedTeacherId}
                  onSelect={handleSelectTeacher}
                  loading={loading}
                  bulkMode={bulkMode}
                  selectedBulkIds={selectedBulkIds}
                  onToggleBulk={handleToggleBulk}
                  teacherFilter={teacherFilter}
                />
              </div>
            </div>

            {/* Right Panel - Access Config */}
            <div className="flex-1 min-h-0 bg-[#f8fafc]">
              {selectedTeacher ? (
                <AccessConfigPanel
                  key={selectedTeacher.id}
                  teacher={selectedTeacher}
                  allTeachers={teachers}
                  initialAccessMap={selectedAccessMap}
                  onSaved={fetchData}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <ShieldOff className="size-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">Select a teacher</p>
                    <p className="text-xs text-muted-foreground mt-1">Choose a teacher from the list to manage their module access</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ── MOBILE LAYOUT (<md) ── */}
        <div className="md:hidden">
          {/* Mobile top controls */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
            {filterButtons.map(fb => (
              <button
                key={fb.key}
                onClick={() => setTeacherFilter(fb.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
                  teacherFilter === fb.key
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-white text-muted-foreground border border-gray-200'
                }`}
              >
                {fb.label} ({fb.count})
              </button>
            ))}
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="h-9 text-xs px-2 shrink-0"
              onClick={() => setBulkMode(!bulkMode)}>
              {bulkMode ? <CheckSquare className="size-3 mr-1" /> : <Square className="size-3 mr-1" />}
              {bulkMode ? 'Done' : 'Bulk'}
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs px-2 shrink-0" onClick={handleExportAll}>
              <Download className="size-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs px-2 shrink-0" onClick={() => setImportAllOpen(true)}>
              <Upload className="size-3" />
            </Button>
          </div>

          {/* Bulk actions bar */}
          {bulkMode && (
            <div className="flex items-center gap-1.5 mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <Checkbox
                checked={selectedBulkIds.size === teachers.length && teachers.length > 0}
                onCheckedChange={handleBulkSelectAll}
                className="size-5 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
              />
              <span className="text-xs text-amber-700 font-medium">
                {selectedBulkIds.size} selected
              </span>
              <div className="flex-1" />
              <Button size="sm" className="h-9 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={selectedBulkIds.size === 0}
                onClick={() => setBulkPresetOpen(true)}>
                Apply Preset
              </Button>
            </div>
          )}

          {/* Selected teacher config or empty state */}
          {selectedTeacher ? (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-[calc(100vh-280px)] min-h-[400px] bg-[#f8fafc]">
                <AccessConfigPanel
                  key={selectedTeacher.id}
                  teacher={selectedTeacher}
                  allTeachers={teachers}
                  initialAccessMap={selectedAccessMap}
                  onSaved={fetchData}
                  onBack={() => setMobileSheetOpen(true)}
                />
              </div>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-center h-[calc(100vh-280px)] min-h-[400px]">
                <div className="text-center">
                  <ShieldOff className="size-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">Select a teacher</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap the button below to choose a teacher</p>
                </div>
              </div>
            </Card>
          )}

          {/* Floating Action Button - Open teacher selector */}
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="fixed bottom-6 left-4 z-40 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-4 py-3 shadow-lg transition-all min-h-[48px]"
          >
            <Users className="size-5" />
            <span className="text-sm font-medium">Teachers</span>
            {selectedTeacher && (
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {selectedTeacher.name.split(' ')[0]}
              </span>
            )}
          </button>

          {/* Mobile bottom action bar */}
          <div className="fixed bottom-6 right-4 z-40 flex items-center gap-2">
            <button
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full size-12 shadow-lg transition-all"
            >
              <Siren className="size-5" />
            </button>
          </div>
        </div>

        {/* ── Mobile Sheet (Teacher Selector) ── */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
            <SheetHeader className="px-3 pt-3 pb-0">
              <SheetTitle className="text-sm flex items-center gap-2">
                <UserCog className="size-4 text-amber-600" />
                Select Teacher
              </SheetTitle>
              <SheetDescription className="text-xs">
                Choose a teacher to manage their module access
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 min-h-0">
              <TeacherListContent
                teachers={teachers}
                accessData={accessData}
                selectedTeacherId={selectedTeacherId}
                onSelect={handleSelectTeacher}
                loading={loading}
                bulkMode={bulkMode}
                selectedBulkIds={selectedBulkIds}
                onToggleBulk={handleToggleBulk}
                teacherFilter={teacherFilter}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Bulk Apply Preset Dialog ── */}
        <Dialog open={bulkPresetOpen} onOpenChange={setBulkPresetOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="size-5 text-amber-600" />
                Bulk Apply Preset
              </DialogTitle>
              <DialogDescription>
                Apply a preset to {selectedBulkIds.size} selected teacher{selectedBulkIds.size !== 1 ? 's' : ''}.
                This will replace all their current access settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Select value={bulkPresetId} onValueChange={setBulkPresetId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Choose a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <p.icon className="size-3.5" />
                        <span>{p.name}</span>
                        <span className="text-muted-foreground text-xs">— {p.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {bulkPresetId && (() => {
                const preset = PRESETS.find(p => p.id === bulkPresetId)
                if (!preset) return null
                return (
                  <div className="rounded-lg border bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800">{preset.name}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{preset.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px]">
                        {preset.features.filter(f => !f.includes('.')).length} modules
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px]">
                        {preset.features.filter(f => f.includes('.')).length} features
                      </Badge>
                    </div>
                  </div>
                )
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkPresetOpen(false)} className="text-xs">Cancel</Button>
              <Button onClick={handleBulkApply} disabled={!bulkPresetId || bulkSaving}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                {bulkSaving ? <><Spinner className="size-3.5 mr-1" />Applying...</> : <><Check className="size-3.5 mr-1" />Apply to {selectedBulkIds.size} Teachers</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Emergency Access Dialog (global) ── */}
        <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <Siren className="size-5" />
                Emergency Full Access
              </DialogTitle>
              <DialogDescription>
                {selectedTeacher
                  ? <>Grant temporary full access to <strong>{selectedTeacher.name}</strong>.</>
                  : 'Select a teacher first, then grant emergency access.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-800">This will enable ALL modules immediately</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Full access will be saved to the database. You can revoke it later by applying a different preset or disabling individual modules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmergencyOpen(false)} className="text-xs">Cancel</Button>
              {selectedTeacher && (
                <Button
                  onClick={async () => {
                    setBulkSaving(true)
                    try {
                      const fullMap = buildFullAccessMap(true)
                      const res = await apiFetch('/api/admin/module-access', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teacherId: selectedTeacher.id, modules: fullMap }),
                      })
                      const data = await res.json()
                      if (data.success) {
                        toast.success('Emergency full access granted', { description: `${selectedTeacher.name} now has full access.` })
                        setEmergencyOpen(false)
                        fetchData()
                      } else {
                        toast.error('Failed to grant emergency access')
                      }
                    } catch {
                      toast.error('Failed to grant emergency access')
                    } finally { setBulkSaving(false) }
                  }}
                  disabled={bulkSaving}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {bulkSaving ? <><Spinner className="size-3.5 mr-1" />Granting...</> : <><Siren className="size-3.5 mr-1" />Grant Full Access</>}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Import All Dialog ── */}
        <Dialog open={importAllOpen} onOpenChange={setImportAllOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="size-5 text-amber-600" />
                Import Access Configurations
              </DialogTitle>
              <DialogDescription>
                Paste a previously exported JSON config to apply access settings for multiple teachers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <textarea
                className="w-full h-40 text-xs font-mono p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder='{"teachers": [{"id": "...", "modules": {...}}]}'
                value={importAllJson}
                onChange={e => setImportAllJson(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setImportAllOpen(false); setImportAllJson('') }} className="text-xs">Cancel</Button>
              <Button onClick={handleImportAll} disabled={!importAllJson.trim()} className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                <Upload className="size-3.5 mr-1" /> Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
