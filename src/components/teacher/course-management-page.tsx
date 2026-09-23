'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Star,
  Loader2,
  Globe,
  GraduationCap,
  BookOpen,
  FileText,
  FileDown,
  HelpCircle,
  Radio,
  Play,
  ArrowLeft,
  FolderOpen,
  Layers,
  Copy,
  Filter,
  SlidersHorizontal,
  Clock,
  Unlock,
  Upload,
  X,
  File,
  Video,
  Paperclip,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Tag,
  Settings,
  MonitorPlay,
  GripVertical,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

// ── File Upload Helper ────────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch('/api/teacher/upload-image', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Upload failed')
  }
  const data = await res.json()
  return data.url
}

// ── Types ────────────────────────────────────────────────────────────────
interface CourseItem {
  id: string
  title: string
  description: string | null
  content: string | null
  thumbnail: string | null
  demoVideo: string | null
  price: number
  mrp: number
  category: string | null
  language: string
  level: string
  featured: boolean
  status: string
  validityType: string
  validityMonths: number | null
  validityEndDate: string | null
  discountCode: string | null
  sortOrder: number
  organizationId: string
  createdAt: string
  updatedAt: string
  purchaseCount?: number
  moduleCount?: number
  totalLessons?: number
  totalDuration?: number
  modules?: CourseModuleItem[]
  [key: string]: unknown
}

interface CourseModuleItem {
  id: string
  title: string
  description: string | null
  sortOrder: number
  courseId: string
  createdAt: string
  updatedAt: string
  lessons?: CourseLessonItem[]
  _count?: { lessons: number }
}

interface CourseLessonItem {
  id: string
  title: string
  type: string
  content: string | null
  videoUrl: string | null
  videoDuration: number
  fileUrl: string | null
  notes: string | null
  isFree: boolean
  sortOrder: number
  moduleId: string
  createdAt: string
  updatedAt: string
}

type LessonType = 'video' | 'text' | 'pdf' | 'quiz' | 'live'

// ── Lesson type config ──────────────────────────────────────────────────
const lessonTypeConfig: Record<LessonType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  video: { label: 'Video', icon: Play, color: 'bg-rose-50 text-rose-700 bsortOrder-rose-200' },
  text: { label: 'Text', icon: FileText, color: 'bg-sky-50 text-sky-700 bsortOrder-sky-200' },
  pdf: { label: 'PDF', icon: FileDown, color: 'bg-orange-50 text-orange-700 bsortOrder-orange-200' },
  quiz: { label: 'Quiz', icon: HelpCircle, color: 'bg-violet-50 text-violet-700 bsortOrder-violet-200' },
  live: { label: 'Live', icon: Radio, color: 'bg-emerald-50 text-emerald-700 bsortOrder-emerald-200' },
}

function getLessonTypeConfig(type: string) {
  return lessonTypeConfig[(type?.toLowerCase() || 'video') as LessonType] || lessonTypeConfig.video
}

// ── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'draft'
  if (s === 'published') {
    return <Badge className="bg-emerald-50 text-emerald-700 bsortOrder-emerald-200 hover:bg-emerald-50">Published</Badge>
  }
  if (s === 'draft') {
    return <Badge className="bg-amber-50 text-amber-700 bsortOrder-amber-200 hover:bg-amber-50">Draft</Badge>
  }
  if (s === 'archived') {
    return <Badge className="bg-gray-100 text-gray-600 bsortOrder-gray-200 hover:bg-gray-100">Archived</Badge>
  }
  return <Badge className="bg-gray-100 text-gray-600 bsortOrder-gray-200 hover:bg-gray-100">{status || 'Draft'}</Badge>
}

// ── Featured Badge ───────────────────────────────────────────────────────
function FeaturedBadge({ featured }: { featured: boolean }) {
  return featured ? (
    <Badge className="bg-amber-50 text-amber-700 bsortOrder-amber-200 gap-1 hover:bg-amber-50">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
    </Badge>
  ) : (
    <span className="text-sm text-muted-foreground">—</span>
  )
}

// ── Format duration ──────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds) return '0m'
  const mins = Math.floor(seconds / 60)
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hrs > 0) return `${hrs}h ${remainingMins}m`
  return `${mins}m`
}

// ── Format price ─────────────────────────────────────────────────────────
function formatPrice(price: number, mrp?: number) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-gray-900">₹{price}</span>
      {mrp && mrp > price ? (
        <span className="text-xs text-muted-foreground line-through">₹{mrp}</span>
      ) : null}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════════════════
const WIZARD_STEPS = [
  { id: 1, label: 'Basic Information', icon: GraduationCap },
  { id: 2, label: 'Pricing', icon: Tag },
  { id: 3, label: 'Content', icon: Layers },
  { id: 4, label: 'Additional Settings', icon: Settings },
]

