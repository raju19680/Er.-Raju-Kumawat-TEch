'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  UserPlus,
  CreditCard,
  Palette,
  AlertCircle,
  RefreshCw,
  Shield,
  Activity,
  BarChart3,
  CalendarDays,
  Phone,
  Mail,
  Eye,
  UserCog,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalTeachers: number
  totalStudents: number
  totalPlatforms: number
  totalRevenue: number
  activeOrgs: number
  trialOrgs: number
  inactiveOrgs: number
}

interface RecentTeacher {
  name: string
  email: string
  phone?: string
  platformName: string
  platformId: string
  accentColor: string
  status: string
  studentCount: number
  createdAt: string
}

interface DashboardData {
  success: boolean
  stats: DashboardStats
  recentTeachers: RecentTeacher[]
}

interface AnalyticsData {
  success: boolean
  revenueData: Array<{ month: string; revenue: number }>
  teacherGrowthData: Array<{ month: string; teachers: number }>
  studentGrowthData: Array<{ month: string; students: number }>
  methodDistribution: Record<string, number>
  topOrganizations: Array<{
    id: string
    name: string
    code: string
    accentColor: string
    status: string
    revenue: number
  }>
  recentActivity: Array<{
    type: string
    text: string
    time: string
    color: string
    icon: string
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString('en-IN')
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getTodayDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 text-xs">Active</Badge>
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 text-xs">Inactive</Badge>
    case 'trial':
      return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0 text-xs">Trial</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'teacher_signup': return UserPlus
    case 'payment': return CreditCard
    case 'student_registered': return GraduationCap
    default: return Activity
  }
}

// ── Stat card config ─────────────────────────────────────────────────────────
const statConfig = [
  {
    label: 'Total Teachers',
    key: 'totalTeachers' as const,
    icon: UserCog,
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-600',
    accentBorder: 'border-l-amber-500',
  },
  {
    label: 'Organizations',
    key: 'totalPlatforms' as const,
    icon: Building2,
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-600',
    accentBorder: 'border-l-sky-500',
  },
  {
    label: 'Platform Revenue',
    key: 'totalRevenue' as const,
    icon: DollarSign,
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-600',
    accentBorder: 'border-l-emerald-500',
  },
  {
    label: 'Total Students',
    key: 'totalStudents' as const,
    icon: GraduationCap,
    accentBg: 'bg-violet-50',
    accentText: 'text-violet-600',
    accentBorder: 'border-l-violet-500',
  },
]

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-white border-l-4 border-l-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="size-11 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  )
}

// ── Custom Tooltip Components ────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-emerald-600">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

function GrowthTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-amber-600">
          {payload[0].value} teachers
        </p>
      </div>
    )
  }
  return null
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setAdminPage, userName } = useAppStore()

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        apiFetch('/api/admin/dashboard'),
        apiFetch('/api/admin/analytics'),
      ])
      const dashJson = await dashRes.json()
      const analyticsJson = await analyticsRes.json()

      if (!dashRes.ok || !dashJson.success) {
        throw new Error(dashJson.message || 'Failed to load dashboard data')
      }

      setData(dashJson)
      if (analyticsJson.success) {
        setAnalytics(analyticsJson)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ── Error state ──
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Welcome back, {userName || 'Super Admin'}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>{getTodayDate()}</span>
            </div>
          </div>
        </div>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center size-14 rounded-full bg-red-50">
              <AlertCircle className="size-7 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Failed to load dashboard</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboard} className="gap-2">
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = data?.stats
  const recentTeachers = data?.recentTeachers ?? []
  const recentActivity = analytics?.recentActivity ?? []
  const revenueData = analytics?.revenueData ?? []
  const teacherGrowthData = analytics?.teacherGrowthData ?? []

  function getStatValue(key: keyof DashboardStats): string {
    if (!stats) return '—'
    if (key === 'totalRevenue') return formatCurrency(stats[key])
    return formatNumber(stats[key])
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Welcome back, {userName || 'Super Admin'}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>{getTodayDate()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => setAdminPage('admin-teachers')}
          >
            <UserPlus className="size-4" />
            Add Teacher
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => setAdminPage('admin-analytics')}
          >
            <BarChart3 className="size-4" />
            Reports
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statConfig.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.key}
                className={`min-w-0 rounded-xl border-l-4 ${stat.accentBorder} bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {getStatValue(stat.key)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">Live data</span>
                      <span className="text-xs text-muted-foreground">from database</span>
                    </div>
                  </div>
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full ${stat.accentBg}`}
                  >
                    <Icon className={`size-5 ${stat.accentText}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Commission Revenue */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card className="min-w-0 rounded-xl bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Commission Revenue
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  Last 6 months
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] w-full">
                {revenueData.length > 0 && revenueData.some(d => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={50} />
                      <RechartsTooltip content={<RevenueTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#adminRevenueGradient)"
                        dot={{ fill: '#10b981', strokeWidth: 2, stroke: '#fff', r: 4 }}
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="size-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No revenue data yet</p>
                      <p className="text-xs text-muted-foreground">Data will appear when payments are received</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teacher Growth */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card className="min-w-0 rounded-xl bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Teacher Signups
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Last 6 months
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] w-full">
                {teacherGrowthData.length > 0 && teacherGrowthData.some(d => d.teachers > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teacherGrowthData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={40} />
                      <RechartsTooltip content={<GrowthTooltip />} />
                      <Bar dataKey="teachers" fill="#d97706" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Users className="size-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No signup data yet</p>
                      <p className="text-xs text-muted-foreground">Data will appear when teachers register</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Teachers + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Teachers */}
        {loading ? (
          <Card className="lg:col-span-2 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-0 rounded-xl bg-white shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-amber-600" />
                  Teacher Management
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setAdminPage('admin-teachers')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {recentTeachers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="size-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No teachers signed up yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentTeachers.map((teacher) => (
                      <div
                        key={teacher.platformId + teacher.email}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                      >
                        <Avatar className="size-9">
                          <AvatarFallback
                            className="text-xs font-semibold text-white"
                            style={{ backgroundColor: teacher.accentColor || '#d97706' }}
                          >
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
                            <span>{teacher.platformName}</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-mono text-xs">{teacher.platformId}</span>
                            <span className="text-gray-300">•</span>
                            <span>{teacher.studentCount} students</span>
                          </p>
                        </div>
                        {getStatusBadge(teacher.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {loading ? (
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-0 rounded-xl bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="size-4 text-sky-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {recentActivity.length === 0 ? (
                  <div className="py-8 text-center">
                    <Activity className="size-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentActivity.map((activity, index) => {
                      const Icon = getActivityIcon(activity.type)
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                        >
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-gray-50 text-xs">
                              <Icon className={`size-4 ${activity.color}`} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {activity.text}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {getTimeAgo(activity.time)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats Row — org status breakdown */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="min-w-0 rounded-xl border-l-4 border-l-emerald-500 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-full bg-emerald-50">
                <TrendingUp className="size-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Organizations</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeOrgs || 0}</p>
                <p className="text-xs text-emerald-600">Running platforms</p>
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-0 rounded-xl border-l-4 border-l-amber-500 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-full bg-amber-50">
                <Building2 className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trial Organizations</p>
                <p className="text-xl font-bold text-gray-900">{stats.trialOrgs || 0}</p>
                <p className="text-xs text-amber-600">Pending conversion</p>
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-0 rounded-xl border-l-4 border-l-red-500 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="flex items-center justify-center size-12 rounded-full bg-red-50">
                <TrendingDown className="size-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive Organizations</p>
                <p className="text-xl font-bold text-gray-900">{stats.inactiveOrgs || 0}</p>
                <p className="text-xs text-red-500">Needs attention</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
