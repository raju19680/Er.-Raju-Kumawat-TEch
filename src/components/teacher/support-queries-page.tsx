'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
  MoreHorizontal,
  Trash2,
  LifeBuoy,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Mail,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────
interface SupportQuery {
  id: string
  subject: string
  message: string
  status: string
  studentName: string | null
  studentEmail: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

// ── Status Badge ─────────────────────────────────────────────────────────
function QueryStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'open':
      return <Badge className="bg-red-50 text-red-700 border-red-200">Open</Badge>
    case 'in_progress':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>
    case 'resolved':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>
    case 'closed':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Closed</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{status}</Badge>
  }
}

// ── Status Icon ──────────────────────────────────────────────────────────
function QueryStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'open':
      return <AlertCircle className="size-4 text-red-500" />
    case 'in_progress':
      return <Clock className="size-4 text-amber-500" />
    case 'resolved':
      return <CheckCircle2 className="size-4 text-emerald-500" />
    case 'closed':
      return <XCircle className="size-4 text-gray-500" />
    default:
      return <AlertCircle className="size-4 text-gray-500" />
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SUPPORT QUERIES PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function SupportQueriesPage() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<SupportQuery[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsPerPage = 10

  // Stats
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 })

  // View Detail Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<SupportQuery | null>(null)
  const [responseText, setResponseText] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<SupportQuery | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        organizationId: orgCode,
        page: String(currentPageNum),
        limit: String(itemsPerPage),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await apiFetch(`/api/support-queries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalItems(data.total || 0)
      }

      // Fetch stats
      const statsParams = new URLSearchParams({
        organizationId: orgCode,
        page: '1',
        limit: '1000',
      })
      const statsRes = await apiFetch(`/api/support-queries?${statsParams}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const allItems: SupportQuery[] = statsData.items || []
        setStats({
          total: statsData.total || allItems.length,
          open: allItems.filter((i: SupportQuery) => i.status === 'open').length,
          inProgress: allItems.filter((i: SupportQuery) => i.status === 'in_progress').length,
          resolved: allItems.filter((i: SupportQuery) => i.status === 'resolved').length,
        })
      }
    } catch {
      toast.error('Failed to load support queries')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openViewDialog = (item: SupportQuery) => {
    setViewingItem(item)
    setResponseText('')
    setViewDialogOpen(true)
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!viewingItem) return
    setUpdatingStatus(true)
    try {
      const res = await apiFetch(`/api/support-queries/${viewingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update status')
        return
      }
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      setViewingItem({ ...viewingItem, status: newStatus })
      fetchItems()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/support-queries/${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Support query deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete support query')
    } finally {
      setDeleting(false)
    }
  }

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case 'open': return 'in_progress'
      case 'in_progress': return 'resolved'
      case 'resolved': return 'closed'
      default: return null
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Queries',
      value: stats.total,
      icon: LifeBuoy,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Open',
      value: stats.open,
      icon: AlertCircle,
      accentBg: 'bg-red-50',
      accentIcon: 'text-red-600',
      accentBorder: 'border-l-red-500',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle2,
      accentBg: 'bg-emerald-50',
      accentIcon: 'text-emerald-600',
      accentBorder: 'border-l-emerald-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Support Queries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage student support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={`min-w-0 rounded-xl border-l-4 ${stat.accentBorder} bg-white shadow-sm`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.title}</p>
                    <div className="text-xl font-bold tracking-tight sm:text-2xl">
                      {loading ? <Skeleton className="h-7 w-12" /> : stat.value}
                    </div>
                  </div>
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${stat.accentBg}`}>
                    <Icon className={`size-5 ${stat.accentIcon}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, student name, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPageNum(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val)
            setCurrentPageNum(1)
          }}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Student Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <LifeBuoy className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No support queries found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Support queries will appear here when students submit them'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id} className="group hover:bg-gray-50">
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QueryStatusIcon status={item.status} />
                      <span className="font-medium text-sm truncate max-w-[200px]">{item.subject}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.studentName || <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.studentEmail || <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <QueryStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openViewDialog(item)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setItemToDelete(item)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showing X to Y of Z */}
      {!loading && totalItems > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPageNum - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} entries
          </p>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))}
                    className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPageNum <= 3) {
                    page = i + 1
                  } else if (currentPageNum >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPageNum - 2 + i
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPageNum}
                        onClick={() => setCurrentPageNum(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))}
                    className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Support Query Details</DialogTitle>
            <DialogDescription>View and respond to this support request</DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              {/* Subject & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold truncate">{viewingItem.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {new Date(viewingItem.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <QueryStatusBadge status={viewingItem.status} />
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewingItem.studentName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <User className="size-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="text-sm font-medium">{viewingItem.studentName}</p>
                    </div>
                  </div>
                )}
                {viewingItem.studentEmail && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Mail className="size-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{viewingItem.studentEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="rounded-lg border p-4 bg-gray-50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Message</p>
                <p className="text-sm whitespace-pre-wrap">{viewingItem.message}</p>
              </div>

              {/* Response Area */}
              <div className="grid gap-2">
                <Label htmlFor="response-text">Response / Notes</Label>
                <Textarea
                  id="response-text"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response or internal notes..."
                  rows={4}
                />
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-sm font-medium">Update Status:</span>
                <div className="flex gap-2 flex-wrap">
                  {getNextStatus(viewingItem.status) && (
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleUpdateStatus(getNextStatus(viewingItem.status)!)}
                      disabled={updatingStatus}
                    >
                      {updatingStatus && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Mark as {getNextStatus(viewingItem.status)?.replace('_', ' ')}
                    </Button>
                  )}
                  {viewingItem.status !== 'closed' && viewingItem.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={updatingStatus}
                    >
                      Resolve
                    </Button>
                  )}
                  {viewingItem.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus('closed')}
                      disabled={updatingStatus}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Support Query</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this support query? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Query'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
