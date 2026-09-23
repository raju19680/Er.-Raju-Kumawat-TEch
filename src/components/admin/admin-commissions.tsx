'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  IndianRupee,
  CreditCard,
  Users,
  Percent,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Building2,
  ArrowUpDown,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────────
interface Summary {
  totalRevenue: number
  totalAdminCommission: number
  totalGatewayCharge: number
  totalTeacherPayout: number
  avgCommissionRate: number
  totalTransactions: number
}

interface OrgBreakdownItem {
  id: string
  name: string
  code: string
  accentColor: string
  status: string
  totalOrders: number
  totalRevenue: number
  adminCommission: number
  gatewayCharge: number
  teacherAmount: number
  commissionRate: number
  recentPaymentDate: string | null
}

interface MonthlyTrendItem {
  month: string
  adminCommission: number
  gatewayCharge: number
  teacherAmount: number
  revenue: number
}

interface TopTeacherItem {
  name: string
  orgName: string
  orgRevenue: number
  commissionEarned: number
}

interface RecentTransactionItem {
  id: string
  date: string
  studentName: string
  studentEmail: string
  orgName: string
  orgCode: string
  amount: number
  adminCommission: number
  gatewayCharge: number
  teacherAmount: number
  status: string
  method: string | null
}

interface CommissionsData {
  summary: Summary
  orgBreakdown: OrgBreakdownItem[]
  monthlyTrend: MonthlyTrendItem[]
  topTeachers: TopTeacherItem[]
  recentTransactions: RecentTransactionItem[]
}

