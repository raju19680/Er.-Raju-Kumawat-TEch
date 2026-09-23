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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2, Package, Star, Loader2,
  Globe, GlobeLock, Download, Copy, Filter, SlidersHorizontal, FileText, BookOpen,
  StickyNote, TestTube2, Layers, Eye, Upload, X, ImagePlus, FileUp, Link2,
  Languages, GraduationCap, User, Calendar, Clock, Tag, Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

// ── File upload helper ───────────────────────────────────────────────────
async function uploadFile(file: File, type: 'image' | 'document' | 'video' = 'document'): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  try {
    const res = await apiFetch(`/api/teacher/upload-image?type=${type}`, { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      return data.url || data.filePath || null
    }
    return null
  } catch {
    return null
  }
}

// ── Type config per product type ─────────────────────────────────────────
interface ProductTypeConfig {
  label: string
  pluralLabel: string
  icon: React.ComponentType<{ className?: string }>
  gradientFrom: string
  iconBg: string
  iconColor: string
  accentBg: string
  addBtnLabel: string
  description: string
  fileLabel: string
  fileAccept: string
  filePlaceholder: string
  categoryOptions: string[]
  languageOptions: string[]
  levelOptions: string[]
  showAuthor?: boolean
  showPages?: boolean
  showDuration?: boolean
  showValidity?: boolean
  extraFields?: string[]
}

const TYPE_CONFIGS: Record<string, ProductTypeConfig> = {
  ebook: {
    label: 'E-Book',
    pluralLabel: 'E-Books',
    icon: BookOpen,
    gradientFrom: 'from-sky-50',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    accentBg: 'bg-sky-500',
    addBtnLabel: 'Add E-Book',
    description: 'Manage your e-books, PDFs, and digital reading material',
    fileLabel: 'E-Book File (PDF, EPUB)',
    fileAccept: '.pdf,.epub,.mobi',
    filePlaceholder: 'Upload or enter URL for e-book file',
    categoryOptions: ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'School', 'General'],
    languageOptions: ['Hindi', 'English', 'Bilingual', 'Regional'],
    levelOptions: ['Beginner', 'Intermediate', 'Advanced', 'All'],
    showAuthor: true,
    showPages: true,
    extraFields: ['author', 'pages', 'isbn', 'edition', 'publisher'],
  },
  notes: {
    label: 'Notes',
    pluralLabel: 'Notes',
    icon: StickyNote,
    gradientFrom: 'from-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accentBg: 'bg-emerald-500',
    addBtnLabel: 'Add Notes',
    description: 'Manage study notes, cheat sheets, and reference material',
    fileLabel: 'Notes File (PDF, DOC)',
    fileAccept: '.pdf,.doc,.docx,.txt',
    filePlaceholder: 'Upload or enter URL for notes file',
    categoryOptions: ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'School', 'General'],
    languageOptions: ['Hindi', 'English', 'Bilingual', 'Regional'],
    levelOptions: ['Beginner', 'Intermediate', 'Advanced', 'All'],
    showAuthor: true,
    showPages: true,
    extraFields: ['author', 'pages', 'subject', 'chapter'],
  },
  test_series: {
    label: 'Test Series',
    pluralLabel: 'Test Series',
    icon: TestTube2,
    gradientFrom: 'from-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accentBg: 'bg-amber-500',
    addBtnLabel: 'Add Test Series Product',
    description: 'Manage test series as purchasable digital products',
    fileLabel: 'Syllabus / Info File (optional)',
    fileAccept: '.pdf,.doc,.docx',
    filePlaceholder: 'Upload or enter URL for test series info',
    categoryOptions: ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'School', 'General'],
    languageOptions: ['Hindi', 'English', 'Bilingual', 'Regional'],
    levelOptions: ['Beginner', 'Intermediate', 'Advanced', 'All'],
    showDuration: true,
    showValidity: true,
    extraFields: ['totalTests', 'totalQuestions', 'duration', 'validityDays', 'syllabus'],
  },
  other: {
    label: 'Other Product',
    pluralLabel: 'Other Products',
    icon: Layers,
    gradientFrom: 'from-gray-50',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    accentBg: 'bg-gray-500',
    addBtnLabel: 'Add Product',
    description: 'Manage other digital products and resources',
    fileLabel: 'Product File / Download URL',
    fileAccept: '.pdf,.doc,.docx,.zip,.rar,.mp4,.mp3',
    filePlaceholder: 'Upload or enter URL for product file',
    categoryOptions: ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'School', 'General', 'Other'],
    languageOptions: ['Hindi', 'English', 'Bilingual', 'Regional'],
    levelOptions: ['Beginner', 'Intermediate', 'Advanced', 'All'],
    extraFields: ['productType', 'format'],
  },
}

