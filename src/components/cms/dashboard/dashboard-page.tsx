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
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  FileText,
  DollarSign,
  Target,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Bell,
  GraduationCap,
  PenTool,
  CalendarDays,
  Activity,
  AlertCircle,
  RefreshCw,
  ClipboardList,
  BookOpen,
  HelpCircle,
  BarChart3,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useModuleAccess, useSubFeatureAccess } from '@/hooks/use-module-access'
import { apiFetch } from '@/lib/api-client'

// ── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalStudents: number
  totalStudentsChange: number
  activeTests: number
  activeTestsChange: number
  revenue: number
  revenueChange: number
  completionRate: number
  completionRateChange: number
  pendingReportedQuestions?: number
  pendingOmrCount?: number
}

interface DashboardCounts {
  totalCourses: number
  totalTestSeries: number
  totalBlogs: number
  totalQuestions: number
  totalTestAttempts: number
  completedTestAttempts: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

interface AnalyticsData {
  success: boolean
  revenueData: Array<{ month: string; revenue: number }>
  enrollmentData: Array<{ month: string; students: number }>
  testAttemptData: Array<{ month: string; attempts: number; completed: number }>
  completionRateTrend: Array<{ month: string; rate: number }>
  topTests: Array<{ testId: string; title: string; attempts: number }>
  revenueByTestSeries: Array<{ id: string; title: string; revenue: number }>
  recentActivity: RecentActivity[]
  stats: DashboardStats
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTodayDate(): string {
  const now = new Date()
  return now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toLocaleString('en-IN')}`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString('en-IN')
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
  return `${diffDays}d ago`
}

function getActivityInitials(type: string): string {
  switch (type) {
    case 'student_registered': return 'SR'
    case 'test_published': return 'TP'
    case 'blog_created': return 'BC'
    case 'test_attempt': return 'TA'
    case 'payment': return 'PY'
    default: return 'AC'
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'student_registered': return 'bg-emerald-100 text-emerald-700'
    case 'test_published': return 'bg-sky-100 text-sky-700'
    case 'blog_created': return 'bg-amber-100 text-amber-700'
    case 'test_attempt': return 'bg-violet-100 text-violet-700'
    case 'payment': return 'bg-emerald-100 text-emerald-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'student_registered': return GraduationCap
    case 'test_published': return ClipboardList
    case 'blog_created': return PenTool
    case 'test_attempt': return Target
    case 'payment': return CreditCard
    default: return Activity
  }
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

function EnrollmentTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-sky-600">
          {payload[0].value} students
        </p>
      </div>
    )
  }
  return null
}

// ── Stat Card Config ────────────────────────────────────────────────────────
function getAnalyticsCards(stats: DashboardStats | null, counts: DashboardCounts | null) {
  return [
    {
      title: 'Total Students',
      value: stats ? formatNumber(stats.totalStudents) : '—',
      change: stats?.totalStudentsChange ? `${stats.totalStudentsChange > 0 ? '+' : ''}${stats.totalStudentsChange}%` : '0%',
      changeLabel: 'from last month',
      icon: Users,
      accentBg: 'bg-emerald-50',
      accentText: 'text-emerald-600',
      accentBorder: 'border-l-emerald-500',
    },
    {
      title: 'Active Tests',
      value: stats ? formatNumber(stats.activeTests) : '—',
      change: stats?.activeTestsChange ? `${stats.activeTestsChange > 0 ? '+' : ''}${stats.activeTestsChange}%` : '0%',
      changeLabel: 'from last month',
      icon: FileText,
      accentBg: 'bg-sky-50',
      accentText: 'text-sky-600',
      accentBorder: 'border-l-sky-500',
    },
    {
      title: 'Total Test Attempts',
      value: counts ? formatNumber(counts.totalTestAttempts) : '—',
      change: '',
      changeLabel: 'all time',
      icon: Target,
      accentBg: 'bg-violet-50',
      accentText: 'text-violet-600',
      accentBorder: 'border-l-violet-500',
    },
    {
      title: 'Completion Rate',
      value: stats ? `${stats.completionRate}%` : '—',
      change: stats?.completionRateChange ? `${stats.completionRateChange > 0 ? '+' : ''}${stats.completionRateChange}%` : '0%',
      changeLabel: 'from last month',
      icon: Target,
      accentBg: 'bg-violet-50',
      accentText: 'text-violet-600',
      accentBorder: 'border-l-violet-500',
    },
    {
      title: 'Revenue',
      value: stats ? formatCurrency(stats.revenue) : '—',
      change: stats?.revenueChange ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%` : '0%',
      changeLabel: 'from last month',
      icon: DollarSign,
      accentBg: 'bg-amber-50',
      accentText: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Pending OMR',
      value: stats?.pendingOmrCount !== undefined ? formatNumber(stats.pendingOmrCount) : '—',
      change: '',
      changeLabel: 'needs review',
      icon: ClipboardList,
      accentBg: 'bg-blue-50',
      accentText: 'text-blue-600',
      accentBorder: 'border-l-blue-500',
    },
    {
      title: 'Reported Questions',
      value: stats?.pendingReportedQuestions !== undefined ? formatNumber(stats.pendingReportedQuestions) : '—',
      change: '',
      changeLabel: 'pending resolution',
      icon: AlertCircle,
      accentBg: 'bg-red-50',
      accentText: 'text-red-600',
      accentBorder: 'border-l-red-500',
    },
    {
      title: 'Active Students',
      value: stats ? formatNumber(stats.totalStudents) : '—', // Displaying total for now, can be updated later
      change: '',
      changeLabel: 'currently enrolled',
      icon: Users,
      accentBg: 'bg-indigo-50',
      accentText: 'text-indigo-600',
      accentBorder: 'border-l-indigo-500',
    },
  ]
}

