'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  IndianRupee,
  Download,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  ShoppingCart,
  UserPlus,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  BarChart,
  Bar,
  Line,
} from 'recharts'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

type ReportTab = 'sales' | 'orders' | 'students' | 'progress'

// Sales data interfaces
interface MonthlyRevenue {
  month: string
  revenue: number
  orders: number
}

interface TopSeries {
  id: string
  title: string
  revenue: number
  orders: number
}

interface RecentOrder {
  id: string
  studentName: string
  studentEmail: string
  items: string
  totalAmount: number
  finalAmount: number
  status: string
  createdAt: string
}

// Orders data interfaces
interface OrderEntry {
  id: string
  studentName: string
  studentEmail: string
  items: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  status: string
  couponCode: string | null
  createdAt: string
}

interface OrderStats {
  total: number
  completed: number
  pending: number
  failed: number
  totalAmount: number
}

// Students data interfaces
interface StudentGrowth {
  month: string
  count: number
  cumulative: number
}

interface StudentEntry {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  isBlocked: boolean
  testAttempts: number
  orders: number
  createdAt: string
}

// Progress data interfaces
interface StudentProgressEntry {
  id: string
  name: string
  email: string
  courseCompletionPercent: number
  testScorePercent: number
  lastActive: string
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales')
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)

  // Sales state
  const [salesData, setSalesData] = useState<{
    totalRevenue: number
    avgOrderValue: number
    totalOrders: number
    monthlyRevenue: MonthlyRevenue[]
    topSeries: TopSeries[]
    recentOrders: RecentOrder[]
  } | null>(null)

  // Orders state
  const [ordersData, setOrdersData] = useState<{
    stats: OrderStats
    orders: OrderEntry[]
    total: number
  } | null>(null)

  // Students state
  const [studentsData, setStudentsData] = useState<{
    totalStudents: number
    activeStudents: number
    newSignups: number
    monthlyGrowth: StudentGrowth[]
    students: StudentEntry[]
  } | null>(null)

  // Progress state
  const [progressData, setProgressData] = useState<{
    overall: { avgCompletionRate: number; avgTestScore: number; activeStudents: number }
    topTests: { title: string; avgScore: number; attempts: number }[]
    studentProgress: StudentProgressEntry[]
  } | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/reports?tab=${activeTab}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        if (data.tab === 'sales') {
          setSalesData(data.data)
        } else if (data.tab === 'orders') {
          setOrdersData(data.data)
        } else if (data.tab === 'students') {
          setStudentsData(data.data)
        } else if (data.tab === 'progress') {
          setProgressData(data.data)
        }
      }
    } catch {
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [activeTab, period])

  useEffect(() => { fetchReport() }, [fetchReport])

  const handleExport = () => {
    const data = activeTab === 'sales' ? salesData
      : activeTab === 'orders' ? ordersData
      : activeTab === 'progress' ? progressData
      : studentsData
    if (!data) return

    try {
      let csvContent = ''
      
      if (activeTab === 'sales' && salesData) {
        csvContent = 'Metric,Value\n'
        csvContent += `Total Revenue,${salesData.totalRevenue}\n`
        csvContent += `Avg Order Value,${salesData.avgOrderValue}\n`
        csvContent += `Total Orders,${salesData.totalOrders}\n\n`
        csvContent += 'Month,Revenue,Orders\n'
        salesData.monthlyRevenue.forEach(m => {
          csvContent += `${m.month},${m.revenue},${m.orders}\n`
        })
        csvContent += '\nTop Products\nTitle,Revenue,Orders\n'
        salesData.topSeries.forEach(s => {
          csvContent += `"${s.title}",${s.revenue},${s.orders}\n`
        })
      } else if (activeTab === 'orders' && ordersData) {
        csvContent = 'Student,Email,Items,Total Amount,Discount,Final Amount,Status,Coupon Code,Date\n'
        ordersData.orders.forEach(o => {
          let itemsLabel = ''
          try {
            const parsed = JSON.parse(o.items || '[]')
            itemsLabel = parsed.map((i: any) => i.title || i.name || 'Item').join('; ')
          } catch { itemsLabel = o.items || '' }
          csvContent += `"${o.studentName}","${o.studentEmail}","${itemsLabel}",${o.totalAmount},${o.discountAmount},${o.finalAmount},${o.status},"${o.couponCode || ''}","${new Date(o.createdAt).toLocaleDateString()}"\n`
        })
      } else if (activeTab === 'students' && studentsData) {
        csvContent = 'Name,Email,Phone,Active,Blocked,Test Attempts,Orders,Joined\n'
        studentsData.students.forEach(s => {
          csvContent += `"${s.name}","${s.email}","${s.phone || ''}",${s.isActive},${s.isBlocked},${s.testAttempts},${s.orders},"${new Date(s.createdAt).toLocaleDateString()}"\n`
        })
      } else if (activeTab === 'progress' && progressData) {
        csvContent = 'Name,Email,Course Completion %,Avg Test Score %,Last Active\n'
        progressData.studentProgress.forEach(s => {
          csvContent += `"${s.name}","${s.email}",${s.courseCompletionPercent},${s.testScorePercent},"${new Date(s.lastActive).toLocaleDateString()}"\n`
        })
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeTab}-report-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report exported as CSV')
    } catch {
      toast.error('Failed to export report')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-gray-100 text-gray-600 border-gray-200',
    }
    return styles[status] || styles.pending
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('amount')
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">View detailed analytics and reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 w-fit" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as ReportTab)}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="sales" className="gap-2">
            <IndianRupee className="size-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="size-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="size-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="size-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-xl border-l-4 border-l-amber-500 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-24" /> : formatCurrency(salesData?.totalRevenue || 0)}
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-50">
                    <IndianRupee className="size-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-emerald-500 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-24" /> : formatCurrency(salesData?.avgOrderValue || 0)}
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <TrendingUp className="size-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-sky-500 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-16" /> : (salesData?.totalOrders || 0)}
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sky-50">
                    <ShoppingCart className="size-5 text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue trend for the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData?.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top Products</CardTitle>
              <CardDescription>Best performing courses, test series, and digital products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (salesData?.topSeries || []).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Package className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No sales data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(salesData?.topSeries || []).map((series, idx) => (
                    <div key={series.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{series.title}</p>
                          <p className="text-xs text-muted-foreground">{series.orders} orders</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-amber-700">{formatCurrency(series.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDERS TAB */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="rounded-xl border-l-4 border-l-amber-500 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Total Orders</p>
                    <div className="text-xl font-bold sm:text-2xl">
                      {loading ? <Skeleton className="h-7 w-12" /> : (ordersData?.stats.total || 0)}
                    </div>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                    <ShoppingCart className="size-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-emerald-500 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Completed</p>
                    <div className="text-xl font-bold sm:text-2xl">
                      {loading ? <Skeleton className="h-7 w-12" /> : (ordersData?.stats.completed || 0)}
                    </div>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle className="size-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-sky-500 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Pending</p>
                    <div className="text-xl font-bold sm:text-2xl">
                      {loading ? <Skeleton className="h-7 w-12" /> : (ordersData?.stats.pending || 0)}
                    </div>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-50">
                    <Clock className="size-5 text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-red-500 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Failed</p>
                    <div className="text-xl font-bold sm:text-2xl">
                      {loading ? <Skeleton className="h-7 w-12" /> : (ordersData?.stats.failed || 0)}
                    </div>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                    <XCircle className="size-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <div className="rounded-xl border bg-white overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (ordersData?.orders || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <ShoppingCart className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                      <p className="text-sm">No orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (ordersData?.orders || []).map((order) => {
                    let itemsLabel = '—'
                    try {
                      const parsed = JSON.parse(order.items || '[]')
                      itemsLabel = parsed.map((i: any) => i.title || i.name || 'Item').join(', ')
                    } catch { /* keep default */ }

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{order.studentName}</p>
                            <p className="text-xs text-muted-foreground truncate">{order.studentEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{itemsLabel}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-semibold">{formatCurrency(order.finalAmount)}</p>
                            {order.discountAmount > 0 && (
                              <p className="text-xs text-muted-foreground line-through">{formatCurrency(order.totalAmount)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* STUDENTS TAB */}
        <TabsContent value="students" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="rounded-xl border-l-4 border-l-amber-500 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-16" /> : (studentsData?.totalStudents || 0)}
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-50">
                    <Users className="size-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-emerald-500 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-16" /> : (studentsData?.activeStudents || 0)}
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <UserPlus className="size-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-l-4 border-l-sky-500 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                    <div className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-16" /> : (studentsData?.newSignups || 0)}
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sky-50">
                    <TrendingUp className="size-5 text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Growth Chart */}
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Student Growth</CardTitle>
              <CardDescription>Cumulative student growth over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={studentsData?.monthlyGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="New Signups" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Total Students"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Students Table */}
          <div className="rounded-xl border bg-white overflow-x-auto">
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold">Recent Students</h3>
            </div>
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Test Attempts</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (studentsData?.students || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <Users className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                      <p className="text-sm">No students found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (studentsData?.students || []).slice(0, 10).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-xs shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{student.testAttempts}</TableCell>
                      <TableCell className="text-sm">{student.orders}</TableCell>
                      <TableCell>
                        {student.isBlocked ? (
                          <Badge className="bg-red-50 text-red-700 border-red-200">Blocked</Badge>
                        ) : student.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(student.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="progress" className="space-y-6 mt-6">
          {!progressData ? (
            <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
          ) : (
            <>
              {/* Progress Overview Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Course Completion</p>
                      <h3 className="text-2xl font-bold">{progressData.overall.avgCompletionRate}%</h3>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Test Score</p>
                      <h3 className="text-2xl font-bold">{progressData.overall.avgTestScore}%</h3>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                      <h3 className="text-2xl font-bold">{progressData.overall.activeStudents}</h3>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Tests Performance</CardTitle>
                  <CardDescription>Average scores across your most attempted tests.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressData.topTests} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="title" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Student Progress Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Progress</CardTitle>
                  <CardDescription>Detailed progress and performance by student.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course Progress</TableHead>
                        <TableHead>Avg Test Score</TableHead>
                        <TableHead>Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressData.studentProgress.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No student progress found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        progressData.studentProgress.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={student.courseCompletionPercent} className="h-2 w-24" />
                                <span className="text-sm">{student.courseCompletionPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={student.testScorePercent} className="h-2 w-24 bg-blue-100 [&>div]:bg-blue-600" />
                                <span className="text-sm">{student.testScorePercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(student.lastActive).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
