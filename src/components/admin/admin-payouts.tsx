'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Wallet,
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarDays,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
interface PayoutItem {
  id: string
  teacherId: string
  teacherName: string | null
  organizationId: string
  orgName: string
  orgCode: string
  orgAccentColor: string
  amount: number
  adminCommission: number
  gatewayCharge: number
  netAmount: number
  periodStart: string
  periodEnd: string
  status: string
  method: string
  transactionId: string | null
  note: string | null
  approvedBy: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

interface PayoutStats {
  totalPendingAmount: number
  totalPaid: number
  pendingCount: number
  thisMonthTotal: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface TeacherOption {
  id: string
  name: string
  email: string
  organizationId: string
  orgName: string
}

interface OrgOption {
  id: string
  name: string
  code: string
}

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

// ── Status badge ─────────────────────────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return (
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 border text-xs font-medium">
          <Clock className="size-3 mr-1" />
          Pending
        </Badge>
      )
    case 'approved':
      return (
        <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50 border-sky-200 border text-xs font-medium">
          <CheckCircle className="size-3 mr-1" />
          Approved
        </Badge>
      )
    case 'processing':
      return (
        <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50 border-violet-200 border text-xs font-medium">
          <RefreshCw className="size-3 mr-1" />
          Processing
        </Badge>
      )
    case 'completed':
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 border text-xs font-medium">
          <CheckCircle className="size-3 mr-1" />
          Completed
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-200 border text-xs font-medium">
          <XCircle className="size-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case 'bank_transfer': return 'Bank Transfer'
    case 'upi': return 'UPI'
    case 'razorpay': return 'Razorpay'
    default: return method
  }
}

// ── Animation variants ───────────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
}

