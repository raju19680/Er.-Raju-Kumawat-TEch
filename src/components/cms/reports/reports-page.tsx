'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  MoreHorizontal,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────

interface RevenueDataPoint {
  month: string
  revenue: number
}

interface EnrollmentDataPoint {
  month: string
  students: number
}

interface TestAttemptDataPoint {
  month: string
  attempts: number
  completed: number
}

interface AnalyticsStats {
  revenue: number
  revenueChange: number
  totalStudents: number
  totalStudentsChange: number
  activeTests: number
  activeTestsChange: number
  completionRate: number
  completionRateChange: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

interface StudentItem {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
}

interface PaymentItem {
  id: string
  amount: number
  method: string | null
  status: string
  createdAt: string
  order: {
    student: { name: string } | null
    items: string | null
  } | null
}

const TXN_STATUS_COLORS: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  pending: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  failed: 'bg-red-50 text-red-700 hover:bg-red-50',
  refunded: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  processing: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  pending: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  failed: 'bg-red-50 text-red-700 hover:bg-red-50',
  cancelled: 'bg-red-50 text-red-700 hover:bg-red-50',
  refunded: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-emerald-600">
        Revenue: ₹{payload[0].value.toLocaleString('en-IN')}
      </p>
    </div>
  )
}

function EnrollmentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-emerald-600">
        New Students: {(payload[0]?.value || 0).toLocaleString()}
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { currentPage, orgCode, setCurrentPage } = useAppStore()

  const defaultTab = useMemo(() => {
    if (currentPage === 'reports-orders') return 'orders'
    if (currentPage === 'reports-users') return 'users'
    return 'sales'
  }, [currentPage])

  // Analytics data
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentDataPoint[]>([])
  const [testAttemptData, setTestAttemptData] = useState<TestAttemptDataPoint[]>([])
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  // Payments (for orders tab)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  // Students (for users tab)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [totalStudentsCount, setTotalStudentsCount] = useState(0)
  const [activeStudentsCount, setActiveStudentsCount] = useState(0)
  const [inactiveStudentsCount, setInactiveStudentsCount] = useState(0)

  // Export loading
  const [exporting, setExporting] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const res = await apiFetch('/api/dashboard/analytics')
      const data = await res.json()
      if (data.success) {
        setRevenueData(data.revenueData || [])
        setEnrollmentData(data.enrollmentData || [])
        setTestAttemptData(data.testAttemptData || [])
        setStats(data.stats || null)
        setRecentActivity(data.recentActivity || [])
      } else {
        setAnalyticsError(data.message || 'Failed to load analytics')
      }
    } catch {
      setAnalyticsError('Network error. Please try again.')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    // Previously called /api/admin/analytics (admin-only), which caused
    // auth errors for teachers. The admin analytics response never contained
    // data.payments anyway, so this was dead code. The orders tab renders
    // from recentActivity (fetched by fetchAnalytics via /api/dashboard/analytics
    // which is accessible by both admin and teacher roles).
    setPaymentsLoading(false)
  }, [])

  const fetchStudents = useCallback(async () => {
    if (!orgCode) return
    setStudentsLoading(true)
    try {
      // /api/students is accessible by both admin and teacher (uses requireAuth)
      // and supports orgCode filtering for proper data scoping
      const res = await apiFetch(`/api/students?limit=50&status=&organizationId=${orgCode}`)
      const data = await res.json()
      if (data.items) {
        setStudents(data.items)
        setTotalStudentsCount(data.total || data.items.length)
        setActiveStudentsCount(data.items.filter((s: StudentItem) => s.isActive).length)
        setInactiveStudentsCount(data.items.filter((s: StudentItem) => !s.isActive).length)
      }
    } catch {
      // Silently fail
    } finally {
      setStudentsLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    fetchAnalytics()
    fetchPayments()
    fetchStudents()
  }, [fetchAnalytics, fetchPayments, fetchStudents])

  // Computed values
  const totalRevenue = stats?.revenue || 0
  const thisMonthRevenue = revenueData.length > 0 ? revenueData[revenueData.length - 1].revenue : 0
  const lastMonthRevenue = revenueData.length > 1 ? revenueData[revenueData.length - 2].revenue : 0

  const revenuePayments = recentActivity.filter((a) => a.type === 'payment')

  // Export CSV
  const handleExportCSV = () => {
    setExporting(true)
    try {
      let csvContent = ''

      // Sales data
      csvContent += 'Month,Revenue\n'
      revenueData.forEach((d) => {
        csvContent += `${d.month},${d.revenue}\n`
      })
      csvContent += '\n\n'

      // Enrollment data
      csvContent += 'Month,New Students\n'
      enrollmentData.forEach((d) => {
        csvContent += `${d.month},${d.students}\n`
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `report-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Report exported successfully')
    } catch {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderSkeletonRows = (cols: number, rows: number = 4) => (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your platform performance and analytics
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCSV} disabled={exporting}>
          {exporting ? (
            <><Loader2 className="size-4 mr-2 animate-spin" />Exporting...</>
          ) : (
            <><Download className="size-4 mr-2" />Export Report</>
          )}
        </Button>
      </div>

      <Tabs value={defaultTab} onValueChange={(v) => {
        const pageMap: Record<string, string> = { sales: 'reports-sales', orders: 'reports-orders', users: 'reports-users' }
        if (pageMap[v]) setCurrentPage(pageMap[v] as any)
      }} className="space-y-6">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start sm:justify-center">
          <TabsTrigger value="sales" className="gap-1.5 flex-shrink-0">
            <DollarSign className="size-3.5" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 flex-shrink-0">
            <ShoppingBag className="size-3.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 flex-shrink-0">
            <Users className="size-3.5" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* ─── Sales Tab ──────────────────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-6">
          {analyticsLoading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="rounded-xl">
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <Skeleton className="h-80 w-full" />
                </CardContent>
              </Card>
            </>
          ) : analyticsError ? (
            <Card className="rounded-xl">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertCircle className="size-5 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Failed to load analytics</p>
                  <p className="text-xs text-muted-foreground mt-1">{analyticsError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchAnalytics}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border-l-4 border-l-emerald-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          ₹{(totalRevenue / 100000).toFixed(1)}L
                        </p>
                      </div>
                      <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <DollarSign className="size-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-l-4 border-l-emerald-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          ₹{(thisMonthRevenue / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        {thisMonthRevenue >= lastMonthRevenue ? (
                          <ArrowUpRight className="size-5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="size-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    {lastMonthRevenue > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {thisMonthRevenue >= lastMonthRevenue ? '+' : ''}
                        {(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)}% vs last month
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {stats?.totalStudents?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="size-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <TrendingUp className="size-5 text-purple-600" />
                      </div>
                    </div>
                    {stats?.totalStudentsChange !== undefined && stats.totalStudentsChange !== 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {stats.totalStudentsChange > 0 ? '+' : ''}{stats.totalStudentsChange}% growth
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {stats?.completionRate || 0}%
                        </p>
                      </div>
                      <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <RefreshCcw className="size-5 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Test completion rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueData.length > 0 ? (
                    <div className="h-[250px] sm:h-80 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="#94a3b8"
                            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
                          />
                          <Tooltip content={<RevenueTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#10b981' }}
                            activeDot={{ r: 6, fill: '#10b981' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </TabsContent>

        {/* ─── Orders Tab ─────────────────────────────────────────────── */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-0">
              {analyticsLoading ? (
                renderSkeletonRows(5)
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingBag className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No orders yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Orders will appear here once students make purchases</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity.filter(a => a.type === 'payment').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentActivity.filter(a => a.type === 'payment').map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium text-sm max-w-[300px] truncate">
                              {activity.description}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  activity.type === 'payment'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                                }
                              >
                                {activity.type === 'payment' ? 'Payment' : activity.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(activity.timestamp).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Users Tab ──────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-6">
          {/* User Stats */}
          {studentsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="rounded-xl">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-xl border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{(totalStudentsCount || 0).toLocaleString()}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users className="size-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-l-4 border-l-emerald-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{(activeStudentsCount || 0).toLocaleString()}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <ArrowUpRight className="size-5 text-emerald-600" />
                    </div>
                  </div>
                  {totalStudentsCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {((activeStudentsCount / totalStudentsCount) * 100).toFixed(1)}% of total users
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-xl border-l-4 border-l-gray-400">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Inactive Users</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{(inactiveStudentsCount || 0).toLocaleString()}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-gray-50 flex items-center justify-center">
                      <ArrowDownRight className="size-5 text-gray-500" />
                    </div>
                  </div>
                  {totalStudentsCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {((inactiveStudentsCount / totalStudentsCount) * 100).toFixed(1)}% of total users
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enrollment Chart */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Student Enrollment</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : enrollmentData.length > 0 ? (
                <div className="h-[250px] sm:h-80 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip content={<EnrollmentTooltip />} />
                      <defs>
                        <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="students"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#enrollGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                  No enrollment data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {studentsLoading ? (
                renderSkeletonRows(4)
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.slice(0, 20).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7">
                                <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                                  {student.name.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm whitespace-nowrap">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{student.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                student.isActive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                              }
                            >
                              {student.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(student.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
