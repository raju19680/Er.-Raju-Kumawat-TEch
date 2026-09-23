'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
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
  Link2,
  CheckCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────
interface QuickLink {
  id: string
  title: string
  url: string
  icon: string | null
  sortOrder: number
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface QuickLinkForm {
  title: string
  url: string
  icon: string
  sortOrder: string
}

const emptyForm: QuickLinkForm = {
  title: '',
  url: '',
  icon: '',
  sortOrder: '0',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN QUICK LINKS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function QuickLinksPage() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<QuickLink[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsPerPage = 10

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0 })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<QuickLink | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<QuickLink | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState<QuickLinkForm>(emptyForm)

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

      const res = await apiFetch(`/api/quick-links?${params}`)
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
      const statsRes = await apiFetch(`/api/quick-links?${statsParams}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          total: statsData.total || 0,
          active: statsData.total || 0, // QuickLinks don't have isActive field, all are active
        })
      }
    } catch {
      toast.error('Failed to load quick links')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: QuickLink) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      url: item.url || '',
      icon: item.icon || '',
      sortOrder: String(item.sortOrder ?? 0),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.url.trim()) {
      toast.error('URL is required')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        const res = await apiFetch(`/api/quick-links/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            url: form.url,
            icon: form.icon || null,
            sortOrder: Number(form.sortOrder) || 0,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to update quick link')
          return
        }
        toast.success('Quick link updated successfully')
      } else {
        const res = await apiFetch('/api/quick-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            url: form.url,
            icon: form.icon || null,
            sortOrder: Number(form.sortOrder) || 0,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to create quick link')
          return
        }
        toast.success('Quick link created successfully')
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
      const res = await apiFetch(`/api/quick-links/${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Quick link deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete quick link')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Links',
      value: stats.total,
      icon: Link2,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircle,
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Quick Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage navigation quick links for your portal</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 max-w-lg">
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

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quick links..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPageNum(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Status</TableHead>
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
                  <Link2 className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No quick links found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Add a quick link to get started'}
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
                      {item.icon && <span className="text-lg">{item.icon}</span>}
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 max-w-[250px]">
                      <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{item.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.icon ? (
                      <span className="text-lg">{item.icon}</span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.sortOrder}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
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

      {/* Add/Edit Quick Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Quick Link' : 'Add Quick Link'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the quick link details below.' : 'Fill in the details to create a new quick link.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ql-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ql-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., JEE Main Info"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ql-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ql-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com/page"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ql-icon">Icon</Label>
                <Input
                  id="ql-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="🔗 or emoji"
                />
                <p className="text-xs text-muted-foreground">
                  Use an emoji or text character as the icon
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ql-sort">Sort Order</Label>
                <Input
                  id="ql-sort"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>
            </div>
            {/* Preview */}
            {form.title && (
              <div className="rounded-lg border p-3 bg-gray-50">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  {form.icon && <span className="text-xl">{form.icon}</span>}
                  <div>
                    <p className="text-sm font-medium">{form.title}</p>
                    {form.url && <p className="text-xs text-muted-foreground">{form.url}</p>}
                  </div>
                </div>
              </div>
            )}
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
              {saving ? 'Saving...' : editingItem ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Quick Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quick link{' '}
              <span className="font-semibold">{itemToDelete?.title}</span>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
