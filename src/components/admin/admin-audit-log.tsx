'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  Shield,
  BookOpen,
  Server,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  User,
  KeyRound,
  GraduationCap,
  Building2,
  Settings,
  Monitor,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string
  userId: string | null
  userName: string | null
  userRole: string | null
  action: string
  category: string
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  organizationId: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AuditStats {
  total: number
  byCategory: Record<string, number>
  recentCount: number
}

interface AuditLogData {
  success: boolean
  logs: AuditLogEntry[]
  pagination: Pagination
  stats: AuditStats
}

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  auth: {
    label: 'Auth',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50 border-violet-200',
    icon: KeyRound,
  },
  teacher: {
    label: 'Teacher',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    icon: User,
  },
  student: {
    label: 'Student',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    icon: GraduationCap,
  },
  organization: {
    label: 'Organization',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: Building2,
  },
  content: {
    label: 'Content',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    icon: BookOpen,
  },
  settings: {
    label: 'Settings',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
    icon: Settings,
  },
  system: {
    label: 'System',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: Monitor,
  },
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  platform_admin: {
    label: 'Admin',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  teacher: {
    label: 'Teacher',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  student: {
    label: 'Student',
    className: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-50',
  },
  system: {
    label: 'System',
    className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

function parseDetails(details: string | null): Record<string, unknown> | null {
  if (!details) return null
  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}

function formatActionLabel(action: string): string {
  return action
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' → ')
}

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminAuditLogPage() {
  const { adminPage } = useAppStore()

  // Data state
  const [data, setData] = useState<AuditLogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [category, setCategory] = useState<string>('all')
  const [actionSearch, setActionSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchAuditLog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (category && category !== 'all') params.set('category', category)
      if (actionSearch) params.set('action', actionSearch)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await apiFetch(`/api/admin/audit-log?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.error || 'Failed to load audit log data')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [page, category, actionSearch, dateFrom, dateTo])

  useEffect(() => {
    fetchAuditLog()
  }, [fetchAuditLog])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [category, actionSearch, dateFrom, dateTo])

  const handleClearFilters = () => {
    setCategory('all')
    setActionSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    toast.success('Filters cleared')
  }

  const hasActiveFilters = category !== 'all' || actionSearch || dateFrom || dateTo

  // ── Computed stat cards ──
  const statCards = data
    ? [
        {
          label: 'Total Logs',
          value: data.stats.total.toLocaleString('en-IN'),
          sub: 'All time entries',
          icon: FileText,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
        },
        {
          label: 'Auth Events',
          value: (data.stats.byCategory.auth || 0).toLocaleString('en-IN'),
          sub: 'Login & access events',
          icon: Shield,
          color: 'text-violet-600',
          bgColor: 'bg-violet-50',
        },
        {
          label: 'Content Changes',
          value: (
            (data.stats.byCategory.content || 0) +
            (data.stats.byCategory.teacher || 0)
          ).toLocaleString('en-IN'),
          sub: 'Content & teacher actions',
          icon: BookOpen,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
        },
        {
          label: 'System Events',
          value: (
            (data.stats.byCategory.system || 0) +
            (data.stats.byCategory.settings || 0)
          ).toLocaleString('en-IN'),
          sub: `${data.stats.recentCount} in last 24h`,
          icon: Server,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        },
      ]
    : []

  // ── Render ────────────────────────────────────────────────────────────────

  if (adminPage !== 'admin-audit-log') return null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="size-6 text-amber-600" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all platform activities and changes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAuditLog}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="size-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAuditLog}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Row */}
      {loading && !data ? (
        <StatsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                      </div>
                      <div className={`flex items-center justify-center size-12 rounded-xl ${card.bgColor}`}>
                        <Icon className={`size-6 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : null}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Active
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Category Select */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search action..."
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      {loading && !data ? (
        <TableSkeleton />
      ) : data ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-amber-600" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  {data.pagination.total === 0
                    ? 'No entries found'
                    : `Showing ${(data.pagination.page - 1) * data.pagination.limit + 1}–${Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of ${data.pagination.total} entries`}
                </CardDescription>
              </div>
              {data.pagination.total > 0 && (
                <Badge variant="outline" className="text-xs">
                  {data.pagination.total} entries
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.logs.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="flex items-center justify-center size-16 rounded-2xl bg-gray-50 mx-auto mb-4">
                  <FileText className="size-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No audit log entries found</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters to see more results'
                    : 'Activity will appear here as actions are performed on the platform'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </motion.div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block max-h-[520px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {data.logs.map((log) => {
                          const catCfg = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.system
                          const roleCfg = ROLE_BADGE[log.userRole || ''] || ROLE_BADGE.system
                          const parsedDetails = parseDetails(log.details)
                          const detailText = parsedDetails
                            ? Object.entries(parsedDetails)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')
                            : log.details || '—'

                          return (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.2 }}
                              className="hover:bg-muted/50 border-b transition-colors"
                            >
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="size-3 text-muted-foreground" />
                                  <span title={formatDate(log.createdAt)}>
                                    {formatRelativeTime(log.createdAt)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium text-gray-900">
                                  {log.userName || 'Unknown'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs px-1.5 py-0 ${roleCfg.className}`}
                                >
                                  {roleCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-700 font-mono">
                                  {formatActionLabel(log.action)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs px-2 py-0.5 border ${catCfg.bgColor} ${catCfg.color}`}
                                >
                                  {catCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[250px]">
                                <span
                                  className="text-xs text-muted-foreground truncate block"
                                  title={detailText}
                                >
                                  {detailText}
                                </span>
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile & Tablet Cards */}
                <div className="lg:hidden max-h-[520px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full space-y-3">
                  {data.logs.map((log) => {
                    const catCfg = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.system
                    const roleCfg = ROLE_BADGE[log.userRole || ''] || ROLE_BADGE.system
                    const parsedDetails = parseDetails(log.details)
                    const detailText = parsedDetails
                      ? Object.entries(parsedDetails)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')
                      : log.details || '—'

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border border-gray-100 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">
                                {log.userName || 'Unknown'}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs px-1.5 py-0 ${roleCfg.className}`}
                              >
                                {roleCfg.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs px-1.5 py-0 border ${catCfg.bgColor} ${catCfg.color}`}
                              >
                                {catCfg.label}
                              </Badge>
                            </div>
                            <p className="text-xs font-mono text-gray-600 mt-1">
                              {formatActionLabel(log.action)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(log.createdAt)}
                          </span>
                        </div>
                        {detailText !== '—' && (
                          <p className="text-xs text-muted-foreground truncate" title={detailText}>
                            {detailText}
                          </p>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={data.pagination.page <= 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="size-3.5" />
                        Previous
                      </Button>
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                          // Show pages around current page
                          const totalPages = data.pagination.totalPages
                          const currentPage = data.pagination.page
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className={`min-w-[32px] h-8 p-0 ${
                                pageNum === currentPage
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : ''
                              }`}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={data.pagination.page >= data.pagination.totalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Category Breakdown */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Filter className="size-4 text-amber-600" />
                Category Breakdown
              </CardTitle>
              <CardDescription>Distribution of log entries by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                  const count = data.stats.byCategory[key] || 0
                  const percentage =
                    data.stats.total > 0 ? Math.round((count / data.stats.total) * 100) : 0
                  const Icon = cfg.icon
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-3 text-center transition-all hover:shadow-sm cursor-pointer ${cfg.bgColor}`}
                      onClick={() => {
                        setCategory(key)
                        setPage(1)
                      }}
                    >
                      <Icon className={`size-5 mx-auto mb-1.5 ${cfg.color}`} />
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                      <div className="mt-1.5 h-1 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cfg.color}`}
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: 'currentColor',
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{percentage}%</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
