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
  Link2,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  GripVertical,
  Loader2,
  ArrowUpDown,
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

interface QuickLink {
  id: string
  title: string
  url: string
  icon: string | null
  sortOrder: number
  organizationId: string
  createdAt: string
}

const ICON_OPTIONS = [
  { label: 'None', value: '' },
  { label: '📖 Book', value: 'book' },
  { label: '📝 Notes', value: 'notes' },
  { label: '🎓 Graduation Cap', value: 'graduation' },
  { label: '📋 Clipboard', value: 'clipboard' },
  { label: '🔗 Link', value: 'link' },
  { label: '📱 Mobile', value: 'mobile' },
  { label: '💬 Chat', value: 'chat' },
  { label: '📧 Email', value: 'email' },
  { label: '🌐 Globe', value: 'globe' },
  { label: '🎥 Video', value: 'video' },
  { label: '📁 Folder', value: 'folder' },
]

// ─── Component ────────────────────────────────────────────────────────────

export default function QuickLinksPage() {
  const { orgCode } = useAppStore()

  // Data state
  const [links, setLinks] = useState<QuickLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editLink, setEditLink] = useState<QuickLink | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<QuickLink | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formSortOrder, setFormSortOrder] = useState('0')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // ─── Fetch ────────────────────────────────────────────────────────────

  const fetchLinks = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ organizationId: orgCode, limit: '100' })
      if (searchDebounced) params.set('search', searchDebounced)
      const res = await apiFetch(`/api/quick-links?${params}`)
      const data = await res.json()
      if (data.items) {
        setLinks(data.items)
      } else {
        setError(data.error || 'Failed to load quick links')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [orgCode, searchDebounced])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  // Filtered links (client-side search as backup)
  const filteredLinks = useMemo(() => {
    if (!searchDebounced) return links
    const q = searchDebounced.toLowerCase()
    return links.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q)
    )
  }, [links, searchDebounced])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormUrl('')
    setFormIcon('')
    setFormSortOrder('0')
  }

  const openAddDrawer = () => {
    setEditLink(null)
    resetForm()
    setDrawerOpen(true)
  }

  const openEditDrawer = (link: QuickLink) => {
    setEditLink(link)
    setFormTitle(link.title)
    setFormUrl(link.url)
    setFormIcon(link.icon || '')
    setFormSortOrder(String(link.sortOrder))
    setDrawerOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formUrl.trim()) {
      toast.error('URL is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        title: formTitle.trim(),
        url: formUrl.trim(),
        icon: formIcon || null,
        sortOrder: Number(formSortOrder) || 0,
        organizationId: orgCode,
      }

      if (editLink) {
        const res = await apiFetch(`/api/quick-links/${editLink.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update')
        }
        toast.success('Quick link updated')
      } else {
        const res = await apiFetch('/api/quick-links', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create')
        }
        toast.success('Quick link created')
      }

      setDrawerOpen(false)
      fetchLinks()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!linkToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/quick-links/${linkToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Quick link deleted')
      setDeleteDialogOpen(false)
      setLinkToDelete(null)
      fetchLinks()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Quick Links</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage navigation links for your platform
          </p>
        </div>
        <Button onClick={openAddDrawer} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Plus className="size-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Search */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search links by title or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
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
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            renderError(error, fetchLinks)
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Link2 className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {searchDebounced ? 'No links found' : 'No quick links yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchDebounced
                  ? 'Try adjusting your search'
                  : 'Add your first quick link to get started'}
              </p>
              {!searchDebounced && (
                <Button onClick={openAddDrawer} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                  <Plus className="size-4 mr-2" /> Add Link
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="hidden md:table-cell">Icon</TableHead>
                    <TableHead className="hidden sm:table-cell">Sort Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <GripVertical className="size-4 text-gray-300" />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{link.title}</TableCell>
                      <TableCell>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                        >
                          {link.url}
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {link.icon ? (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                            {link.icon}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {link.sortOrder}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDrawer(link)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setLinkToDelete(link)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add/Edit Drawer ───────────────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editLink ? 'Edit Quick Link' : 'Add Quick Link'}</SheetTitle>
            <SheetDescription>
              {editLink ? 'Update the link details' : 'Add a new navigation link for your platform'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. YouTube Channel" />
            </div>

            <div className="space-y-2">
              <Label>URL *</Label>
              <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com" />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-black hover:bg-gray-800 text-white" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {editLink ? 'Update' : 'Create'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quick Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{linkToDelete?.title}&rdquo;? This action cannot be undone.
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
