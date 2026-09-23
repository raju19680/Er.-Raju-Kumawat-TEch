'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  SlidersHorizontal,
  Calendar,
  AlertCircle,
  RotateCcw,
  TestTube2,
  BookOpen,
  FileText,
  ClipboardList,
  Activity,
  ArrowRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { apiFetch } from '@/lib/api-client'
import { useTeacherStore } from '@/lib/teacher-store'

interface DashboardStats {
  rank: number
  rankChange: number
  salesVolume: number
  salesVolumeChange: number
  revenue: number
  revenueChange: number
  signups: number
  signupsChange: number
}

interface DashboardCounts {
  totalTestSeries: number
  totalTests: number
  totalQuestions: number
  totalStudents: number
  totalCourses: number
  totalBlogs: number
  totalOrders: number
}

interface ChartData {
  month: string
  revenue: number
  count: number
}

interface RecentActivity {
  type: 'order' | 'signup' | 'attempt'
  title: string
  description: string
  time: string
}

type DateRange = '7d' | '30d' | '90d' | '12m' | 'all'
type ChartMetric = 'revenue' | 'signups' | 'attempts'

function CustomTooltip({ active, payload, label, isCurrency }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-amber-600">
          {isCurrency
            ? `₹${payload[0].value.toLocaleString('en-IN')}`
            : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
  switch (type) {
    case 'order':
      return <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0"><ShoppingCart className="size-4" /></div>
    case 'signup':
      return <div className="flex size-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 shrink-0"><Users className="size-4" /></div>
    case 'attempt':
      return <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0"><ClipboardList className="size-4" /></div>
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [counts, setCounts] = useState<DashboardCounts | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<ChartMetric>('revenue')
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { setCurrentPage } = useTeacherStore()

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/teacher/dashboard')
      if (res.ok) {
        const data = await res.json()
        if (data.stats) setStats(data.stats)
        if (data.counts) setCounts(data.counts)
        if (data.charts) {
          if (metric === 'revenue') setChartData(data.charts.monthlyRevenue || [])
          else if (metric === 'signups') setChartData(data.charts.monthlySignups || [])
          else setChartData(data.charts.monthlyAttempts || [])
        }
        if (data.recentActivity) setRecentActivity(data.recentActivity)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [metric])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Update chart data when metric changes (without refetching)
  useEffect(() => {
    // Re-fetch only when metric changes (already handled by fetchDashboard dependency)
  }, [metric])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const dateRangeLabels: Record<DateRange, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '12m': 'Last 12 months',
    'all': 'All time',
  }

  const metricCards = [
    {
      title: 'Rank',
      value: stats?.rank ? `#${stats.rank}` : '#12',
      change: stats?.rankChange ?? 20,
      icon: Award,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Test Attempts',
      value: stats?.salesVolume ? `${stats.salesVolume.toLocaleString('en-IN')}` : '0',
      change: stats?.salesVolumeChange ?? -35.7,
      icon: ClipboardList,
      accentBg: 'bg-emerald-50',
      accentIcon: 'text-emerald-600',
      accentBorder: 'border-l-emerald-500',
    },
    {
      title: 'Revenue',
      value: stats?.revenue ? `₹${stats.revenue.toLocaleString('en-IN')}` : '₹0',
      change: stats?.revenueChange ?? 0,
      icon: DollarSign,
      accentBg: 'bg-sky-50',
      accentIcon: 'text-sky-600',
      accentBorder: 'border-l-sky-500',
    },
    {
      title: 'Signups',
      value: stats?.signups ? `${stats.signups.toLocaleString('en-IN')}` : '0',
      change: stats?.signupsChange ?? 0,
      icon: Users,
      accentBg: 'bg-violet-50',
      accentIcon: 'text-violet-600',
      accentBorder: 'border-l-violet-500',
    },
  ]

  const quickStatCards = [
    { title: 'Test Series', value: counts?.totalTestSeries ?? 0, icon: TestTube2, accentBg: 'bg-amber-50', accentIcon: 'text-amber-600', action: () => setCurrentPage('tests') },
    { title: 'Tests', value: counts?.totalTests ?? 0, icon: ClipboardList, accentBg: 'bg-emerald-50', accentIcon: 'text-emerald-600', action: () => setCurrentPage('tests') },
    { title: 'Questions', value: counts?.totalQuestions ?? 0, icon: FileText, accentBg: 'bg-sky-50', accentIcon: 'text-sky-600', action: undefined },
    { title: 'Students', value: counts?.totalStudents ?? 0, icon: Users, accentBg: 'bg-violet-50', accentIcon: 'text-violet-600', action: () => setCurrentPage('users') },
    { title: 'Courses', value: counts?.totalCourses ?? 0, icon: BookOpen, accentBg: 'bg-rose-50', accentIcon: 'text-rose-600', action: () => setCurrentPage('content') },
    { title: 'Blogs', value: counts?.totalBlogs ?? 0, icon: Activity, accentBg: 'bg-teal-50', accentIcon: 'text-teal-600', action: () => setCurrentPage('content') },
  ]

  // Error state with retry
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg font-semibold text-gray-900 mb-1">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" className="gap-2" onClick={fetchDashboard}>
          <RotateCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-fit">
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="size-4" />
                  Date Range
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {(['7d', '30d', '90d', '12m', 'all'] as DateRange[]).map((range) => (
                    <Button
                      key={range}
                      variant={dateRange === range ? 'default' : 'ghost'}
                      size="sm"
                      className={`justify-start ${dateRange === range ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                      onClick={() => setDateRange(range)}
                    >
                      {dateRangeLabels[range]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active date range indicator */}
      {dateRange !== '30d' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Calendar className="size-3" />
            {dateRangeLabels[dateRange]}
          </Badge>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setDateRange('30d')}>
            Clear
          </Button>
        </div>
      )}

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="min-w-0 rounded-xl border-l-4 border-l-gray-200 bg-white shadow-sm">
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon
            const isPositive = card.change >= 0
            return (
              <Card
                key={card.title}
                className={`min-w-0 rounded-xl border-l-4 ${card.accentBorder} bg-white shadow-sm hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                      <div className="flex items-center gap-1.5">
                        {isPositive ? (
                          <TrendingUp className="size-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="size-3.5 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{card.change}%
                        </span>
                      </div>
                    </div>
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${card.accentBg}`}>
                      <Icon className={`size-5 ${card.accentIcon}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {quickStatCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={`min-w-0 rounded-xl bg-white shadow-sm ${card.action ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
              onClick={card.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.accentBg}`}>
                    <Icon className={`size-4 ${card.accentIcon}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    <p className="text-lg font-bold tracking-tight">
                      {loading ? <Skeleton className="h-6 w-10" /> : card.value.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Analysis Chart - 2 cols */}
        <Card className="rounded-xl bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Analysis</CardTitle>
              <Select value={metric} onValueChange={(v) => setMetric(v as ChartMetric)}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="signups">Signups</SelectItem>
                  <SelectItem value="attempts">Test Attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                <Activity className="size-10 text-gray-300 mb-2" />
                <p className="text-sm">No data available yet</p>
                <p className="text-xs mt-1">Data will appear as your platform grows</p>
              </div>
            ) : metric === 'revenue' ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={50} />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, stroke: '#fff', r: 4 }}
                      activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={50} />
                    <Tooltip content={<CustomTooltip isCurrency={false} />} />
                    <Bar
                      dataKey="count"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      name={metric === 'signups' ? 'New Signups' : 'Test Attempts'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - 1 col */}
        <Card className="rounded-xl bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setCurrentPage('reports')}>
                View All <ArrowRight className="size-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="size-8 text-gray-300 mb-2" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Activity will appear here as users interact with your platform</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[340px] overflow-y-auto">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(activity.time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