// ── Constants ────────────────────────────────────────────────────────────────
const dateRanges = ['7D', '30D', '90D', '12M', 'All'] as const
type DateRange = (typeof dateRanges)[number]

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toLocaleString('en-IN')}`
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="size-10 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-28 mb-1" />
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
            <Skeleton className="h-5 w-44 mb-1" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2">
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-48 mb-1" />
        <Skeleton className="h-3 w-36" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="size-3 rounded-full" />
                <Skeleton className="size-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-14" />
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

// ── Custom tooltip for chart ─────────────────────────────────────────────────
function CustomChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Payment status badge ─────────────────────────────────────────────────────
function getPaymentStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'success':
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 text-xs">
          Success
        </Badge>
      )
    case 'failed':
      return (
        <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-0 text-xs">
          Failed
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-0 text-xs">
          Pending
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminCommissionsPage() {
  const setAdminPage = useAppStore((s) => s.setAdminPage)

  const [selectedRange, setSelectedRange] = useState<DateRange>('All')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [data, setData] = useState<CommissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'revenue' | 'commission' | 'orders'>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('period', selectedRange)
      if (selectedOrgId) params.set('organizationId', selectedOrgId)

      const res = await apiFetch(`/api/admin/commissions?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch commission data. Please try again.')
      }

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || 'Invalid API response')
      }

      setData(json)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [selectedRange, selectedOrgId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Sort org breakdown ────────────────────────────────────────────────
  const sortedOrgBreakdown = React.useMemo(() => {
    if (!data?.orgBreakdown) return []
    const sorted = [...data.orgBreakdown]
    sorted.sort((a, b) => {
      let aVal = 0
      let bVal = 0
      switch (sortField) {
        case 'revenue':
          aVal = a.totalRevenue
          bVal = b.totalRevenue
          break
        case 'commission':
          aVal = a.adminCommission
          bVal = b.adminCommission
          break
        case 'orders':
          aVal = a.totalOrders
          bVal = b.totalOrders
          break
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
    return sorted
  }, [data?.orgBreakdown, sortField, sortDir])

  const handleSort = (field: 'revenue' | 'commission' | 'orders') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: 'revenue' | 'commission' | 'orders' }) => (
    <ArrowUpDown
      className={`size-3 ml-1 inline ${sortField === field ? 'text-amber-600' : 'text-muted-foreground/40'}`}
    />
  )

  // ── Max revenue for progress bars ─────────────────────────────────────
  const maxOrgRevenue = React.useMemo(() => {
    if (!data?.orgBreakdown?.length) return 1
    return Math.max(...data.orgBreakdown.map((o) => o.totalRevenue), 1)
  }, [data?.orgBreakdown])

  // ── Full error state ──────────────────────────────────────────────────
  if (error && !loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue & Commissions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed breakdown of platform revenue, commissions, and payouts.
            </p>
          </div>
        </div>
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue & Commissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed breakdown of platform revenue, commissions, and payouts.
          </p>
        </div>
      </div>

      {/* ── Date Range Selector + Org Filter ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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

        {/* Organization filter chips */}
        {data?.orgBreakdown && data.orgBreakdown.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedOrgId(null)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                !selectedOrgId
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              All Orgs
            </button>
            {data.orgBreakdown.slice(0, 6).map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 ${
                  selectedOrgId === org.id
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: org.accentColor || '#D97706' }}
                />
                {org.name.length > 15 ? `${org.name.slice(0, 15)}…` : org.name}
              </button>
            ))}
            {selectedOrgId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setSelectedOrgId(null)}
              >
                <X className="size-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Summary Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {/* Total Revenue */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-50">
                    <DollarSign className="size-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.summary.totalRevenue ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Revenue</p>
              </CardContent>
            </Card>

            {/* Admin Commission */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-amber-50">
                    <IndianRupee className="size-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.summary.totalAdminCommission ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin Commission</p>
              </CardContent>
            </Card>

            {/* Gateway Charges */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-sky-50">
                    <CreditCard className="size-5 text-sky-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.summary.totalGatewayCharge ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Gateway Charges</p>
              </CardContent>
            </Card>

            {/* Teacher Payouts */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-violet-50">
                    <Users className="size-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.summary.totalTeacherPayout ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Teacher Payouts</p>
              </CardContent>
            </Card>

            {/* Avg Commission Rate */}
            <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-rose-50">
                    <Percent className="size-5 text-rose-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.summary.avgCommissionRate.toFixed(1) ?? '0.0'}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg Commission Rate</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Revenue Split Chart ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
        ) : !data?.monthlyTrend?.length ? (
          <div className="lg:col-span-2">
            <EmptyState message="No monthly trend data available for the selected period." />
          </div>
        ) : (
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Revenue Split</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Monthly breakdown: Admin commission vs Gateway charge vs Teacher payout
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data?.summary.totalTransactions ?? 0} transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-gray-600 ml-1">{value}</span>
                      )}
                    />
                    <Bar
                      dataKey="adminCommission"
                      name="Admin Commission"
                      stackId="split"
                      fill="#D97706"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="gatewayCharge"
                      name="Gateway Charge"
                      stackId="split"
                      fill="#0EA5E9"
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="teacherAmount"
                      name="Teacher Payout"
                      stackId="split"
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

        {/* ── Top Performing Organizations ──────────────────────────────── */}
        {loading ? (
          <TableSkeleton />
        ) : !data?.orgBreakdown?.length ? (
          <EmptyState message="No organization data available yet." />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Organizations</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Revenue & commission rate by org
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4">
                {data.orgBreakdown.slice(0, 5).map((org, index) => (
                  <div key={org.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground w-4 shrink-0">
                          #{index + 1}
                        </span>
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: org.accentColor || '#D97706' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {org.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{org.code}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(org.totalRevenue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={org.commissionRate}
                        max={50}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs font-medium text-amber-600 shrink-0">
                        {org.commissionRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Organization Breakdown Table ─────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Organization Breakdown</h2>
        {loading ? (
          <TableSkeleton />
        ) : !sortedOrgBreakdown.length ? (
          <EmptyState message="No organization data available for the selected period." />
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="border-0 shadow-sm hidden md:block">
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-muted-foreground">Organization</TableHead>
                        <TableHead
                          className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-gray-900"
                          onClick={() => handleSort('orders')}
                        >
                          Orders <SortIcon field="orders" />
                        </TableHead>
                        <TableHead
                          className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-gray-900"
                          onClick={() => handleSort('revenue')}
                        >
                          Revenue <SortIcon field="revenue" />
                        </TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Commission Rate</TableHead>
                        <TableHead
                          className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-gray-900"
                          onClick={() => handleSort('commission')}
                        >
                          Admin Commission <SortIcon field="commission" />
                        </TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Gateway Charge</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Teacher Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrgBreakdown.map((org) => (
                        <TableRow
                          key={org.id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => {
                            setSelectedOrgId(selectedOrgId === org.id ? null : org.id)
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span
                                className="size-3 rounded-full shrink-0"
                                style={{ backgroundColor: org.accentColor || '#D97706' }}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{org.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">{org.code}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1 py-0 ${
                                      org.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : org.status === 'trial'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}
                                  >
                                    {org.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {org.totalOrders.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900">
                            {formatFullCurrency(org.totalRevenue)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={org.commissionRate}
                                max={50}
                                className="h-1.5 w-16"
                              />
                              <span className="text-xs font-medium text-amber-600">
                                {org.commissionRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-amber-700">
                            {formatFullCurrency(org.adminCommission)}
                          </TableCell>
                          <TableCell className="text-sm text-sky-700">
                            {formatFullCurrency(org.gatewayCharge)}
                          </TableCell>
                          <TableCell className="text-sm text-emerald-700">
                            {formatFullCurrency(org.teacherAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {sortedOrgBreakdown.map((org) => (
                <Card
                  key={org.id}
                  className="border-0 shadow-sm cursor-pointer"
                  onClick={() => {
                    setSelectedOrgId(selectedOrgId === org.id ? null : org.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: org.accentColor || '#D97706' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{org.code}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${
                                org.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : org.status === 'trial'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              }`}
                            >
                              {org.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 shrink-0">
                        {formatCurrency(org.totalRevenue)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Progress value={org.commissionRate} max={50} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium text-amber-600 shrink-0">
                        {org.commissionRate}% commission
                      </span>
                    </div>

                    <Separator className="mb-3" />

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Admin</p>
                        <p className="text-xs font-semibold text-amber-700">
                          {formatCurrency(org.adminCommission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gateway</p>
                        <p className="text-xs font-semibold text-sky-700">
                          {formatCurrency(org.gatewayCharge)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                        <p className="text-xs font-semibold text-emerald-700">
                          {formatCurrency(org.teacherAmount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Recent Transactions Table ────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Transactions</h2>
        {loading ? (
          <TableSkeleton />
        ) : !data?.recentTransactions?.length ? (
          <EmptyState message="No recent transactions found." />
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="border-0 shadow-sm hidden md:block">
              <CardContent className="px-0 pb-0">
                <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Organization</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Commission</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Gateway</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Teacher Payout</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTransactions.map((tx) => (
                        <TableRow key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDateTime(tx.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{tx.studentName}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{tx.studentEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-700">{tx.orgName}</p>
                            <p className="text-xs text-muted-foreground">{tx.orgCode}</p>
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900">
                            {formatFullCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-amber-700">
                            {formatFullCurrency(tx.adminCommission)}
                          </TableCell>
                          <TableCell className="text-sm text-sky-700">
                            {formatFullCurrency(tx.gatewayCharge)}
                          </TableCell>
                          <TableCell className="text-sm text-emerald-700">
                            {formatFullCurrency(tx.teacherAmount)}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(tx.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {data.recentTransactions.map((tx) => (
                <Card key={tx.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{tx.studentName}</p>
                        <p className="text-xs text-muted-foreground">{tx.orgName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(tx.amount)}
                        </p>
                        {getPaymentStatusBadge(tx.status)}
                      </div>
                    </div>

                    <Separator className="my-2.5" />

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Admin</p>
                        <p className="text-xs font-semibold text-amber-700">
                          {formatCurrency(tx.adminCommission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gateway</p>
                        <p className="text-xs font-semibold text-sky-700">
                          {formatCurrency(tx.gatewayCharge)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                        <p className="text-xs font-semibold text-emerald-700">
                          {formatCurrency(tx.teacherAmount)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(tx.date)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Top Teachers Card ────────────────────────────────────────────── */}
      {data?.topTeachers && data.topTeachers.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Top Teachers by Revenue</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {data.topTeachers.map((teacher, index) => (
                  <div
                    key={`${teacher.name}-${index}`}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                        #{index + 1}
                      </span>
                      <div className="flex items-center justify-center size-8 rounded-lg bg-violet-50">
                        <Users className="size-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{teacher.orgName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(teacher.orgRevenue)}
                      </p>
                      <p className="text-xs text-amber-600">
                        Commission: {formatCurrency(teacher.commissionEarned)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Navigate to Orders Page Link ─────────────────────────────────── */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          onClick={() => setAdminPage('admin-orders')}
        >
          <Building2 className="size-4 mr-2" />
          View All Orders & Payments
        </Button>
      </div>
    </div>
  )
}