// ── Data types ───────────────────────────────────────────────────────────
interface ProductItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  file: string | null
  type: string
  category: string | null
  language: string | null
  level: string | null
  author: string | null
  pages: number | null
  price: number
  mrp: number
  status: string
  featured: boolean
  createdAt: string
  [key: string]: unknown
}

// ── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'draft'
  if (s === 'published') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">{status}</Badge>
  if (s === 'archived') return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">{status}</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">{status || 'Draft'}</Badge>
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function DigitalProductTypePage({ productType }: { productType: string }) {
  const orgCode = useAppStore(s => s.orgCode)
  const config = TYPE_CONFIGS[productType] || TYPE_CONFIGS.other
  const Icon = config.icon

  // Data state
  const [items, setItems] = useState<ProductItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stats
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, featured: 0 })

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // File upload state
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', category: '', thumbnail: '', file: '',
    price: '', mrp: '', status: 'draft', featured: false,
    language: '', level: '', author: '', pages: '',
    totalTests: '', totalQuestions: '', duration: '', validityDays: '',
    isbn: '', edition: '', publisher: '', subject: '', chapter: '',
    productType: '', format: '', syllabus: '',
  })

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
        type: productType,
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await apiFetch(`/api/teacher/digital-products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalItems(data.total || 0)
      }

      // Fetch stats (unfiltered)
      const statsRes = await apiFetch(`/api/teacher/digital-products?organizationId=${orgCode}&type=${productType}&limit=1000`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const all = statsData.items || []
        setStats({
          total: statsData.total || all.length,
          published: all.filter((i: ProductItem) => i.status?.toLowerCase() === 'published').length,
          draft: all.filter((i: ProductItem) => i.status?.toLowerCase() === 'draft').length,
          featured: all.filter((i: ProductItem) => i.featured).length,
        })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter, productType])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { setCurrentPageNum(1) }, [statusFilter, categoryFilter, productType])

  // Dialog helpers
  const openAddDialog = () => {
    setEditingItem(null)
    setForm({
      title: '', description: '', category: '', thumbnail: '', file: '',
      price: '', mrp: '', status: 'draft', featured: false,
      language: '', level: '', author: '', pages: '',
      totalTests: '', totalQuestions: '', duration: '', validityDays: '',
      isbn: '', edition: '', publisher: '', subject: '', chapter: '',
      productType: '', format: '', syllabus: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (item: ProductItem) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      thumbnail: (item.thumbnail as string) || '',
      file: (item.file as string) || '',
      price: String(item.price ?? ''),
      mrp: String(item.mrp ?? ''),
      status: item.status || 'draft',
      featured: item.featured || false,
      language: (item.language as string) || '',
      level: (item.level as string) || '',
      author: (item.author as string) || '',
      pages: String((item.pages as number) ?? ''),
      totalTests: String(((item as any).totalTests as number) ?? ''),
      totalQuestions: String(((item as any).totalQuestions as number) ?? ''),
      duration: ((item as any).duration as string) || '',
      validityDays: String(((item as any).validityDays as number) ?? ''),
      isbn: ((item as any).isbn as string) || '',
      edition: ((item as any).edition as string) || '',
      publisher: ((item as any).publisher as string) || '',
      subject: ((item as any).subject as string) || '',
      chapter: ((item as any).chapter as string) || '',
      productType: ((item as any).productType as string) || '',
      format: ((item as any).format as string) || '',
      syllabus: ((item as any).syllabus as string) || '',
    })
    setDialogOpen(true)
  }

  // File upload handlers
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setUploadingThumbnail(true)
    const url = await uploadFile(file, 'image')
    if (url) {
      setForm(prev => ({ ...prev, thumbnail: url }))
      toast.success('Thumbnail uploaded')
    } else {
      toast.error('Failed to upload thumbnail')
    }
    setUploadingThumbnail(false)
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50MB')
      return
    }
    setUploadingFile(true)
    const url = await uploadFile(file, 'document')
    if (url) {
      setForm(prev => ({ ...prev, file: url }))
      toast.success('File uploaded')
    } else {
      toast.error('Failed to upload file')
    }
    setUploadingFile(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Save handler
  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.price || Number(form.price) < 0) { toast.error('Please enter a valid price'); return }
    if (form.mrp && Number(form.mrp) < Number(form.price)) { toast.error('MRP should be ≥ selling price'); return }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        type: productType,
        category: form.category || null,
        thumbnail: form.thumbnail || null,
        file: form.file || null,
        price: Number(form.price) || 0,
        mrp: Number(form.mrp) || 0,
        status: form.status,
        featured: form.featured,
        organizationId: orgCode,
        language: form.language || null,
        level: form.level || null,
      }
      // Add type-specific fields
      if (config.showAuthor && form.author) body.author = form.author
      if (config.showPages && form.pages) body.pages = Number(form.pages)
      if (productType === 'ebook') {
        if (form.isbn) body.isbn = form.isbn
        if (form.edition) body.edition = form.edition
        if (form.publisher) body.publisher = form.publisher
      }
      if (productType === 'notes') {
        if (form.subject) body.subject = form.subject
        if (form.chapter) body.chapter = form.chapter
      }
      if (productType === 'test_series') {
        if (form.totalTests) body.totalTests = Number(form.totalTests)
        if (form.totalQuestions) body.totalQuestions = Number(form.totalQuestions)
        if (form.duration) body.duration = form.duration
        if (form.validityDays) body.validityDays = Number(form.validityDays)
        if (form.syllabus) body.syllabus = form.syllabus
      }
      if (productType === 'other') {
        if (form.productType) body.productType = form.productType
        if (form.format) body.format = form.format
      }

      if (editingItem) body.id = editingItem.id

      const res = await apiFetch('/api/teacher/digital-products', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Save failed')
      }
      toast.success(editingItem ? `${config.label} updated` : `${config.label} created`)
      setDialogOpen(false)
      setEditingItem(null)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to save ${config.label.toLowerCase()}`)
    } finally {
      setSaving(false)
    }
  }

  // Toggle publish
  const handleTogglePublish = async (item: ProductItem) => {
    try {
      const newStatus = item.status?.toLowerCase() === 'published' ? 'draft' : 'published'
      const res = await apiFetch('/api/teacher/digital-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(newStatus === 'published' ? 'Published' : 'Unpublished')
      fetchItems()
    } catch { toast.error('Failed to update status') }
  }

  // Toggle featured
  const handleToggleFeatured = async (item: ProductItem) => {
    try {
      const res = await apiFetch('/api/teacher/digital-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, featured: !item.featured }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(item.featured ? 'Removed from featured' : 'Marked as featured')
      fetchItems()
    } catch { toast.error('Failed to toggle featured') }
  }

  // Duplicate
  const handleDuplicate = async (item: ProductItem) => {
    try {
      const res = await apiFetch('/api/teacher/digital-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${item.title} (Copy)`, description: item.description, type: item.type,
          category: item.category, thumbnail: item.thumbnail, file: item.file,
          price: item.price, mrp: item.mrp, status: 'draft', featured: false, organizationId: orgCode,
        }),
      })
      if (!res.ok) throw new Error('Duplicate failed')
      toast.success(`${config.label} duplicated`)
      fetchItems()
    } catch { toast.error('Failed to duplicate') }
  }

  // Delete
  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/digital-products?id=${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success(`${config.label} deleted`)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch { toast.error(`Failed to delete ${config.label.toLowerCase()}`) }
    finally { setDeleting(false) }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const discount = form.price && form.mrp && Number(form.mrp) > Number(form.price)
    ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100) : 0

  // ── Render type-specific form fields ─────────────────────────────────
  const renderTypeSpecificFields = () => {
    if (productType === 'ebook') {
      return (
        <>
          {/* Author */}
          <div className="grid gap-2">
            <Label htmlFor="dp-author" className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Author
            </Label>
            <Input id="dp-author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" className="bg-gray-50 focus:bg-white" />
          </div>
          {/* Pages + Edition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dp-pages" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Pages
              </Label>
              <Input id="dp-pages" type="number" min="1" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} placeholder="250" className="bg-gray-50 focus:bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp-edition" className="text-sm font-medium">Edition</Label>
              <Input id="dp-edition" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="1st Edition" className="bg-gray-50 focus:bg-white" />
            </div>
          </div>
          {/* ISBN + Publisher */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dp-isbn" className="text-sm font-medium">ISBN</Label>
              <Input id="dp-isbn" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="978-XXX-XXX" className="bg-gray-50 focus:bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp-publisher" className="text-sm font-medium">Publisher</Label>
              <Input id="dp-publisher" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} placeholder="Publisher name" className="bg-gray-50 focus:bg-white" />
            </div>
          </div>
        </>
      )
    }

    if (productType === 'notes') {
      return (
        <>
          {/* Author */}
          <div className="grid gap-2">
            <Label htmlFor="dp-author" className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Author
            </Label>
            <Input id="dp-author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" className="bg-gray-50 focus:bg-white" />
          </div>
          {/* Subject + Chapter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dp-subject" className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Subject
              </Label>
              <Input id="dp-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Physics, Chemistry..." className="bg-gray-50 focus:bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp-chapter" className="text-sm font-medium">Chapter</Label>
              <Input id="dp-chapter" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} placeholder="Chapter name" className="bg-gray-50 focus:bg-white" />
            </div>
          </div>
          {/* Pages */}
          <div className="grid gap-2">
            <Label htmlFor="dp-pages" className="text-sm font-medium flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" /> Pages
            </Label>
            <Input id="dp-pages" type="number" min="1" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} placeholder="50" className="bg-gray-50 focus:bg-white" />
          </div>
        </>
      )
    }

    if (productType === 'test_series') {
      return (
        <>
          {/* Total Tests + Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dp-totalTests" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Total Tests
              </Label>
              <Input id="dp-totalTests" type="number" min="1" value={form.totalTests} onChange={(e) => setForm({ ...form, totalTests: e.target.value })} placeholder="10" className="bg-gray-50 focus:bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp-totalQuestions" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Total Questions
              </Label>
              <Input id="dp-totalQuestions" type="number" min="1" value={form.totalQuestions} onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })} placeholder="500" className="bg-gray-50 focus:bg-white" />
            </div>
          </div>
          {/* Duration + Validity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dp-duration" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Duration per Test
              </Label>
              <Input id="dp-duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3 hours" className="bg-gray-50 focus:bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp-validity" className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Validity (days)
              </Label>
              <Input id="dp-validity" type="number" min="1" value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: e.target.value })} placeholder="365" className="bg-gray-50 focus:bg-white" />
            </div>
          </div>
          {/* Syllabus */}
          <div className="grid gap-2">
            <Label htmlFor="dp-syllabus" className="text-sm font-medium">Syllabus / Topics</Label>
            <Textarea id="dp-syllabus" value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })} placeholder="Enter syllabus topics, one per line..." rows={3} className="bg-gray-50 focus:bg-white resize-none" />
          </div>
        </>
      )
    }

    if (productType === 'other') {
      return (
        <>
          {/* Product Type + Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dp-productType" className="text-sm font-medium">Product Type</Label>
              <Input id="dp-productType" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} placeholder="Template, Worksheet, etc." className="bg-gray-50 focus:bg-white" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dp-format" className="text-sm font-medium">Format</Label>
              <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v === '_none_' ? '' : v })}>
                <SelectTrigger id="dp-format" className="bg-gray-50 focus:bg-white">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">None</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOC">DOC</SelectItem>
                  <SelectItem value="ZIP">ZIP</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{config.pluralLabel}</h2>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        </div>
        <Button className={cn('text-white w-full sm:w-fit shadow-sm', config.accentBg, `hover:${config.accentBg}/90`)} onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {config.addBtnLabel}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('flex items-center justify-center h-11 w-11 rounded-xl', config.iconBg)}>
                <Icon className={cn('h-5 w-5', config.iconColor)} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                <div className="text-2xl font-bold text-gray-900">{loading ? <Skeleton className="h-7 w-12" /> : stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
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
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
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
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-white">
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${config.pluralLabel.toLowerCase()} by title, description...`}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageNum(1) }}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-white">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
            <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {config.categoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-12 text-xs font-semibold uppercase tracking-wide">S.NO</TableHead>
              <TableHead className="w-16 text-xs font-semibold uppercase tracking-wide">Image</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">{config.label}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Price</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Featured</TableHead>
              <TableHead className="w-16 text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-11 w-11 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn('flex items-center justify-center h-16 w-16 rounded-2xl', config.iconBg)}>
                      <Icon className={cn('h-8 w-8', config.iconColor)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">No {config.pluralLabel.toLowerCase()} found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {debouncedSearch || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : `Create your first ${config.label.toLowerCase()} to get started`}
                      </p>
                    </div>
                    {!debouncedSearch && statusFilter === 'all' && (
                      <Button className={cn('text-white mt-2', config.accentBg)} size="sm" onClick={openAddDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        {config.addBtnLabel}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    {item.thumbnail ? (
                      <div className="h-11 w-11 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                        <img src={item.thumbnail as string} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg ring-1', config.iconBg, `ring-${config.iconColor}/30`)}>
                        <Icon className={cn('h-5 w-5', config.iconColor)} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">{item.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.language && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Languages className="h-3 w-3" />{item.language as string}
                          </span>
                        )}
                        {item.level && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <GraduationCap className="h-3 w-3" />{item.level as string}
                          </span>
                        )}
                        {item.author && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />{item.author as string}
                          </span>
                        )}
                        {item.file && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                            <Download className="h-3 w-3" />Has file
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="outline" className="text-xs font-normal">{item.category}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-semibold text-sm text-gray-900">₹{item.price ?? 0}</span>
                      {item.mrp > (item.price ?? 0) && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground line-through">₹{item.mrp}</span>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1 py-0">
                            {Math.round(((item.mrp - (item.price ?? 0)) / item.mrp) * 100)}% OFF
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    {item.featured ? (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 hover:bg-amber-50">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(item)}>
                          {item.status?.toLowerCase() === 'published' ? (
                            <><GlobeLock className="mr-2 h-4 w-4" /> Unpublish</>
                          ) : (
                            <><Globe className="mr-2 h-4 w-4" /> Publish</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(item)}>
                          <Star className={`mr-2 h-4 w-4 ${item.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {item.featured ? 'Remove Featured' : 'Mark Featured'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true) }}>
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

      {/* Showing entries */}
      <div className="text-center text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>Showing {(currentPageNum - 1) * itemsPerPage + 1} to {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} {config.pluralLabel.toLowerCase()}</>
        ) : `No ${config.pluralLabel.toLowerCase()} to show`}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))} className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink isActive={page === currentPageNum} onClick={() => setCurrentPageNum(page)} className="cursor-pointer">{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))} className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ── Add/Edit Dialog ────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingItem ? `Edit ${config.label}` : `Add ${config.label}`}</DialogTitle>
            <DialogDescription>
              {editingItem ? `Update the ${config.label.toLowerCase()} details below.` : `Fill in the details to create a new ${config.label.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="dp-title" className="text-sm font-medium">Title <span className="text-destructive">*</span></Label>
              <Input id="dp-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={`Enter ${config.label.toLowerCase()} title`} className="bg-gray-50 focus:bg-white" />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="dp-desc" className="text-sm font-medium">Description</Label>
              <Textarea id="dp-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={`Describe this ${config.label.toLowerCase()}...`} rows={3} className="bg-gray-50 focus:bg-white resize-none" />
            </div>

            {/* Thumbnail Upload */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <ImagePlus className="h-3.5 w-3.5" /> Cover Image / Thumbnail
              </Label>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Input
                      value={form.thumbnail}
                      onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                      placeholder="https://example.com/thumbnail.jpg"
                      className="bg-gray-50 focus:bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={uploadingThumbnail}
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      {uploadingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Upload an image or paste URL (JPG, PNG, max 5MB)</p>
                </div>
                {form.thumbnail && (
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200 shrink-0 group">
                    <img src={form.thumbnail} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setForm({ ...form, thumbnail: '' })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
            </div>

            {/* File Upload */}
            <div className="grid gap-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <FileUp className="h-3.5 w-3.5" /> {config.fileLabel}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={form.file}
                    onChange={(e) => setForm({ ...form, file: e.target.value })}
                    placeholder={config.filePlaceholder}
                    className="bg-gray-50 focus:bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  Upload
                </Button>
              </div>
              {form.file && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700 truncate flex-1">{form.file}</span>
                  <button type="button" onClick={() => setForm({ ...form, file: '' })} className="text-emerald-600 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={config.fileAccept}
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Category + Language */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dp-cat" className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Category
                </Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v === '_none_' ? '' : v })}>
                  <SelectTrigger id="dp-cat" className="bg-gray-50 focus:bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">None</SelectItem>
                    {config.categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dp-lang" className="text-sm font-medium flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5" /> Language
                </Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v === '_none_' ? '' : v })}>
                  <SelectTrigger id="dp-lang" className="bg-gray-50 focus:bg-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">None</SelectItem>
                    {config.languageOptions.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Level */}
            <div className="grid gap-2">
              <Label htmlFor="dp-level" className="text-sm font-medium flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Level
              </Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v === '_none_' ? '' : v })}>
                <SelectTrigger id="dp-level" className="bg-gray-50 focus:bg-white">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">None</SelectItem>
                  {config.levelOptions.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific fields */}
            {renderTypeSpecificFields()}

            {/* Price + MRP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dp-price" className="text-sm font-medium">Selling Price (₹) <span className="text-destructive">*</span></Label>
                <Input id="dp-price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="299" className="bg-gray-50 focus:bg-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dp-mrp" className="text-sm font-medium">MRP (₹)</Label>
                <Input id="dp-mrp" type="number" min="0" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} placeholder="599" className="bg-gray-50 focus:bg-white" />
              </div>
            </div>

            {/* Discount Preview */}
            {discount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">{discount}% OFF</Badge>
                <span className="text-xs text-emerald-700">Customers save ₹{Number(form.mrp) - Number(form.price)}</span>
              </div>
            )}

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="dp-status" className="text-sm font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="dp-status" className="bg-gray-50 focus:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Featured Product</Label>
                <p className="text-xs text-muted-foreground">Featured products are highlighted on the storefront</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(checked) => setForm({ ...form, featured: checked })} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className={cn('text-white', config.accentBg)} onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete {config.label}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">{itemToDelete?.title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            {itemToDelete && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className={cn('flex items-center justify-center h-11 w-11 rounded-lg', config.iconBg)}>
                  <Icon className={cn('h-5 w-5', config.iconColor)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{itemToDelete.title}</p>
                  <p className="text-xs text-muted-foreground">{config.label} • ₹{itemToDelete.price}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
