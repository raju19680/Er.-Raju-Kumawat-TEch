'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  MessageSquare,
  Share2,
  Megaphone,
  MoreHorizontal,
  LayoutGrid,
  List,
  TrendingUp,
  Pencil,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost'
type LeadSource = 'website' | 'whatsapp' | 'referral' | 'ads' | 'other'
type ViewMode = 'kanban' | 'table'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: LeadSource
  status: LeadStatus
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bgColor: string; headerBg: string }
> = {
  new: {
    label: 'New',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 text-blue-700 hover:bg-blue-50',
    headerBg: 'bg-blue-500',
  },
  contacted: {
    label: 'Contacted',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
    headerBg: 'bg-amber-500',
  },
  qualified: {
    label: 'Qualified',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
    headerBg: 'bg-emerald-500',
  },
  lost: {
    label: 'Lost',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
    headerBg: 'bg-gray-400',
  },
}

const SOURCE_CONFIG: Record<LeadSource, { label: string; icon: React.ElementType }> = {
  website: { label: 'Website', icon: Globe },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  referral: { label: 'Referral', icon: Share2 },
  ads: { label: 'Ads', icon: Megaphone },
  other: { label: 'Other', icon: Users },
}

const COLUMNS: LeadStatus[] = ['new', 'contacted', 'qualified', 'lost']

// ─── API data mapper ─────────────────────────────────────────────────────

