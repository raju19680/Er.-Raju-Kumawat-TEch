'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
  Link2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Youtube,
  MessageCircle,
  FileText,
  Award,
  Phone,
  Globe,
  BookOpen,
  GraduationCap,
  Mail,
  Video,
  FolderOpen,
  HelpCircle,
  Home,
  Star,
  Hash,
  MousePointerClick,
  CheckCircle2,
  LayoutList,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface QuickLink {
  id: string
  title: string
  url: string
  icon: string
  sortOrder: number
  active: boolean
  clicks: number
  createdAt: string
}

// ─── Icon Mapping ─────────────────────────────────────────────────────────

const ICON_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  youtube: { label: 'YouTube', icon: Youtube },
  telegram: { label: 'Telegram', icon: MessageCircle },
  'study-material': { label: 'Study Material', icon: FileText },
  'result-portal': { label: 'Result Portal', icon: Award },
  phone: { label: 'Phone', icon: Phone },
  globe: { label: 'Website', icon: Globe },
  book: { label: 'Book', icon: BookOpen },
  graduation: { label: 'Graduation', icon: GraduationCap },
  email: { label: 'Email', icon: Mail },
  video: { label: 'Video', icon: Video },
  folder: { label: 'Folder', icon: FolderOpen },
  help: { label: 'Help', icon: HelpCircle },
  home: { label: 'Home', icon: Home },
  star: { label: 'Star', icon: Star },
  hash: { label: 'Hash', icon: Hash },
  link: { label: 'Link', icon: Link2 },
}

const ICON_OPTIONS = Object.entries(ICON_MAP).map(([value, { label }]) => ({
  value,
  label,
}))

// ─── API data mapper ─────────────────────────────────────────────────────