// ── Skeletons ────────────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="min-w-0 rounded-xl border-l-4 border-l-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="size-11 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card className="min-w-0 rounded-xl bg-white shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userName, orgCode } = useAppStore()
  const { setCurrentPage } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [counts, setCounts] = useState<DashboardCounts | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch dashboard data and analytics
      const [dashRes, analyticsRes, teacherAnalyticsRes] = await Promise.all([
        apiFetch(`/api/dashboard?organizationId=${orgCode}`),
        apiFetch('/api/dashboard/analytics'),
        apiFetch('/api/teacher/analytics'),
      ])

      if (!dashRes.ok) throw new Error('Failed to load dashboard')
      const dashData = await dashRes.json()
      setStats(dashData.stats)
      setCounts(dashData.counts)
      setActivities(dashData.recentActivities || [])

      try {
        const teacherData = await teacherAnalyticsRes.json()
        if (teacherData.success) {
          setTeacherAnalytics(teacherData.data)
        }
      } catch (e) {
        console.error("Failed to load Phase 1 analytics", e)
      }

      // Try to load analytics (may fail if not authenticated properly)
      try {
        const analyticsJson = await analyticsRes.json()
        if (analyticsJson.success) {
          setAnalytics(analyticsJson)
          // Use analytics stats (real revenue) if available
          if (analyticsJson.stats) {
            setStats(analyticsJson.stats)
          }
          // Use analytics activity if available
          if (analyticsJson.recentActivity && analyticsJson.recentActivity.length > 0) {
            setActivities(analyticsJson.recentActivity)
          }
        }
      } catch {
        // Analytics optional - use dashboard data
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    if (orgCode) fetchDashboard()
  }, [orgCode, fetchDashboard])

  // Get analytics cards
  const statCards = getAnalyticsCards(stats, counts)

  // Get real chart data from analytics
  const revenueData = analytics?.revenueData ?? []
  const enrollmentData = analytics?.enrollmentData ?? []

  // Feature-level access checks for quick actions
  const testsAccess = useModuleAccess('tests')
  const blogsAccess = useModuleAccess('blogs')
  const reportsAccess = useModuleAccess('reports')

  const quickActions = [
    {
      label: 'Create Test',
      icon: FileText,
      variant: 'default' as const,
      className: 'bg-amber-600 hover:bg-amber-700 text-white',
      onClick: () => setCurrentPage('tests'),
      enabled: testsAccess.moduleEnabled && testsAccess.canCreate,
    },
    {
      label: 'Add Student',
      icon: GraduationCap,
      variant: 'outline' as const,
      className: 'border-amber-200 text-amber-700 hover:bg-amber-50',
      onClick: () => setCurrentPage('tests'),
      enabled: true,
    },
    {
      label: 'Publish Blog',
      icon: PenTool,
      variant: 'outline' as const,
      className: 'border-amber-200 text-amber-700 hover:bg-amber-50',
      onClick: () => setCurrentPage('blogs'),
      enabled: blogsAccess.moduleEnabled && blogsAccess.canPublish,
    },
    {
      label: 'View Reports',
      icon: BarChart3,
      variant: 'outline' as const,
      className: 'border-amber-200 text-amber-700 hover:bg-amber-50',
      onClick: () => setCurrentPage('reports-sales'),
      enabled: reportsAccess.moduleEnabled,
    },
  ]

  // ── Error state ──
  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Welcome back, {userName || 'Teacher'}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>{getTodayDate()}</span>
            </div>
          </div>
        </div>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center gap-4">
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

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Welcome back, {userName || 'Teacher'}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>{getTodayDate()}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 self-start sm:self-auto w-full sm:w-auto text-sm sm:text-base"
          onClick={() => setCurrentPage('reports-sales')}
        >
          <Activity className="size-4" />
          View Reports
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>

      {/* ── Analytics Cards ──────────────────────────────────────────────── */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.title}
                className={`min-w-0 rounded-xl border-l-4 ${card.accentBorder} bg-white p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">
                        {card.change}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {card.changeLabel}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full ${card.accentBg}`}
                  >
                    <Icon className={`size-5 ${card.accentText}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Extra stats row ──────────────────────────────────────────────── */}
      {!loading && counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-sky-50">
                <BookOpen className="size-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Courses</p>
                <p className="text-lg font-bold text-gray-900">{counts.totalCourses}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
                <ClipboardList className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Test Series</p>
                <p className="text-lg font-bold text-gray-900">{counts.totalTestSeries}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
                <HelpCircle className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-lg font-bold text-gray-900">{counts.totalQuestions}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-violet-50">
                <PenTool className="size-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blogs</p>
                <p className="text-lg font-bold text-gray-900">{counts.totalBlogs}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Charts Section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Overview */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card className="min-w-0 rounded-xl bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Revenue Overview
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
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={50} />
                      <Tooltip content={<RevenueTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
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

        {/* Student Enrollment */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card className="min-w-0 rounded-xl bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">
                  Student Enrollment
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-sky-50 text-sky-700 hover:bg-sky-100"
                >
                  Last 6 months
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] w-full">
                {enrollmentData.length > 0 && enrollmentData.some(d => d.students > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={enrollmentData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={40} />
                      <Tooltip content={<EnrollmentTooltip />} />
                      <Bar dataKey="students" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Users className="size-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No enrollment data yet</p>
                      <p className="text-xs text-muted-foreground">Data will appear when students register</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Phase 1: Teacher Progress Analytics ──────────────────────────────── */}
      {teacherAnalytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* At-Risk Students */}
          <Card className="min-w-0 rounded-xl bg-white shadow-sm border-l-4 border-l-rose-500">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="size-4 text-rose-500" />
                At-Risk Students
              </CardTitle>
              <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100">
                Avg Score &lt; 40%
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {teacherAnalytics.atRiskStudents?.length > 0 ? (
                <div className="space-y-4">
                  {teacherAnalytics.atRiskStudents.map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-rose-100 bg-rose-50/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 bg-white border border-rose-200 text-rose-700 font-bold">
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email || student.phone || 'No contact'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-rose-600">{student.avgScore}%</p>
                        <p className="text-xs text-rose-400 font-medium tracking-wide">AVG SCORE</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <CheckCircle2 className="size-10 text-emerald-300 mb-2" />
                  <p className="text-sm font-medium text-emerald-700">No At-Risk Students</p>
                  <p className="text-xs text-muted-foreground mt-1">All students are performing above the 40% threshold.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Completion Rates */}
          <Card className="min-w-0 rounded-xl bg-white shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-indigo-500" />
                Course Completion Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {teacherAnalytics.courseCompletionStats?.length > 0 ? (
                <div className="space-y-4">
                  {teacherAnalytics.courseCompletionStats.map((course: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{course.title}</p>
                        <p className="text-sm font-bold text-indigo-600">{course.completionRate}% Completed</p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all" 
                          style={{ width: `${course.completionRate}%` }} 
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-right">
                        {course.completedBy} of {course.enrollments} students finished
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <p className="text-sm">No courses active yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Recent Activity + Quick Actions ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity — with REAL data */}
        <Card className="min-w-0 rounded-xl bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="size-4 text-amber-600" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 sm:max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="size-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <div
                        key={activity.id + activity.type + activity.timestamp}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                      >
                        <Avatar className="size-9">
                          <AvatarFallback className={getActivityColor(activity.type)}>
                            <Icon className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getTimeAgo(activity.timestamp)}
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

        {/* Quick Actions */}
        <Card className="min-w-0 rounded-xl bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.filter(a => a.enabled).map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className={`${action.className} h-auto flex-col gap-2 rounded-xl py-4 cursor-pointer`}
                    onClick={action.onClick}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