function mapApiLead(apiItem: Record<string, unknown>): Lead {
  return {
    id: apiItem.id as string,
    name: apiItem.name as string,
    email: (apiItem.email as string) || null,
    phone: (apiItem.phone as string) || null,
    source: (apiItem.source as LeadSource) || 'other',
    status: (apiItem.status as LeadStatus) || 'new',
    createdAt: apiItem.createdAt as string,
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { orgCode, userRole } = useAppStore()
  const orgAccent = '#f59e0b'

  // Data state
  const [leads, setLeads] = useState<Lead[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [loading, setLoading] = useState(true)

  // Search & filter
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formSource, setFormSource] = useState<LeadSource>('website')
  const [formStatus, setFormStatus] = useState<LeadStatus>('new')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)

  // ─── Fetch leads ────────────────────────────────────────────────────────

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/leads?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        setLeads(data.items.map(mapApiLead))
      }
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgCode) fetchLeads()
  }, [orgCode])

  // ─── Computed ─────────────────────────────────────────────────────────

  const filteredLeads = useMemo(() => {
    let result = leads
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }
    if (sourceFilter !== 'all') {
      result = result.filter((l) => l.source === sourceFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q))
      )
    }
    return result
  }, [leads, statusFilter, sourceFilter, search])

  const stats = useMemo(() => {
    const total = leads.length
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newThisWeek = leads.filter(
      (l) => l.status === 'new' && new Date(l.createdAt) >= oneWeekAgo
    ).length
    const qualified = leads.filter((l) => l.status === 'qualified').length
    const newTotal = leads.filter((l) => l.status === 'new').length
    const conversionRate =
      total > 0 ? Math.round((qualified / total) * 100) : 0
    const lost = leads.filter((l) => l.status === 'lost').length
    return { total, newThisWeek, conversionRate, lost }
  }, [leads])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setFormSource('website')
    setFormStatus('new')
  }

  const openAddDialog = () => {
    setEditLead(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (lead: Lead) => {
    setEditLead(lead)
    setFormName(lead.name)
    setFormEmail(lead.email || '')
    setFormPhone(lead.phone || '')
    setFormSource(lead.source)
    setFormStatus(lead.status)
    setDialogOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)

    try {
      if (editLead) {
        const response = await apiFetch(`/api/leads/${editLead.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
            source: formSource,
            status: formStatus,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          setLeads((prev) =>
            prev.map((l) => (l.id === editLead.id ? mapApiLead(data.item as Record<string, unknown>) : l))
          )
          toast.success('Lead updated')
        } else {
          toast.error(data.error || 'Failed to update lead')
        }
      } else {
        const response = await apiFetch('/api/leads', {
          method: 'POST',
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
            source: formSource,
            status: formStatus,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          setLeads((prev) => [mapApiLead(data.item as Record<string, unknown>), ...prev])
          toast.success('Lead added')
        } else {
          toast.error(data.error || 'Failed to create lead')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Status change ───────────────────────────────────────────────────

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )
    toast.success(`Lead moved to ${STATUS_CONFIG[newStatus].label}`)
    try {
      await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, organizationId: orgCode }),
      })
    } catch {
      // Silently fail - UI is already updated
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!leadToDelete) return
    try {
      const response = await apiFetch(`/api/leads/${leadToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id))
        toast.success('Lead deleted')
      } else {
        toast.error(data.error || 'Failed to delete lead')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeleteDialogOpen(false)
      setLeadToDelete(null)
    }
  }

  // ─── Get initials ─────────────────────────────────────────────────────

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  // ─── Format date ──────────────────────────────────────────────────────

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  // ─── Kanban Card ─────────────────────────────────────────────────────

  const renderKanbanCard = (lead: Lead) => {
    const SourceIcon = SOURCE_CONFIG[lead.source]?.icon || Users
    return (
      <Card
        key={lead.id}
        className="rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => openEditDialog(lead)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback
                className="bg-gray-100 text-gray-600 text-xs font-medium"
              >
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {lead.name}
              </p>
              {lead.email && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
                  <Mail className="size-2.5" /> {lead.email}
                </p>
              )}
              {lead.phone && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
                  <Phone className="size-2.5" /> {lead.phone}
                </p>
              )}
            </div>
            {/* Quick actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(lead) }}>
                  <Pencil className="size-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                {COLUMNS.filter((s) => s !== lead.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(lead.id, s)
                    }}
                  >
                    <ArrowRight className="size-3.5 mr-2" /> Move to {STATUS_CONFIG[s].label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLeadToDelete(lead)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="size-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bottom row: source + date */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <SourceIcon className="size-3" />
              {SOURCE_CONFIG[lead.source]?.label || 'Other'}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(lead.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Kanban View ─────────────────────────────────────────────────────

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((status) => {
        const config = STATUS_CONFIG[status]
        const columnLeads = filteredLeads.filter((l) => l.status === status)
        return (
          <div key={status} className="flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`size-2.5 rounded-full ${config.headerBg}`} />
              <h3 className="text-sm font-semibold text-gray-900">{config.label}</h3>
              <Badge
                variant="secondary"
                className={`text-xs ml-auto ${config.bgColor}`}
              >
                {columnLeads.length}
              </Badge>
            </div>

            {/* Column body */}
            <div className="flex-1 bg-muted/20 rounded-xl p-2 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
              {columnLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-muted-foreground">No leads</p>
                </div>
              ) : (
                columnLeads.map((lead) => renderKanbanCard(lead))
              )}

              {/* Quick add button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30"
                onClick={() => {
                  setFormStatus(status)
                  setEditLead(null)
                  setFormName('')
                  setFormEmail('')
                  setFormPhone('')
                  setFormSource('website')
                  setDialogOpen(true)
                }}
              >
                <Plus className="size-3 mr-1" /> Add
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )

  // ─── Table View ──────────────────────────────────────────────────────

  const renderTableView = () => (
    <Card className="rounded-xl">
      <CardContent className="p-0">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="size-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${orgAccent}15` }}
            >
              <Users className="size-6" style={{ color: orgAccent }} />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {search || sourceFilter !== 'all' || statusFilter !== 'all'
                ? 'No leads found'
                : 'No leads yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || sourceFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first lead to get started'}
            </p>
            {!search && sourceFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={openAddDialog}
                className="mt-4 text-white"
                size="sm"
                style={{ backgroundColor: orgAccent }}
              >
                <Plus className="size-4 mr-2" /> Add Lead
              </Button>
            )}
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
                  const SourceIcon = SOURCE_CONFIG[lead.source]?.icon || Users
                  const statusConfig = STATUS_CONFIG[lead.status]
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                              {getInitials(lead.name)}
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
                          <span className="hidden sm:inline">
                            {SOURCE_CONFIG[lead.source]?.label || 'Other'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="focus:outline-none" onClick={(e) => e.stopPropagation()}>
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer ${statusConfig.bgColor}`}
                              >
                                {statusConfig.label} ▾
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {COLUMNS.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusChange(lead.id, s)}
                              >
                                {STATUS_CONFIG[s].label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-8 p-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                              <Pencil className="size-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            {lead.email && (
                              <DropdownMenuItem>
                                <Mail className="size-3.5 mr-2" /> Send Email
                              </DropdownMenuItem>
                            )}
                            {lead.phone && (
                              <DropdownMenuItem>
                                <Phone className="size-3.5 mr-2" /> Call
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setLeadToDelete(lead)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="size-3.5 mr-2" /> Delete
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
  )

  // ─── Main Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="size-6" style={{ color: orgAccent }} />
            Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your sales pipeline
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="w-full sm:w-auto text-white"
          style={{ backgroundColor: orgAccent }}
        >
          <Plus className="size-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className="flex items-center justify-center size-9 rounded-full"
              style={{ backgroundColor: `${orgAccent}15` }}
            >
              <Users className="size-4" style={{ color: orgAccent }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
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
              <p className="text-xs text-muted-foreground">New This Week</p>
              <p className="text-lg font-bold text-gray-900">{stats.newThisWeek}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
              <p className="text-lg font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
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

      {/* Search, Filters & View Toggle */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-lg">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(SOURCE_CONFIG).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {COLUMNS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-9 w-9 p-0"
                onClick={() => setViewMode('kanban')}
                style={viewMode === 'kanban' ? { backgroundColor: orgAccent } : {}}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-9 w-9 p-0"
                onClick={() => setViewMode('table')}
                style={viewMode === 'table' ? { backgroundColor: orgAccent } : {}}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex items-center justify-center">
              <span className="size-6 animate-spin inline-block border-2 border-gray-300 border-t-gray-900 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? renderKanbanView() : renderTableView()}

      {/* ─── Add/Edit Lead Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editLead ? 'Edit Lead' : 'Add Lead'}
            </DialogTitle>
            <DialogDescription>
              {editLead
                ? 'Update lead information'
                : 'Add a new lead to your pipeline'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  type="tel"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={formSource} onValueChange={(v) => setFormSource(v as LeadSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as LeadStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="text-white"
              style={{ backgroundColor: orgAccent }}
            >
              {saving && <span className="size-4 animate-spin mr-2 inline-block border-2 border-white border-t-transparent rounded-full" />}
              {editLead ? 'Update' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{leadToDelete?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
