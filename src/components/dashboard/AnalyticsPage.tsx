'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  ShoppingCart,
  IndianRupee,
  UserPlus,
  Calendar,
  Loader2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

// ─── Analytics Page ────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [chartFilter, setChartFilter] = useState('revenue')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/teacher/stats')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          toast.error('Failed to load analytics')
        }
      } catch (err) {
        toast.error('Error loading analytics data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!data || !data.stats) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No analytics data available.
      </div>
    )
  }

  const { stats, enrollmentTrend, dailyEarnings, topCourses } = data

  // Prepare chart data based on filter
  let chartData: any[] = []
  if (chartFilter === 'revenue') {
    chartData = dailyEarnings.map((d: any) => ({ name: d.date, value: d.amount }))
  } else if (chartFilter === 'enrollments') {
    chartData = enrollmentTrend.map((d: any) => ({ name: d.month, value: d.count }))
  }

  const statCards = [
    {
      label: 'Rank',
      value: `#${stats.rank}`,
      change: '',
      positive: true,
      icon: Trophy,
      gradient: 'from-purple-600 to-purple-500',
    },
    {
      label: 'Enrollments',
      value: stats.totalEnrollments.toLocaleString('en-IN'),
      change: '',
      positive: true,
      icon: ShoppingCart,
      gradient: 'from-purple-600 to-purple-500',
    },
    {
      label: 'Revenue',
      value: `\u20B9${stats.totalRevenue.toLocaleString('en-IN')}`,
      change: '',
      positive: true,
      icon: IndianRupee,
      gradient: 'from-purple-600 to-purple-500',
    },
    {
      label: 'Students',
      value: stats.totalStudents.toLocaleString('en-IN'),
      change: '',
      positive: true,
      icon: UserPlus,
      gradient: 'from-purple-600 to-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your performance and student engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Updated Now</span>
        </div>
      </div>

      {/* Stat Cards - Purple Gradient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="overflow-hidden border-0">
              <div className={`bg-gradient-to-br ${stat.gradient} p-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Icon className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                  {stat.change && (
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      stat.positive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'
                    }`}>
                      {stat.positive ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {stat.change}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Analysis Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Analysis</CardTitle>
            <CardDescription>Performance overview over time</CardDescription>
          </div>
          <Select value={chartFilter} onValueChange={setChartFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Daily Revenue</SelectItem>
              <SelectItem value="enrollments">Monthly Enrollments</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    fill="url(#purpleGradient)"
                    dot={{ fill: '#7c3aed', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No data available for the selected metric.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Courses & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Courses</CardTitle>
            <CardDescription>Based on total enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {topCourses.length > 0 ? (
              <div className="space-y-4">
                {topCourses.map((course: any, i: number) => (
                  <div key={course.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-purple-600 w-6">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course._count.purchasedBy} enrolled</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-semibold text-foreground">
                        {course.price > 0 ? `\u20B9${course.price.toLocaleString('en-IN')}` : 'Free'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No courses published yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Library Summary</CardTitle>
            <CardDescription>Your published content overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Courses</span>
                <span className="text-sm font-bold">{stats.totalCourses}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Test Series</span>
                <span className="text-sm font-bold">{stats.totalTestSeries}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Notes & PDFs</span>
                <span className="text-sm font-bold">{stats.totalNotes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage
