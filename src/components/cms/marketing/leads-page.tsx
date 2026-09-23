'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Search,
  Mail,
  Phone,
  Globe,
  AlertCircle,
  RefreshCw,
  Loader2,
  MoreHorizontal,
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

// ─── Types ────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  status: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 hover:bg-blue-50',
  contacted: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  qualified: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  lost: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  lost: 'Lost',
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  website: Globe,
  referral: Users,
  social_media: Users,
  ad_campaign: Mail,
}

// ─── Component ────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { orgCode } = useAppStore()

  // Data
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadSource, setLeadSource] = useState('website')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // ─── Fetch ────────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/leads?organizationId=${orgCode}&limit=100`)
      const data = await res.json()
      if (data.items) {
        setLeads(data.items)
      } else {
        setError(data.error || 'Failed to load leads')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // ─── Stats ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = leads.length
    const newLeads = leads.filter((l) => l.status === 'new').length
    const contacted = leads.filter((l) => l.status === 'contacted').length
    const qualified = leads.filter((l) => l.status === 'qualified').length
    const lost = leads.filter((l) => l.status === 'lost').length
    return { total, new: newLeads, contacted, qualified, lost }
  }, [leads])

  // ─── Filtered leads ──────────────────────────────────────────────────

  const filteredLeads = useMemo(() => {
    let result = leads
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }
    if (searchDebounced) {
      const q = searchDebounced.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q))
      )
    }
    return result
  }, [leads, statusFilter, searchDebounced])

  // ─── Add lead ─────────────────────────────────────────────────────────

  const handleAddLead = async () => {
    if (!leadName.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim() || null,
          phone: leadPhone.trim() || null,
          source: leadSource,
          organizationId: orgCode,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Lead added successfully')
        setDrawerOpen(false)
        setLeadName('')
        setLeadEmail('')
        setLeadPhone('')
        setLeadSource('website')
        fetchLeads()
      } else {
        toast.error(data.error || 'Failed to add lead')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Update status ───────────────────────────────────────────────────

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      const res = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Status updated')
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)))
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!leadToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/leads/${leadToDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Lead deleted')
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id))
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setLeadToDelete(null)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  const renderError = (message: string, onRetry: () => void) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="size-5 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-900">Something went wrong</p>
      <p className="text-xs text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        <RefreshCw className="size-3.5 mr-1.5" /> Try Again
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your sales leads
          </p>
        </div>
        <Button
          onClick={() => {
            setLeadName('')
            setLeadEmail('')
            setLeadPhone('')
            setLeadSource('website')
            setDrawerOpen(true)
          }}
          className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white"
        >
          <Plus className="size-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-gray-100">
                <Users className="size-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-blue-50">
                <UserPlus className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New</p>
                <p className="text-lg font-bold text-gray-900">{stats.new}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
                <Phone className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contacted</p>
                <p className="text-lg font-bold text-gray-900">{stats.contacted}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
                <UserCheck className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qualified</p>
                <p className="text-lg font-bold text-gray-900">{stats.qualified}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-gray-100">
                <UserX className="size-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lost</p>
                <p className="text-lg font-bold text-gray-900">{stats.lost}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            renderError(error, fetchLeads)
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {search || statusFilter !== 'all' ? 'No leads found' : 'No leads yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Add your first lead to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const SourceIcon = (lead.source ? SOURCE_ICONS[lead.source] : null) || Globe
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                                {lead.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{lead.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {lead.email || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {lead.phone || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <SourceIcon className="size-3.5" />
                            {lead.source
                              ? lead.source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                              : '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="focus:outline-none" onClick={(e) => e.stopPropagation()}>
                                <Badge
                                  variant="secondary"
                                  className={`cursor-pointer ${LEAD_STATUS_COLORS[lead.status] || LEAD_STATUS_COLORS.new}`}
                                >
                                  {LEAD_STATUS_LABEL[lead.status] || lead.status} ▾
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {['new', 'contacted', 'qualified', 'lost'].map((s) => (
                                <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(lead.id, s)}>
                                  {LEAD_STATUS_LABEL[s]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-8 p-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {lead.email && (
                                <DropdownMenuItem>
                                  <Mail className="size-4 mr-2" /> Email
                                </DropdownMenuItem>
                              )}
                              {lead.phone && (
                                <DropdownMenuItem>
                                  <Phone className="size-4 mr-2" /> Call
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setLeadToDelete(lead)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-4 mr-2" /> Delete
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
          )}
        </CardContent>
      </Card>

      {/* ─── Add Lead Drawer ───────────────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Lead</SheetTitle>
            <SheetDescription>Add a new lead to your pipeline</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="email@example.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="+91 9876543210" type="tel" />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={leadSource} onValueChange={setLeadSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="ad_campaign">Ad Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-black hover:bg-gray-800 text-white" onClick={handleAddLead} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                Add Lead
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{leadToDelete?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
