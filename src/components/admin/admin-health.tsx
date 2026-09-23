'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Database,
  Users,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { motion } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface HealthData {
  success: boolean
  health: {
    db: {
      totalRecords: number
      fileSize: number
      fileSizeFormatted: string
      records: Record<string, number>
    }
    errors: {
      last24h: number
      recent: Array<{
        id: string
        email: string
        ipAddress: string | null
        createdAt: string
      }>
    }
    activeUsers: number
    system: {
      uptime: number
      uptimeFormatted: string
      memory: {
        rss: string
        heapTotal: string
        heapUsed: string
        external: string
        arrayBuffers: string
        rssBytes: number
        heapTotalBytes: number
        heapUsedBytes: number
        heapUsagePercent: number
      }
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getErrorStatus(count: number): { color: string; label: string; icon: React.ReactNode } {
  if (count === 0) return { color: 'text-emerald-600', label: 'Healthy', icon: <CheckCircle2 className="size-4" /> }
  if (count < 10) return { color: 'text-amber-600', label: 'Warning', icon: <AlertTriangle className="size-4" /> }
  return { color: 'text-red-600', label: 'Critical', icon: <XCircle className="size-4" /> }
}

function getStatusColor(count: number): 'emerald' | 'amber' | 'red' {
  if (count === 0) return 'emerald'
  if (count < 10) return 'amber'
  return 'red'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/health')
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Failed to load health data')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHealth()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  const health = data?.health

  // ── Computed ──
  const errorStatus = health ? getErrorStatus(health.errors.last24h) : null
  const errorColor = health ? getStatusColor(health.errors.last24h) : 'emerald'
  const heapPercent = health?.system.memory.heapUsagePercent ?? 0
  const memBarColor =
    heapPercent > 80 ? 'bg-red-500' : heapPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="size-6 text-amber-600" />
            System Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor platform performance and status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto-refresh: 30s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="size-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchHealth}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stat Cards */}
      {loading && !data ? (
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
      ) : health ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DB Size */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">DB Size</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {health.db.fileSizeFormatted}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {health.db.totalRecords.toLocaleString('en-IN')} total records
                    </p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                    <Database className="size-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Users (24h) */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users (24h)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {health.activeUsers.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">Currently online</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50">
                    <Users className="size-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Rate */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate (24h)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {health.errors.last24h}
                    </p>
                    <p className={`text-xs mt-1 ${errorStatus?.color}`}>
                      {errorStatus?.label}
                    </p>
                  </div>
                  <div className={`flex items-center justify-center size-12 rounded-xl ${
                    errorColor === 'emerald' ? 'bg-emerald-50' : errorColor === 'amber' ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    <AlertTriangle className={`size-6 ${
                      errorColor === 'emerald' ? 'text-emerald-600' : errorColor === 'amber' ? 'text-amber-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Uptime */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {health.system.uptimeFormatted}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">Server running</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-sky-50">
                    <Clock className="size-6 text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Database Overview & System Resources */}
      {loading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : health ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Overview */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="size-5 text-amber-600" />
                  <CardTitle className="text-base font-semibold">Database Overview</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Record counts for each model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <div className="space-y-1">
                    {Object.entries(health.db.records)
                      .sort(([, a], [, b]) => b - a)
                      .map(([model, count]) => (
                        <div
                          key={model}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-700">{model}</span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {count.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Resources */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cpu className="size-5 text-amber-600" />
                  <CardTitle className="text-base font-semibold">System Resources</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Memory usage and server info
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Heap Usage Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Heap Usage</span>
                    <span className="text-sm font-semibold text-gray-900">{heapPercent}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${memBarColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${heapPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {health.system.memory.heapUsed} / {health.system.memory.heapTotal}
                  </p>
                </div>

                {/* Memory details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="size-4 text-gray-400" />
                      <span className="text-sm text-gray-600">RSS (Resident Set Size)</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{health.system.memory.rss}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Heap Used</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{health.system.memory.heapUsed}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-gray-400" />
                      <span className="text-sm text-gray-600">External</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{health.system.memory.external}</span>
                  </div>
                </div>

                {/* Uptime */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100">
                      <Clock className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Server Uptime</p>
                      <p className="text-lg font-bold text-emerald-600">{health.system.uptimeFormatted}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Recent Errors */}
      {loading && !data ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : health ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600" />
                <CardTitle className="text-base font-semibold">Recent Errors</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Failed login attempts in the last 24 hours ({health.errors.last24h} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {health.errors.recent.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="size-10 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No errors in the last 24 hours. All systems operational!</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full space-y-2">
                  {health.errors.recent.map((err) => (
                    <div
                      key={err.id}
                      className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-red-50/50 transition-colors border border-red-100/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <XCircle className="size-4 text-red-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{err.email}</p>
                          <p className="text-xs text-muted-foreground">
                            IP: {err.ipAddress || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDate(err.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </motion.div>
  )
}
