'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Clock,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { apiFetch } from '@/lib/api-client'

// ── Types ─────────────────────────────────────────────────────────────────────
interface RevenueDataPoint {
  month: string
  revenue: number
}

interface GrowthDataPoint {
  month: string
  teachers?: number
  students?: number
}

interface MethodDistribution {
  upi: number
  card: number
  netbanking: number
  [key: string]: number
}

interface TopOrganization {
  id: string
  name: string
  code: string
  accentColor: string
  status: string
  revenue: number
}

interface RecentActivity {
  type: string
  text: string
  time: string
  color: string
  icon: string
}

interface ChangeData {
  revenueChange: string
  teacherChange: string
  studentChange: string
  platformChange: string
}

interface AnalyticsData {
  revenueData: RevenueDataPoint[]
  teacherGrowthData: GrowthDataPoint[]
  studentGrowthData: GrowthDataPoint[]
  methodDistribution: MethodDistribution
  topOrganizations: TopOrganization[]
  recentActivity: RecentActivity[]
  changes: ChangeData
}

interface DashboardStats {
  totalTeachers: number
  totalStudents: number
  totalPlatforms: number
  totalRevenue: number
  activeOrgs: number
  trialOrgs: number
  inactiveOrgs: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CHART_COLORS = ['#D97706', '#059669', '#0891B2', '#7C3AED', '#DC2626']

const dateRanges = ['7D', '30D', '90D', '12M', 'All'] as const
type DateRange = (typeof dateRanges)[number]

const dateRangeLabels: Record<DateRange, string> = {
  '7D': 'Last 7 Days',
  '30D': 'Last 30 Days',
  '90D': 'Last 90 Days',
  '12M': 'Last 12 Months',
  All: 'All Time',
}

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
}

// ── Metric card config type ───────────────────────────────────────────────────
interface MetricCard {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
  bgColor: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2">
        <Skeleton className="h-52 w-full" />
      </CardContent>
    </Card>
  )
}

function PieChartSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-44 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-52" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-5" />
                <Skeleton className="size-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center">
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="size-6 text-red-500" />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">Failed to load data</p>
        <p className="text-xs text-muted-foreground mb-4">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center">
        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <BarChart3 className="size-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">No data available</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

