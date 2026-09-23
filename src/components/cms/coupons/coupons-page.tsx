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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Percent,
  IndianRupee,
  Copy,
  Search,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface Coupon {
  id: string
  code: string
  discount: number
  discountType: 'percentage' | 'flat'
  maxUses: number | null
  usedCount: number
  validFrom: string
  validTo: string
  isActive: boolean
}

// ─── API data mapper ─────────────────────────────────────────────────────

function mapApiCoupon(apiItem: Record<string, unknown>): Coupon {
  return {
    id: apiItem.id as string,
    code: apiItem.code as string,
    discount: apiItem.discount as number,
    discountType: (apiItem.discountType as 'percentage' | 'flat') || 'percentage',
    maxUses: (apiItem.maxUses as number | null) ?? null,
    usedCount: (apiItem.usedCount as number) || 0,
    validFrom: apiItem.validFrom ? new Date(apiItem.validFrom as string).toISOString().split('T')[0] : '',
    validTo: apiItem.validTo ? new Date(apiItem.validTo as string).toISOString().split('T')[0] : '',
    isActive: (apiItem.isActive as boolean) ?? true,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const prefixes = ['SAVE', 'DEAL', 'OFF', 'NEW', 'PRO']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${suffix}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const { orgCode } = useAppStore()

  // Data
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)

  // Form
  const [formCode, setFormCode] = useState('')
  const [formDiscount, setFormDiscount] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'flat'>('percentage')
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formValidFrom, setFormValidFrom] = useState('')
  const [formValidTo, setFormValidTo] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  // ─── Fetch coupons ───────────────────────────────────────────────────────

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/coupons?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        setCoupons(data.items.map(mapApiCoupon))
      }
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgCode) fetchCoupons()
  }, [orgCode])

  // ─── Filtered Data ─────────────────────────────────────────────────────

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || c.discountType === filterType
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && c.isActive) ||
        (filterStatus === 'inactive' && !c.isActive) ||
        (filterStatus === 'expired' && c.validTo && new Date(c.validTo) < new Date())
      return matchesSearch && matchesType && matchesStatus
    })
  }, [coupons, searchQuery, filterType, filterStatus])

  // ─── Stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter((c) => c.isActive).length
    const totalSavings = coupons.reduce((acc, c) => {
      if (c.discountType === 'flat') return acc + c.discount * c.usedCount
      return acc + c.discount * c.usedCount // Simplified — in real app would need order values
    }, 0)
    const mostUsed = coupons.reduce((max, c) => (c.usedCount > max.usedCount ? c : max), coupons[0])
    return { total, active, totalSavings, mostUsedCode: mostUsed?.code || '—', mostUsedCount: mostUsed?.usedCount || 0 }
  }, [coupons])

  // ─── Form helpers ──────────────────────────────────────────────────────

  const resetForm = () => {
    setFormCode('')
    setFormDiscount('')
    setFormDiscountType('percentage')
    setFormMaxUses('')
    setFormValidFrom('')
    setFormValidTo('')
    setFormIsActive(true)
  }

  const openAddDialog = () => {
    setEditCoupon(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditCoupon(coupon)
    setFormCode(coupon.code)
    setFormDiscount(String(coupon.discount))
    setFormDiscountType(coupon.discountType)
    setFormMaxUses(coupon.maxUses ? String(coupon.maxUses) : '')
    setFormValidFrom(coupon.validFrom)
    setFormValidTo(coupon.validTo)
    setFormIsActive(coupon.isActive)
    setDialogOpen(true)
  }

  const handleAutoGenerate = () => {
    setFormCode(generateCouponCode())
    toast.success('Coupon code generated')
  }

  // ─── Save ──────────────────────────────────────────────────────────────

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
      const payload = {
        code: formCode.toUpperCase().trim(),
        discount: Number(formDiscount),
        discountType: formDiscountType,
        maxUses: formMaxUses ? Number(formMaxUses) : null,
        validFrom: formValidFrom || new Date().toISOString().split('T')[0],
        validTo: formValidTo || null,
        isActive: formIsActive,
        organizationId: orgCode,
      }

      if (editCoupon) {
        const response = await apiFetch(`/api/coupons/${editCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        const data = await response.json()
        if (data.success) {
          setCoupons((prev) =>
            prev.map((c) => (c.id === editCoupon.id ? mapApiCoupon(data.item as Record<string, unknown>) : c))
          )
          toast.success('Coupon updated')
        } else {
          toast.error(data.error || 'Failed to update coupon')
        }
      } else {
        const response = await apiFetch('/api/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const data = await response.json()
        if (data.success) {
          setCoupons((prev) => [mapApiCoupon(data.item as Record<string, unknown>), ...prev])
          toast.success('Coupon created')
        } else {
          toast.error(data.error || 'Failed to create coupon')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle active ─────────────────────────────────────────────────────

  const toggleCouponStatus = async (coupon: Coupon) => {
    const newIsActive = !coupon.isActive
    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newIsActive } : c))
    )
    try {
      const response = await apiFetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newIsActive, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(newIsActive ? 'Coupon activated' : 'Coupon deactivated')
      } else {
        // Revert on failure
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c))
        )
        toast.error(data.error || 'Failed to update coupon status')
      }
    } catch {
      // Revert on failure
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c))
      )
      toast.error('Network error. Please try again.')
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!couponToDelete) return
    try {
      const response = await apiFetch(`/api/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id))
        toast.success('Coupon deleted')
      } else {
        toast.error(data.error || 'Failed to delete coupon')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
    }
  }

  // ─── Copy code ─────────────────────────────────────────────────────────

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Copied "${code}" to clipboard`)
  }

  // ─── Render ────────────────────────────────────────────────────────────

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
        <Button onClick={openAddDialog} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Plus className="size-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-violet-50">
              <Tag className="size-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Coupons</p>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <CheckCircle className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold text-gray-900">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
              <Zap className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Savings</p>
              <p className="text-lg font-bold text-gray-900">₹{stats.totalSavings.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-rose-50">
              <TrendingUp className="size-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Most Used</p>
              <p className="text-lg font-bold text-gray-900">{stats.mostUsedCode}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="rounded-xl bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by coupon code..."
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="flat">Flat (₹)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex items-center justify-center">
              <span className="size-6 animate-spin inline-block border-2 border-gray-300 border-t-gray-900 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ) : filteredCoupons.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Tag className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No coupons found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first discount coupon'}
              </p>
              {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                <Button onClick={openAddDialog} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                  <Plus className="size-4 mr-2" /> Add Coupon
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="hidden sm:table-cell">Usage</TableHead>
                  <TableHead className="hidden md:table-cell">Valid From</TableHead>
                  <TableHead className="hidden md:table-cell">Valid To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.validTo && new Date(coupon.validTo) < new Date()
                  return (
                    <TableRow key={coupon.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm tracking-wide">{coupon.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyCode(coupon.code)}
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            coupon.discountType === 'percentage'
                              ? 'bg-purple-50 text-purple-700 hover:bg-purple-50'
                              : 'bg-teal-50 text-teal-700 hover:bg-teal-50'
                          }
                        >
                          {coupon.discountType === 'percentage' ? (
                            <><Percent className="size-3 mr-0.5" />{coupon.discount}% OFF</>
                          ) : (
                            <><IndianRupee className="size-3 mr-0.5" />₹{coupon.discount} OFF</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{coupon.usedCount}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-sm text-muted-foreground">{coupon.maxUses || '∞'}</span>
                          {coupon.maxUses && (
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses!) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(coupon.validFrom)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(coupon.validTo)}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge className="bg-red-50 text-red-600 hover:bg-red-50">Expired</Badge>
                        ) : coupon.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={coupon.isActive}
                            onCheckedChange={() => toggleCouponStatus(coupon)}
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              setCouponToDelete(coupon)
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
        </Card>
      )}

      {/* ─── Add/Edit Coupon Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
            <DialogDescription>
              {editCoupon ? 'Update coupon details' : 'Create a new discount coupon'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <div className="flex gap-2">
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER2024"
                  className="font-mono uppercase flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAutoGenerate}
                  className="shrink-0"
                >
                  <RefreshCw className="size-4 mr-1.5" />
                  Auto
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Value *</Label>
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
                Preview: {formDiscountType === 'percentage' ? `${formDiscount}% off` : `₹${formDiscount} off`} on purchase
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formValidFrom}
                  onChange={(e) => setFormValidFrom(e.target.value)}
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
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {editCoupon ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ───────────────────────────────────────────────── */}
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
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
