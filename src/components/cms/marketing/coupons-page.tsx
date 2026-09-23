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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Percent,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface Coupon {
  id: string
  code: string
  discount: number
  discountType: string
  maxUses: number | null
  usedCount: number
  validFrom: string | null
  validTo: string | null
  isActive: boolean
  organizationId: string
  createdAt: string
  applicableProductIds: string[]
  minPurchaseAmount: number | null
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const { orgCode } = useAppStore()

  // Data
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form
  const [formCode, setFormCode] = useState('')
  const [formDiscount, setFormDiscount] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'flat'>('percentage')
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formValidTo, setFormValidTo] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formApplicableProductIds, setFormApplicableProductIds] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<{id: string, title: string, type: string}[]>([])

  // ─── Fetch ────────────────────────────────────────────────────────────

  const fetchCoupons = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/coupons?organizationId=${orgCode}&limit=100`)
      const data = await res.json()
      if (data.items) {
        setCoupons(data.items)
      } else {
        setError(data.error || 'Failed to load coupons')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  const fetchProducts = useCallback(async () => {
    if (!orgCode) return
    try {
      const [cRes, tRes] = await Promise.all([
        apiFetch(`/api/teacher/courses`),
        apiFetch(`/api/teacher/test-series`)
      ])
      const cData = await cRes.json()
      const tData = await tRes.json()
      
      const prods: {id: string, title: string, type: string}[] = []
      if (cData.items) prods.push(...cData.items.map((i: any) => ({ id: i.id, title: i.title, type: 'Course' })))
      if (tData.items) prods.push(...tData.items.map((i: any) => ({ id: i.id, title: i.title, type: 'Test Series' })))
      setAvailableProducts(prods)
    } catch (err) {
      console.error('Failed to fetch products', err)
    }
  }, [orgCode])

  useEffect(() => {
    fetchCoupons()
    fetchProducts()
  }, [fetchCoupons, fetchProducts])

  // ─── Stats ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalActive = coupons.filter((c) => c.isActive).length
    const totalUsed = coupons.reduce((acc, c) => acc + c.usedCount, 0)
    const now = new Date()
    const expiringSoon = coupons.filter((c) => {
      if (!c.validTo) return false
      const validTo = new Date(c.validTo)
      const diffDays = (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 0 && diffDays <= 7 && c.isActive
    }).length
    return { totalActive, totalUsed, expiringSoon }
  }, [coupons])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormCode('')
    setFormDiscount('')
    setFormDiscountType('percentage')
    setFormMaxUses('')
    setFormValidTo('')
    setFormIsActive(true)
    setFormApplicableProductIds([])
  }

  const openAddDrawer = () => {
    setEditCoupon(null)
    resetForm()
    setDrawerOpen(true)
  }

  const openEditDrawer = (coupon: Coupon) => {
    setEditCoupon(coupon)
    setFormCode(coupon.code)
    setFormDiscount(String(coupon.discount))
    setFormDiscountType(coupon.discountType as 'percentage' | 'flat')
    setFormMaxUses(coupon.maxUses ? String(coupon.maxUses) : '')
    setFormValidTo(coupon.validTo ? coupon.validTo.split('T')[0] : '')
    setFormIsActive(coupon.isActive)
    setFormApplicableProductIds(coupon.applicableProductIds || [])
    setDrawerOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formCode.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (!formDiscount || Number(formDiscount) <= 0) {
      toast.error('Discount must be greater than 0')
      return
    }
    if (formDiscountType === 'percentage' && Number(formDiscount) > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }
    setSaving(true)
    try {
      const body = {
        code: formCode.toUpperCase().trim(),
        discount: Number(formDiscount),
        discountType: formDiscountType,
        maxUses: formMaxUses ? Number(formMaxUses) : null,
        validTo: formValidTo || null,
        isActive: formIsActive,
        organizationId: orgCode,
      }

      if (editCoupon) {
        const res = await apiFetch(`/api/coupons/${editCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update')
        }
        toast.success('Coupon updated')
      } else {
        const res = await apiFetch('/api/coupons', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create')
        }
        toast.success('Coupon created')
      }

      setDrawerOpen(false)
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle active ────────────────────────────────────────────────────

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const res = await apiFetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated')
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
        )
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!couponToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/coupons/${couponToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Coupon deleted')
      setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id))
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage discount coupons
          </p>
        </div>
        <Button onClick={openAddDrawer} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Plus className="size-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
                <CheckCircle className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Active</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalActive}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
                <Zap className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Used</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalUsed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-full bg-red-50">
                <Clock className="size-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className="text-lg font-bold text-gray-900">{stats.expiringSoon}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-px w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 flex-1" />
                  <Skeleton className="h-7 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="rounded-xl">
          <CardContent className="p-0">{renderError(error, fetchCoupons)}</CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && coupons.length === 0 && (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Tag className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No coupons yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first discount coupon</p>
              <Button onClick={openAddDrawer} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                <Plus className="size-4 mr-2" /> Add Coupon
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupon Cards Grid */}
      {!loading && !error && coupons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const isExpired = coupon.validTo && new Date(coupon.validTo) < new Date()
            return (
              <Card key={coupon.id} className="rounded-xl group hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono font-bold text-lg tracking-wide">{coupon.code}</p>
                      <Badge
                        variant="secondary"
                        className={`mt-1 ${
                          coupon.discountType === 'percentage'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discount}% OFF`
                          : `₹${coupon.discount} OFF`}
                      </Badge>
                    </div>
                    <Switch
                      checked={coupon.isActive}
                      onCheckedChange={() => toggleCouponStatus(coupon)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Percent className="size-3" />
                      {coupon.usedCount}/{coupon.maxUses || '∞'} used
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {coupon.validTo
                        ? new Date(coupon.validTo).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'No expiry'}
                    </div>
                  </div>

                  {isExpired && (
                    <Badge className="bg-red-50 text-red-600 w-full justify-center">Expired</Badge>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => openEditDrawer(coupon)}
                    >
                      <Pencil className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setCouponToDelete(coupon)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="size-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Add/Edit Coupon Drawer ────────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</SheetTitle>
            <SheetDescription>
              {editCoupon ? 'Update coupon details' : 'Create a new discount coupon'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER2024"
                className="font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount *</Label>
                <Input
                  type="number"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={formDiscountType} onValueChange={(v) => setFormDiscountType(v as 'percentage' | 'flat')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formDiscount && Number(formDiscount) > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                Preview: {formDiscountType === 'percentage' ? `${formDiscount}% off` : `₹${formDiscount} off`} on
                purchase
              </div>
            )}

            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Valid To</Label>
              <Input
                type="date"
                value={formValidTo}
                onChange={(e) => setFormValidTo(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              <Label>Active</Label>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-black hover:bg-gray-800 text-white" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {editCoupon ? 'Update' : 'Create'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete coupon &ldquo;{couponToDelete?.code}&rdquo;? This action cannot be undone.
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
