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
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────
interface Coupon {
  id: string
  code: string
  discount: number
  discountType: string
  minPurchaseAmount: number | null
  applicableProductIds: string[]
  maxUses: number | null
  usedCount: number
  validFrom: string | null
  validTo: string | null
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface CouponForm {
  code: string
  discount: string
  discountType: string
  minPurchaseAmount: string
  applicableProductIds: string
  maxUses: string
  validFrom: string
  validTo: string
  isActive: boolean
}

const emptyForm: CouponForm = {
  code: '',
  discount: '',
  discountType: 'percentage',
  minPurchaseAmount: '',
  applicableProductIds: '',
  maxUses: '',
  validFrom: '',
  validTo: '',
  isActive: true,
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COUPONS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function CouponsPage() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<Coupon[]>([])
  const [products, setProducts] = useState<{id: string, title: string, type: string}[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'used'>('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const itemsPerPage = 10

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Coupon | null>(null)
  const [itemToDelete, setItemToDelete] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState<CouponForm>(emptyForm)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const fetchProducts = useCallback(async () => {
    try {
      const [resC, resT] = await Promise.all([
        apiFetch("/api/courses?organizationId=" + orgCode),
        apiFetch("/api/test-series?organizationId=" + orgCode)
      ])
      const courses = (await resC.json()).items || []
      const testSeries = (await resT.json()).items || []
      setProducts([
        ...courses.map((c: any) => ({id: c.id, title: c.title, type: "Course"})),
        ...testSeries.map((t: any) => ({id: t.id, title: t.title, type: "Test Series"}))
      ])
    } catch (e) { console.error(e) }
  }, [orgCode])

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
      else if (statusFilter === 'expired' || statusFilter === 'used') {
        // For expired/used we fetch all and filter client-side
        // since API only supports isActive filter
      }

      const res = await apiFetch(`/api/coupons?${params}`)
      if (res.ok) {
        const data = await res.json()
        let fetchedItems: Coupon[] = data.items || []
        const total = data.total || 0

        // Client-side filtering for expired/used
        if (statusFilter === 'expired') {
          fetchedItems = fetchedItems.filter((item: Coupon) => {
            if (item.validTo && new Date(item.validTo) < new Date()) return true
            return false
          })
        } else if (statusFilter === 'used') {
          fetchedItems = fetchedItems.filter((item: Coupon) => item.usedCount >= (item.maxUses || Infinity))
        }

        setItems(fetchedItems)
        setTotalItems(statusFilter === 'all' || statusFilter === 'active' ? total : fetchedItems.length)

        // Compute stats from all items (no filter)
        const allParams = new URLSearchParams({
          organizationId: orgCode,
          page: '1',
          limit: '1000',
        })
        const allRes = await apiFetch(`/api/coupons?${allParams}`)
        if (allRes.ok) {
          const allData = await allRes.json()
          const allItems: Coupon[] = allData.items || []
          const now = new Date()
          setStats({
            total: allData.total || allItems.length,
            active: allItems.filter((i: Coupon) => i.isActive && (!i.validTo || new Date(i.validTo) >= now) && (i.maxUses === null || i.usedCount < i.maxUses)).length,
            used: allItems.filter((i: Coupon) => i.maxUses !== null && i.usedCount >= i.maxUses).length,
            expired: allItems.filter((i: Coupon) => i.validTo && new Date(i.validTo) < now).length,
          })
        }
      }
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchItems()
    fetchProducts()
  }, [fetchItems, fetchProducts])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: Coupon) => {
    setEditingItem(item)
    setForm({
      code: item.code || '',
      discount: String(item.discount ?? ''),
      discountType: item.discountType || 'percentage',
      minPurchaseAmount: item.minPurchaseAmount !== null ? String(item.minPurchaseAmount) : '',
      applicableProductIds: item.applicableProductIds ? item.applicableProductIds.join(', ') : '',
      maxUses: item.maxUses !== null ? String(item.maxUses) : '',
      validFrom: item.validFrom ? new Date(item.validFrom).toISOString().slice(0, 16) : '',
      validTo: item.validTo ? new Date(item.validTo).toISOString().slice(0, 16) : '',
      isActive: item.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (!form.discount || Number(form.discount) <= 0) {
      toast.error('Discount value must be greater than 0')
      return
    }
    if (form.discountType === 'percentage' && Number(form.discount) > 100) {
      toast.error('Percentage discount cannot exceed 100')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discount: Number(form.discount),
        discountType: form.discountType,
        minPurchaseAmount: form.minPurchaseAmount ? Number(form.minPurchaseAmount) : null,
        applicableProductIds: form.applicableProductIds ? form.applicableProductIds.split(',').map(s => s.trim()).filter(Boolean) : [],
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        isActive: form.isActive,
      }

      if (editingItem) {
        const res = await apiFetch(`/api/coupons/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to update coupon')
          return
        }
        toast.success('Coupon updated successfully')
      } else {
        const res = await apiFetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, organizationId: orgCode }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to create coupon')
          return
        }
        toast.success('Coupon created successfully')
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

  const handleToggleActive = async (item: Coupon) => {
    try {
      const res = await apiFetch(`/api/coupons/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(item.isActive ? 'Coupon deactivated' : 'Coupon activated')
      fetchItems()
    } catch {
      toast.error('Failed to update coupon status')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/coupons/${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Coupon deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete coupon')
    } finally {
      setDeleting(false)
    }
  }

  const getCouponStatus = (item: Coupon) => {
    if (!item.isActive) return 'inactive'
    if (item.validTo && new Date(item.validTo) < new Date()) return 'expired'
    if (item.maxUses !== null && item.usedCount >= item.maxUses) return 'used'
    return 'active'
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Coupons',
      value: stats.total,
      icon: Ticket,
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
    {
      title: 'Used',
      value: stats.used,
      accentBg: 'bg-sky-50',
      accentIcon: 'text-sky-600',
      accentBorder: 'border-l-sky-500',
      icon: Clock,
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: XCircle,
      accentBg: 'bg-red-50',
      accentIcon: 'text-red-600',
      accentBorder: 'border-l-red-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage discount coupons for your organization</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
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
            placeholder="Search coupons by code..."
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
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Purchase</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Max Uses</TableHead>
              <TableHead>Used Count</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  <Ticket className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No coupons found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create a coupon to get started'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => {
                const status = getCouponStatus(item)
                return (
                  <TableRow key={item.id} className="group hover:bg-gray-50">
                    <TableCell className="text-muted-foreground text-sm">
                      {(currentPageNum - 1) * itemsPerPage + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold uppercase text-xs px-2 py-0.5">
                        {item.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {item.discountType === 'percentage' ? `${item.discount}%` : `₹${item.discount}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.minPurchaseAmount ? `₹${item.minPurchaseAmount}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className="text-xs">
                        {item.discountType === 'percentage' ? '% Percentage' : '₹ Flat'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.maxUses ?? '∞'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={item.maxUses !== null && item.usedCount >= item.maxUses ? 'text-red-600 font-medium' : ''}>
                        {item.usedCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {item.validFrom && (
                          <span className="text-xs">From: {new Date(item.validFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        )}
                        {item.validTo && (
                          <span className="text-xs">To: {new Date(item.validTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        )}
                        {!item.validFrom && !item.validTo && <span className="text-xs">No expiry</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {status === 'active' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>}
                      {status === 'expired' && <Badge className="bg-red-50 text-red-700 border-red-200">Expired</Badge>}
                      {status === 'used' && <Badge className="bg-sky-50 text-sky-700 border-sky-200">Used</Badge>}
                      {status === 'inactive' && <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>}
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
                          <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                            {item.isActive ? 'Deactivate' : 'Activate'}
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
                )
              })
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

      {/* Add/Edit Coupon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the coupon details below.' : 'Fill in the details to create a new coupon.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="coupon-code">
                Coupon Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20, WELCOME50"
                className="uppercase"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Code will be auto-converted to uppercase
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="coupon-discount">
                  Discount Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coupon-discount"
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coupon-type">Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm({ ...form, discountType: v })}
                >
                  <SelectTrigger id="coupon-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="coupon-min-purchase">Min Purchase Amount (₹)</Label>
                <Input
                  id="coupon-min-purchase"
                  type="number"
                  min="0"
                  value={form.minPurchaseAmount}
                  onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                  placeholder="e.g. 500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coupon-max-uses">Max Uses</Label>
                <Input
                  id="coupon-max-uses"
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Unlimited if empty"
                />
              </div>
            </div>
              <div className="grid gap-2">
                <Label htmlFor="coupon-products">Applicable Products</Label>
                <div className="flex flex-col gap-2">
                  <select
                    id="coupon-products"
                    multiple
                    value={form.applicableProductIds ? form.applicableProductIds.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setForm({ ...form, applicableProductIds: selected.join(',') })
                    }}
                    className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.type}: {p.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple. Leave unselected for all products.
                  </p>
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="coupon-valid-from">Valid From</Label>
                <Input
                  id="coupon-valid-from"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coupon-valid-to">Valid To</Label>
                <Input
                  id="coupon-valid-to"
                  type="datetime-local"
                  value={form.validTo}
                  onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="coupon-active" className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">Enable this coupon for use</p>
              </div>
              <Switch
                id="coupon-active"
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
              {saving ? 'Saving...' : editingItem ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete coupon{' '}
              <span className="font-mono font-semibold">{itemToDelete?.code}</span>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