function mapApiLink(apiItem: Record<string, unknown>): QuickLink {
  return {
    id: apiItem.id as string,
    title: apiItem.title as string,
    url: apiItem.url as string,
    icon: (apiItem.icon as string) || 'link',
    sortOrder: (apiItem.sortOrder as number) || 0,
    active: true, // Prisma model has no 'active' field; kept in UI only
    clicks: 0,    // Prisma model has no 'clicks' field; kept in UI only
    createdAt: apiItem.createdAt as string,
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function QuickLinksPage() {
  const { orgCode, userRole } = useAppStore()
  const orgAccent = '#f59e0b'

  // Data state
  const [links, setLinks] = useState<QuickLink[]>([])
  const [loading, setLoading] = useState(true)

  // Search
  const [search, setSearch] = useState('')

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLink, setEditLink] = useState<QuickLink | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formIcon, setFormIcon] = useState('link')
  const [formSortOrder, setFormSortOrder] = useState('0')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<QuickLink | null>(null)

  // ─── Fetch links ───────────────────────────────────────────────────────

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/quick-links?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        setLinks(data.items.map(mapApiLink))
      }
    } catch {
      toast.error('Failed to load quick links')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgCode) fetchLinks()
  }, [orgCode])

  // ─── Computed ─────────────────────────────────────────────────────────

  const filteredLinks = useMemo(() => {
    if (!search) return links
    const q = search.toLowerCase()
    return links.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q)
    )
  }, [links, search])

  const stats = useMemo(() => {
    const total = links.length
    const active = links.filter((l) => l.active).length
    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
    return { total, active, totalClicks }
  }, [links])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormUrl('')
    setFormIcon('link')
    setFormSortOrder(String(links.length + 1))
  }

  const openAddDialog = () => {
    setEditLink(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (link: QuickLink) => {
    setEditLink(link)
    setFormTitle(link.title)
    setFormUrl(link.url)
    setFormIcon(link.icon)
    setFormSortOrder(String(link.sortOrder))
    setDialogOpen(true)
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
      if (editLink) {
        const response = await apiFetch(`/api/quick-links/${editLink.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle.trim(),
            url: formUrl.trim(),
            icon: formIcon,
            sortOrder: Number(formSortOrder) || 0,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          setLinks((prev) =>
            prev.map((l) => (l.id === editLink.id ? mapApiLink(data.item as Record<string, unknown>) : l))
          )
          toast.success('Quick link updated')
        } else {
          toast.error(data.error || 'Failed to update quick link')
        }
      } else {
        const response = await apiFetch('/api/quick-links', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle.trim(),
            url: formUrl.trim(),
            icon: formIcon,
            sortOrder: Number(formSortOrder) || 0,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          setLinks((prev) => [...prev, mapApiLink(data.item as Record<string, unknown>)])
          toast.success('Quick link created')
        } else {
          toast.error(data.error || 'Failed to create quick link')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!linkToDelete) return
    try {
      const response = await apiFetch(`/api/quick-links/${linkToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id))
        toast.success('Quick link deleted')
      } else {
        toast.error(data.error || 'Failed to delete quick link')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeleteDialogOpen(false)
      setLinkToDelete(null)
    }
  }

  // ─── Reorder ─────────────────────────────────────────────────────────

  const handleMoveUp = async (linkId: string) => {
    const idx = links.findIndex((l) => l.id === linkId)
    if (idx <= 0) return
    const newLinks = [...links]
    const temp = newLinks[idx]
    newLinks[idx] = newLinks[idx - 1]
    newLinks[idx - 1] = temp
    const reordered = newLinks.map((l, i) => ({ ...l, sortOrder: i + 1 }))
    setLinks(reordered)
    // Update sort orders via API
    try {
      await apiFetch(`/api/quick-links/${linkId}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: idx, organizationId: orgCode }),
      })
      await apiFetch(`/api/quick-links/${newLinks[idx - 1].id}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: idx + 1, organizationId: orgCode }),
      })
    } catch {
      // Silently fail - UI is already updated
    }
    toast.success('Link moved up')
  }

  const handleMoveDown = async (linkId: string) => {
    const idx = links.findIndex((l) => l.id === linkId)
    if (idx < 0 || idx >= links.length - 1) return
    const newLinks = [...links]
    const temp = newLinks[idx]
    newLinks[idx] = newLinks[idx + 1]
    newLinks[idx + 1] = temp
    const reordered = newLinks.map((l, i) => ({ ...l, sortOrder: i + 1 }))
    setLinks(reordered)
    // Update sort orders via API
    try {
      await apiFetch(`/api/quick-links/${linkId}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: idx + 2, organizationId: orgCode }),
      })
      await apiFetch(`/api/quick-links/${newLinks[idx + 1].id}`, {
        method: 'PUT',
        body: JSON.stringify({ sortOrder: idx + 1, organizationId: orgCode }),
      })
    } catch {
      // Silently fail - UI is already updated
    }
    toast.success('Link moved down')
  }

  // ─── Get Icon Component ───────────────────────────────────────────────

  const getIconComponent = (iconKey: string) => {
    return ICON_MAP[iconKey]?.icon || Link2
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="size-6" style={{ color: orgAccent }} />
            Quick Links
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage custom URL shortcuts for your students
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="w-full sm:w-auto text-white"
          style={{ backgroundColor: orgAccent }}
        >
          <Plus className="size-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className="flex items-center justify-center size-9 rounded-full"
              style={{ backgroundColor: `${orgAccent}15` }}
            >
              <LayoutList className="size-4" style={{ color: orgAccent }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Links</p>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold text-gray-900">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-sky-50">
              <MousePointerClick className="size-4 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.totalClicks.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>
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
            <div className="flex items-center justify-center py-16">
              <span className="size-6 animate-spin inline-block border-2 border-gray-300 border-t-gray-900 rounded-full" />
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="size-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${orgAccent}15` }}
              >
                <Link2 className="size-6" style={{ color: orgAccent }} />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {search ? 'No links found' : 'No quick links yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? 'Try adjusting your search'
                  : 'Add your first quick link to get started'}
              </p>
              {!search && (
                <Button
                  onClick={openAddDialog}
                  className="mt-4 text-white"
                  size="sm"
                  style={{ backgroundColor: orgAccent }}
                >
                  <Plus className="size-4 mr-2" /> Add Link
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="hidden md:table-cell">URL</TableHead>
                    <TableHead className="hidden sm:table-cell">Clicks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link, idx) => {
                    const IconComp = getIconComponent(link.icon)
                    return (
                      <TableRow key={link.id}>
                        {/* Sort order + move buttons */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground font-mono w-5 text-center">
                              {link.sortOrder}
                            </span>
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                disabled={idx === 0}
                                onClick={() => handleMoveUp(link.id)}
                              >
                                <ArrowUp className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                disabled={idx === filteredLinks.length - 1}
                                onClick={() => handleMoveDown(link.id)}
                              >
                                <ArrowDown className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>

                        {/* Title + Icon */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center size-8 rounded-lg shrink-0"
                              style={{ backgroundColor: `${orgAccent}15` }}
                            >
                              <IconComp className="size-4" style={{ color: orgAccent }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                                {link.title}
                              </p>
                              {/* URL visible on mobile */}
                              <p className="text-xs text-muted-foreground truncate max-w-[180px] md:hidden">
                                {link.url}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* URL - hidden on mobile */}
                        <TableCell className="hidden md:table-cell">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-sky-600 hover:underline flex items-center gap-1 max-w-[220px] truncate"
                          >
                            {link.url}
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        </TableCell>

                        {/* Clicks - hidden on small screens */}
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {link.clicks.toLocaleString('en-IN')}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              link.active
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                            }
                          >
                            {link.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(link)}
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add/Edit Link Dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editLink ? 'Edit Quick Link' : 'Add Quick Link'}
            </DialogTitle>
            <DialogDescription>
              {editLink
                ? 'Update the link details'
                : 'Add a new navigation link for your students'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. YouTube Channel"
              />
            </div>

            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com"
              />
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
              {/* Icon preview */}
              {formIcon && ICON_MAP[formIcon] && (
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="flex items-center justify-center size-8 rounded-lg"
                    style={{ backgroundColor: `${orgAccent}15` }}
                  >
                    {React.createElement(getIconComponent(formIcon), {
                      className: 'size-4',
                      style: { color: orgAccent },
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ICON_MAP[formIcon].label}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                placeholder="1"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
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
              {editLink ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quick Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{linkToDelete?.title}&rdquo;? This action
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
