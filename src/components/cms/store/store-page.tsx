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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Store,
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  LayoutGrid,
  List,
  IndianRupee,
  Star,
  MoreHorizontal,
  Eye,
  EyeOff,
  BookOpen,
  FileText,
  GraduationCap,
  Monitor,
  Archive,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type ProductType = 'physical' | 'digital' | 'service'
type ProductStatus = 'published' | 'draft' | 'archived'

interface Product {
  id: string
  title: string
  description: string
  price: number
  mrp: number
  category: string
  type: ProductType
  stock: number
  featured: boolean
  status: ProductStatus
  thumbnail: string | null
  createdAt: string
}

const CATEGORIES = ['Books', 'Notes', 'Courses', 'Practice Sets', 'Papers', 'Other']
const PRODUCT_TYPES: { label: string; value: ProductType }[] = [
  { label: 'Physical', value: 'physical' },
  { label: 'Digital', value: 'digital' },
  { label: 'Service', value: 'service' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Books: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  Notes: 'bg-sky-50 text-sky-700 hover:bg-sky-50',
  Courses: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  'Practice Sets': 'bg-purple-50 text-purple-700 hover:bg-purple-50',
  Papers: 'bg-rose-50 text-rose-700 hover:bg-rose-50',
  Other: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
}

const STATUS_COLORS: Record<ProductStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  draft: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  archived: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
}

const TYPE_ICONS: Record<ProductType, React.ElementType> = {
  physical: BookOpen,
  digital: FileText,
  service: GraduationCap,
}

// ─── Component ────────────────────────────────────────────────────────────