// ── Custom tooltip for charts ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name || entry.dataKey}:</span>
          <span className="font-medium text-gray-900">
            {typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Activity icon mapper ──────────────────────────────────────────────────────
function getActivityIcon(iconName: string) {
  const iconMap: Record<string, React.ElementType> = {
    Building2,
    Users,
    GraduationCap,
    DollarSign,
    CreditCard,
    Activity,
    TrendingUp,
    BarChart3,
  }
  return iconMap[iconName] || Activity
}

// ── Format currency ───────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toLocaleString('en-IN')}`
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString('en-IN')
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('12M')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [analyticsRes, dashboardRes] = await Promise.all([
        apiFetch(`/api/admin/analytics?range=${selectedRange}`),
        apiFetch('/api/admin/dashboard'),
      ])

      if (!analyticsRes.ok || !dashboardRes.ok) {
        throw new Error('Failed to fetch analytics data. Please try again.')
      }

      const analyticsJson = await analyticsRes.json()
      const dashboardJson = await dashboardRes.json()

      if (!analyticsJson.success || !dashboardJson.success) {
        throw new Error(analyticsJson.error || dashboardJson.error || 'Invalid API response')
      }

      setAnalytics(analyticsJson)
      setStats(dashboardJson.stats)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [selectedRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (!analytics || !stats) return
    const rows: string[][] = []

    // Summary metrics
    rows.push(['Metric', 'Value'])
    rows.push(['Total Revenue', String(stats.totalRevenue)])
    rows.push(['Total Teachers', String(stats.totalTeachers)])
    rows.push(['Total Students', String(stats.totalStudents)])
    rows.push(['Active Platforms', String(stats.activeOrgs)])
    rows.push([])

    // Revenue data
    if (analytics.revenueData.length > 0) {
      rows.push(['Month', 'Revenue'])
      analytics.revenueData.forEach(d => rows.push([d.month, String(d.revenue)]))
      rows.push([])
    }

    // Teacher growth
    if (analytics.teacherGrowthData.length > 0) {
      rows.push(['Month', 'New Teachers'])
      analytics.teacherGrowthData.forEach(d => rows.push([d.month, String(d.teachers ?? 0)]))
      rows.push([])
    }

    // Student growth
    if (analytics.studentGrowthData.length > 0) {
      rows.push(['Month', 'New Students'])
      analytics.studentGrowthData.forEach(d => rows.push([d.month, String(d.students ?? 0)]))
      rows.push([])
    }

    // Top organizations
    if (analytics.topOrganizations.length > 0) {
      rows.push(['Organization', 'Code', 'Status', 'Revenue'])
      analytics.topOrganizations.forEach(o => rows.push([o.name, o.code, o.status, String(o.revenue)]))
    }

    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedRange}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [analytics, stats, selectedRange])

  // ── Build metric cards from real stats ────────────────────────────────────
  const metricCards: MetricCard[] = stats
    ? [
        {
          label: 'Total Revenue',
          value: formatCurrency(stats.totalRevenue),
          change: analytics?.changes?.revenueChange ?? '+0%',
          trend: (analytics?.changes?.revenueChange ?? '+0%').startsWith('-') ? 'down' : 'up',
          icon: DollarSign,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
        },
        {
          label: 'Active Platforms',
          value: formatNumber(stats.activeOrgs),
          change: analytics?.changes?.platformChange ?? '0%',
          trend: (analytics?.changes?.platformChange ?? '0%').startsWith('-') ? 'down' : 'up',
          icon: Building2,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
        },
        {
          label: 'Total Teachers',
          value: formatNumber(stats.totalTeachers),
          change: analytics?.changes?.teacherChange ?? '+0%',
          trend: (analytics?.changes?.teacherChange ?? '+0%').startsWith('-') ? 'down' : 'up',
          icon: Users,
          color: 'text-cyan-700',
          bgColor: 'bg-cyan-50',
        },
        {
          label: 'Total Students',
          value: formatNumber(stats.totalStudents),
          change: analytics?.changes?.studentChange ?? '+0%',
          trend: (analytics?.changes?.studentChange ?? '+0%').startsWith('-') ? 'down' : 'up',
          icon: GraduationCap,
          color: 'text-violet-600',
          bgColor: 'bg-violet-50',
        },
      ]
    : []

  // ── Transform method distribution for PieChart ────────────────────────────
  const pieData = analytics?.methodDistribution
    ? Object.entries(analytics.methodDistribution).map(([key, value]) => ({
        name: METHOD_LABELS[key] || key,
        value,
      }))
    : []

  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0)

  // ── Render ────────────────────────────────────────────────────────────────

  // Full error state
  if (error && !loading && !analytics && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Insights and metrics across the entire platform.
            </p>
          </div>
        </div>
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Insights and metrics across the entire platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-200 text-sm">
            <Calendar className="size-4 mr-2" />
            {dateRangeLabels[selectedRange]}
          </Button>
          <Button variant="outline" className="border-gray-200 text-sm" onClick={handleExportCSV}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {dateRanges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedRange === range
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted-foreground hover:text-gray-700'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          metricCards.map((metric) => {
            const Icon = metric.icon
            const isUp = metric.trend === 'up'
            return (
              <Card key={metric.label} className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center justify-center size-10 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`size-5 ${metric.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {metric.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Charts Row 1: Revenue + Teacher Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Overview - Area Chart */}
        {loading ? (
          <ChartSkeleton />
        ) : !analytics?.revenueData?.length ? (
          <EmptyState message="No revenue data available for the selected period." />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Monthly revenue trend
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="size-3 mr-1" />
                  {stats ? formatCurrency(stats.totalRevenue) : '—'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#D97706"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                      dot={{ r: 4, fill: '#D97706', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#D97706', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teacher Signups - Bar Chart */}
        {loading ? (
          <ChartSkeleton />
        ) : !analytics?.teacherGrowthData?.length ? (
          <EmptyState message="No teacher signup data available." />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Teacher Signups</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    New teacher registrations per month
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Users className="size-3 mr-1" />
                  {stats ? formatNumber(stats.totalTeachers) : '—'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.teacherGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="teachers"
                      name="Teachers"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row 2: Student Registrations + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Student Registrations - Bar Chart */}
        {loading ? (
          <ChartSkeleton />
        ) : !analytics?.studentGrowthData?.length ? (
          <EmptyState message="No student registration data available." />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Student Registrations</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    New student registrations per month
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <GraduationCap className="size-3 mr-1" />
                  {stats ? formatNumber(stats.totalStudents) : '—'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.studentGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="students"
                      name="Students"
                      fill="#0891B2"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Distribution - Pie Chart */}
        {loading ? (
          <PieChartSkeleton />
        ) : !pieData.length ? (
          <EmptyState message="No payment method data available." />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Payment Method Distribution</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Breakdown of payment methods used
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-56 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="middle"
                      align="right"
                      layout="vertical"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string, entry: any) => {
                        const item = pieData.find((d) => d.name === value)
                        const pct = item && pieTotal > 0 ? ((item.value / pieTotal) * 100).toFixed(1) : '0'
                        return (
                          <span className="text-xs text-gray-600 ml-1">
                            {value} <span className="text-muted-foreground">({pct}%)</span>
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Row: Top Organizations + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Organizations */}
        {loading ? (
          <div className="lg:col-span-2">
            <TableSkeleton />
          </div>
        ) : !analytics?.topOrganizations?.length ? (
          <div className="lg:col-span-2">
            <EmptyState message="No organization data available yet." />
          </div>
        ) : (
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Organizations by Revenue</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Highest-grossing organizations on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="space-y-1">
                  {analytics.topOrganizations.map((org, index) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                          #{index + 1}
                        </span>
                        <div
                          className="flex items-center justify-center size-8 rounded-lg"
                          style={{ backgroundColor: `${org.accentColor || '#D97706'}15` }}
                        >
                          <Building2
                            className="size-4"
                            style={{ color: org.accentColor || '#D97706' }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{org.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{org.code}</span>
                            <Badge
                              variant={org.status === 'active' ? 'default' : 'secondary'}
                              className={`text-xs px-1.5 py-0 ${
                                org.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : org.status === 'trial'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {org.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(org.revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-44" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-8 rounded-lg mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-full mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !analytics?.recentActivity?.length ? (
          <EmptyState message="No recent activity to show." />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Latest platform events
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.icon)
                    return (
                      <div key={index} className="flex items-start gap-3 py-1">
                        <div
                          className="flex items-center justify-center size-8 rounded-lg shrink-0 mt-0.5"
                          style={{ backgroundColor: `${activity.color || '#D97706'}15` }}
                        >
                          <ActivityIcon
                            className="size-4"
                            style={{ color: activity.color || '#D97706' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-snug">{activity.text}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="size-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