function StepIndicator({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {WIZARD_STEPS.map((step, idx) => {
        const Icon = step.icon
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer',
                isActive && 'bg-amber-50 text-amber-700 bsortOrder bsortOrder-amber-200 shadow-sm',
                isCompleted && 'bg-emerald-50 text-emerald-700 bsortOrder bsortOrder-emerald-200',
                !isActive && !isCompleted && 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold bsortOrder-2 transition-all',
                isActive && 'bg-amber-500 text-white bsortOrder-amber-500',
                isCompleted && 'bg-emerald-500 text-white bsortOrder-emerald-500',
                !isActive && !isCompleted && 'bg-gray-100 text-gray-400 bsortOrder-gray-200'
              )}>
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </button>
            {idx < WIZARD_STEPS.length - 1 && (
              <div className={cn(
                'w-8 h-0.5 mx-1',
                currentStep > step.id ? 'bg-emerald-300' : 'bg-gray-200'
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW PANEL
// ═══════════════════════════════════════════════════════════════════════════
function CoursePreviewPanel({ form }: { form: CourseFormState }) {
  const discount = form.mrp && Number(form.mrp) > Number(form.price) && Number(form.price) > 0
    ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl bsortOrder shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 bsortOrder-b">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Live Preview</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">How students will see this course</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Thumbnail Preview */}
        <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
          {form.thumbnail ? (
            <img src={form.thumbnail} alt="Course cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs">No Cover Image</span>
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              {discount}% OFF
            </div>
          )}
          {form.featured && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Star className="h-3 w-3 fill-white" /> Featured
            </div>
          )}
        </div>

        {/* Course Title */}
        <div>
          <h4 className="font-bold text-gray-900 line-clamp-2">
            {form.title || 'Course Name'}
          </h4>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {Number(form.price) > 0 ? (
            <>
              <span className="text-2xl font-bold text-gray-900">₹{form.price}</span>
              {form.mrp && Number(form.mrp) > Number(form.price) && (
                <span className="text-sm text-muted-foreground line-through">₹{form.mrp}</span>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold text-emerald-600">Free</span>
          )}
        </div>

        {/* Demo Video */}
        {form.demoVideo && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-sky-50 p-2 rounded-lg">
            <MonitorPlay className="h-4 w-4 text-sky-600" />
            <span>Demo video available</span>
          </div>
        )}

        {/* Category */}
        {form.category && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Tag className="h-4 w-4" />
            <span>{form.category}</span>
          </div>
        )}

        {/* Validity */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>
            {form.validityType === 'lifetime' ? 'Lifetime Access' :
             form.validityType === 'months' ? `${form.validityMonths || 6} Months Access` :
             form.validityType === 'end_date' && form.validityEndDate ? `Valid till ${new Date(form.validityEndDate).toLocaleDateString()}` :
             'Lifetime Access'}
          </span>
        </div>

        {/* Language & Level */}
        <div className="flex gap-2 flex-wrap">
          {form.language && (
            <Badge variant="secondary" className="text-xs">{form.language}</Badge>
          )}
          {form.level && (
            <Badge variant="secondary" className="text-xs">{form.level}</Badge>
          )}
          <Badge variant="secondary" className="text-xs">{form.status === 'published' ? 'Published' : 'Draft'}</Badge>
        </div>

        {/* Description */}
        {form.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 bsortOrder-t pt-3">
            {form.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Form State Type ──────────────────────────────────────────────────────
interface CourseFormState {
  title: string
  description: string
  content: string
  thumbnail: string
  demoVideo: string
  price: string
  mrp: string
  category: string
  language: string
  level: string
  status: string
  featured: boolean
  validityType: string
  validityMonths: string
  validityEndDate: string
  discountCode: string
  sortOrder: number
  seoTitle: string
  seoDescription: string
  autoGenerateSeo: boolean
}

const EMPTY_FORM: CourseFormState = {
  title: '',
  description: '',
  content: '',
  thumbnail: '',
  demoVideo: '',
  price: '',
  mrp: '',
  category: '',
  language: 'Hindi',
  level: 'All',
  status: 'draft',
  featured: false,
  validityType: 'lifetime',
  validityMonths: '6',
  validityEndDate: '',
  discountCode: '',
  sortOrder: 0,
  seoTitle: '',
  seoDescription: '',
  autoGenerateSeo: true,
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 1: COURSE LISTING
// ═══════════════════════════════════════════════════════════════════════════
function CourseListingView({ onOpenBuilder }: { onOpenBuilder: (id: string) => void }) {
  const orgCode = useAppStore(s => s.orgCode)
  // Data state
  const [items, setItems] = useState<CourseItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CourseItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Stats
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, featured: 0 })

  // Categories for filter
  const [categories, setCategories] = useState<string[]>([])

  const itemsPerPage = 10

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        organizationId: orgCode,
        page: String(currentPageNum),
        limit: String(itemsPerPage),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await apiFetch(`/api/teacher/courses?${params}`)
      if (res.ok) {
        const data = await res.json()
        const fetchedItems = data.items || []
        setItems(fetchedItems)
        setTotalItems(data.total || 0)
        setStats(data.stats || { total: 0, published: 0, draft: 0, featured: 0 })

        // Extract unique categories from items
        const cats = Array.from(new Set(fetchedItems.map((i: CourseItem) => i.category).filter(Boolean))) as string[]
        setCategories(cats)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter, categoryFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Reset page when filters change
  useEffect(() => { setCurrentPageNum(1) }, [statusFilter, categoryFilter])

  // Toggle publish
  const handleTogglePublish = async (item: CourseItem) => {
    try {
      const newStatus = item.status?.toLowerCase() === 'published' ? 'draft' : 'published'
      const res = await apiFetch('/api/teacher/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(newStatus === 'published' ? 'Course published' : 'Course unpublished')
      fetchItems()
    } catch {
      toast.error('Failed to update course status')
    }
  }

  // Toggle featured
  const handleToggleFeatured = async (item: CourseItem) => {
    try {
      const res = await apiFetch('/api/teacher/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, featured: !item.featured }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(item.featured ? 'Removed from featured' : 'Marked as featured')
      fetchItems()
    } catch {
      toast.error('Failed to toggle featured status')
    }
  }

  // Duplicate course
  const handleDuplicate = async (item: CourseItem) => {
    try {
      const res = await apiFetch('/api/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${item.title} (Copy)`,
          description: item.description,
          content: item.content,
          thumbnail: item.thumbnail,
          demoVideo: item.demoVideo,
          price: item.price,
          mrp: item.mrp,
          category: item.category,
          language: item.language,
          level: item.level,
          status: 'draft',
          featured: false,
          validityType: item.validityType || 'lifetime',
          validityMonths: item.validityMonths,
          validityEndDate: item.validityEndDate,
          discountCode: item.discountCode,
          organizationId: orgCode,
        }),
      })
      if (!res.ok) throw new Error('Duplicate failed')
      toast.success('Course duplicated successfully')
      fetchItems()
    } catch {
      toast.error('Failed to duplicate course')
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/courses?id=${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Course deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete course')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bsortOrder-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-gray-100">
                <GraduationCap className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Courses</p>
                <div className="text-2xl font-bold text-gray-900">{loading ? <Skeleton className="h-7 w-12" /> : stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bsortOrder-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-100">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Published</p>
                <div className="text-2xl font-bold text-emerald-700">{loading ? <Skeleton className="h-7 w-12" /> : stats.published}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bsortOrder-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-amber-100">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Draft</p>
                <div className="text-2xl font-bold text-amber-700">{loading ? <Skeleton className="h-7 w-12" /> : stats.draft}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bsortOrder-0 shadow-sm bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-rose-100">
                <Star className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Featured</p>
                <div className="text-2xl font-bold text-rose-700">{loading ? <Skeleton className="h-7 w-12" /> : stats.featured}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by title, description..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageNum(1) }}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] bg-white">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bsortOrder bg-white shadow-sm overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide">S.NO</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Product Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Category</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Price</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Sort By</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="w-16 text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-full max-w-[300px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gray-100">
                      <GraduationCap className="h-8 w-8 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">No courses found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {debouncedSearch || statusFilter !== 'all' || categoryFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Create your first course to get started'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => onOpenBuilder(item.id)}>
                  <TableCell className="text-sm text-muted-foreground font-medium">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail as string}
                          alt={item.title}
                          className="h-10 w-14 rounded-lg object-cover bsortOrder flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded-lg bg-gray-100 flex items-center justify-center bsortOrder flex-shrink-0">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.featured && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                          <span className="text-xs text-muted-foreground">{item.language} • {item.level}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">{item.category || '—'}</span>
                  </TableCell>
                  <TableCell>{formatPrice(item.price, item.mrp)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{item.sortOrder ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => onOpenBuilder(item.id)}>
                          <FolderOpen className="mr-2 h-4 w-4" /> View/Edit Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(item)}>
                          <Globe className="mr-2 h-4 w-4" />
                          {item.status?.toLowerCase() === 'published' ? 'Unpublish' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(item)}>
                          <Star className="mr-2 h-4 w-4" />
                          {item.featured ? 'Remove Featured' : 'Mark Featured'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true) }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPageNum - 1) * itemsPerPage) + 1} to {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} entries
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                  className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPageNum(page)}
                    isActive={page === currentPageNum}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                  className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{itemToDelete?.title}</strong>? This action cannot be undone. All modules and lessons within this course will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 2: COURSE WIZARD (Add New Course - Multi-step with preview)
// ═══════════════════════════════════════════════════════════════════════════
function CourseWizardView({ courseId, onBack, onSaved }: { courseId: string | null; onBack: () => void; onSaved?: () => void }) {
  const orgCode = useAppStore(s => s.orgCode)
  const isEditing = !!courseId
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM)
  const [courseData, setCourseData] = useState<CourseItem | null>(null)
  const [loading, setLoading] = useState(isEditing)

  // Upload states
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingDemoVideo, setUploadingDemoVideo] = useState(false)

  // Fetch existing course if editing
  useEffect(() => {
    if (!courseId) return
    const fetchCourse = async () => {
      setLoading(true)
      try {
        const res = await apiFetch(`/api/teacher/courses/${courseId}`)
        if (res.ok) {
          const data = await res.json()
          setCourseData(data)
          setForm({
            title: data.title || '',
            description: data.description || '',
            content: data.content || '',
            thumbnail: data.thumbnail || '',
            demoVideo: data.demoVideo || '',
            price: String(data.price ?? ''),
            mrp: String(data.mrp ?? ''),
            category: data.category || '',
            language: data.language || 'Hindi',
            level: data.level || 'All',
            status: data.status || 'draft',
            featured: data.featured || false,
            validityType: data.validityType || 'lifetime',
            validityMonths: String(data.validityMonths ?? '6'),
            validityEndDate: data.validityEndDate ? new Date(data.validityEndDate).toISOString().split('T')[0] : '',
            discountCode: data.discountCode || '',
            sortOrder: data.sortOrder || 0,
          })
        }
      } catch {
        toast.error('Failed to load course')
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const updateForm = (updates: Partial<CourseFormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  // Save course (create or update)
  const handleSave = async (publishStatus?: string) => {
    if (!form.title.trim()) {
      toast.error('Course title is required')
      setCurrentStep(1)
      return
    }
    setSaving(true)
    try {
      const body = {
        title: form.title,
        description: form.description || null,
        content: form.content || null,
        thumbnail: form.thumbnail || null,
        demoVideo: form.demoVideo || null,
        price: Number(form.price) || 0,
        mrp: Number(form.mrp) || 0,
        category: form.category || null,
        language: form.language || 'Hindi',
        level: form.level || 'All',
        status: publishStatus || form.status || 'draft',
        featured: form.featured,
        validityType: form.validityType || 'lifetime',
        validityMonths: form.validityType === 'months' ? Number(form.validityMonths) || 6 : null,
        validityEndDate: form.validityType === 'end_date' && form.validityEndDate ? form.validityEndDate : null,
        discountCode: form.discountCode || null,
        organizationId: orgCode,
        ...(courseId ? { id: courseId } : {}),
      }

      const res = await apiFetch('/api/teacher/courses', {
        method: courseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Save failed')
      }
      const data = await res.json()
      const savedCourse = data.course || data
      toast.success(courseId ? 'Course updated successfully' : 'Course created successfully')
      onSaved?.()
      onBack()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  // Thumbnail upload handler
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumbnail(true)
    try {
      const url = await uploadFile(file)
      updateForm({ thumbnail: url })
      toast.success('Cover image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  // Demo video upload handler
  const handleDemoVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDemoVideo(true)
    try {
      const url = await uploadFile(file)
      updateForm({ demoVideo: url })
      toast.success('Demo video uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingDemoVideo(false)
      e.target.value = ''
    }
  }

  // Step validation
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return form.title.trim().length > 0
      case 2: return true
      case 3: return true
      case 4: return true
      default: return true
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0 -m-6">
      {/* Wizard Header */}
      <div className="bg-white bsortOrder-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Course' : 'Add New Course'}
              </h1>
              <p className="text-xs text-muted-foreground">Fill in the details to {isEditing ? 'update' : 'create'} your course</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save as Draft
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm" onClick={() => handleSave('published')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </div>
        </div>
        {/* Step Indicator */}
        <div className="px-6 pb-4">
          <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>
      </div>

      {/* Wizard Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* ─── STEP 1: Basic Information ─── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card className="bsortOrder shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-amber-500" />
                      Basic Course Information
                    </h3>

                    {/* Title */}
                    <div className="grid gap-2">
                      <Label htmlFor="title" className="text-sm font-medium">Course Name *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => updateForm({ title: e.target.value })}
                        placeholder="Course Name"
                        className="h-11"
                      />
                    </div>

                    {/* Price + Featured */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price" className="text-sm font-medium">Price (₹)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                          <Input
                            id="price"
                            type="number"
                            value={form.price}
                            onChange={(e) => updateForm({ price: e.target.value })}
                            placeholder="Enter Price"
                            className="h-11 pl-8"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium">Featured Course</Label>
                        <div className="flex items-center gap-3 h-11 bg-gray-50 rounded-lg bsortOrder px-4">
                          <Switch
                            id="featured"
                            checked={form.featured}
                            onCheckedChange={(v) => updateForm({ featured: v })}
                          />
                          <Label htmlFor="featured" className="cursor-pointer text-sm text-gray-700">
                            {form.featured ? 'Yes, mark as featured' : 'No'}
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="text-sm font-medium">Course Description</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => updateForm({ description: e.target.value })}
                        placeholder="Enter course description..."
                        rows={6}
                        className="resize-y min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Image & Demo Video */}
                <Card className="bsortOrder shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-amber-500" />
                      Media
                    </h3>

                    {/* Cover Image */}
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Cover Image</Label>
                      {form.thumbnail ? (
                        <div className="relative group rounded-xl overflow-hidden bsortOrder bg-gray-50">
                          <img
                            src={form.thumbnail}
                            alt="Cover"
                            className="w-full max-h-80 object-contain bg-gray-100"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => document.getElementById('cover-upload')?.click()}
                            >
                              <Upload className="mr-2 h-3.5 w-3.5" /> Change
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateForm({ thumbnail: '' })}
                            >
                              <X className="mr-2 h-3.5 w-3.5" /> Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="bsortOrder-2 bsortOrder-dashed bsortOrder-gray-300 rounded-xl p-8 text-center hover:bsortOrder-amber-400 hover:bg-amber-50/30 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('cover-upload')?.click()}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">No Image</p>
                              <p className="text-xs text-muted-foreground mt-1">Click to upload cover image</p>
                              <p className="text-xs text-muted-foreground">Recommended: 960px × 540px</p>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2" disabled={uploadingThumbnail}>
                              {uploadingThumbnail ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                              Upload Image
                            </Button>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        id="cover-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                      />
                    </div>

                    {/* Demo Video */}
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Demo Video</Label>
                      {form.demoVideo ? (
                        <div className="relative group rounded-xl overflow-hidden bsortOrder bg-gray-50">
                          <video
                            src={form.demoVideo}
                            className="w-full max-h-80 object-contain bg-black"
                            controls
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateForm({ demoVideo: '' })}
                            >
                              <X className="mr-2 h-3.5 w-3.5" /> Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="bsortOrder-2 bsortOrder-dashed bsortOrder-gray-300 rounded-xl p-8 text-center hover:bsortOrder-sky-400 hover:bg-sky-50/30 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('demo-video-upload')?.click()}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <Video className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">No Video</p>
                              <p className="text-xs text-muted-foreground mt-1">Click to upload demo video</p>
                              <p className="text-xs text-muted-foreground">MP4, WebM supported</p>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2" disabled={uploadingDemoVideo}>
                              {uploadingDemoVideo ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                              Upload Video
                            </Button>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        id="demo-video-upload"
                        accept="video/*"
                        className="hidden"
                        onChange={handleDemoVideoUpload}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="bsortOrder shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-amber-500" />
                      Categories
                    </h3>
                    <div className="grid gap-2">
                      <Label htmlFor="category" className="text-sm font-medium">Select Category</Label>
                      <Input
                        id="category"
                        value={form.category}
                        onChange={(e) => updateForm({ category: e.target.value })}
                        placeholder="e.g., Mathematics, Science, UPSC..."
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">Type a category name for this course</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium">Language</Label>
                        <Select value={form.language} onValueChange={(v) => updateForm({ language: v })}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Bilingual">Bilingual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium">Level</Label>
                        <Select value={form.level} onValueChange={(v) => updateForm({ level: v })}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Validity */}
                <Card className="bsortOrder shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      Validity
                    </h3>
                    <RadioGroup value={form.validityType} onValueChange={(v) => updateForm({ validityType: v })}>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bsortOrder bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value="lifetime" id="validity-lifetime" />
                          <Label htmlFor="validity-lifetime" className="cursor-pointer flex-1">
                            <div>
                              <p className="font-medium text-sm text-gray-900">Lifetime Access</p>
                              <p className="text-xs text-muted-foreground">Students get access forever</p>
                            </div>
                          </Label>
                          <Unlock className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bsortOrder bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value="months" id="validity-months" />
                          <Label htmlFor="validity-months" className="cursor-pointer flex-1">
                            <div>
                              <p className="font-medium text-sm text-gray-900">Set Validity</p>
                              <p className="text-xs text-muted-foreground">Access expires after a set number of months</p>
                            </div>
                          </Label>
                        </div>
                        {form.validityType === 'months' && (
                          <div className="ml-8 grid grid-cols-2 gap-3 items-end">
                            <div className="grid gap-1">
                              <Label className="text-xs">Duration</Label>
                              <Select value={form.validityMonths} onValueChange={(v) => updateForm({ validityMonths: v })}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Months" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 6, 9, 12, 18, 24, 36].map(m => (
                                    <SelectItem key={m} value={String(m)}>{m} Months</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-xs">Custom Months</Label>
                              <Input
                                type="number"
                                value={form.validityMonths}
                                onChange={(e) => updateForm({ validityMonths: e.target.value })}
                                placeholder="6"
                                className="h-10"
                                min="1"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-3 rounded-lg bsortOrder bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value="end_date" id="validity-end_date" />
                          <Label htmlFor="validity-end_date" className="cursor-pointer flex-1">
                            <div>
                              <p className="font-medium text-sm text-gray-900">End Date</p>
                              <p className="text-xs text-muted-foreground">Access expires on a specific date</p>
                            </div>
                          </Label>
                        </div>
                        {form.validityType === 'end_date' && (
                          <div className="ml-8 grid gap-1">
                            <Label className="text-xs">End Date</Label>
                            <Input
                              type="date"
                              value={form.validityEndDate}
                              onChange={(e) => updateForm({ validityEndDate: e.target.value })}
                              className="h-10 w-48"
                            />
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── STEP 2: Pricing ─── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card className="bsortOrder shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-amber-500" />
                      Pricing
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="mrp" className="text-sm font-medium">MRP (Maximum Retail Price)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                          <Input
                            id="mrp"
                            type="number"
                            value={form.mrp}
                            onChange={(e) => updateForm({ mrp: e.target.value })}
                            placeholder="Enter MRP"
                            className="h-11 pl-8"
                            min="0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">The original price before any discount</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="selling-price" className="text-sm font-medium">Selling Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                          <Input
                            id="selling-price"
                            type="number"
                            value={form.price}
                            onChange={(e) => updateForm({ price: e.target.value })}
                            placeholder="Enter selling price"
                            className="h-11 pl-8"
                            min="0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">The price students will pay</p>
                      </div>
                    </div>

                    {/* Discount Preview */}
                    {form.mrp && Number(form.mrp) > 0 && form.price && Number(form.price) > 0 && Number(form.price) < Number(form.mrp) && (
                      <div className="bg-emerald-50 bsortOrder bsortOrder-emerald-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Tag className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-800">
                            {Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)}% Discount
                          </p>
                          <p className="text-xs text-emerald-600">
                            Students save ₹{Number(form.mrp) - Number(form.price)} on this course
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Discount Codes */}
                    <div className="grid gap-2">
                      <Label htmlFor="discount-code" className="text-sm font-medium">Select Discount Codes</Label>
                      <Input
                        id="discount-code"
                        value={form.discountCode}
                        onChange={(e) => updateForm({ discountCode: e.target.value })}
                        placeholder="Enter discount codes (comma-separated)"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">Enter coupon codes that can be applied to this course</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── STEP 3: Content (Modules & Lessons Builder) ─── */}
            {currentStep === 3 && (
              <CourseContentBuilder courseId={courseId} form={form} updateForm={updateForm} />
            )}

            {/* ─── STEP 4: Additional Settings ─── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card className="bsortOrder shadow-sm">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-amber-500" />
                      Additional Settings
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium">Course Status</Label>
                        <Select value={form.status} onValueChange={(v) => updateForm({ status: v })}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium">Sort Order</Label>
                        <Input
                          type="number"
                          value={form.sortOrder || ''}
                          onChange={(e) => updateForm({ sortOrder: Number(e.target.value) || 0 })}
                          placeholder="0"
                          className="h-11"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">Lower numbers appear first in listings</p>
                      </div>
                    </div>

                    {/* Featured Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 bsortOrder">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-amber-100 flex items-center justify-center">
                          <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Featured Course</p>
                          <p className="text-xs text-muted-foreground">Featured courses are highlighted on the student portal</p>
                        </div>
                      </div>
                      <Switch
                        checked={form.featured}
                        onCheckedChange={(v) => updateForm({ featured: v })}
                      />
                    </div>

                    {/* Additional Notes */}
                    <div className="grid gap-2">
                      <Label htmlFor="content" className="text-sm font-medium">Additional Notes</Label>
                      <Textarea
                        id="content"
                        value={form.content}
                        onChange={(e) => updateForm({ content: e.target.value })}
                        placeholder="Any additional notes or information about this course..."
                        rows={4}
                        className="resize-y"
                      />
                    </div>

                    {/* Info box */}
                    <div className="flex gap-3 p-4 rounded-xl bg-blue-50 bsortOrder bsortOrder-blue-200">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Course Visibility</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Courses set to &quot;Published&quot; will be visible to students immediately.
                          Use &quot;Draft&quot; to save without making it visible. You can always change the status later.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex items-center gap-2">
                {currentStep < 4 ? (
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                    onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                    disabled={!canGoNext()}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save as Draft
                    </Button>
                    <Button
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleSave('published')}
                      disabled={saving}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish Course
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Preview Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <CoursePreviewPanel form={form} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COURSE CONTENT BUILDER (Step 3 - Modules & Lessons)
// ═══════════════════════════════════════════════════════════════════════════
function CourseContentBuilder({ courseId, form, updateForm }: { courseId: string | null; form: CourseFormState; updateForm: (updates: Partial<CourseFormState>) => void }) {
  const [course, setCourse] = useState<CourseItem | null>(null)
  const [loading, setLoading] = useState(!!courseId)
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<CourseModuleItem | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' })
  const [moduleSaving, setModuleSaving] = useState(false)

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<CourseLessonItem | null>(null)
  const [lessonModuleId, setLessonModuleId] = useState<string>('')
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as LessonType,
    videoUrl: '',
    videoDuration: '',
    content: '',
    fileUrl: '',
    notes: '',
    isFree: false,
  })
  const [lessonSaving, setLessonSaving] = useState(false)

  // Delete dialogs
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<CourseModuleItem | null>(null)
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<CourseLessonItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Upload states for lesson files
  const [uploadingFile, setUploadingFile] = useState(false)

  // Fetch course with modules and lessons
  const fetchCourse = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
      }
    } catch {
      toast.error('Failed to load course content')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  // Auto expand first module
  useEffect(() => {
    if (course?.modules?.length && expandedModules.length === 0) {
      setExpandedModules([course.modules[0].id])
    }
  }, [course, expandedModules.length])

  // ── Module handlers ────────────────────────────────────────────────────
  const openAddModuleDialog = () => {
    setEditingModule(null)
    setModuleForm({ title: '', description: '' })
    setModuleDialogOpen(true)
  }

  const openEditModuleDialog = (mod: CourseModuleItem) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, description: mod.description || '' })
    setModuleDialogOpen(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error('Module title is required')
      return
    }
    if (!courseId) {
      toast.error('Please save the course first before adding modules')
      return
    }
    setModuleSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: moduleForm.title,
        description: moduleForm.description || null,
      }
      if (editingModule) body.id = editingModule.id

      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules`, {
        method: editingModule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Save failed')
      }
      toast.success(editingModule ? 'Module updated' : 'Module created')
      setModuleDialogOpen(false)
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save module')
    } finally {
      setModuleSaving(false)
    }
  }

  const handleDeleteModule = async () => {
    if (!moduleToDelete || !courseId) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules?id=${moduleToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Module deleted')
      setDeleteModuleDialogOpen(false)
      setModuleToDelete(null)
      fetchCourse()
    } catch {
      toast.error('Failed to delete module')
    } finally {
      setDeleting(false)
    }
  }

  // ── Lesson handlers ────────────────────────────────────────────────────
  const openAddLessonDialog = (moduleId: string) => {
    setLessonModuleId(moduleId)
    setEditingLesson(null)
    setLessonForm({
      title: '',
      type: 'video',
      videoUrl: '',
      videoDuration: '',
      content: '',
      fileUrl: '',
      notes: '',
      isFree: false,
    })
    setLessonDialogOpen(true)
  }

  const openEditLessonDialog = (lesson: CourseLessonItem, moduleId: string) => {
    setLessonModuleId(moduleId)
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      type: (lesson.type || 'video') as LessonType,
      videoUrl: lesson.videoUrl || '',
      videoDuration: lesson.videoDuration ? String(Math.round(lesson.videoDuration / 60)) : '',
      content: lesson.content || '',
      fileUrl: lesson.fileUrl || '',
      notes: lesson.notes || '',
      isFree: lesson.isFree || false,
    })
    setLessonDialogOpen(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error('Lesson title is required')
      return
    }
    if (!courseId) {
      toast.error('Please save the course first before adding lessons')
      return
    }
    setLessonSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: lessonForm.title,
        type: lessonForm.type,
        content: lessonForm.content || null,
        videoUrl: lessonForm.videoUrl || null,
        videoDuration: lessonForm.videoDuration ? Number(lessonForm.videoDuration) * 60 : 0,
        fileUrl: lessonForm.fileUrl || null,
        notes: lessonForm.notes || null,
        isFree: lessonForm.isFree,
      }
      if (editingLesson) body.lessonId = editingLesson.id

      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules/lessons?moduleId=${lessonModuleId}`, {
        method: editingLesson ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Save failed')
      }
      toast.success(editingLesson ? 'Lesson updated' : 'Lesson created')
      setLessonDialogOpen(false)
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save lesson')
    } finally {
      setLessonSaving(false)
    }
  }

  const handleDeleteLesson = async () => {
    if (!lessonToDelete || !courseId) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules/lessons?moduleId=${lessonToDelete.moduleId}&lessonId=${lessonToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Lesson deleted')
      setDeleteLessonDialogOpen(false)
      setLessonToDelete(null)
      fetchCourse()
    } catch {
      toast.error('Failed to delete lesson')
    } finally {
      setDeleting(false)
    }
  }

  // Lesson file upload handler
  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const url = await uploadFile(file)
      setLessonForm(prev => ({ ...prev, fileUrl: url }))
      toast.success('File uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const modules = course?.modules || []
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Content Summary */}
      <Card className="bsortOrder shadow-sm bg-gradient-to-r from-amber-50/50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-500" />
                Course Content
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {modules.length} module{modules.length !== 1 ? 's' : ''} • {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
              </p>
            </div>
            {courseId && (
              <Button onClick={openAddModuleDialog} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                <Plus className="h-4 w-4" /> Add Module
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No course saved yet message */}
      {!courseId && (
        <div className="flex flex-col items-center justify-center p-12 text-center bsortOrder-2 bsortOrder-dashed bsortOrder-gray-300 rounded-xl bg-gray-50/50">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">Save the course first to add content</p>
          <p className="text-xs text-muted-foreground mt-1">Go back to Step 1, fill in the basic details, and save the course. Then you can add modules and lessons here.</p>
        </div>
      )}

      {/* Modules & Lessons Accordion */}
      {courseId && modules.length > 0 && (
        <Accordion
          type="multiple"
          value={expandedModules}
          onValueChange={setExpandedModules}
          className="space-y-3"
        >
          {modules.map((mod, modIdx) => (
            <AccordionItem key={mod.id} value={mod.id} className="bsortOrder rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 text-amber-700 text-sm font-bold flex-shrink-0">
                    {modIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{mod.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mod.lessons?.length ?? mod._count?.lessons ?? 0} lesson{(mod.lessons?.length ?? mod._count?.lessons ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditModuleDialog(mod)}
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setModuleToDelete(mod); setDeleteModuleDialogOpen(true) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4">
                <div className="space-y-2">
                  {mod.lessons?.map((lesson, lesIdx) => {
                    const typeConf = getLessonTypeConfig(lesson.type)
                    const TypeIcon = typeConf.icon
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-lg bsortOrder bg-gray-50/50 hover:bg-gray-50 transition-colors group"
                      >
                        <GripVertical className="h-4 w-4 text-gray-300" />
                        <div className={cn('flex items-center justify-center h-7 w-7 rounded-md text-xs font-medium bsortOrder', typeConf.color)}>
                          <TypeIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn('text-xs px-1.5 py-0.5 rounded bsortOrder', typeConf.color)}>{typeConf.label}</span>
                            {lesson.isFree && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 bsortOrder bsortOrder-emerald-200">Free</span>
                            )}
                            {lesson.videoDuration > 0 && (
                              <span className="text-xs text-muted-foreground">{formatDuration(lesson.videoDuration)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLessonDialog(lesson, mod.id)}>
                            <Pencil className="h-3 w-3 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLessonToDelete(lesson); setDeleteLessonDialogOpen(true) }}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {(!mod.lessons || mod.lessons.length === 0) && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No lessons in this module yet
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bsortOrder-dashed"
                    onClick={() => openAddLessonDialog(mod.id)}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Lesson
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {courseId && modules.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center bsortOrder-2 bsortOrder-dashed bsortOrder-gray-300 rounded-xl bg-gray-50/50">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No modules yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first module to start building course content</p>
          <Button onClick={openAddModuleDialog} className="bg-amber-500 hover:bg-amber-600 text-white mt-4 gap-2">
            <Plus className="h-4 w-4" /> Add Module
          </Button>
        </div>
      )}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
            <DialogDescription>
              {editingModule ? 'Update module details' : 'Create a new module for your course'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module-title">Module Title *</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Enter module title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="module-desc">Description</Label>
              <Textarea
                id="module-desc"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Optional module description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} disabled={moduleSaving}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSaveModule} disabled={moduleSaving}>
              {moduleSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModule ? 'Update' : 'Create'} Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update lesson details' : 'Create a new lesson for this module'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lesson Type</Label>
                <Select value={lessonForm.type} onValueChange={(v) => setLessonForm({ ...lessonForm, type: v as LessonType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(lessonTypeConfig).map(([key, conf]) => {
                      const Icon = conf.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {conf.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={lessonForm.isFree}
                  onCheckedChange={(v) => setLessonForm({ ...lessonForm, isFree: v })}
                />
                <Label className="cursor-pointer">Free Preview</Label>
              </div>
            </div>

            {/* Type-specific fields */}
            {(lessonForm.type === 'video' || lessonForm.type === 'live') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Video URL</Label>
                  <Input
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="Paste video URL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={lessonForm.videoDuration}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoDuration: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}

            {(lessonForm.type === 'text' || lessonForm.type === 'quiz') && (
              <div className="grid gap-2">
                <Label>Content</Label>
                <Textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Enter lesson content"
                  rows={5}
                />
              </div>
            )}

            {lessonForm.type === 'pdf' && (
              <div className="grid gap-2">
                <Label>PDF File</Label>
                <div className="flex items-center gap-3">
                  {lessonForm.fileUrl ? (
                    <div className="flex items-center gap-2 flex-1 bg-gray-50 p-2 rounded-lg bsortOrder">
                      <File className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{lessonForm.fileUrl}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setLessonForm({ ...lessonForm, fileUrl: '' })}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        value={lessonForm.fileUrl}
                        onChange={(e) => setLessonForm({ ...lessonForm, fileUrl: e.target.value })}
                        placeholder="Paste URL or upload"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        id="lesson-file-upload"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        className="hidden"
                        onChange={handleLessonFileUpload}
                      />
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('lesson-file-upload')?.click()} disabled={uploadingFile}>
                        {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={lessonForm.notes}
                onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                placeholder="Additional notes for this lesson"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} disabled={lessonSaving}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSaveLesson} disabled={lessonSaving}>
              {lessonSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLesson ? 'Update' : 'Create'} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module Dialog */}
      <AlertDialog open={deleteModuleDialogOpen} onOpenChange={setDeleteModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{moduleToDelete?.title}</strong>? All lessons within this module will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{lessonToDelete?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW 3: COURSE DETAIL (Existing builder - kept for backward compat)
// ═══════════════════════════════════════════════════════════════════════════
function CourseBuilderView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  // Course data
  const [course, setCourse] = useState<CourseItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<CourseModuleItem | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' })
  const [moduleSaving, setModuleSaving] = useState(false)

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<CourseLessonItem | null>(null)
  const [lessonModuleId, setLessonModuleId] = useState<string>('')
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as LessonType,
    videoUrl: '',
    videoDuration: '',
    content: '',
    fileUrl: '',
    notes: '',
    isFree: false,
  })
  const [lessonSaving, setLessonSaving] = useState(false)

  // Delete dialogs
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<CourseModuleItem | null>(null)
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<CourseLessonItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Upload states
  const [uploadingFile, setUploadingFile] = useState(false)

  // Fetch course with modules and lessons
  const fetchCourse = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
      } else {
        toast.error('Failed to load course')
        onBack()
      }
    } catch {
      toast.error('Failed to load course')
      onBack()
    } finally {
      setLoading(false)
    }
  }, [courseId, onBack])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  // Auto expand first module
  useEffect(() => {
    if (course?.modules?.length && expandedModules.length === 0) {
      setExpandedModules([course.modules[0].id])
    }
  }, [course, expandedModules.length])

  // ── Module handlers ────────────────────────────────────────────────────
  const openAddModuleDialog = () => {
    setEditingModule(null)
    setModuleForm({ title: '', description: '' })
    setModuleDialogOpen(true)
  }

  const openEditModuleDialog = (mod: CourseModuleItem) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, description: mod.description || '' })
    setModuleDialogOpen(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error('Module title is required')
      return
    }
    setModuleSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: moduleForm.title,
        description: moduleForm.description || null,
      }
      if (editingModule) body.id = editingModule.id

      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules`, {
        method: editingModule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Save failed')
      }
      toast.success(editingModule ? 'Module updated' : 'Module created')
      setModuleDialogOpen(false)
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save module')
    } finally {
      setModuleSaving(false)
    }
  }

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules?id=${moduleToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Module deleted')
      setDeleteModuleDialogOpen(false)
      setModuleToDelete(null)
      fetchCourse()
    } catch {
      toast.error('Failed to delete module')
    } finally {
      setDeleting(false)
    }
  }

  // ── Lesson handlers ────────────────────────────────────────────────────
  const openAddLessonDialog = (moduleId: string) => {
    setLessonModuleId(moduleId)
    setEditingLesson(null)
    setLessonForm({
      title: '',
      type: 'video',
      videoUrl: '',
      videoDuration: '',
      content: '',
      fileUrl: '',
      notes: '',
      isFree: false,
    })
    setLessonDialogOpen(true)
  }

  const openEditLessonDialog = (lesson: CourseLessonItem, moduleId: string) => {
    setLessonModuleId(moduleId)
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      type: (lesson.type || 'video') as LessonType,
      videoUrl: lesson.videoUrl || '',
      videoDuration: lesson.videoDuration ? String(Math.round(lesson.videoDuration / 60)) : '',
      content: lesson.content || '',
      fileUrl: lesson.fileUrl || '',
      notes: lesson.notes || '',
      isFree: lesson.isFree || false,
    })
    setLessonDialogOpen(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error('Lesson title is required')
      return
    }
    setLessonSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: lessonForm.title,
        type: lessonForm.type,
        content: lessonForm.content || null,
        videoUrl: lessonForm.videoUrl || null,
        videoDuration: lessonForm.videoDuration ? Number(lessonForm.videoDuration) * 60 : 0,
        fileUrl: lessonForm.fileUrl || null,
        notes: lessonForm.notes || null,
        isFree: lessonForm.isFree,
      }
      if (editingLesson) body.lessonId = editingLesson.id

      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules/lessons?moduleId=${lessonModuleId}`, {
        method: editingLesson ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Save failed')
      }
      toast.success(editingLesson ? 'Lesson updated' : 'Lesson created')
      setLessonDialogOpen(false)
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save lesson')
    } finally {
      setLessonSaving(false)
    }
  }

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}/modules/lessons?moduleId=${lessonToDelete.moduleId}&lessonId=${lessonToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Lesson deleted')
      setDeleteLessonDialogOpen(false)
      setLessonToDelete(null)
      fetchCourse()
    } catch {
      toast.error('Failed to delete lesson')
    } finally {
      setDeleting(false)
    }
  }

  // Lesson file upload handler
  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const url = await uploadFile(file)
      setLessonForm(prev => ({ ...prev, fileUrl: url }))
      toast.success('File uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-12 w-40 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!course) return null

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer" onClick={onBack}>Courses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-medium text-gray-900">{course.title}</span>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      {/* Course Summary Card */}
      <Card className="bsortOrder-0 shadow-sm bg-gradient-to-r from-amber-50/50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {course.thumbnail ? (
              <img
                src={course.thumbnail as string}
                alt={course.title}
                className="h-24 w-36 rounded-xl object-cover bsortOrder"
              />
            ) : (
              <div className="h-24 w-36 rounded-xl bg-gray-100 flex items-center justify-center bsortOrder">
                <ImageIcon className="h-8 w-8 text-gray-300" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
                  {course.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>}
                </div>
                <StatusBadge status={course.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {formatPrice(course.price, course.mrp)}
                {course.category && <Badge variant="secondary">{course.category}</Badge>}
                <Badge variant="secondary">{course.language}</Badge>
                <Badge variant="secondary">{course.level}</Badge>
                {course.featured && <FeaturedBadge featured={course.featured} />}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {course.modules?.length ?? 0} Modules</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {totalLessons} Lessons</span>
                <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {course.purchaseCount ?? 0} Enrolled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Module Button */}
      <Button onClick={openAddModuleDialog} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
        <Plus className="h-4 w-4" /> Add Module
      </Button>

      {/* Modules & Lessons */}
      {course.modules && course.modules.length > 0 ? (
        <Accordion
          type="multiple"
          value={expandedModules}
          onValueChange={setExpandedModules}
          className="space-y-3"
        >
          {course.modules.map((mod, modIdx) => (
            <AccordionItem key={mod.id} value={mod.id} className="bsortOrder rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 text-amber-700 text-sm font-bold flex-shrink-0">
                    {modIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{mod.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mod.lessons?.length ?? 0} lesson{(mod.lessons?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModuleDialog(mod)}>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setModuleToDelete(mod); setDeleteModuleDialogOpen(true) }}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4">
                <div className="space-y-2">
                  {mod.lessons?.map((lesson) => {
                    const typeConf = getLessonTypeConfig(lesson.type)
                    const TypeIcon = typeConf.icon
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-lg bsortOrder bg-gray-50/50 hover:bg-gray-50 transition-colors group"
                      >
                        <GripVertical className="h-4 w-4 text-gray-300" />
                        <div className={cn('flex items-center justify-center h-7 w-7 rounded-md text-xs font-medium bsortOrder', typeConf.color)}>
                          <TypeIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn('text-xs px-1.5 py-0.5 rounded bsortOrder', typeConf.color)}>{typeConf.label}</span>
                            {lesson.isFree && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 bsortOrder bsortOrder-emerald-200">Free</span>
                            )}
                            {lesson.videoDuration > 0 && (
                              <span className="text-xs text-muted-foreground">{formatDuration(lesson.videoDuration)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLessonDialog(lesson, mod.id)}>
                            <Pencil className="h-3 w-3 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLessonToDelete(lesson); setDeleteLessonDialogOpen(true) }}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {(!mod.lessons || mod.lessons.length === 0) && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No lessons in this module yet
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bsortOrder-dashed"
                    onClick={() => openAddLessonDialog(mod.id)}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Lesson
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bsortOrder-2 bsortOrder-dashed bsortOrder-gray-300 rounded-xl">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No modules yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first module to start building course content</p>
          <Button onClick={openAddModuleDialog} className="bg-amber-500 hover:bg-amber-600 text-white mt-4 gap-2">
            <Plus className="h-4 w-4" /> Add Module
          </Button>
        </div>
      )}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
            <DialogDescription>
              {editingModule ? 'Update module details' : 'Create a new module for your course'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module-title">Module Title *</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Enter module title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="module-desc">Description</Label>
              <Textarea
                id="module-desc"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Optional module description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} disabled={moduleSaving}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSaveModule} disabled={moduleSaving}>
              {moduleSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModule ? 'Update' : 'Create'} Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update lesson details' : 'Create a new lesson for this module'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lesson Type</Label>
                <Select value={lessonForm.type} onValueChange={(v) => setLessonForm({ ...lessonForm, type: v as LessonType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(lessonTypeConfig).map(([key, conf]) => {
                      const Icon = conf.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {conf.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={lessonForm.isFree}
                  onCheckedChange={(v) => setLessonForm({ ...lessonForm, isFree: v })}
                />
                <Label className="cursor-pointer">Free Preview</Label>
              </div>
            </div>

            {(lessonForm.type === 'video' || lessonForm.type === 'live') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Video URL</Label>
                  <Input
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="Paste video URL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={lessonForm.videoDuration}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoDuration: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}

            {(lessonForm.type === 'text' || lessonForm.type === 'quiz') && (
              <div className="grid gap-2">
                <Label>Content</Label>
                <Textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Enter lesson content"
                  rows={5}
                />
              </div>
            )}

            {lessonForm.type === 'pdf' && (
              <div className="grid gap-2">
                <Label>PDF File</Label>
                <div className="flex items-center gap-3">
                  {lessonForm.fileUrl ? (
                    <div className="flex items-center gap-2 flex-1 bg-gray-50 p-2 rounded-lg bsortOrder">
                      <File className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{lessonForm.fileUrl}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setLessonForm({ ...lessonForm, fileUrl: '' })}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        value={lessonForm.fileUrl}
                        onChange={(e) => setLessonForm({ ...lessonForm, fileUrl: e.target.value })}
                        placeholder="Paste URL or upload"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        id="lesson-file-upload-detail"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setUploadingFile(true)
                          try {
                            const url = await uploadFile(file)
                            setLessonForm(prev => ({ ...prev, fileUrl: url }))
                            toast.success('File uploaded')
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Upload failed')
                          } finally {
                            setUploadingFile(false)
                            e.target.value = ''
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('lesson-file-upload-detail')?.click()} disabled={uploadingFile}>
                        {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={lessonForm.notes}
                onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                placeholder="Additional notes for this lesson"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} disabled={lessonSaving}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSaveLesson} disabled={lessonSaving}>
              {lessonSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLesson ? 'Update' : 'Create'} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module Dialog */}
      <AlertDialog open={deleteModuleDialogOpen} onOpenChange={setDeleteModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{moduleToDelete?.title}</strong>? All lessons within this module will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{lessonToDelete?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Course Management Page
// ═══════════════════════════════════════════════════════════════════════════
export default function CourseManagementPage() {
  // View state: 'list' | 'wizard' | 'builder'
  const [view, setView] = useState<'list' | 'wizard' | 'builder'>('list')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOpenBuilder = (id: string) => {
    setSelectedCourseId(id)
    setView('builder')
  }

  const handleAddNew = () => {
    setSelectedCourseId(null)
    setView('wizard')
  }

  const handleEditCourse = (id: string) => {
    setSelectedCourseId(id)
    setView('wizard')
  }

  const handleBack = () => {
    setView('list')
    setSelectedCourseId(null)
    setRefreshKey(k => k + 1)
  }

  if (view === 'wizard') {
    return (
      <div className="relative">
        <CourseWizardView
          courseId={selectedCourseId}
          onBack={handleBack}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      </div>
    )
  }

  if (view === 'builder' && selectedCourseId) {
    return (
      <div className="relative">
        <CourseBuilderView
          courseId={selectedCourseId}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Default: List view
  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Page Header with Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your courses, modules, and lessons</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit shadow-sm" onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Course Listing */}
      <CourseListingView onOpenBuilder={handleOpenBuilder} />
    </div>
  )
}
