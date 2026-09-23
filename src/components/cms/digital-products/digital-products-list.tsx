'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  IndianRupee,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Copy,
  Share2,
  Star,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  File,
  Filter,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface DigitalProduct {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  file: string | null
  type: string
  category: string | null
  price: number
  mrp: number
  status: string
  featured: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  [key: string]: unknown
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  published: { label: 'Published', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' },
  draft: { label: 'Draft', color: 'bg-amber-50 text-amber-700 hover:bg-amber-50' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course: { label: 'Course', icon: GraduationCap, color: 'bg-violet-50 text-violet-700' },
  ebook: { label: 'E-Book', icon: BookOpen, color: 'bg-sky-50 text-sky-700' },
  notes: { label: 'Notes', icon: FileText, color: 'bg-teal-50 text-teal-700' },
  test_series: { label: 'Test Series', icon: ClipboardList, color: 'bg-orange-50 text-orange-700' },
  other: { label: 'Other', icon: File, color: 'bg-gray-50 text-gray-700' },
}

const CATEGORY_COLORS: Record<string, string> = {
  JEE: 'bg-rose-50 text-rose-700',
  NEET: 'bg-rose-50 text-rose-700',
  UPSC: 'bg-purple-50 text-purple-700',
  GATE: 'bg-orange-50 text-orange-700',
  CAT: 'bg-teal-50 text-teal-700',
  CUET: 'bg-cyan-50 text-cyan-700',
  General: 'bg-gray-50 text-gray-700',
}
const DEFAULT_CATEGORY_COLOR = 'bg-gray-50 text-gray-700'

// ─── Component ────────────────────────────────────────────────────────────

export default function DigitalProductsList() {
  const { orgCode } = useAppStore()

  // Data state
  const [products, setProducts] = useState<DigitalProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<DigitalProduct | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<DigitalProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Duplicate dialog state
  const [duplicating, setDuplicating] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formFile, setFormFile] = useState('')
  const [formType, setFormType] = useState('course')
  const [formCategory, setFormCategory] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formMrp, setFormMrp] = useState('')
  const [formStatus, setFormStatus] = useState<string>('draft')
  const [formFeatured, setFormFeatured] = useState(false)

  // ─── Debounced search ─────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // ─── Fetch products ──────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        organizationId: orgCode || '',
      })
      if (searchDebounced) params.set('search', searchDebounced)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await apiFetch(`/api/digital-products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / limit) || 1)
    } catch (err) {
      console.error('Failed to fetch digital products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, searchDebounced, statusFilter, typeFilter, categoryFilter, orgCode])

  // ─── Fetch categories ─────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const params = new URLSearchParams({ organizationId: orgCode || '' })
      const res = await apiFetch(`/api/categories?${params}`)
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data.items || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [orgCode])

  // ─── Effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, typeFilter, categoryFilter])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormThumbnail('')
    setFormFile('')
    setFormType('course')
    setFormCategory('')
    setFormPrice('')
    setFormMrp('')
    setFormStatus('draft')
    setFormFeatured(false)
  }

  const openAddDrawer = () => {
    setEditProduct(null)
    resetForm()
    setDrawerOpen(true)
  }

  const openEditDrawer = (product: DigitalProduct) => {
    setEditProduct(product)
    setFormTitle(product.title)
    setFormDescription(product.description || '')
    setFormThumbnail(product.thumbnail || '')
    setFormFile(product.file || '')
    setFormType(product.type)
    setFormCategory(product.category || '')
    setFormPrice(String(product.price))
    setFormMrp(String(product.mrp))
    setFormStatus(product.status)
    setFormFeatured(product.featured)
    setDrawerOpen(true)
  }

  // ─── Save (Create / Update) ───────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        thumbnail: formThumbnail.trim(),
        file: formFile.trim(),
        type: formType,
        category: formCategory,
        price: Number(formPrice) || 0,
        mrp: Number(formMrp) || 0,
        status: formStatus,
        featured: formFeatured,
        organizationId: orgCode,
      }

      if (editProduct) {
        const res = await apiFetch(`/api/digital-products/${editProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update product')
        }
        toast.success('Product updated successfully')
      } else {
        const res = await apiFetch('/api/digital-products', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create product')
        }
        toast.success('Product created successfully')
      }

      setDrawerOpen(false)
      fetchProducts()
    } catch (err: any) {
      console.error('Save failed:', err)
      toast.error(err.message || (editProduct ? 'Failed to update product' : 'Failed to create product'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/digital-products/${productToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete product')
      toast.success('Product deleted successfully')
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      fetchProducts()
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  // ─── Toggle publish/draft ─────────────────────────────────────────────

  const handleTogglePublish = async (product: DigitalProduct) => {
    const newStatus = product.status === 'published' ? 'draft' : 'published'
    try {
      const res = await apiFetch(`/api/digital-products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(newStatus === 'published' ? 'Product published' : 'Product moved to draft')
      fetchProducts()
    } catch (err) {
      console.error('Toggle publish failed:', err)
      toast.error('Failed to update product status')
    }
  }

  // ─── Toggle featured ──────────────────────────────────────────────────

  const handleToggleFeatured = async (product: DigitalProduct) => {
    try {
      const res = await apiFetch(`/api/digital-products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: !product.featured }),
      })
      if (!res.ok) throw new Error('Failed to update featured status')
      toast.success(product.featured ? 'Removed from featured' : 'Marked as featured')
      fetchProducts()
    } catch (err) {
      console.error('Toggle featured failed:', err)
      toast.error('Failed to update featured status')
    }
  }

  // ─── Duplicate ────────────────────────────────────────────────────────

  const handleDuplicate = async (product: DigitalProduct) => {
    setDuplicating(true)
    try {
      const res = await apiFetch('/api/digital-products', {
        method: 'POST',
        body: JSON.stringify({
          title: `${product.title} (Copy)`,
          description: product.description,
          thumbnail: product.thumbnail,
          file: product.file,
          type: product.type,
          category: product.category,
          price: product.price,
          mrp: product.mrp,
          status: 'draft',
          featured: false,
          organizationId: orgCode,
        }),
      })
      if (!res.ok) throw new Error('Failed to duplicate product')
      toast.success('Product duplicated')
      fetchProducts()
    } catch (err) {
      console.error('Duplicate failed:', err)
      toast.error('Failed to duplicate product')
    } finally {
      setDuplicating(false)
    }
  }

  // ─── Share ────────────────────────────────────────────────────────────

  const handleShare = (product: DigitalProduct) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Share link copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  // ─── Discount calculator ──────────────────────────────────────────────

  const discount = (price: number, mrp: number) => {
    if (mrp === 0) return 0
    return Math.round(((mrp - price) / mrp) * 100)
  }

  // ─── Render helpers ──────────────────────────────────────────────────

  const getTypeIcon = (type: string) => {
    return TYPE_CONFIG[type]?.icon || File
  }

  const getTypeLabel = (type: string) => {
    return TYPE_CONFIG[type]?.label || 'Other'
  }

  // ─── Loading Skeletons ────────────────────────────────────────────────

  const renderSkeletons = () => (
    <>
      {/* Desktop Table Skeleton */}
      <Card className="hidden md:block rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-28">Category</TableHead>
                <TableHead className="w-24">Price</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="size-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="size-8 rounded shrink-0" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )


  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Digital Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your digital offerings — courses, e-books, notes & more
          </p>
        </div>
        <Button onClick={openAddDrawer} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Plus className="size-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters Row */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="ebook">E-Book</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="test_series">Test Series</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span>{total} product{total !== 1 ? 's' : ''} total</span>
          {totalPages > 1 && (
            <>
              <span>•</span>
              <span>Page {page} of {totalPages}</span>
            </>
          )}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="size-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={fetchProducts}
              >
                <RefreshCw className="size-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeletons */}
      {loading && renderSkeletons()}

      {/* Empty State */}
      {!loading && !error && products.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No products found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first digital product to get started'}
              </p>
              {!search && statusFilter === 'all' && typeFilter === 'all' && categoryFilter === 'all' && (
                <Button
                  onClick={openAddDrawer}
                  className="mt-4 bg-black hover:bg-gray-800 text-white"
                  size="sm"
                >
                  <Plus className="size-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : !loading && !error ? (
        /* Products Table - Desktop */
        <>
        <Card className="hidden md:block rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-14 text-center font-semibold">S.No</TableHead>
                    <TableHead className="font-semibold min-w-[240px]">Product Name</TableHead>
                    <TableHead className="w-28 font-semibold">Type</TableHead>
                    <TableHead className="w-28 font-semibold">Category</TableHead>
                    <TableHead className="w-28 font-semibold text-right">Price</TableHead>
                    <TableHead className="w-28 font-semibold">Status</TableHead>
                    <TableHead className="w-20 text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => {
                    const TypeIcon = getTypeIcon(product.type)
                    const disc = discount(product.price, product.mrp)
                    const statusCfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.draft

                    return (
                      <TableRow key={product.id} className="hover:bg-gray-50/50 group">
                        <TableCell className="text-center text-muted-foreground text-sm">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="size-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 overflow-hidden border">
                              {product.thumbnail ? (
                                <img
                                  src={product.thumbnail}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <TypeIcon className="size-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm text-gray-900 truncate block max-w-[200px]">
                                  {product.title}
                                </span>
                                {product.featured && (
                                  <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={TYPE_CONFIG[product.type]?.color || TYPE_CONFIG.other.color}>
                            <TypeIcon className="size-3 mr-1" />
                            {getTypeLabel(product.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="secondary" className={CATEGORY_COLORS[product.category] || DEFAULT_CATEGORY_COLOR}>
                              {product.category}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-sm text-gray-900 flex items-center">
                              <IndianRupee className="size-3" />
                              {product.price.toLocaleString('en-IN')}
                            </span>
                            {product.mrp > product.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{product.mrp.toLocaleString('en-IN')}
                              </span>
                            )}
                            {disc > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">{disc}% OFF</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusCfg.color}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditDrawer(product)}>
                                <Pencil className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePublish(product)}>
                                {product.status === 'published' ? (
                                  <>
                                    <EyeOff className="size-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="size-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                                <Star className={`size-4 mr-2 ${product.featured ? 'text-amber-500 fill-amber-500' : ''}`} />
                                {product.featured ? 'Remove Featured' : 'Mark Featured'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(product)} disabled={duplicating}>
                                <Copy className="size-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(product)}>
                                <Share2 className="size-4 mr-2" />
                                Share Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setProductToDelete(product)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
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

            {/* Pagination - Desktop */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
                <span className="text-xs text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {products.map((product, index) => {
            const TypeIcon = getTypeIcon(product.type)
            const disc = discount(product.price, product.mrp)
            const statusCfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.draft

            return (
              <Card key={product.id} className="rounded-xl">
                <CardContent className="p-4">
                  {/* Top row: thumbnail + info + actions */}
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="size-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 overflow-hidden border">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <TypeIcon className="size-5 text-gray-400" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {product.title}
                        </p>
                        {product.featured && (
                          <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        #{(page - 1) * limit + index + 1} · {getTypeLabel(product.type)}
                        {product.category && ` · ${product.category}`}
                      </p>
                    </div>
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-8 p-0 shrink-0">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDrawer(product)}>
                          <Pencil className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(product)}>
                          {product.status === 'published' ? (
                            <>
                              <EyeOff className="size-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="size-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                          <Star className={`size-4 mr-2 ${product.featured ? 'text-amber-500 fill-amber-500' : ''}`} />
                          {product.featured ? 'Remove Featured' : 'Mark Featured'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(product)} disabled={duplicating}>
                          <Copy className="size-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(product)}>
                          <Share2 className="size-4 mr-2" />
                          Share Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            setProductToDelete(product)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Bottom row: badges + price */}
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className={TYPE_CONFIG[product.type]?.color || TYPE_CONFIG.other.color}>
                        <TypeIcon className="size-3 mr-1" />
                        {getTypeLabel(product.type)}
                      </Badge>
                      {product.category && (
                        <Badge variant="secondary" className={CATEGORY_COLORS[product.category] || DEFAULT_CATEGORY_COLOR}>
                          {product.category}
                        </Badge>
                      )}
                      <Badge className={statusCfg.color}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-semibold text-sm text-gray-900 flex items-center">
                        <IndianRupee className="size-3" />
                        {product.price.toLocaleString('en-IN')}
                      </span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{product.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                      {disc > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">{disc}% OFF</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8"
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        </>
      ) : null}

      {/* Add/Edit Product Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
            <SheetDescription>
              {editProduct
                ? 'Update product details below'
                : 'Fill in the details to create a new digital product'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="product-title">Title *</Label>
              <Input
                id="product-title"
                placeholder="Enter product title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-type">Product Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger id="product-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="ebook">E-Book</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="test_series">Test Series</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="product-desc">Description</Label>
              <Textarea
                id="product-desc"
                placeholder="Brief description of the product..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="product-thumbnail">Thumbnail URL</Label>
              <Input
                id="product-thumbnail"
                placeholder="https://example.com/image.jpg"
                value={formThumbnail}
                onChange={(e) => setFormThumbnail(e.target.value)}
              />
              {formThumbnail ? (
                <div className="mt-2 h-28 rounded-lg overflow-hidden border bg-gray-50">
                  <img
                    src={formThumbnail}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="mt-2 h-28 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2">
                  <Upload className="size-6 text-gray-400" />
                  <span className="text-xs text-gray-500">Enter a thumbnail URL above</span>
                </div>
              )}
            </div>

            {/* File URL */}
            <div className="space-y-2">
              <Label htmlFor="product-file">File / Content URL</Label>
              <Input
                id="product-file"
                placeholder="https://example.com/file.pdf"
                value={formFile}
                onChange={(e) => setFormFile(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">URL to the downloadable file or course content</p>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Selling Price (₹)</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">This is the final price student will pay</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-mrp">MRP (₹)</Label>
                <Input
                  id="product-mrp"
                  type="number"
                  placeholder="0"
                  value={formMrp}
                  onChange={(e) => setFormMrp(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Price Preview */}
            {Number(formPrice) > 0 && Number(formMrp) > Number(formPrice) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-sm text-emerald-700">
                  💰 Students see: <strong>₹{Number(formPrice).toLocaleString('en-IN')}</strong>
                  <span className="line-through text-muted-foreground ml-1">₹{Number(formMrp).toLocaleString('en-IN')}</span>
                  <Badge className="ml-2 bg-emerald-600 text-white hover:bg-emerald-600 text-xs">
                    {discount(Number(formPrice), Number(formMrp))}% OFF
                  </Badge>
                </span>
              </div>
            )}

            <Separator />

            {/* Status & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-status">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger id="product-status">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-featured">Featured Product</Label>
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id="product-featured"
                    checked={formFeatured}
                    onCheckedChange={setFormFeatured}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formFeatured ? 'Yes, feature this product' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {editProduct ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  editProduct ? 'Save Changes' : 'Create Product'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{productToDelete?.title}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
