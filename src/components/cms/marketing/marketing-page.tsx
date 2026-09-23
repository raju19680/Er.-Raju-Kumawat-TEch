'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MediaImage } from '@/components/ui/media-image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
  Image as ImageIcon,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  LayoutGrid,
  Eye,
  EyeOff,
  Link as LinkIcon,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  ChevronDown,
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

interface Banner {
  id: string
  title: string
  description?: string
  image: string
  link?: string | null
  isActive: boolean
  startDate?: string | null
  endDate?: string | null
  sortOrder?: number
  organizationId: string
  createdAt: string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const { orgCode } = useAppStore()

  // Data states
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannersLoading, setBannersLoading] = useState(true)
  const [bannersError, setBannersError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Banner drawer (add / edit)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerDescription, setBannerDescription] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerLinkUrl, setBannerLinkUrl] = useState('')
  const [bannerSortOrder, setBannerSortOrder] = useState('1')
  const [bannerStartDate, setBannerStartDate] = useState('')
  const [bannerEndDate, setBannerEndDate] = useState('')
  const [bannerActive, setBannerActive] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Product link picker
  const [linkProducts, setLinkProducts] = useState<{ type: string; id: string; title: string; slug?: string }[]>([])
  const [linkProductsLoading, setLinkProductsLoading] = useState(false)
  const [linkSearchQuery, setLinkSearchQuery] = useState('')
  const [showLinkPicker, setShowLinkPicker] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // ─── Fetch ──────────────────────────────────────────────────────────

  const fetchBanners = useCallback(async () => {
    if (!orgCode) return
    setBannersLoading(true)
    setBannersError(null)
    try {
      const res = await apiFetch(`/api/banners?organizationId=${orgCode}&limit=50`)
      const data = await res.json()
      if (data.items) {
        setBanners(data.items)
      } else {
        setBannersError(data.error || 'Failed to load banners')
      }
    } catch {
      setBannersError('Network error. Please try again.')
    } finally {
      setBannersLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // Fetch products for link picker
  const fetchLinkProducts = useCallback(async () => {
    if (!orgCode) return
    setLinkProductsLoading(true)
    try {
      const [coursesRes, testSeriesRes, productsRes] = await Promise.allSettled([
        apiFetch(`/api/teacher/courses?organizationId=${orgCode}&limit=50`).then(r => r.json()),
        apiFetch(`/api/teacher/test-series?organizationId=${orgCode}&limit=50`).then(r => r.json()),
        apiFetch(`/api/teacher/digital-products?organizationId=${orgCode}&limit=50`).then(r => r.json()),
      ])

      const items: { type: string; id: string; title: string; slug?: string }[] = []

      if (coursesRes.status === 'fulfilled') {
        const courses = coursesRes.value.items || coursesRes.value.courses || []
        courses.forEach((c: any) => items.push({ type: 'Course', id: c.id, title: c.title, slug: c.slug }))
      }
      if (testSeriesRes.status === 'fulfilled') {
        const ts = testSeriesRes.value.items || testSeriesRes.value.testSeries || []
        ts.forEach((t: any) => items.push({ type: 'Test Series', id: t.id, title: t.title, slug: t.slug }))
      }
      if (productsRes.status === 'fulfilled') {
        const dp = productsRes.value.items || productsRes.value.products || []
        dp.forEach((p: any) => items.push({ type: 'Digital Product', id: p.id, title: p.title, slug: p.slug }))
      }

      setLinkProducts(items)
    } catch {
      console.error('Failed to fetch link products')
    } finally {
      setLinkProductsLoading(false)
    }
  }, [orgCode])

  // ─── Handlers ──────────────────────────────────────────────────────

  const resetDrawerForm = () => {
    setBannerTitle('')
    setBannerDescription('')
    setBannerImageUrl('')
    setBannerLinkUrl('')
    setBannerSortOrder('1')
    setBannerStartDate('')
    setBannerEndDate('')
    setBannerActive(true)
    setEditingBanner(null)
  }

  const openAddDrawer = () => {
    resetDrawerForm()
    setDrawerOpen(true)
    fetchLinkProducts()
  }

  const openEditDrawer = (banner: Banner) => {
    setEditingBanner(banner)
    setBannerTitle(banner.title)
    setBannerDescription(banner.description || '')
    setBannerImageUrl(banner.image || '')
    setBannerLinkUrl(banner.link || '')
    setBannerSortOrder(String(banner.sortOrder ?? 1))
    setBannerStartDate(banner.startDate ? banner.startDate.slice(0, 10) : '')
    setBannerEndDate(banner.endDate ? banner.endDate.slice(0, 10) : '')
    setBannerActive(banner.isActive)
    setDrawerOpen(true)
    fetchLinkProducts()
  }

  const handleSaveBanner = async () => {
    if (!bannerTitle) {
      toast.error('Banner title is required')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: bannerTitle,
        description: bannerDescription || undefined,
        image: bannerImageUrl || '',
        link: bannerLinkUrl || null,
        sortOrder: Number(bannerSortOrder) || 0,
        isActive: bannerActive,
        startDate: bannerStartDate || null,
        endDate: bannerEndDate || null,
        organizationId: orgCode,
      }

      const isEdit = !!editingBanner
      const url = isEdit ? `/api/banners/${editingBanner!.id}` : '/api/banners'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(isEdit ? 'Banner updated successfully' : 'Banner created successfully')
        setDrawerOpen(false)
        resetDrawerForm()
        fetchBanners()
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} banner`)
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleBannerActive = async (banner: Banner) => {
    try {
      const res = await apiFetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !banner.isActive }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated')
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b)))
      } else {
        toast.error(data.error || 'Failed to update banner')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/banners/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Banner deleted successfully')
        setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      } else {
        toast.error(data.error || 'Failed to delete banner')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ─── Derived data ──────────────────────────────────────────────────

  const filteredBanners = banners.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && b.isActive) ||
      (filterStatus === 'inactive' && !b.isActive)
    return matchesSearch && matchesStatus
  })

  const totalBanners = banners.length
  const activeBanners = banners.filter((b) => b.isActive).length
  const inactiveBanners = totalBanners - activeBanners

  // ─── Render helpers ────────────────────────────────────────────────

  const renderError = (message: string, onRetry: () => void) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="size-5 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-900">Something went wrong</p>
      <p className="text-xs text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage promotional banners displayed across the platform
          </p>
        </div>
        <Button
          onClick={openAddDrawer}
          className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white"
        >
          <Plus className="size-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Banners</p>
              <p className="text-xl font-bold text-gray-900">{totalBanners}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Eye className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-gray-900">{activeBanners}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <EyeOff className="size-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inactive</p>
              <p className="text-xl font-bold text-gray-900">{inactiveBanners}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search banners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status ? 'bg-black hover:bg-gray-800 text-white' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Banner grid */}
      {bannersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-px w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 flex-1" />
                  <Skeleton className="h-7 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bannersError ? (
        <Card className="rounded-xl">
          <CardContent className="p-0">{renderError(bannersError, fetchBanners)}</CardContent>
        </Card>
      ) : filteredBanners.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {searchQuery || filterStatus !== 'all' ? 'No banners match your filters' : 'No banners yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first banner for the platform'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={openAddDrawer}
                >
                  <Plus className="size-4 mr-1" />
                  Add Banner
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanners.map((banner) => (
            <Card key={banner.id} className="rounded-xl overflow-hidden">
              {/* Thumbnail */}
              <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 aspect-video lg:aspect-[3/1]">
                {banner.image ? (
                  <MediaImage src={banner.image} alt={banner.title} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <ImageIcon className="size-8 text-gray-400" />
                  </div>
                )}
                {/* Status badge overlay */}
                <Badge
                  variant="secondary"
                  className={`absolute top-2 right-2 ${
                    banner.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {banner.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Card body */}
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm text-gray-900 line-clamp-1">{banner.title}</p>
                  {banner.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {banner.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {banner.link && (
                    <span className="flex items-center gap-1">
                      <LinkIcon className="size-3" />
                      Link
                    </span>
                  )}
                  {banner.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(banner.startDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {banner.endDate && (
                        <>
                          {' – '}
                          {new Date(banner.endDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </>
                      )}
                    </span>
                  )}
                  <span className="ml-auto">Order: {banner.sortOrder ?? 0}</span>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={banner.isActive}
                    onCheckedChange={() => toggleBannerActive(banner)}
                  />
                  <div className="flex-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-8 p-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDrawer(banner)}>
                        <Pencil className="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          setDeleteTarget({ id: banner.id, name: banner.title })
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Add / Edit Banner Drawer ──────────────────────────────────── */}
      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) resetDrawerForm()
        }}
      >
        <SheetContent side="right" className="sm:max-w-md w-full sm:w-auto">
          <SheetHeader>
            <SheetTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</SheetTitle>
            <SheetDescription>
              {editingBanner ? 'Update banner details' : 'Create a new banner for the platform'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Banner Title *</Label>
              <Input
                id="banner-title"
                placeholder="e.g., Diwali Sale Banner"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-description">Description</Label>
              <Textarea
                id="banner-description"
                placeholder="Brief description of the banner..."
                value={bannerDescription}
                onChange={(e) => setBannerDescription(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-image">Image URL</Label>
              <Input
                id="banner-image"
                placeholder="https://example.com/banner.jpg"
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
              />
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // Validate file size (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('File size exceeds 5MB limit')
                      return
                    }

                    // Validate file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
                    if (!allowedTypes.includes(file.type)) {
                      toast.error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.')
                      return
                    }

                    setUploading(true)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('type', 'image')
                      formData.append('folder', 'banners')

                      const res = await apiFetch('/api/teacher/upload-image?type=image', {
                        method: 'POST',
                        body: formData,
                      })
                      const data = await res.json()
                      if (res.ok && data.success && data.url) {
                        setBannerImageUrl(data.url)
                        toast.success('Image uploaded successfully')
                      } else {
                        toast.error(data.message || 'Failed to upload image')
                      }
                    } catch {
                      toast.error('Network error. Please try again.')
                    } finally {
                      setUploading(false)
                      // Reset the file input so the same file can be re-selected
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-6 text-gray-400 animate-spin" />
                      <span className="text-xs text-gray-500">Uploading...</span>
                    </>
                  ) : bannerImageUrl ? (
                    <img
                      src={bannerImageUrl}
                      alt="Banner preview"
                      className="size-full object-contain rounded-lg p-1"
                    />
                  ) : (
                    <>
                      <Upload className="size-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to upload banner image</span>
                    </>
                  )}
                </button>
                {bannerImageUrl && !uploading && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{bannerImageUrl}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link URL</Label>
              <p className="text-xs text-muted-foreground">Select a product or enter a custom URL</p>
              
              {/* Manual URL input */}
              <Input
                id="banner-link"
                placeholder="https://example.com or select product below"
                value={bannerLinkUrl}
                onChange={(e) => setBannerLinkUrl(e.target.value)}
              />

              {/* Product Picker Toggle */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setShowLinkPicker(!showLinkPicker)}
              >
                <span className="flex items-center gap-2">
                  <LinkIcon className="size-4 text-indigo-500" />
                  Link to Product (Course / Test Series / Digital Product)
                </span>
                <ChevronDown className={`size-4 transition-transform ${showLinkPicker ? 'rotate-180' : ''}`} />
              </button>

              {/* Product list dropdown */}
              {showLinkPicker && (
                <div className="border rounded-lg bg-white shadow-sm max-h-56 overflow-y-auto">
                  {/* Search within products */}
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <Input
                      placeholder="Search products..."
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {linkProductsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="size-5 animate-spin text-gray-400" />
                    </div>
                  ) : linkProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No products found</p>
                  ) : (
                    <div className="divide-y">
                      {linkProducts
                        .filter(p => !linkSearchQuery || p.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) || p.type.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                        .map((product) => (
                          <button
                            key={`${product.type}-${product.id}`}
                            type="button"
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-indigo-50 transition-colors text-sm ${
                              bannerLinkUrl === `/product/${product.type.toLowerCase().replace(/\s+/g, '-')}/${product.id}` ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''
                            }`}
                            onClick={() => {
                              const slug = product.slug || product.id
                              const type = product.type.toLowerCase().replace(/\s+/g, '-')
                              setBannerLinkUrl(`/product/${type}/${slug}`)
                              setShowLinkPicker(false)
                              setLinkSearchQuery('')
                            }}
                          >
                            <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${
                              product.type === 'Course' ? 'bg-blue-50 text-blue-600' :
                              product.type === 'Test Series' ? 'bg-amber-50 text-amber-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {product.type === 'Course' ? <BookOpen className="size-3.5" /> :
                               product.type === 'Test Series' ? <ClipboardList className="size-3.5" /> :
                               <ShoppingBag className="size-3.5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-xs truncate">{product.title}</p>
                              <p className="text-xs text-muted-foreground">{product.type}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {bannerLinkUrl && (
                <p className="text-xs text-indigo-600 font-medium mt-1 truncate">
                  → {bannerLinkUrl}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-start">Start Date</Label>
                <Input
                  id="banner-start"
                  type="date"
                  value={bannerStartDate}
                  onChange={(e) => setBannerStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-end">End Date</Label>
                <Input
                  id="banner-end"
                  type="date"
                  value={bannerEndDate}
                  onChange={(e) => setBannerEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner-sort">Sort Order</Label>
                <Input
                  id="banner-sort"
                  type="number"
                  placeholder="1"
                  value={bannerSortOrder}
                  onChange={(e) => setBannerSortOrder(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center h-9">
                  <Switch
                    checked={bannerActive}
                    onCheckedChange={setBannerActive}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {bannerActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDrawerOpen(false)
                  resetDrawerForm()
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white"
                onClick={handleSaveBanner}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {editingBanner ? 'Saving...' : 'Adding...'}
                  </>
                ) : editingBanner ? (
                  'Save Changes'
                ) : (
                  'Add Banner'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
