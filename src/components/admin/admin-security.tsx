'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  AlertTriangle,
  Lock,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { apiFetch } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

// ── Types ────────────────────────────────────────────────────────────────────

interface SecurityStats {
  totalLoginAttempts: number
  failedAttempts: number
  lockedAccounts: number
  usersWith2FA: number
  totalUsers: number
}

interface RecentAttempt {
  id: string
  email: string
  ipAddress: string | null
  userAgent: string | null
  success: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
    organization: { name: string; code: string } | null
  } | null
}

interface LockedUser {
  id: string
  name: string
  email: string
  role: string
  failedLoginAttempts: number
  lockedUntil: string | null
  lastLoginAt: string | null
  organization: { name: string; code: string } | null
}

interface SecurityEvent {
  date: string
  successful: number
  failed: number
}

interface SecurityData {
  success: boolean
  stats: SecurityStats
  recentAttempts: RecentAttempt[]
  lockedUsers: LockedUser[]
  securityEvents: SecurityEvent[]
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

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

function truncateAgent(ua: string | null, maxLen = 50): string {
  if (!ua) return '—'
  return ua.length > maxLen ? ua.substring(0, maxLen) + '…' : ua
}

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (role) {
    case 'platform_admin':
      return 'destructive'
    case 'teacher':
      return 'default'
    case 'student':
      return 'secondary'
    default:
      return 'outline'
  }
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

function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)

  const fetchSecurityData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/security')
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.error || 'Failed to load security data')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSecurityData()
  }, [fetchSecurityData])

  const handleUnlock = async (userId: string, userName: string) => {
    setUnlockingId(userId)
    try {
      const res = await apiFetch(`/api/admin/security/${userId}/unlock`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message || `Account for ${userName} unlocked successfully`)
        // Refresh data
        await fetchSecurityData()
      } else {
        toast.error(json.error || 'Failed to unlock account')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setUnlockingId(null)
    }
  }

  // ── Computed values ──
  const twoFAPercentage =
    data && data.stats.totalUsers > 0
      ? Math.round((data.stats.usersWith2FA / data.stats.totalUsers) * 100)
      : 0

  const failedPercentage =
    data && data.stats.totalLoginAttempts > 0
      ? Math.round((data.stats.failedAttempts / data.stats.totalLoginAttempts) * 100)
      : 0

  // ── Security recommendations ──
  const recommendations: { type: 'warning' | 'danger' | 'info'; message: string }[] = []
  if (data) {
    if (data.stats.failedAttempts > 50) {
      recommendations.push({
        type: 'danger',
        message: `High number of failed login attempts detected (${data.stats.failedAttempts} in last 30 days). Consider implementing rate limiting or CAPTCHA.`,
      })
    }
    if (data.stats.lockedAccounts > 0) {
      recommendations.push({
        type: 'warning',
        message: `${data.stats.lockedAccounts} ${data.stats.lockedAccounts === 1 ? 'account is' : 'accounts are'} currently locked. Review and unlock legitimate users.`,
      })
    }
    if (twoFAPercentage < 50 && data.stats.totalUsers > 0) {
      recommendations.push({
        type: 'info',
        message: `Only ${twoFAPercentage}% of users have 2FA enabled. Consider requiring 2FA for all admin users.`,
      })
    }
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'No critical security issues detected. Keep monitoring regularly.',
      })
    }
  }

  // ── Chart data ──
  const chartData =
    data?.securityEvents.map((e) => ({
      date: formatShortDate(e.date),
      Successful: e.successful,
      Failed: e.failed,
    })) || []

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="size-6 text-amber-600" />
            Security & Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor login activity, locked accounts, and security events across the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSecurityData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSecurityData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Login Attempts */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Login Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.stats.totalLoginAttempts.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </div>
                <div className="flex items-center justify-center size-12 rounded-xl bg-blue-50">
                  <Shield className="size-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failed Attempts */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.stats.failedAttempts.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    {failedPercentage}% failure rate
                  </p>
                </div>
                <div className="flex items-center justify-center size-12 rounded-xl bg-red-50">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locked Accounts */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Locked Accounts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.stats.lockedAccounts.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {data.stats.lockedAccounts > 0 ? 'Requires attention' : 'All clear'}
                  </p>
                </div>
                <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                  <Lock className="size-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Enabled Users */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">2FA Enabled Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.stats.usersWith2FA.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{data.stats.totalUsers}
                    </span>
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {twoFAPercentage}% adoption rate
                  </p>
                </div>
                <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50">
                  <ShieldCheck className="size-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Security Recommendations */}
      {!loading && data && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              Security Recommendations
            </CardTitle>
            <CardDescription>
              Actionable insights based on your current security data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    rec.type === 'danger'
                      ? 'bg-red-50 border border-red-100'
                      : rec.type === 'warning'
                      ? 'bg-amber-50 border border-amber-100'
                      : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  {rec.type === 'danger' ? (
                    <XCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                  ) : rec.type === 'warning' ? (
                    <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                  )}
                  <p
                    className={`text-sm ${
                      rec.type === 'danger'
                        ? 'text-red-700'
                        : rec.type === 'warning'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {rec.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Attempts Chart */}
      {loading ? (
        <ChartSkeleton />
      ) : data ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Login Attempts Overview</CardTitle>
            <CardDescription>
              Daily successful vs failed login attempts for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="Successful"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="Failed"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Locked Accounts Section */}
      {loading ? (
        <TableSkeleton />
      ) : data ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="size-4 text-amber-600" />
                  Locked Accounts
                </CardTitle>
                <CardDescription>
                  {data.lockedUsers.length === 0
                    ? 'No accounts are currently locked'
                    : `${data.lockedUsers.length} account${data.lockedUsers.length > 1 ? 's' : ''} currently locked`}
                </CardDescription>
              </div>
              {data.lockedUsers.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="size-3" />
                  {data.lockedUsers.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.lockedUsers.length === 0 ? (
              <div className="text-center py-8">
                <ShieldCheck className="size-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">All accounts are in good standing</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Locked Until</TableHead>
                        <TableHead>Failed Attempts</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lockedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-xs">
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.organization?.name || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.lockedUntil ? formatDate(user.lockedUntil) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              {user.failedLoginAttempts}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
                              onClick={() => handleUnlock(user.id, user.name || user.email)}
                              disabled={unlockingId === user.id}
                            >
                              {unlockingId === user.id ? (
                                <RefreshCw className="size-3 animate-spin" />
                              ) : (
                                <KeyRound className="size-3" />
                              )}
                              Unlock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {data.lockedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-lg border border-gray-100 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{user.name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-xs">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Organization:</span>{' '}
                          <span className="font-medium">{user.organization?.name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed Attempts:</span>{' '}
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            {user.failedLoginAttempts}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Locked Until:</span>{' '}
                          <span className="font-medium">
                            {user.lockedUntil ? formatDate(user.lockedUntil) : '—'}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-1"
                        onClick={() => handleUnlock(user.id, user.name || user.email)}
                        disabled={unlockingId === user.id}
                      >
                        {unlockingId === user.id ? (
                          <RefreshCw className="size-3 animate-spin" />
                        ) : (
                          <KeyRound className="size-3" />
                        )}
                        Unlock Account
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Recent Login Attempts */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : data ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Login Attempts</CardTitle>
                <CardDescription>
                  Last {data.recentAttempts.length} login attempts across the platform
                </CardDescription>
              </div>
              <Separator orientation="vertical" className="hidden sm:block h-8" />
            </div>
          </CardHeader>
          <CardContent>
            {data.recentAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="size-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No login attempts recorded</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>User Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentAttempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium text-sm">
                            {attempt.email}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {attempt.user ? (
                              <div>
                                <span>{attempt.user.name}</span>
                                <Badge
                                  variant={getRoleBadgeVariant(attempt.user.role)}
                                  className="ml-1.5 capitalize text-xs px-1.5 py-0"
                                >
                                  {attempt.user.role.replace('_', ' ')}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-400">Unknown user</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {attempt.ipAddress || '—'}
                          </TableCell>
                          <TableCell
                            className="text-xs text-muted-foreground max-w-[200px] truncate"
                            title={attempt.userAgent || ''}
                          >
                            {truncateAgent(attempt.userAgent)}
                          </TableCell>
                          <TableCell>
                            {attempt.success ? (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs gap-1">
                                <CheckCircle2 className="size-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <XCircle className="size-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(attempt.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile & Tablet Scrollable List */}
                <div className="lg:hidden max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full space-y-2">
                  {data.recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-lg border border-gray-100 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{attempt.email}</p>
                          {attempt.user && (
                            <p className="text-xs text-muted-foreground">
                              {attempt.user.name}
                              <Badge
                                variant={getRoleBadgeVariant(attempt.user.role)}
                                className="ml-1 capitalize text-xs px-1 py-0"
                              >
                                {attempt.user.role.replace('_', ' ')}
                              </Badge>
                            </p>
                          )}
                        </div>
                        {attempt.success ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs shrink-0">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs shrink-0">
                            Failed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{attempt.ipAddress || '—'}</span>
                        <span>•</span>
                        <span>{formatDate(attempt.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