export default function StorePage() {
  const { orgCode } = useAppStore()
  const orgAccent = '#f59e0b'

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Search & filter
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formMrp, setFormMrp] = useState('')
  const [formCategory, setFormCategory] = useState('Books')
  const [formType, setFormType] = useState<ProductType>('digital')
  const [formStock, setFormStock] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formStatus, setFormStatus] = useState<ProductStatus>('draft')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // ─── Data fetching ─────────────────────────────────────────────────────

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('organizationId', orgCode)
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const response = await apiFetch(`/api/teacher/store-products?${params.toString()}`)
      const data = await response.json()

      if (data.items) {
        const mapped: Product[] = data.items.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          title: item.title as string,
          description: (item.description as string) || '',
          price: item.price as number,
          mrp: item.mrp as number,
          category: (item.category as string) || 'Other',
          type: (item.type as ProductType) || 'digital',
          stock: (item.stock as number) ?? 0,
          featured: (item.featured as boolean) ?? false,
          status: (item.status as ProductStatus) || 'draft',
          thumbnail: (item.thumbnail as string | null) ?? null,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt as string).toISOString(),
        }))
        setProducts(mapped)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [orgCode, search, statusFilter, categoryFilter])

  // ─── Computed ─────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    let result = products
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter)
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [products, categoryFilter, statusFilter, search])

  const stats = useMemo(() => {
    const total = products.length
    const published = products.filter((p) => p.status === 'published').length
    const outOfStock = products.filter((p) => p.stock === 0 && p.status === 'published').length
    const revenue = products
      .filter((p) => p.status === 'published')
      .reduce((sum, p) => sum + p.price, 0)
    return { total, published, outOfStock, revenue }
  }, [products])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormPrice('')
    setFormMrp('')
    setFormCategory('Books')
    setFormType('digital')
    setFormStock('')
    setFormFeatured(false)
    setFormStatus('draft')
  }

  const openAddDialog = () => {
    setEditingProduct(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormTitle(product.title)
    setFormDescription(product.description)
    setFormPrice(String(product.price))
    setFormMrp(String(product.mrp))
    setFormCategory(product.category)
    setFormType(product.type)
    setFormStock(String(product.stock))
    setFormFeatured(product.featured)
    setFormStatus(product.status)
    setDialogOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formPrice || Number(formPrice) < 0) {
      toast.error('Valid price is required')
      return
    }
    setSaving(true)

    try {
      const formData = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        mrp: Number(formMrp),
        category: formCategory,
        type: formType,
        stock: Number(formStock) || 0,
        featured: formFeatured,
        status: formStatus,
        organizationId: orgCode,
      }

      if (editingProduct) {
        const response = await apiFetch(`/api/teacher/store-products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        const data = await response.json()
        if (data.success && data.item) {
          const updatedProduct: Product = {
            id: data.item.id,
            title: data.item.title,
            description: data.item.description || '',
            price: data.item.price,
            mrp: data.item.mrp,
            category: data.item.category || 'Other',
            type: data.item.type || 'digital',
            stock: data.item.stock ?? 0,
            featured: data.item.featured ?? false,
            status: data.item.status || 'draft',
            thumbnail: data.item.thumbnail ?? null,
            createdAt: typeof data.item.createdAt === 'string' ? data.item.createdAt : new Date(data.item.createdAt).toISOString(),
          }
          setProducts((prev) =>
            prev.map((p) => p.id === editingProduct.id ? updatedProduct : p)
          )
          toast.success('Product updated successfully')
        } else {
          toast.error(data.error || 'Failed to update product')
        }
      } else {
        const response = await apiFetch('/api/teacher/store-products', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        const data = await response.json()
        if (data.success && data.item) {
          const newProduct: Product = {
            id: data.item.id,
            title: data.item.title,
            description: data.item.description || '',
            price: data.item.price,
            mrp: data.item.mrp,
            category: data.item.category || 'Other',
            type: data.item.type || 'digital',
            stock: data.item.stock ?? 0,
            featured: data.item.featured ?? false,
            status: data.item.status || 'draft',
            thumbnail: data.item.thumbnail ?? null,
            createdAt: typeof data.item.createdAt === 'string' ? data.item.createdAt : new Date(data.item.createdAt).toISOString(),
          }
          setProducts((prev) => [newProduct, ...prev])
          toast.success('Product added successfully')
        } else {
          toast.error(data.error || 'Failed to add product')
        }
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to save product:', error)
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      const response = await apiFetch(`/api/teacher/store-products/${productToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
        toast.success('Product deleted')
      } else {
        toast.error(data.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
    setDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  // ─── Toggle helpers ────────────────────────────────────────────────────

  const toggleProductStatus = async (product: Product) => {
    const newStatus: ProductStatus = product.status === 'published' ? 'draft' : 'published'
    try {
      const response = await apiFetch(`/api/teacher/store-products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => p.id === product.id ? { ...p, status: newStatus } : p)
        )
        toast.success(newStatus === 'draft' ? 'Product moved to draft' : 'Product published')
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('Failed to update status')
    }
  }

  const toggleProductFeatured = async (product: Product) => {
    const newFeatured = !product.featured
    try {
      const response = await apiFetch(`/api/teacher/store-products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: newFeatured, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => p.id === product.id ? { ...p, featured: newFeatured } : p)
        )
        toast.success(newFeatured ? 'Product featured' : 'Product unfeatured')
      } else {
        toast.error(data.error || 'Failed to update featured')
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error)
      toast.error('Failed to update featured')
    }
  }

  // ─── Discount calc ────────────────────────────────────────────────────

  const getDiscount = (price: number, mrp: number) => {
    if (mrp <= 0 || price >= mrp) return 0
    return Math.round(((mrp - price) / mrp) * 100)
  }

  // ─── Render helpers ───────────────────────────────────────────────────

  const renderProductThumbnail = (product: Product) => {
    const IconComp = TYPE_ICONS[product.type] || Package
    return (
      <div
        className="flex items-center justify-center w-full h-full rounded-lg"
        style={{ backgroundColor: `${orgAccent}15` }}
      >
        <IconComp className="size-8" style={{ color: orgAccent }} />
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // ─── Skeleton loading ────────────────────────────────────────────────

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-xl">
          <Skeleton className="h-40 rounded-t-xl" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListSkeletons = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="size-12 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )

  // ─── Grid view ────────────────────────────────────────────────────────

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProducts.map((product) => {
        const discount = getDiscount(product.price, product.mrp)
        const TypeIcon = TYPE_ICONS[product.type]
        return (
          <Card
            key={product.id}
            className="rounded-xl overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Thumbnail area */}
            <div className="relative h-40 bg-muted/30">
              {renderProductThumbnail(product)}
              {/* Overlays */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                {product.featured && (
                  <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0 hover:bg-amber-500">
                    <Star className="size-2.5 mr-0.5" /> Featured
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge className="bg-emerald-600 text-white text-xs px-1.5 py-0 hover:bg-emerald-600">
                    {discount}% OFF
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 hover:bg-red-500">
                    Out of Stock
                  </Badge>
                )}
              </div>
              {/* Actions overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0 bg-white/90 shadow-sm hover:bg-white"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(product)}>
                      <Pencil className="size-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleProductStatus(product)}
                    >
                      {product.status === 'published' ? (
                        <>
                          <EyeOff className="size-3.5 mr-2" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5 mr-2" /> Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        setProductToDelete(product)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="size-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <CardContent className="p-4">
              {/* Category & Type */}
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other}`}
                >
                  {product.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TypeIcon className="size-3" />
                  <span className="capitalize">{product.type}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1.5">
                {product.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {product.description}
              </p>

              {/* Price row */}
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-bold"
                  style={{ color: orgAccent }}
                >
                  {product.price === 0 ? 'Free' : formatCurrency(product.price)}
                </span>
                {product.mrp > product.price && product.mrp > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(product.mrp)}
                  </span>
                )}
              </div>

              {/* Stock & Status */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="size-3" />
                  <span>
                    {product.type === 'digital'
                      ? 'Unlimited'
                      : `${product.stock} in stock`}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${STATUS_COLORS[product.status]}`}
                >
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  // ─── List view ────────────────────────────────────────────────────────

  const renderListView = () => (
    <Card className="rounded-xl">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Category</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Price</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Stock</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const discount = getDiscount(product.price, product.mrp)
                const TypeIcon = TYPE_ICONS[product.type]
                return (
                  <tr
                    key={product.id}
                    className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${orgAccent}15` }}
                        >
                          <TypeIcon className="size-4" style={{ color: orgAccent }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {product.type}
                            {product.featured && (
                              <Star className="size-3 inline ml-1 text-amber-500" />
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other}`}
                      >
                        {product.category}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold" style={{ color: orgAccent }}>
                          {product.price === 0 ? 'Free' : formatCurrency(product.price)}
                        </span>
                        {discount > 0 && (
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 hover:bg-emerald-600">
                            {discount}%
                          </Badge>
                        )}
                      </div>
                      {product.mrp > product.price && product.mrp > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(product.mrp)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {product.type === 'digital' ? '∞' : product.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${STATUS_COLORS[product.status]}`}
                      >
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Pencil className="size-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleProductStatus(product)}
                          >
                            {product.status === 'published' ? (
                              <>
                                <EyeOff className="size-3.5 mr-2" /> Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="size-3.5 mr-2" /> Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="size-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
            <Store className="size-6" style={{ color: orgAccent }} />
            Store
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your products and digital goods
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="w-full sm:w-auto text-white"
          style={{ backgroundColor: orgAccent }}
        >
          <Plus className="size-4 mr-2" />
          Add Product
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
              <Package className="size-4" style={{ color: orgAccent }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Products</p>
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
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-lg font-bold text-gray-900">{stats.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-red-50">
              <AlertTriangle className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-lg font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.revenue)}
              </p>
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
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
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
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-9 w-9 p-0"
                onClick={() => setViewMode('grid')}
                style={viewMode === 'grid' ? { backgroundColor: orgAccent } : {}}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-9 w-9 p-0"
                onClick={() => setViewMode('list')}
                style={viewMode === 'list' ? { backgroundColor: orgAccent } : {}}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid / List */}
      {loading ? (
        viewMode === 'grid' ? renderSkeletons() : renderListSkeletons()
      ) : filteredProducts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className="size-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${orgAccent}15` }}
              >
                <Layers className="size-6" style={{ color: orgAccent }} />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {search || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'No products found'
                  : 'No products yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first product to get started'}
              </p>
              {!search && categoryFilter === 'all' && statusFilter === 'all' && (
                <Button
                  onClick={openAddDialog}
                  className="mt-4 text-white"
                  size="sm"
                  style={{ backgroundColor: orgAccent }}
                >
                  <Plus className="size-4 mr-2" /> Add Product
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        renderGridView()
      ) : (
        renderListView()
      )}

      {/* ─── Add/Edit Product Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product details'
                : 'Add a new product to your store'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. JEE Main Physics Book"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0"
                    className="pl-8"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>MRP (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formMrp}
                    onChange={(e) => setFormMrp(e.target.value)}
                    placeholder="0"
                    className="pl-8"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {Number(formMrp) > 0 && Number(formPrice) > 0 && Number(formPrice) < Number(formMrp) && (
              <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-2 rounded-lg">
                Discount: {Math.round(((Number(formMrp) - Number(formPrice)) / Number(formMrp)) * 100)}% off
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ProductType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder={formType === 'digital' ? '999' : '0'}
                  min="0"
                />
                {formType === 'digital' && (
                  <p className="text-xs text-muted-foreground">
                    Digital products have unlimited stock
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProductStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Label className="text-sm">Featured Product</Label>
                <p className="text-xs text-muted-foreground">
                  Featured products are highlighted on your store
                </p>
              </div>
              <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
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
              {editingProduct ? 'Update' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{productToDelete?.title}&rdquo;? This action
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
