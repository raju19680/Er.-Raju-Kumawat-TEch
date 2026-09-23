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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserSearch,
  UserPlus,
  Phone,
  PhoneCall,
  Mail,
  MessageCircle,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────
interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  status: string
  notes: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface LeadForm {
  name: string
  email: string
  phone: string
  source: string
  status: string
  notes: string
}

const emptyForm: LeadForm = {
  name: '',
  email: '',
  phone: '',
  source: '',
  status: 'new',
  notes: '',
}

// ── Status Badge ─────────────────────────────────────────────────────────
function LeadStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'new':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>
    case 'contacted':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Contacted</Badge>
    case 'qualified':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Qualified</Badge>
    case 'lost':
      return <Badge className="bg-red-50 text-red-700 border-red-200">Lost</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{status}</Badge>
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LEADS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function LeadsPage() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<Lead[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsPerPage = 10

  // Stats
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, qualified: 0 })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Lead | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Lead | null>(null)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [selectedLeadForWhatsapp, setSelectedLeadForWhatsapp] = useState<Lead | null>(null)
  const [customWhatsappMessage, setCustomWhatsappMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('admission')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState<LeadForm>(emptyForm)

  const openWhatsappOutreach = (lead: Lead) => {
    setSelectedLeadForWhatsapp(lead)
    const templates: Record<string, string> = {
      admission: `Hello ${lead.name}! 🎓 New batch admissions are now open at Er. Raju Kumawat Tech. Reply to this message to claim your exclusive student discount coupon code!`,
      mocktest: `Hello ${lead.name}! 📚 CBT Mock Test Series for competitive exams is now live on our student portal. Check your rank & preparation today!`,
      followup: `Hello ${lead.name}! 👋 Following up on your course inquiry. Let us know if you would like syllabus details, demo videos, or doubt session access.`,
    }
    setCustomWhatsappMessage(templates.admission)
    setSelectedTemplate('admission')
    setWhatsappDialogOpen(true)
  }

  const handleSendWhatsapp = () => {
    if (!selectedLeadForWhatsapp?.phone) {
      toast.error('Lead phone number is missing')
      return
    }
    let cleanPhone = selectedLeadForWhatsapp.phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWhatsappMessage)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setWhatsappDialogOpen(false)
    toast.success('WhatsApp chat opened!')
  }

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

      const res = await apiFetch(`/api/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalItems(data.total || 0)
      }

      // Fetch stats (all leads without filters)
      const statsParams = new URLSearchParams({
        organizationId: orgCode,
        page: '1',
        limit: '1000',
      })
      const statsRes = await apiFetch(`/api/leads?${statsParams}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const allItems: Lead[] = statsData.items || []
        setStats({
          total: statsData.total || allItems.length,
          new: allItems.filter((i: Lead) => i.status === 'new').length,
          contacted: allItems.filter((i: Lead) => i.status === 'contacted').length,
          qualified: allItems.filter((i: Lead) => i.status === 'qualified').length,
        })
      }
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter, orgCode])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: Lead) => {
    setEditingItem(item)
    setForm({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      source: item.source || '',
      status: item.status || 'new',
      notes: item.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        const res = await apiFetch(`/api/leads/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            source: form.source || null,
            status: form.status,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to update lead')
          return
        }
        toast.success('Lead updated successfully')
      } else {
        const res = await apiFetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            source: form.source || null,
            status: form.status,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to create lead')
          return
        }
        toast.success('Lead created successfully')
      }
      setDialogOpen(false)
      setEditingItem(null)
      fetchItems()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/leads/${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Lead deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.total,
      icon: UserSearch,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'New',
      value: stats.new,
      icon: UserPlus,
      accentBg: 'bg-blue-50',
      accentIcon: 'text-blue-600',
      accentBorder: 'border-l-blue-500',
    },
    {
      title: 'Contacted',
      value: stats.contacted,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
      icon: Phone,
    },
    {
      title: 'Qualified',
      value: stats.qualified,
      icon: Mail,
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage potential students</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
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
            placeholder="Search by name, email, phone..."
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
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <UserSearch className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No leads found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add a lead to get started'}
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
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-xs shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-sm truncate">{item.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.email || <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.phone || <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    {item.source ? (
                      <Badge variant="outline" className="text-xs capitalize">{item.source}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {item.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Send WhatsApp Message"
                          onClick={() => openWhatsappOutreach(item)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Call Lead"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {item.phone && (
                            <DropdownMenuItem onClick={() => openWhatsappOutreach(item)} className="text-emerald-700">
                              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Outreach
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Lead
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
                    </div>
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

      {/* Add/Edit Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the lead details below.' : 'Fill in the details to add a new lead.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lead-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-phone">Phone</Label>
                <Input
                  id="lead-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-source">Source</Label>
                <Select
                  value={form.source || '_none'}
                  onValueChange={(v) => setForm({ ...form, source: v === '_none' ? '' : v })}
                >
                  <SelectTrigger id="lead-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger id="lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes about this lead..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : editingItem ? 'Update Lead' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Outreach Campaign Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Student Outreach
            </DialogTitle>
            <DialogDescription>
              Directly reach out to <span className="font-semibold text-gray-900">{selectedLeadForWhatsapp?.name}</span> ({selectedLeadForWhatsapp?.phone}) with one click.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Select Message Template</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {[
                  { key: 'admission', label: '🎓 New Admission' },
                  { key: 'mocktest', label: '📚 Mock Tests' },
                  { key: 'followup', label: '👋 Follow-up' },
                ].map(tmpl => (
                  <Button
                    key={tmpl.key}
                    type="button"
                    variant={selectedTemplate === tmpl.key ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs h-8 ${selectedTemplate === tmpl.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                    onClick={() => {
                      setSelectedTemplate(tmpl.key)
                      const templates: Record<string, string> = {
                        admission: `Hello ${selectedLeadForWhatsapp?.name || 'Student'}! 🎓 New batch admissions are now open at Er. Raju Kumawat Tech. Reply to this message to claim your exclusive student discount coupon code!`,
                        mocktest: `Hello ${selectedLeadForWhatsapp?.name || 'Student'}! 📚 CBT Mock Test Series for competitive exams is now live on our student portal. Check your rank & preparation today!`,
                        followup: `Hello ${selectedLeadForWhatsapp?.name || 'Student'}! 👋 Following up on your course inquiry. Let us know if you would like syllabus details, demo videos, or doubt session access.`,
                      }
                      setCustomWhatsappMessage(templates[tmpl.key] || '')
                    }}
                  >
                    {tmpl.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Message Content (Editable)</Label>
              <Textarea
                rows={5}
                value={customWhatsappMessage}
                onChange={e => setCustomWhatsappMessage(e.target.value)}
                className="mt-1.5 font-mono text-xs"
                placeholder="Type custom message..."
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-start gap-2">
              <span className="font-bold">Tip:</span> Clicking "Open WhatsApp" opens WhatsApp Web / App directly to this student's chat with your message ready to send.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              onClick={handleSendWhatsapp}
            >
              <Send className="h-4 w-4" />
              Open WhatsApp Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete lead{' '}
              <span className="font-semibold">{itemToDelete?.name}</span>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
