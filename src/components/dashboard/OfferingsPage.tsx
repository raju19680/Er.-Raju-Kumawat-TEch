'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Package, Edit3, Trash2, Eye, EyeOff,
  ChevronDown, BookOpen, ClipboardList, Star, Clock,
  Calendar, DollarSign, Tag, AlertCircle, Loader2,
  CheckCircle2, X, GripVertical, Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourseRef { id: string; title: string }
interface TestSeriesRef { id: string; title: string }

interface Offering {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  validityMode: string
  validityDays: number | null
  endDate: string | null
  status: string
  sortOrder: number
  seoTitle: string | null
  seoDescription: string | null
  courses: CourseRef[]
  testSeriesItems: TestSeriesRef[]
  featuredBulletsList: string[]
  createdAt: string
  updatedAt: string
}

interface FormState {
  title: string
  description: string
  thumbnail: string
  price: string
  mrp: string
  validityMode: string
  validityDays: string
  endDate: string
  status: string
  seoTitle: string
  seoDescription: string
  selectedCourseIds: string[]
  selectedTestSeriesIds: string[]
  bulletInput: string
  featuredBullets: string[]
}

const DEFAULT_FORM: FormState = {
  title: '',
  description: '',
  thumbnail: '',
  price: '',
  mrp: '',
  validityMode: 'lifetime',
  validityDays: '',
  endDate: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  selectedCourseIds: [],
  selectedTestSeriesIds: [],
  bulletInput: '',
  featuredBullets: [],
}