// ── Skeleton components ──────────────────────────────────────────────────────
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

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminPayoutsPage() {
  // ── State ─────────────────────────────────────────────────────────────
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Organizations list
  const [organizations, setOrganizations] = useState<OrgOption[]>([])

  // Create payout dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [createForm, setCreateForm] = useState({
    teacherId: '',
    organizationId: '',
    amount: '',
    periodStart: '',
    periodEnd: '',
    method: 'bank_transfer',
  })
  const [creating, setCreating] = useState(false)

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null)

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Fetch payouts ─────────────────────────────────────────────────────
  const fetchPayouts = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (orgFilter && orgFilter !== 'all') params.set('organizationId', orgFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await apiFetch(`/api/admin/payouts?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch payouts')

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Invalid response')

      setPayouts(json.payouts)
      setStats(json.stats)
      setPagination(json.pagination)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, orgFilter, dateFrom, dateTo])

  // ── Fetch organizations ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await apiFetch('/api/admin/organizations')
        if (res.ok) {
          const json = await res.json()
          if (json.organizations) {
            setOrganizations(json.organizations.map((o: any) => ({ id: o.id, name: o.name, code: o.code })))
          }
        }
      } catch {
        // Ignore — will just have empty org list
      }
    }
    fetchOrgs()
  }, [])

  // ── Fetch teachers for create dialog ──────────────────────────────────
  useEffect(() => {
    if (!createDialogOpen) return
    async function fetchTeachers() {
      try {
        const res = await apiFetch('/api/admin/teachers')
        if (res.ok) {
          const json = await res.json()
          if (json.teachers) {
            setTeachers(
              json.teachers.map((t: any) => ({
                id: t.id,
                name: t.name,
                email: t.email,
                organizationId: t.organizationId,
                orgName: t.organization?.name ?? 'Unknown',
              }))
            )
          }
        }
      } catch {
        // Ignore
      }
    }
    fetchTeachers()
  }, [createDialogOpen])

  // ── Initial fetch + refetch on filter change ──────────────────────────
  useEffect(() => {
    fetchPayouts(1)
  }, [fetchPayouts])

  // ── Create payout ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.teacherId || !createForm.amount || !createForm.periodStart || !createForm.periodEnd) {
      toast.error('Please fill all required fields.')
      return
    }

    setCreating(true)
    try {
      // Find teacher to get orgId
      const teacher = teachers.find((t) => t.id === createForm.teacherId)
      const orgId = createForm.organizationId || teacher?.organizationId

      if (!orgId) {
        toast.error('Could not determine organization for this teacher.')
        setCreating(false)
        return
      }

      const res = await apiFetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: createForm.teacherId,
          organizationId: orgId,
          amount: parseFloat(createForm.amount),
          periodStart: createForm.periodStart,
          periodEnd: createForm.periodEnd,
          method: createForm.method,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create payout')
      }

      toast.success('Payout created successfully!')
      setCreateDialogOpen(false)
      setCreateForm({ teacherId: '', organizationId: '', amount: '', periodStart: '', periodEnd: '', method: 'bank_transfer' })
      fetchPayouts(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create payout')
    } finally {
      setCreating(false)
    }
  }

  // ── Update payout status ──────────────────────────────────────────────
  const handleStatusUpdate = async (payoutId: string, newStatus: string, note?: string) => {
    setActionLoading(payoutId + newStatus)
    try {
      const res = await apiFetch('/api/admin/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payoutId, status: newStatus, note }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update payout')
      }

      toast.success(`Payout ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'marked as paid'} successfully!`)
      fetchPayouts(pagination.page)

      if (selectedPayout?.id === payoutId) {
        setSelectedPayout(json.payout)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payout')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Open detail dialog ────────────────────────────────────────────────
  const openDetail = (payout: PayoutItem) => {
    setSelectedPayout(payout)
    setDetailDialogOpen(true)
  }

  // ── Full error state ──────────────────────────────────────────────────
  if (error && !loading && payouts.length === 0 && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage teacher payouts and payments</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="size-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Failed to load data</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchPayouts(1)}>
              <RefreshCw className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage teacher payouts and payments</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              <Plus className="size-4 mr-1.5" />
              Create Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Payout</DialogTitle>
              <DialogDescription>Generate a payout for a teacher. Commission and gateway charges will be calculated automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Teacher select */}
              <div className="space-y-2">
                <Label htmlFor="teacher" className="text-sm font-medium">Teacher *</Label>
                <Select
                  value={createForm.teacherId}
                  onValueChange={(val) => {
                    const t = teachers.find((x) => x.id === val)
                    setCreateForm((f) => ({
                      ...f,
                      teacherId: val,
                      organizationId: t?.organizationId || '',
                    }))
                  }}
                >
                  <SelectTrigger id="teacher">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.orgName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Gross Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart" className="text-sm font-medium">Period Start *</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={createForm.periodStart}
                    onChange={(e) => setCreateForm((f) => ({ ...f, periodStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd" className="text-sm font-medium">Period End *</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={createForm.periodEnd}
                    onChange={(e) => setCreateForm((f) => ({ ...f, periodEnd: e.target.value }))}
                  />
                </div>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label htmlFor="method" className="text-sm font-medium">Payment Method</Label>
                <Select
                  value={createForm.method}
                  onValueChange={(val) => setCreateForm((f) => ({ ...f, method: val }))}
                >
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleCreate}
                disabled={creating || !createForm.teacherId || !createForm.amount || !createForm.periodStart || !createForm.periodEnd}
              >
                {creating ? (
                  <>
                    <RefreshCw className="size-4 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Payout'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {/* Pending Amount */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-amber-50">
                      <Clock className="size-5 text-amber-600" />
                    </div>
                    <Badge className="bg-amber-50 text-amber-700 border-0 text-xs font-semibold">
                      Pending
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalPendingAmount ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pending Amount</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Paid */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-50">
                      <CheckCircle className="size-5 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs font-semibold">
                      Paid
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalPaid ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Paid</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Payouts Count */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-red-50">
                      <IndianRupee className="size-5 text-red-500" />
                    </div>
                    <Badge className="bg-red-50 text-red-600 border-0 text-xs font-semibold">
                      Action
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.pendingCount ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pending Payouts</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* This Month Total */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-violet-50">
                      <TrendingUp className="size-5 text-violet-600" />
                    </div>
                    <Badge className="bg-violet-50 text-violet-700 border-0 text-xs font-semibold">
                      Month
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.thisMonthTotal ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">This Month Total</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              {/* Status filter */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization filter */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Organization</Label>
                <Select value={orgFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-sm w-full sm:w-[150px]"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-sm w-full sm:w-[150px]"
                />
              </div>

              {/* Clear filters */}
              {(statusFilter !== 'all' || orgFilter !== 'all' || dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground"
                  onClick={() => {
                    setStatusFilter('all')
                    setOrgFilter('all')
                    setDateFrom('')
                    setDateTo('')
                  }}
                >
                  <XCircle className="size-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Payouts Table ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        {loading ? (
          <TableSkeleton />
        ) : payouts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Wallet className="size-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No payouts found</p>
              <p className="text-xs text-muted-foreground">
                {statusFilter !== 'all' || orgFilter !== 'all' || dateFrom || dateTo
                  ? 'Try adjusting the filters to find payouts.'
                  : 'Create your first payout to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="border-0 shadow-sm hidden lg:block">
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-muted-foreground">Teacher</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Organization</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Net Amount</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Period</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Method</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {payouts.map((payout) => (
                          <motion.tr
                            key={payout.id}
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="border-b border-gray-50 hover:bg-gray-50/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-8 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold shrink-0">
                                  {payout.teacherName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {payout.teacherName || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {payout.teacherId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: payout.orgAccentColor || '#D97706' }}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-700 truncate">{payout.orgName}</p>
                                  <p className="text-xs text-muted-foreground">{payout.orgCode}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatFullCurrency(payout.amount)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold text-emerald-700">
                                {formatFullCurrency(payout.netAmount)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <CalendarDays className="size-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(payout.status)}</TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-600">{getMethodLabel(payout.method)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => openDetail(payout)}
                                >
                                  <Eye className="size-3 mr-1" />
                                  View
                                </Button>
                                {payout.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                      disabled={!!actionLoading}
                                      onClick={() => handleStatusUpdate(payout.id, 'approved')}
                                    >
                                      {actionLoading === payout.id + 'approved' ? (
                                        <RefreshCw className="size-3 animate-spin" />
                                      ) : (
                                        <CheckCircle className="size-3 mr-0.5" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                      disabled={!!actionLoading}
                                      onClick={() => handleStatusUpdate(payout.id, 'rejected')}
                                    >
                                      {actionLoading === payout.id + 'rejected' ? (
                                        <RefreshCw className="size-3 animate-spin" />
                                      ) : (
                                        <XCircle className="size-3 mr-0.5" />
                                      )}
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {payout.status === 'approved' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    disabled={!!actionLoading}
                                    onClick={() => handleStatusUpdate(payout.id, 'completed')}
                                  >
                                    {actionLoading === payout.id + 'completed' ? (
                                      <RefreshCw className="size-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="size-3 mr-0.5" />
                                    )}
                                    Mark Paid
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile / Tablet Cards */}
            <div className="lg:hidden space-y-3">
              <AnimatePresence mode="popLayout">
                {payouts.map((payout) => (
                  <motion.div
                    key={payout.id}
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center size-9 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold shrink-0">
                              {payout.teacherName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {payout.teacherName || 'Unknown'}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: payout.orgAccentColor || '#D97706' }}
                                />
                                <span className="text-xs text-muted-foreground truncate">{payout.orgName}</span>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(payout.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Gross Amount</p>
                            <p className="text-sm font-semibold text-gray-900">{formatFullCurrency(payout.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Net Amount</p>
                            <p className="text-sm font-semibold text-emerald-700">{formatFullCurrency(payout.netAmount)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" />
                          {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
                          <span className="mx-1">·</span>
                          {getMethodLabel(payout.method)}
                        </div>

                        <Separator className="mb-3" />

                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => openDetail(payout)}
                          >
                            <Eye className="size-3 mr-1" />
                            Details
                          </Button>
                          {payout.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs text-sky-600 border-sky-200 hover:bg-sky-50"
                                disabled={!!actionLoading}
                                onClick={() => handleStatusUpdate(payout.id, 'approved')}
                              >
                                <CheckCircle className="size-3 mr-0.5" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs text-red-500 border-red-200 hover:bg-red-50"
                                disabled={!!actionLoading}
                                onClick={() => handleStatusUpdate(payout.id, 'rejected')}
                              >
                                <XCircle className="size-3 mr-0.5" />
                                Reject
                              </Button>
                            </>
                          )}
                          {payout.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              disabled={!!actionLoading}
                              onClick={() => handleStatusUpdate(payout.id, 'completed')}
                            >
                              <CheckCircle className="size-3 mr-0.5" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── Pagination ────────────────────────────────────────────────── */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} payouts
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchPayouts(pagination.page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${
                          pageNum === pagination.page ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
                        }`}
                        disabled={loading}
                        onClick={() => fetchPayouts(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => fetchPayouts(pagination.page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Payout Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-amber-600" />
              Payout Details
            </DialogTitle>
            <DialogDescription>
              Complete breakdown for this payout record.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-2">
              {/* Teacher & Org */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Teacher</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPayout.teacherName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedPayout.orgAccentColor || '#D97706' }}
                    />
                    <p className="text-sm font-medium text-gray-900">{selectedPayout.orgName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Amount Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gross Amount</span>
                  <span className="text-sm font-semibold text-gray-900">{formatFullCurrency(selectedPayout.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-600 flex items-center gap-1">
                    <IndianRupee className="size-3" />
                    Admin Commission
                  </span>
                  <span className="text-sm font-medium text-amber-700">- {formatFullCurrency(selectedPayout.adminCommission)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-sky-600">Gateway Charge</span>
                  <span className="text-sm font-medium text-sky-700">- {formatFullCurrency(selectedPayout.gatewayCharge)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Net Amount</span>
                  <span className="text-lg font-bold text-emerald-700">{formatFullCurrency(selectedPayout.netAmount)}</span>
                </div>
              </div>

              <Separator />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="text-sm text-gray-700">
                    {formatDate(selectedPayout.periodStart)} – {formatDate(selectedPayout.periodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-0.5">{getStatusBadge(selectedPayout.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="text-sm text-gray-700">{getMethodLabel(selectedPayout.method)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm text-gray-700">{formatDateTime(selectedPayout.createdAt)}</p>
                </div>
                {selectedPayout.transactionId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="text-sm text-gray-700 font-mono">{selectedPayout.transactionId}</p>
                  </div>
                )}
                {selectedPayout.approvedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Approved At</p>
                    <p className="text-sm text-gray-700">{formatDateTime(selectedPayout.approvedAt)}</p>
                  </div>
                )}
                {selectedPayout.paidAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Paid At</p>
                    <p className="text-sm text-gray-700">{formatDateTime(selectedPayout.paidAt)}</p>
                  </div>
                )}
                {selectedPayout.note && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Note</p>
                    <p className="text-sm text-gray-700">{selectedPayout.note}</p>
                  </div>
                )}
              </div>

              {/* Actions in dialog */}
              {(selectedPayout.status === 'pending' || selectedPayout.status === 'approved') && (
                <>
                  <Separator />
                  <div className="flex items-center justify-end gap-2">
                    {selectedPayout.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          disabled={!!actionLoading}
                          onClick={() => {
                            handleStatusUpdate(selectedPayout.id, 'rejected')
                            setDetailDialogOpen(false)
                          }}
                        >
                          {actionLoading === selectedPayout.id + 'rejected' ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            <XCircle className="size-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-sky-600 hover:bg-sky-700 text-white"
                          disabled={!!actionLoading}
                          onClick={() => {
                            handleStatusUpdate(selectedPayout.id, 'approved')
                            setDetailDialogOpen(false)
                          }}
                        >
                          {actionLoading === selectedPayout.id + 'approved' ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle className="size-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </>
                    )}
                    {selectedPayout.status === 'approved' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={!!actionLoading}
                        onClick={() => {
                          handleStatusUpdate(selectedPayout.id, 'completed')
                          setDetailDialogOpen(false)
                        }}
                      >
                        {actionLoading === selectedPayout.id + 'completed' ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle className="size-4 mr-1" />
                        )}
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
