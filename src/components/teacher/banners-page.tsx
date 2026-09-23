'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Star,
  ExternalLink,
  Loader2,
  Power,
  PowerOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────
interface Banner {
  id: string
  title: string
  description: string | null
  image: string
  mobileImage: string | null
  link: string | null
  position: string
  sortOrder: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface BannerForm {
  title: string
  description: string
  image: string
  mobileImage: string
  link: string
  position: string
  sortOrder: string
  isActive: boolean
  startDate: string
  endDate: string
}

const emptyForm: BannerForm = {
  title: '',
  description: '',
  image: '',
  mobileImage: '',
  link: '',
  position: 'homepage',
  sortOrder: '0',
  isActive: true,
  startDate: '',
  endDate: '',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BANNERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function BannersPage() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<Banner[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsPerPage = 12

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, featured: 0 })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Banner | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Banner | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState<BannerForm>(emptyForm)

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
      if (statusFilter === 'active') params.set('isActive', 'true')
      else if (statusFilter === 'inactive') params.set('isActive', 'false')

      const res = await apiFetch(`/api/banners?${params}`)
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
      const statsRes = await apiFetch(`/api/banners?${statsParams}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const allItems: Banner[] = statsData.items || []
        setStats({
          total: statsData.total || allItems.length,
          active: allItems.filter((i: Banner) => i.isActive).length,
          inactive: allItems.filter((i: Banner) => !i.isActive).length,
          featured: allItems.filter((i: Banner) => i.sortOrder <= 2 && i.isActive).length,
        })
      }
    } catch {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: Banner) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      description: item.description || '',
      image: item.image || '',
      mobileImage: item.mobileImage || '',
      link: item.link || '',
      position: item.position || 'homepage',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive,
      startDate: item.startDate ? item.startDate.slice(0, 10) : '',
      endDate: item.endDate ? item.endDate.slice(0, 10) : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.image.trim()) {
      toast.error('Image URL is required')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        const res = await apiFetch(`/api/banners/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            image: form.image,
            mobileImage: form.mobileImage || null,
            link: form.link || null,
            position: form.position || 'homepage',
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to update banner')
          return
        }
        toast.success('Banner updated successfully')
      } else {
        const res = await apiFetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            image: form.image,
            mobileImage: form.mobileImage || null,
            link: form.link || null,
            position: form.position || 'homepage',
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to create banner')
          return
        }
        toast.success('Banner created successfully')
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

  const handleToggleActive = async (item: Banner) => {
    try {
      const res = await apiFetch(`/api/banners/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(item.isActive ? 'Banner deactivated' : 'Banner activated')
      fetchItems()
    } catch {
      toast.error('Failed to update banner status')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/banners/${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Banner deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete banner')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Banners',
      value: stats.total,
      icon: ImageIcon,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: Power,
      accentBg: 'bg-emerald-50',
      accentIcon: 'text-emerald-600',
      accentBorder: 'border-l-emerald-500',
    },
    {
      title: 'Inactive',
      value: stats.inactive,
      icon: PowerOff,
      accentBg: 'bg-red-50',
      accentIcon: 'text-red-600',
      accentBorder: 'border-l-red-500',
    },
    {
      title: 'Featured',
      value: stats.featured,
      icon: Star,
      accentBg: 'bg-sky-50',
      accentIcon: 'text-sky-600',
      accentBorder: 'border-l-sky-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage homepage and promotional banners</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
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
            placeholder="Search banners..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Banner Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-11 w-11 text-gray-300 mb-2" />
          <p className="text-sm text-muted-foreground">No banners found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add a banner to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
              {/* Banner Image */}
              <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '3/1' }}>
                { }
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Status badge overlay */}
                <div className="absolute top-2 right-2">
                  {item.isActive ? (
                    <Badge className="bg-emerald-500 text-white border-0 shadow-sm">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-500 text-white border-0 shadow-sm">Inactive</Badge>
                  )}
                </div>
                {item.sortOrder <= 2 && item.isActive && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-amber-500 text-white border-0 shadow-sm gap-1">
                      <Star className="h-3 w-3 fill-white" /> Featured
                    </Badge>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <CardContent className="p-4">
                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {item.position === 'both' ? '🏠+📊' : item.position === 'dashboard' ? '📊 Dashboard' : '🏠 Homepage'}
                  </Badge>
                  {item.startDate && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-600">
                      📅 {new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {item.endDate ? ` - ${new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : '+'}
                    </Badge>
                  )}
                </div>
                {item.link && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground truncate">
                    <ExternalLink className="size-3 shrink-0" />
                    <span className="truncate">{item.link}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort: {item.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(item)}
                      title={item.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {item.isActive ? (
                        <PowerOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Power className="h-4 w-4 text-emerald-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setItemToDelete(item)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Showing X to Y of Z + Pagination */}
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

      {/* Add/Edit Banner Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the banner details below.' : 'Fill in the details to create a new banner.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="banner-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="banner-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter banner title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-desc">Description</Label>
              <Input
                id="banner-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-position">Position</Label>
              <Select value={form.position} onValueChange={(val) => setForm({ ...form, position: val })}>
                <SelectTrigger id="banner-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage">Homepage (Before Login)</SelectItem>
                  <SelectItem value="dashboard">Dashboard (After Login)</SelectItem>
                  <SelectItem value="both">Both (Homepage + Dashboard)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Where should this banner be displayed
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-image">
                Desktop Image URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="banner-image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
              <p className="text-xs text-amber-600 font-medium">
                📐 Recommended: 1200×400px (3:1 ratio) for best desktop display
              </p>
              {form.image && (
                <div className="mt-1 rounded-lg border overflow-hidden bg-gray-50" style={{ aspectRatio: '3/1' }}>
                  <img
                    src={form.image}
                    alt="Desktop Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-mobile-image">Mobile Image URL (optional)</Label>
              <Input
                id="banner-mobile-image"
                value={form.mobileImage}
                onChange={(e) => setForm({ ...form, mobileImage: e.target.value })}
                placeholder="https://example.com/banner-mobile.jpg"
              />
              <p className="text-xs text-amber-600 font-medium">
                📱 Recommended: 600×300px (2:1 ratio) for mobile screens
              </p>
              {form.mobileImage && (
                <div className="mt-1 rounded-lg border overflow-hidden bg-gray-50 max-w-[200px]" style={{ aspectRatio: '2/1' }}>
                  <img
                    src={form.mobileImage}
                    alt="Mobile Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-link">Link URL</Label>
              <Input
                id="banner-link"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://example.com/landing-page"
              />
              <p className="text-xs text-muted-foreground">
                URL where users will be redirected on clicking the banner
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="banner-start">Start Date</Label>
                <Input
                  id="banner-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="banner-end">End Date</Label>
                <Input
                  id="banner-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground col-span-2">
                Leave empty to show the banner indefinitely. Set dates for scheduled banners.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banner-sort">Sort Order</Label>
              <Input
                id="banner-sort"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Banners with sort order ≤ 2 are marked as featured.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="banner-active" className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">Show this banner on the portal</p>
              </div>
              <Switch
                id="banner-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
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
              {saving ? 'Saving...' : editingItem ? 'Update Banner' : 'Add Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete banner{' '}
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
              {deleting ? 'Deleting...' : 'Delete Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
