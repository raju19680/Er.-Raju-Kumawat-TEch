'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  IndianRupee,
  MoreHorizontal,
  Eye,
  RefreshCw,
  AlertCircle,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
interface Payment {
  id: string
  orderId: string
  amount: number
  method: string | null
  status: string
  adminCommission: number | null
  teacherAmount: number | null
  gatewayCharge: number | null
  transactionId: string | null
  createdAt: string
}

interface OrderStudent {
  id: string
  name: string
  email: string
}

interface Order {
  id: string
  studentId: string
  items: string // JSON string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  status: string
  couponCode: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  organizationId: string | null
  createdAt: string
  updatedAt: string
  student: OrderStudent
  payments: Payment[]
}

interface OrderStats {
  totalRevenue: number
  completedOrders: number
  pendingOrders: number
  refundedOrders: number
}

interface ApiResponse {
  items: Order[]
  total: number
  page: number
  limit: number
  stats: OrderStats
  error?: string
}

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20
const DEBOUNCE_MS = 400

type StatusFilter = '' | 'pending' | 'completed' | 'failed' | 'refunded'

const ORDER_STATUSES: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const UPDATE_STATUSES = ['pending', 'completed', 'failed', 'refunded']

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
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

function truncateId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function parseItems(itemsJson: string): { name: string; quantity?: number }[] {
  try {
    const parsed = JSON.parse(itemsJson)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
          <CheckCircle className="size-3 mr-1" />
          Completed
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
          <Clock className="size-3 mr-1" />
          Pending
        </Badge>
      )
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
          <XCircle className="size-3 mr-1" />
          Failed
        </Badge>
      )
    case 'refunded':
      return (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0">
          <RotateCcw className="size-3 mr-1" />
          Refunded
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

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

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const orgCode = useAppStore((s) => s.orgCode)

  // Data state
  const [orders, setOrders] = useState<Order[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState<OrderStats>({
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    refundedOrders: 0,
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean
    order: Order | null
  }>({ open: false, order: null })

  // Update status dialog state
  const [updateDialog, setUpdateDialog] = useState<{
    open: boolean
    orderId: string
    currentStatus: string
    newStatus: string
  }>({ open: false, orderId: '', currentStatus: '', newStatus: '' })

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Reset page when filters change ──
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFrom, dateTo])

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', PAGE_SIZE.toString())
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const url = `/api/admin/orders?${params.toString()}`
      const res = await apiFetch(url)

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      const data: ApiResponse = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setOrders(data.items)
      setTotalItems(data.total)
      setStats(data.stats)
    } catch (err) {
      console.error('Fetch orders error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  // ── Update order status ──
  const handleUpdateStatus = async () => {
    const { orderId, newStatus } = updateDialog
    setActionLoading(orderId)
    try {
      const res = await apiFetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status')
      }

      toast.success(`Order status updated to "${newStatus}"`)

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      // Refresh stats
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status')
    } finally {
      setActionLoading(null)
      setUpdateDialog({ open: false, orderId: '', currentStatus: '', newStatus: '' })
    }
  }

  // ── Clear filters ──
  const handleClearFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || statusFilter || dateFrom || dateTo

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders & Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all orders, payments, and revenue across the platform.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-50">
                  <IndianRupee className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-50">
                  <CheckCircle className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed Orders</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.completedOrders.toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-amber-50">
                  <Clock className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Orders</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.pendingOrders.toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-gray-100">
                  <RotateCcw className="size-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Refunded Orders</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.refundedOrders.toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters Row */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, student, coupon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-50/80 border-gray-200"
                />
              </div>
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as StatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-50/80 border-gray-200">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value || '__all__'}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-gray-50/80 border-gray-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-gray-50/80 border-gray-200 text-sm"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs border-gray-200 text-gray-600 hover:text-gray-900 shrink-0"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Failed to load orders</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0">
              <RefreshCw className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders Table / Cards */}
      {!error && (
        <Card className="border-0 shadow-sm">
          <CardContent className="px-0 pb-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-gray-900">All Orders</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {loading ? 'Loading...' : `${totalItems} order${totalItems !== 1 ? 's' : ''}`}
              </span>
            </div>

            {loading ? (
              /* Loading Skeletons */
              <div className="space-y-0">
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="size-8 rounded-md" />
                    </div>
                  ))}
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden space-y-3 px-4 pb-4 pt-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-36" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : orders.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center">
                <Package className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">No orders found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Orders will appear here once students make purchases'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleClearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-muted-foreground">Order ID</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Items</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Payment</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                        <TableHead className="text-right text-xs font-medium text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const parsedItems = parseItems(order.items)
                        const primaryPayment = order.payments?.[0]

                        return (
                          <TableRow key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <TableCell>
                              <span className="text-sm font-mono text-gray-700" title={order.id}>
                                {truncateId(order.id)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{order.student.name}</p>
                                <p className="text-xs text-muted-foreground">{order.student.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {parsedItems.length > 0 ? (
                                <div className="max-w-[180px]">
                                  <p className="text-sm text-gray-700 truncate" title={parsedItems.map((i) => i.name).join(', ')}>
                                    {parsedItems[0].name}
                                  </p>
                                  {parsedItems.length > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{parsedItems.length - 1} more
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(order.finalAmount)}
                                </p>
                                {order.discountAmount > 0 && (
                                  <p className="text-xs text-emerald-600">
                                    -{formatCurrency(order.discountAmount)} off
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              {primaryPayment ? (
                                <div className="space-y-1">
                                  {getPaymentStatusBadge(primaryPayment.status)}
                                  {primaryPayment.method && (
                                    <p className="text-xs text-muted-foreground">
                                      {primaryPayment.method}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No payment</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={actionLoading === order.id}
                                  >
                                    {actionLoading === order.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="size-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => setDetailDialog({ open: true, order })}
                                  >
                                    <Eye className="mr-2 size-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setUpdateDialog({
                                        open: true,
                                        orderId: order.id,
                                        currentStatus: order.status,
                                        newStatus: '',
                                      })
                                    }
                                  >
                                    <RefreshCw className="mr-2 size-4" />
                                    Update Status
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 px-4 pb-4 pt-2">
                  {orders.map((order) => {
                    const parsedItems = parseItems(order.items)
                    const primaryPayment = order.payments?.[0]

                    return (
                      <div
                        key={order.id}
                        className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-gray-700">
                                {truncateId(order.id)}
                              </span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {order.student.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{order.student.email}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 -mr-1 shrink-0"
                                disabled={actionLoading === order.id}
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="size-3.5" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => setDetailDialog({ open: true, order })}
                              >
                                <Eye className="mr-2 size-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setUpdateDialog({
                                    open: true,
                                    orderId: order.id,
                                    currentStatus: order.status,
                                    newStatus: '',
                                  })
                                }
                              >
                                <RefreshCw className="mr-2 size-4" />
                                Update Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {parsedItems.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={parsedItems.map((i) => i.name).join(', ')}>
                              {parsedItems.map((i) => i.name).join(', ')}
                            </span>
                          )}
                        </div>

                        <Separator className="my-2.5" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.finalAmount)}
                            </span>
                            {order.discountAmount > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                -{formatCurrency(order.discountAmount)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {primaryPayment && getPaymentStatusBadge(primaryPayment.status)}
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground order-2 sm:order-1">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
                    </p>
                    <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (page === 1 || page === totalPages) return true
                          if (Math.abs(page - currentPage) <= 1) return true
                          return false
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1]
                          const showEllipsis = prevPage !== undefined && page - prevPage > 1
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="text-xs text-muted-foreground px-1">…</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="icon"
                                className={`size-8 text-xs ${
                                  currentPage === page
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                                    : ''
                                }`}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => !open && setDetailDialog({ open: false, order: null })}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Full order information and payment breakdown.
            </DialogDescription>
          </DialogHeader>
          {detailDialog.order && (() => {
            const order = detailDialog.order
            const parsedItems = parseItems(order.items)
            const primaryPayment = order.payments?.[0]

            return (
              <div className="space-y-5">
                {/* Order ID & Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="text-sm font-mono font-medium text-gray-900 break-all">{order.id}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <Separator />

                {/* Student Info */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Package className="size-3" />
                    Student Information
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Name</p>
                      <p className="text-sm font-medium text-gray-900">{order.student.name}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate" title={order.student.email}>
                        {order.student.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Package className="size-3" />
                    Items
                  </p>
                  {parsedItems.length > 0 ? (
                    <div className="space-y-1.5">
                      {parsedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <span className="text-sm text-gray-700">{item.name}</span>
                          {item.quantity && (
                            <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items data available</p>
                  )}
                </div>

                <Separator />

                {/* Amount Breakdown */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <IndianRupee className="size-3" />
                    Amount Breakdown
                  </p>
                  <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-emerald-600">-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    {order.couponCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coupon</span>
                        <span className="font-medium text-amber-600">{order.couponCode}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">Final Amount</span>
                      <span className="font-bold text-gray-900">{formatCurrency(order.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                {primaryPayment && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <CreditCard className="size-3" />
                        Payment Breakdown
                      </p>
                      <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payment Status</span>
                          {getPaymentStatusBadge(primaryPayment.status)}
                        </div>
                        {primaryPayment.method && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Method</span>
                            <span className="font-medium text-gray-900 capitalize">{primaryPayment.method}</span>
                          </div>
                        )}
                        {primaryPayment.amount != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount Paid</span>
                            <span className="font-medium text-gray-900">{formatCurrency(primaryPayment.amount)}</span>
                          </div>
                        )}
                        <Separator />
                        {primaryPayment.adminCommission != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Admin Commission</span>
                            <span className="font-medium text-amber-600">{formatCurrency(primaryPayment.adminCommission)}</span>
                          </div>
                        )}
                        {primaryPayment.teacherAmount != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Teacher Amount</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(primaryPayment.teacherAmount)}</span>
                          </div>
                        )}
                        {primaryPayment.gatewayCharge != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Gateway Charge</span>
                            <span className="font-medium text-gray-500">{formatCurrency(primaryPayment.gatewayCharge)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Dates & IDs */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Calendar className="size-3" />
                    Timeline & References
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Created</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Updated</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(order.updatedAt)}</p>
                    </div>
                    {order.razorpayOrderId && (
                      <div className="rounded-lg bg-gray-50 p-3 col-span-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Razorpay Order ID</p>
                        <p className="text-xs font-mono font-medium text-gray-900 break-all">{order.razorpayOrderId}</p>
                      </div>
                    )}
                    {order.razorpayPaymentId && (
                      <div className="rounded-lg bg-gray-50 p-3 col-span-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Razorpay Payment ID</p>
                        <p className="text-xs font-mono font-medium text-gray-900 break-all">{order.razorpayPaymentId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setDetailDialog({ open: false, order: null })
                      setUpdateDialog({
                        open: true,
                        orderId: order.id,
                        currentStatus: order.status,
                        newStatus: '',
                      })
                    }}
                  >
                    <RefreshCw className="size-3.5 mr-1.5" />
                    Update Status
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={updateDialog.open}
        onOpenChange={(open) =>
          !open && setUpdateDialog({ open: false, orderId: '', currentStatus: '', newStatus: '' })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of this order. Current status:{' '}
              <span className="font-medium">{updateDialog.currentStatus}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={updateDialog.newStatus}
                onValueChange={(val) =>
                  setUpdateDialog((prev) => ({ ...prev, newStatus: val }))
                }
              >
                <SelectTrigger className="bg-gray-50/80 border-gray-200">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {UPDATE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {updateDialog.newStatus && updateDialog.newStatus !== updateDialog.currentStatus && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">
                  You are about to change the order status from{' '}
                  <span className="font-semibold">{updateDialog.currentStatus}</span> to{' '}
                  <span className="font-semibold">{updateDialog.newStatus}</span>. This action may affect
                  revenue calculations and student access.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setUpdateDialog({ open: false, orderId: '', currentStatus: '', newStatus: '' })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!updateDialog.newStatus || updateDialog.newStatus === updateDialog.currentStatus || !!actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
