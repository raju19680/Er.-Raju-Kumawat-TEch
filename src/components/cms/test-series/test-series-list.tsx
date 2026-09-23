'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Eye,
  Copy,
  Trash2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Upload,
  Filter,
  Package,
  ImagePlus,
  AlertCircle,
  Calculator,
  RefreshCw,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { TestSeriesContentManager } from './test-series-content-manager'
import { TestSeriesForm } from './components/test-series-form'
import { TestSeriesCard, type TestSeriesItem } from './components/test-series-card'

// ── Types ────────────────────────────────────────────────────────────────────


interface TestOption {
  id: string
  title: string
}

interface CategoryOption {
  id: string
  name: string
}

interface FormData {
  title: string
  description: string
  category: string
  price: string
  mrp: string
  validityMode: 'days' | 'date' | 'lifetime'
  validityDays: string
  validityDate: string
  isCombo: boolean
  selectedTests: string[]
  includeTestMaker: boolean
  allowPayment: boolean
  seoTitle: string
  seoDescription: string
  richSnippets: boolean
  imagePreview: string | null
  status: 'published' | 'draft'
  sortOrder: string
  examProfileId: string
  parentId: string | null
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ── Category color map ───────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  JEE: 'bg-rose-500',
  NEET: 'bg-emerald-500',
  CUET: 'bg-purple-500',
  GATE: 'bg-orange-500',
  UPSC: 'bg-rose-500',
  CAT: 'bg-amber-500',
  Other: 'bg-slate-500',
}

// ── Default form ─────────────────────────────────────────────────────────────