// ─── Validity badge helper ────────────────────────────────────────────────────
function ValidityBadge({ mode, days, endDate }: { mode: string; days: number | null; endDate: string | null }) {
  if (mode === 'lifetime') return <Badge variant="secondary" className="text-xs">♾ Lifetime</Badge>
  if (mode === 'days' && days) return <Badge variant="secondary" className="text-xs">⏱ {days} Days</Badge>
  if (mode === 'end_date' && endDate) return <Badge variant="secondary" className="text-xs">📅 Till {new Date(endDate).toLocaleDateString('en-IN')}</Badge>
  return <Badge variant="secondary" className="text-xs">Lifetime</Badge>
}

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number;
  icon: React.ComponentType<{ className?: string }>; color: string
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`size-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  // Available courses and test series for selection
  const [availableCourses, setAvailableCourses] = useState<CourseRef[]>([])
  const [availableTestSeries, setAvailableTestSeries] = useState<TestSeriesRef[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // ─── Fetch offerings ──────────────────────────────────────────────────────
  const fetchOfferings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/teacher/offerings?${params}`)
      const data = await res.json()
      if (data.success) setOfferings(data.offerings || [])
      else throw new Error(data.error || 'Failed to load offerings')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load offerings'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  // ─── Fetch available courses & test series ────────────────────────────────
  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const [cRes, tsRes] = await Promise.all([
        fetch('/api/teacher/courses?limit=100'),
        fetch('/api/teacher/test-series?limit=100'),
      ])
      const [cData, tsData] = await Promise.all([cRes.json(), tsRes.json()])
      setAvailableCourses(
        (cData.items || []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
      )
      setAvailableTestSeries(
        (tsData.items || []).map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))
      )
    } catch {
      // Non-critical – just log
      console.warn('Could not load courses/test series options')
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  useEffect(() => { fetchOfferings() }, [fetchOfferings])
  useEffect(() => { if (dialogOpen) fetchOptions() }, [dialogOpen, fetchOptions])

  // ─── Open dialog for create/edit ──────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  const openEdit = (o: Offering) => {
    setEditingId(o.id)
    setForm({
      title: o.title,
      description: o.description || '',
      thumbnail: o.thumbnail || '',
      price: String(o.price),
      mrp: String(o.mrp),
      validityMode: o.validityMode,
      validityDays: o.validityDays ? String(o.validityDays) : '',
      endDate: o.endDate ? o.endDate.split('T')[0] : '',
      status: o.status,
      seoTitle: o.seoTitle || '',
      seoDescription: o.seoDescription || '',
      selectedCourseIds: o.courses.map(c => c.id),
      selectedTestSeriesIds: o.testSeriesItems.map(t => t.id),
      bulletInput: '',
      featuredBullets: o.featuredBulletsList || [],
    })
    setDialogOpen(true)
  }

  // ─── Save (create or update) ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title.trim(),
        description: form.description.trim() || null,
        thumbnail: form.thumbnail.trim() || null,
        price: parseFloat(form.price) || 0,
        mrp: parseFloat(form.mrp) || 0,
        validityMode: form.validityMode,
        validityDays: form.validityMode === 'days' && form.validityDays ? parseInt(form.validityDays) : null,
        endDate: form.validityMode === 'end_date' && form.endDate ? form.endDate : null,
        status: form.status,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        includedCourses: form.selectedCourseIds,
        includedTestSeries: form.selectedTestSeriesIds,
        featuredBullets: form.featuredBullets,
      }

      const res = await fetch('/api/teacher/offerings', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      toast.success(editingId ? 'Offering updated!' : 'Offering created!')
      setDialogOpen(false)
      fetchOfferings()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/teacher/offerings?id=${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      toast.success('Offering deleted')
      setDeleteDialogOpen(false)
      setDeleteId(null)
      fetchOfferings()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  // ─── Toggle status ────────────────────────────────────────────────────────
  const toggleStatus = async (o: Offering) => {
    const newStatus = o.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch('/api/teacher/offerings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Offering ${newStatus === 'published' ? 'published' : 'unpublished'}`)
      fetchOfferings()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  // ─── Toggle course/test series selection ──────────────────────────────────
  const toggleCourse = (id: string) => {
    setForm(f => ({
      ...f,
      selectedCourseIds: f.selectedCourseIds.includes(id)
        ? f.selectedCourseIds.filter(x => x !== id)
        : [...f.selectedCourseIds, id],
    }))
  }
  const toggleTestSeries = (id: string) => {
    setForm(f => ({
      ...f,
      selectedTestSeriesIds: f.selectedTestSeriesIds.includes(id)
        ? f.selectedTestSeriesIds.filter(x => x !== id)
        : [...f.selectedTestSeriesIds, id],
    }))
  }

  const addBullet = () => {
    if (!form.bulletInput.trim()) return
    setForm(f => ({
      ...f,
      featuredBullets: [...f.featuredBullets, f.bulletInput.trim()],
      bulletInput: '',
    }))
  }

  const removeBullet = (idx: number) => {
    setForm(f => ({ ...f, featuredBullets: f.featuredBullets.filter((_, i) => i !== idx) }))
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: offerings.length,
    published: offerings.filter(o => o.status === 'published').length,
    draft: offerings.filter(o => o.status === 'draft').length,
    avgPrice: offerings.length
      ? Math.round(offerings.reduce((s, o) => s + o.price, 0) / offerings.length)
      : 0,
  }

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = offerings.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  // ─── Discount % ───────────────────────────────────────────────────────────
  const discountPct = (price: number, mrp: number) =>
    mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="size-6 text-primary" />
            Offerings & Bundles
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create combo packages combining courses and test series
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="size-4 mr-2" />
          New Offering
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Offerings" value={stats.total} icon={Package} color="bg-primary/10 text-primary" />
        <StatCard label="Published" value={stats.published} icon={CheckCircle2} color="bg-green-500/10 text-green-600" />
        <StatCard label="Drafts" value={stats.draft} icon={Edit3} color="bg-amber-500/10 text-amber-600" />
        <StatCard label="Avg Price" value={`₹${stats.avgPrice.toLocaleString('en-IN')}`} icon={Tag} color="bg-purple-500/10 text-purple-600" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search offerings..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Offerings Grid ── */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package className="size-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No offerings found</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {search || statusFilter !== 'all'
                ? 'Try changing your filters'
                : 'Create your first combo offering to bundle courses and test series'}
            </p>
            <Button onClick={openCreate}>
              <Plus className="size-4 mr-2" />
              Create Offering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(offering => {
            const pct = discountPct(offering.price, offering.mrp)
            const isFree = offering.price === 0
            return (
              <Card key={offering.id} className="group overflow-hidden flex flex-col transition-shadow hover:shadow-md border-border/60">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                  {offering.thumbnail ? (
                    <img src={offering.thumbnail} alt={offering.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Layers className="size-12 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge
                      className={offering.status === 'published'
                        ? 'bg-green-500 text-white border-0'
                        : 'bg-amber-500 text-white border-0'}
                    >
                      {offering.status}
                    </Badge>
                    {pct > 0 && (
                      <Badge className="bg-red-500 text-white border-0">{pct}% OFF</Badge>
                    )}
                  </div>
                </div>

                <CardContent className="flex-1 pt-4 pb-3 space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{offering.title}</h3>
                  {offering.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{offering.description}</p>
                  )}

                  {/* Included items */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {offering.courses.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        <BookOpen className="size-3" />
                        {offering.courses.length} Course{offering.courses.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {offering.testSeriesItems.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full">
                        <ClipboardList className="size-3" />
                        {offering.testSeriesItems.length} Test Series
                      </span>
                    )}
                    <ValidityBadge mode={offering.validityMode} days={offering.validityDays} endDate={offering.endDate} />
                  </div>

                  {/* Bullets */}
                  {offering.featuredBulletsList.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {offering.featuredBulletsList.slice(0, 3).map((b, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="size-3 text-green-500 mt-0.5 shrink-0" />
                          {b}
                        </li>
                      ))}
                      {offering.featuredBulletsList.length > 3 && (
                        <li className="text-xs text-muted-foreground pl-4.5">
                          +{offering.featuredBulletsList.length - 3} more features
                        </li>
                      )}
                    </ul>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 pt-2">
                    {isFree ? (
                      <span className="text-lg font-bold text-green-600">Free</span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-foreground">₹{offering.price.toLocaleString('en-IN')}</span>
                        {offering.mrp > offering.price && (
                          <span className="text-sm text-muted-foreground line-through">₹{offering.mrp.toLocaleString('en-IN')}</span>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(offering)}>
                    <Edit3 className="size-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={offering.status === 'published' ? 'secondary' : 'default'}
                    className="flex-1"
                    onClick={() => toggleStatus(offering)}
                  >
                    {offering.status === 'published' ? (
                      <><EyeOff className="size-3 mr-1" />Unpublish</>
                    ) : (
                      <><Eye className="size-3 mr-1" />Publish</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { setDeleteId(offering.id); setDeleteDialogOpen(true) }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          CREATE / EDIT DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Offering' : 'Create New Offering'}</DialogTitle>
            <DialogDescription>
              Bundle courses and test series into a single purchasable package
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Star className="size-4 text-primary" />Basic Info
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g., NEET 2026 Complete Package"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what's included and why students should buy..."
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Thumbnail URL</Label>
                  <Input
                    placeholder="https://..."
                    value={form.thumbnail}
                    onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />Pricing
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Set 0 for free</p>
                </div>
                <div className="space-y-1">
                  <Label>MRP (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.mrp}
                    onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">For showing discount</p>
                </div>
              </div>
              {form.price && form.mrp && parseFloat(form.mrp) > parseFloat(form.price) && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="size-4" />
                  {discountPct(parseFloat(form.price), parseFloat(form.mrp))}% discount applied
                </div>
              )}
            </div>

            <Separator />

            {/* Validity */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />Validity
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Validity Mode</Label>
                  <Select value={form.validityMode} onValueChange={v => setForm(f => ({ ...f, validityMode: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lifetime">♾ Lifetime Access</SelectItem>
                      <SelectItem value="days">⏱ Fixed Days</SelectItem>
                      <SelectItem value="end_date">📅 End Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.validityMode === 'days' && (
                  <div className="space-y-1">
                    <Label>Number of Days</Label>
                    <Input
                      type="number"
                      placeholder="365"
                      value={form.validityDays}
                      onChange={e => setForm(f => ({ ...f, validityDays: e.target.value }))}
                    />
                  </div>
                )}
                {form.validityMode === 'end_date' && (
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Included Content */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />Included Content
              </h4>

              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />Loading available content...
                </div>
              ) : (
                <>
                  {/* Courses */}
                  {availableCourses.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Courses ({form.selectedCourseIds.length} selected)
                      </Label>
                      <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                        {availableCourses.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCourse(c.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                              form.selectedCourseIds.includes(c.id)
                                ? 'bg-primary/5 text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            <BookOpen className="size-4 shrink-0" />
                            <span className="flex-1 truncate">{c.title}</span>
                            {form.selectedCourseIds.includes(c.id) && (
                              <CheckCircle2 className="size-4 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Series */}
                  {availableTestSeries.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Test Series ({form.selectedTestSeriesIds.length} selected)
                      </Label>
                      <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                        {availableTestSeries.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTestSeries(t.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                              form.selectedTestSeriesIds.includes(t.id)
                                ? 'bg-primary/5 text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            <ClipboardList className="size-4 shrink-0" />
                            <span className="flex-1 truncate">{t.title}</span>
                            {form.selectedTestSeriesIds.includes(t.id) && (
                              <CheckCircle2 className="size-4 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableCourses.length === 0 && availableTestSeries.length === 0 && (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                      No courses or test series found. Create some first.
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Feature Bullets */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />Feature Highlights
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Full NEET syllabus coverage"
                  value={form.bulletInput}
                  onChange={e => setForm(f => ({ ...f, bulletInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBullet() } }}
                />
                <Button type="button" variant="outline" onClick={addBullet}>Add</Button>
              </div>
              {form.featuredBullets.length > 0 && (
                <ul className="space-y-1.5">
                  {form.featuredBullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2">
                      <GripVertical className="size-3 text-muted-foreground" />
                      <span className="flex-1">{b}</span>
                      <button onClick={() => removeBullet(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Status & SEO */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="size-4 text-primary" />Status & SEO
              </h4>
              <div className="flex items-center gap-3">
                <Switch
                  id="offering-status"
                  checked={form.status === 'published'}
                  onCheckedChange={v => setForm(f => ({ ...f, status: v ? 'published' : 'draft' }))}
                />
                <Label htmlFor="offering-status" className="cursor-pointer">
                  {form.status === 'published' ? (
                    <span className="text-green-600 font-medium">Published (visible to students)</span>
                  ) : (
                    <span className="text-muted-foreground">Draft (hidden)</span>
                  )}
                </Label>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label>SEO Title</Label>
                  <Input
                    placeholder="For search engines..."
                    value={form.seoTitle}
                    onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>SEO Description</Label>
                  <Textarea
                    placeholder="Meta description for search engines..."
                    rows={2}
                    value={form.seoDescription}
                    onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving...</> : (editingId ? 'Update Offering' : 'Create Offering')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              Delete Offering
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The offering will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