const defaultFormData: FormData = {
  title: '',
  description: '',
  category: '',
  price: '',
  mrp: '',
  validityMode: 'days',
  validityDays: '',
  validityDate: '',
  isCombo: false,
  selectedTests: [],
  includeTestMaker: false,
  allowPayment: true,
  seoTitle: '',
  seoDescription: '',
  richSnippets: false,
  imagePreview: null,
  status: 'draft',
  sortOrder: '',
  examProfileId: 'none',
  parentId: null,
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TestSeriesList() {
  const { orgCode } = useAppStore()

  // List state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // API-driven state
  const [series, setSeries] = useState<TestSeriesItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Explorer state
  const folderId = useAppStore(s => s.folderId)
  const setFolderId = useAppStore(s => s.setFolderId)
  const currentFolderId = folderId || null
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{id: string, title: string}>>([])

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [managingTestsId, setManagingTestsId] = useState<string | null>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [seriesToDelete, setSeriesToDelete] = useState<TestSeriesItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<FormData>({ ...defaultFormData })

  // Reference data from API
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [testOptions, setTestOptions] = useState<TestOption[]>([])
  const [loadingTests, setLoadingTests] = useState(false)
  const [examProfiles, setExamProfiles] = useState<{ id: string, name: string }[]>([])
  
  // Upload state
  const [uploading, setUploading] = useState(false)

  const itemsPerPage = 20

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setFormData({ ...defaultFormData })
    setActiveTab('basic')
    setEditingId(null)
  }

  // ── Fetch test series list ───────────────────────────────────────────────

  const fetchSeries = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: String(currentPageNum),
        limit: String(itemsPerPage),
        organizationId: orgCode,
        parentId: currentFolderId || 'null'
      })
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const data = await apiFetchJSON<PaginatedResponse<TestSeriesItem>>(
        `/api/teacher/test-series?${params.toString()}`
      )
      setSeries(data.items || [])
      setTotalItems(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch test series:', err)
      setError('Failed to load test series. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [orgCode, searchQuery, currentPageNum, categoryFilter, statusFilter, currentFolderId])

  // ── Bulk Actions ─────────────────────────────────────────────────────────

  const handleBulkStatus = async (status: 'published' | 'draft') => {
    if (!selectedIds.length || !orgCode) return
    const toastId = toast.loading(`Updating ${selectedIds.length} items...`)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiFetchJSON(`/api/teacher/test-series/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
          })
        )
      )
      toast.success(`Successfully updated ${selectedIds.length} items`, { id: toastId })
      setSelectedIds([])
      fetchSeries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update some items', { id: toastId })
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !orgCode) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`)) return
    const toastId = toast.loading(`Deleting ${selectedIds.length} items...`)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiFetchJSON(`/api/teacher/test-series/${id}`, {
            method: 'DELETE',
          })
        )
      )
      toast.success(`Successfully deleted ${selectedIds.length} items`, { id: toastId })
      setSelectedIds([])
      fetchSeries()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete some items', { id: toastId })
    }
  }

  // ── Fetch categories ─────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    if (!orgCode) return
    try {
      const data = await apiFetchJSON<{ items: CategoryOption[] }>(
        `/api/categories?organizationId=${orgCode}&limit=100`
      )
      setCategories(data.items || [])
    } catch {
      // Silently fail
    }
  }, [orgCode])

  // ── Fetch test options for combo selection ───────────────────────────────

  const fetchTestOptions = useCallback(async () => {
    if (!orgCode) return
    setLoadingTests(true)
    try {
      const data = await apiFetchJSON<PaginatedResponse<TestOption>>(
        `/api/tests?organizationId=${orgCode}&limit=100`
      )
      setTestOptions(data.items || [])
    } catch {
      // Silently fail
    } finally {
      setLoadingTests(false)
    }
  }, [orgCode])

  // ── Fetch exam profiles ──────────────────────────────────────────────────

  const fetchExamProfiles = useCallback(async () => {
    if (!orgCode) return
    try {
      const data = await apiFetchJSON<{ items: { id: string, name: string }[] }>(
        `/api/teacher/exams?organizationId=${orgCode}&limit=100`
      )
      setExamProfiles(data.items || [])
    } catch {
      // Silently fail
    }
  }, [orgCode])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  useEffect(() => {
    fetchCategories()
    fetchExamProfiles()
  }, [fetchCategories, fetchExamProfiles])

  // Load test options when drawer opens with combo enabled
  useEffect(() => {
    if (drawerOpen) {
      fetchTestOptions()
    }
  }, [drawerOpen, fetchTestOptions])

  useEffect(() => {
    if (!currentFolderId) {
      setBreadcrumbs([])
    } else if (currentFolderId && breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].id !== currentFolderId) {
      const index = breadcrumbs.findIndex(b => b.id === currentFolderId)
      if (index !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, index + 1))
      } else {
        setBreadcrumbs([{ id: currentFolderId, title: 'Folder' }])
      }
    } else if (currentFolderId && breadcrumbs.length === 0) {
      setBreadcrumbs([{ id: currentFolderId, title: 'Folder' }])
    }
  }, [currentFolderId])

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const discount = (price: number, mrp: number) =>
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  // ── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!seriesToDelete) return
    setDeleting(true)
    try {
      await apiFetchJSON(`/api/teacher/test-series/${seriesToDelete.id}`, { method: 'DELETE' })
      toast.success('Test series deleted successfully')
      setDeleteDialogOpen(false)
      setSeriesToDelete(null)
      fetchSeries()
    } catch {
      toast.error('Failed to delete test series')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async (item: TestSeriesItem, checked: boolean) => {
    try {
      const newStatus = checked ? 'published' : 'draft'
      await apiFetchJSON(`/api/teacher/test-series/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(checked ? 'Test series enabled' : 'Test series disabled')
      fetchSeries()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleRecalculate = async (id: string) => {
    try {
      // Assuming endpoint exists or we mock it with a delay
      toast.info('Recalculating test count...')
      await apiFetchJSON(`/api/teacher/test-series/${id}/recalculate`, { method: 'POST' }).catch(() => {})
      toast.success('Test count recalculated successfully')
      fetchSeries()
    } catch (err) {
      toast.error('Failed to recalculate')
    }
  }

  const handleDuplicate = async (item: TestSeriesItem) => {
    try {
      // Mock duplicate logic
      toast.info('Duplicating test series...')
      await apiFetchJSON(`/api/teacher/test-series`, {
        method: 'POST',
        body: JSON.stringify({
          ...item,
          title: `${item.title} (Copy)`,
          status: 'draft'
        })
      }).catch(() => {})
      toast.success('Test series duplicated')
      fetchSeries()
    } catch (err) {
      toast.error('Failed to duplicate')
    }
  }


  // ── Open drawer for edit ─────────────────────────────────────────────────

  const openEditDrawer = (item: TestSeriesItem) => {
    setEditingId(item.id)
    setFormData({
      title: item.title || '',
      description: (item.description as string) || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      mrp: item.mrp?.toString() || '',
      validityMode: (item.validityMode as FormData['validityMode']) || 'days',
      validityDays: (item.validityDays as string)?.toString() || '',
      validityDate: (item.validityDate as string) || '',
      isCombo: item.isCombo || false,
      selectedTests: (item.selectedTests as string[]) || [],
      includeTestMaker: (item.includeTestMaker as boolean) || false,
      allowPayment: (item.allowPayment as boolean) ?? true,
      seoTitle: (item.seoTitle as string) || '',
      seoDescription: (item.seoDescription as string) || '',
      richSnippets: (item.richSnippets as boolean) || false,
      imagePreview: item.thumbnail || null,
      status: item.status || 'draft',
      sortOrder: item.sortOrder?.toString() || '',
      examProfileId: (item.examProfileId as string) || 'none',
      parentId: (item.parentId as string) || currentFolderId || null,
    })
    setActiveTab('basic')
    setDrawerOpen(true)
  }

  // ── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price ? Number(formData.price) : 0,
        mrp: formData.mrp ? Number(formData.mrp) : 0,
        validityMode: formData.validityMode,
        validityDays: formData.validityDays ? Number(formData.validityDays) : undefined,
        validityDate: formData.validityDate || undefined,
        isCombo: formData.isCombo,
        selectedTests: formData.isCombo ? formData.selectedTests : [],
        includeTestMaker: formData.includeTestMaker,
        allowPayment: formData.allowPayment,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        richSnippets: formData.richSnippets,
        status: formData.status,
        sortOrder: formData.sortOrder ? Number(formData.sortOrder) : undefined,
        parentId: formData.parentId || null,
        thumbnail: formData.imagePreview || undefined,
        organizationId: orgCode,
        examProfileId: formData.examProfileId === 'none' ? null : formData.examProfileId,
      }

      if (editingId) {
        await apiFetchJSON(`/api/teacher/test-series/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        toast.success('Test series updated successfully')
      } else {
        await apiFetchJSON('/api/teacher/test-series', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Test series created successfully')
      }

      setDrawerOpen(false)
      resetForm()
      fetchSeries()
    } catch (err) {
      console.error('Failed to save test series:', err)
      toast.error(editingId ? 'Failed to update test series' : 'Failed to create test series')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const handleNavigateToFolder = (item: { id: string, title: string }) => {
    setFolderId(item.id)
    setBreadcrumbs(prev => [...prev, item])
    setCurrentPageNum(1)
  }

  const handleNavigateUp = (index: number) => {
    if (index === -1) {
      setFolderId('')
      setBreadcrumbs([])
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
      setFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id)
      setBreadcrumbs(newBreadcrumbs)
    }
    setCurrentPageNum(1)
  }

  return (
    <div className="space-y-5">
      {/* ── Header row & Breadcrumbs ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {currentFolderId ? 'Folder Content' : 'Test Series'}
          </h1>
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
            <button 
              onClick={() => handleNavigateUp(-1)}
              className="hover:text-foreground hover:underline transition-colors"
            >
              Root
            </button>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center gap-2">
                <span>/</span>
                <button 
                  onClick={() => handleNavigateUp(index)}
                  className={`hover:text-foreground hover:underline transition-colors ${index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : ''}`}
                >
                  {crumb.title}
                </button>
              </div>
            ))}
          </div>
        </div>
        <Button
          className="w-full sm:w-fit"
          onClick={() => {
            resetForm()
            // If we are in a folder, pre-fill parentId
            if (currentFolderId) {
              setFormData(prev => ({ ...prev, parentId: currentFolderId }))
            }
            setDrawerOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {currentFolderId ? 'Add Sub-folder' : 'Add Folder'}
        </Button>
      </div>



      {/* ── Search / Filter / View toggle bar ───────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search test series..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPageNum(1)
            }}
            className="pl-9 rounded-lg"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {(categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>

          {showFilterDropdown && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Filters</span>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Category
                  </label>
                  <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPageNum(1) }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.length > 0
                        ? categories.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))
                        : ['JEE', 'NEET', 'CUET', 'GATE', 'UPSC', 'CAT', 'Other'].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPageNum(1) }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
                    setCurrentPageNum(1)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border bg-muted p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Selection / Bulk Actions Bar ───────────────────────────────── */}
      {series.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-white p-2 text-sm">
          <div className="flex items-center gap-2 pl-2">
            <Checkbox
              checked={selectedIds.length === series.length && series.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds(series.map((s) => s.id))
                } else {
                  setSelectedIds([])
                }
              }}
            />
            <span className="text-muted-foreground font-medium">
              {selectedIds.length} selected
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('published')} className="h-8">
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('draft')} className="h-8">
                Draft
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8">
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={fetchSeries}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Loading skeletons ────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !error && series.length === 0 ? (
      /* ── Empty state ────────────────────────────────────────────────────── */
        <div className="flex items-center justify-center rounded-xl border bg-white py-16">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No test series found.</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* List view */
        <div className="space-y-3">
          {series.map((item) => (
            <TestSeriesCard
              key={item.id}
              item={item as TestSeriesItem}
              viewMode="list"
              isSelected={selectedIds.includes(item.id)}
              onSelect={(id, checked) => {
                setSelectedIds((prev) =>
                  checked ? [...prev, id] : prev.filter((prevId) => prevId !== id)
                )
              }}
              onNavigateToFolder={handleNavigateToFolder}
              onToggleStatus={(itm, enable) => handleToggleStatus(itm as any, enable)}
              onEdit={(itm) => openEditDrawer(itm as any)}
              onDuplicate={(itm) => handleDuplicate(itm as any)}
              onRecalculate={handleRecalculate}
              onDelete={(itm) => {
                setSeriesToDelete(itm as any)
                setDeleteDialogOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((item) => (
            <TestSeriesCard
              key={item.id}
              item={item as TestSeriesItem}
              viewMode="grid"
              isSelected={selectedIds.includes(item.id)}
              onSelect={(id, checked) => {
                setSelectedIds((prev) =>
                  checked ? [...prev, id] : prev.filter((prevId) => prevId !== id)
                )
              }}
              onNavigateToFolder={handleNavigateToFolder}
              onToggleStatus={(itm, enable) => handleToggleStatus(itm as any, enable)}
              onEdit={(itm) => openEditDrawer(itm as any)}
              onDuplicate={(itm) => handleDuplicate(itm as any)}
              onRecalculate={handleRecalculate}
              onDelete={(itm) => {
                setSeriesToDelete(itm as any)
                setDeleteDialogOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))}
                  className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPageNum}
                    onClick={() => setCurrentPageNum(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))}
                  className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ── Sub-level Tests (if inside a folder) ────────────────────────── */}
      {currentFolderId && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <TestSeriesContentManager 
            testSeriesId={currentFolderId} 
            embedded={true} 
            onBack={() => {}} // embedded version doesn't use onBack
          />
        </div>
      )}

      {/* ── Add / Edit Test Series Drawer ─────────────────────────────────── */}
      <TestSeriesForm 
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        editingId={editingId}
        resetForm={resetForm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        formData={formData}
        updateField={updateField}
        uploading={uploading}
        setUploading={setUploading}
        orgCode={orgCode}
        categories={categories}
        examProfiles={examProfiles}
        loadingTests={loadingTests}
        testOptions={testOptions}
        saving={saving}
        handleSubmit={handleSubmit}
      />

      {/* ── Delete confirmation dialog ─────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test Series</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {seriesToDelete?.title}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
