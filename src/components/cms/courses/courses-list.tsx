'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit3, Trash2, Eye, EyeOff, BookOpen, Clock, Users,
  ChevronLeft, ChevronRight, Loader2, X, Upload, Video, Image as ImageIcon,
  Tag, DollarSign, Settings, FileText, Check, ArrowRight, ArrowLeft,
  Star, Layers, Link2, Code, Save, MoreVertical, Copy, RefreshCw, Share2,
  Lock, Unlock, Folder, FolderPlus, Radio, Monitor, FileEdit, Award,
  Music, File, FileCode, ClipboardList, List as ListIcon, Grid3x3, Filter, Play,
  Calendar, LayoutGrid, Table as TableIcon
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CourseContentManager } from './course-content-manager'

interface Course {
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
  parentId?: string | null
  children?: Course[]
  createdAt: string
  _count?: { purchasedBy: number; children?: number }
}

const STEPS = [
  { id: 1, label: 'Basic Info', icon: FileText },
  { id: 2, label: 'Pricing', icon: DollarSign },
  { id: 3, label: 'Content', icon: Layers },
  { id: 4, label: 'Settings', icon: Settings },
]

const BULK_ACTIONS = [
  { label: 'Add Folder', icon: FolderPlus, color: 'text-blue-500' },
  { label: 'Add Link', icon: Link2, color: 'text-green-500' },
  { label: 'Add Video', icon: Video, color: 'text-red-500' },
  { label: 'Add PDF', icon: File, color: 'text-orange-500' },
  { label: 'Add Test', icon: ClipboardList, color: 'text-amber-500' },
  { label: 'Add Subjective Test', icon: FileEdit, color: 'text-indigo-500' },
  { label: 'Add Quiz', icon: Award, color: 'text-yellow-500' },
  { label: 'Add Image', icon: ImageIcon, color: 'text-pink-500' },
  { label: 'Add Audio File', icon: Music, color: 'text-indigo-500' },
  { label: 'Add Live Stream', icon: Radio, color: 'text-purple-500' },
  { label: 'Add YouTube/Zoom Video', icon: Monitor, color: 'text-red-600' },
  { label: 'Add Webinar.gg Live', icon: Radio, color: 'text-pink-500' },
  { label: 'Add Document', icon: FileText, color: 'text-blue-500' },
]

export function CoursesList() {
  const { orgCode } = useAppStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState('products')
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table')

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Delete state
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)

  // Content management state
  const [contentManagerCourse, setContentManagerCourse] = useState<Course | null>(null)

  // Explorer state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{id: string, title: string}>>([])

  // Form data
  const [formData, setFormData] = useState({
    title: '', description: '', content: '', thumbnail: '', demoVideo: '',
    price: '0', mrp: '0', category: '', language: 'Hindi', level: 'All',
    featured: false, status: 'draft', validityType: 'lifetime',
    validityMonths: '12', validityEndDate: '', discountCode: '', sortOrder: '0', parentId: null as string | null,
    seoTitle: '', seoDescription: '', richSnippets: false,
  })

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ 
        page: String(page), 
        limit: '20', 
        parentId: currentFolderId || 'null',
        ...(search ? { search } : {}) 
      })
      const res = await apiFetch(`/api/teacher/courses?${params}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      setCourses(data.items || [])
      setTotal(data.total || 0)
    } catch { setError('Failed to load courses.') }
    finally { setLoading(false) }
  }, [page, search, currentFolderId])

  useEffect(() => { fetchCourses() }, [fetchCourses, currentFolderId])

  const handleNavigateFolder = (course: Course) => {
    setBreadcrumbs(prev => [...prev, { id: course.id, title: course.title }])
    setCurrentFolderId(course.id)
    setPage(1)
  }

  const handleNavigateUp = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([])
      setCurrentFolderId(null)
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
      setBreadcrumbs(newBreadcrumbs)
      setCurrentFolderId(newBreadcrumbs[index].id)
    }
    setPage(1)
  }

  const openWizard = (course: Course | null) => {
    setEditingCourse(course)
    setCurrentStep(1)
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        content: course.content || '',
        thumbnail: course.thumbnail || '',
        demoVideo: course.demoVideo || '',
        price: String(course.price ?? 0),
        mrp: String(course.mrp ?? 0),
        category: course.category || '',
        language: course.language || 'Hindi',
        level: course.level || 'All',
        featured: course.featured ?? false,
        status: course.status || 'draft',
        validityType: course.validityType || 'lifetime',
        validityMonths: course.validityMonths != null ? String(course.validityMonths) : '12',
        validityEndDate: course.validityEndDate ? new Date(course.validityEndDate).toISOString().split('T')[0] : '',
        discountCode: course.discountCode || '',
        sortOrder: String(course.sortOrder ?? 0),
        parentId: course.parentId ?? currentFolderId ?? null,
        seoTitle: course.seoTitle || '',
        seoDescription: course.seoDescription || '',
        richSnippets: course.richSnippets ?? false,
      })
    } else {
      setFormData({
        title: '', description: '', content: '', thumbnail: '', demoVideo: '',
        price: '0', mrp: '0', category: '', language: 'Hindi', level: 'All',
        featured: false, status: 'draft', validityType: 'lifetime',
        validityMonths: '12', validityEndDate: '', discountCode: '', sortOrder: '0', parentId: currentFolderId,
        seoTitle: '', seoDescription: '', richSnippets: false,
      })
    }
    setWizardOpen(true)
  }

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) { toast.error('Course title is required'); setCurrentStep(1); return }
    setSaving(true)
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        mrp: parseFloat(formData.mrp) || 0,
        validityMonths: formData.validityType === 'months' ? parseInt(formData.validityMonths) : null,
        validityEndDate: formData.validityType === 'end_date' ? formData.validityEndDate : null,
        status: publish ? 'published' : formData.status,
        parentId: formData.parentId,
      }
      const url = editingCourse ? `/api/teacher/courses/${editingCourse.id}` : '/api/teacher/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(publish ? 'Course published!' : 'Course saved as draft')
      setWizardOpen(false)
      fetchCourses()
    } catch (err: any) { toast.error(err.message || 'Failed to save course') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Course deleted')
      fetchCourses()
    } catch { toast.error('Failed to delete') }
    setCourseToDelete(null)
  }

  const togglePublish = async (course: Course) => {
    try {
      const res = await apiFetch(`/api/teacher/courses/${course.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: course.status === 'published' ? 'draft' : 'published' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(course.status === 'published' ? 'Unpublished' : 'Published')
      fetchCourses()
    } catch { toast.error('Failed') }
  }

  const update = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }))

  const handleImageUpload = async (file: File, field: 'thumbnail' | 'demoVideo') => {
    if (!file) return
    try {
      const fd = new FormData(); fd.append('file', file)
      // Route now supports both image and video uploads based on type query
      const uploadType = field === 'demoVideo' ? 'video' : 'image'
      const res = await apiFetch(`/api/teacher/upload-image?type=${uploadType}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      update(field, data.url)
      toast.success(`${uploadType === 'video' ? 'Video' : 'Image'} uploaded!`)
    } catch (err: any) { toast.error(err.message || 'Upload failed') }
  }

  // ── Duplicate course (deep copy with modules + lessons) ──
  const handleDuplicate = async (course: Course) => {
    try {
      toast.info('Duplicating course...')
      const res = await apiFetch(`/api/teacher/courses/${course.id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate')
      toast.success(`Course duplicated as "${data.course?.title || course.title + ' (Copy)'}"`)
      fetchCourses()
    } catch (err: any) { toast.error(err.message || 'Failed to duplicate course') }
  }

  // ── Share course (copy public URL to clipboard) ──
  const handleShare = async (course: Course) => {
    const shareUrl = `${window.location.origin}/?orgCode=${orgCode}&course=${course.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, text: `Check out this course: ${course.title}`, url: shareUrl })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Course link copied to clipboard!')
      } else {
        // Fallback for older browsers
        const ta = document.createElement('textarea')
        ta.value = shareUrl
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast.success('Course link copied!')
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Failed to copy link')
      }
    }
  }

  // ── Content Manager ──
  if (contentManagerCourse) {
    return <CourseContentManager courseId={contentManagerCourse.id} courseTitle={contentManagerCourse.title} onBack={() => setContentManagerCourse(null)} />
  }

  // ── Loading ──
  if (loading && courses.length === 0) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="truncate">Courses</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
            <button 
              onClick={() => handleNavigateUp(-1)}
              className={`hover:text-foreground hover:underline transition-colors ${!currentFolderId ? 'font-medium text-foreground' : ''}`}
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
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => openWizard(null)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-10">
            <Plus className="w-4 h-4" /> <span className="sm:inline">{currentFolderId ? 'Add Item' : 'Add Course'}</span>
          </Button>
          {/* Bulk Actions 3-dot dropdown - uses Radix Portal so it won't be clipped */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Bulk Actions" className="h-9 w-9 sm:h-10 sm:w-10">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {BULK_ACTIONS.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => {
                    if (courses.length === 0) { toast.error('Create a course first'); return }
                    setContentManagerCourse(courses[0])
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs: Products | Live & Upcoming | Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full max-w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="products" className="flex-1 sm:flex-initial">Products</TabsTrigger>
          <TabsTrigger value="live" className="flex-1 sm:flex-initial">Live & Upcoming</TabsTrigger>
          <TabsTrigger value="content" className="flex-1 sm:flex-initial">Content</TabsTrigger>
        </TabsList>

        {/* ── Products Tab (Course Table) ── */}
        <TabsContent value="products" className="space-y-4">
          {/* Search */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-[180px] sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 h-9 sm:h-10" />
            </div>
            <Button variant="outline" size="sm" className="gap-1 h-9 sm:h-10"><Filter className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Filters</span></Button>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
              <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('list')}>
                <ListIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${viewMode === 'table' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('table')}>
                <TableIcon className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground ml-auto sm:ml-0">{total} total</span>
          </div>

          {/* List/Grid/Table */}
          {courses.length === 0 ? (
            <Card><CardContent className="p-8 sm:p-12 text-center">
              <BookOpen className="w-11 h-11 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">No courses yet</p>
              <Button onClick={() => openWizard(null)} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4" /> Create First Course</Button>
            </CardContent></Card>
          ) : (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">S.No</th>
                      <th className="text-left px-4 py-3 font-medium">Product Name</th>
                      <th className="text-left px-4 py-3 font-medium">Category</th>
                      <th className="text-left px-4 py-3 font-medium">Price</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {courses.map((course, idx) => (
                      <tr key={course.id} className="hover:bg-muted/30 group">
                        <td className="px-4 py-3 text-muted-foreground">{(page - 1) * 20 + idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center shrink-0 overflow-hidden">
                              {course.thumbnail ? <MediaImage src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-emerald-600/30" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => setContentManagerCourse(course)}>{course.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{course.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline">{course.category || '—'}</Badge></td>
                        <td className="px-4 py-3 font-semibold">₹{course.price}</td>
                        <td className="px-4 py-3">
                          {course.status === 'published'
                            ? <Badge className="bg-emerald-600">Published</Badge>
                            : <Badge variant="secondary">Inactive</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setContentManagerCourse(course)}>
                              <Layers className="w-3.5 h-3.5 mr-1" /> Content
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openWizard(course)}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            {/* 3-dot row dropdown - Radix Portal, no clipping */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => handleNavigateFolder(course)} className="cursor-pointer font-medium text-emerald-600">
                                  <Folder className="w-3.5 h-3.5 mr-2" /> Open Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setContentManagerCourse(course)} className="cursor-pointer">
                                  <Layers className="w-3.5 h-3.5 mr-2" /> Course Overview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setContentManagerCourse(course)} className="cursor-pointer">
                                  <BookOpen className="w-3.5 h-3.5 mr-2" /> Add/View Content
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => togglePublish(course)} className="cursor-pointer">
                                  {course.status === 'published' ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
                                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openWizard(course)} className="cursor-pointer">
                                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(course)} className="cursor-pointer">
                                  <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(course)} className="cursor-pointer">
                                  <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setCourseToDelete(course)} className="cursor-pointer text-destructive focus:text-destructive focus:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

              {/* Grid / List View */}
              {viewMode !== 'table' && (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                {courses.map((course, idx) => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex flex-col sm:flex-row gap-4' : 'flex flex-col gap-3'}`}>
                      <div className={`flex items-start gap-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className={`rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center shrink-0 overflow-hidden ${viewMode === 'grid' ? 'w-full h-40 mb-3' : 'w-16 h-16 sm:w-24 sm:h-24'}`}>
                          {course.thumbnail ? <MediaImage src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <BookOpen className={`text-emerald-600/30 ${viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-base leading-tight cursor-pointer hover:text-emerald-600 transition-colors line-clamp-2" onClick={() => setContentManagerCourse(course)}>{course.title}</p>
                            {/* 3-dot row dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => handleNavigateFolder(course)} className="cursor-pointer font-medium text-emerald-600">
                                  <Folder className="w-3.5 h-3.5 mr-2" /> Open Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setContentManagerCourse(course)} className="cursor-pointer">
                                  <Layers className="w-3.5 h-3.5 mr-2" /> Course Overview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setContentManagerCourse(course)} className="cursor-pointer">
                                  <BookOpen className="w-3.5 h-3.5 mr-2" /> Add/View Content
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => togglePublish(course)} className="cursor-pointer">
                                  {course.status === 'published' ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
                                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openWizard(course)} className="cursor-pointer">
                                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(course)} className="cursor-pointer">
                                  <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(course)} className="cursor-pointer">
                                  <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setCourseToDelete(course)} className="cursor-pointer text-destructive focus:text-destructive focus:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description || 'No description'}</p>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <Badge variant="outline" className="text-xs">{course.category || '—'}</Badge>
                            <span className="text-sm font-semibold text-emerald-600">₹{course.price}</span>
                            {course.status === 'published'
                              ? <Badge className="bg-emerald-600 text-xs">Published</Badge>
                              : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'sm:ml-auto sm:self-center' : 'mt-4 border-t pt-4'}`}>
                        <Button size="sm" variant="outline" className="h-9 flex-1 sm:flex-initial gap-1 text-xs" onClick={() => setContentManagerCourse(course)}>
                              <Layers className="w-3.5 h-3.5" /> Content
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => openWizard(course)}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm">Page {page}</span>
              <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </TabsContent>

        {/* ── Live & Upcoming Tab ── */}
        <TabsContent value="live">
          <div className="rounded-lg border overflow-hidden">
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Content ID</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Live On</th>
                  <th className="text-left px-4 py-3 font-medium">Go Live</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No live sessions yet</td></tr>
              </tbody>
            </table>
            {/* Mobile empty state */}
            <div className="md:hidden p-8 text-center text-sm text-muted-foreground">No live sessions yet</div>
          </div>
        </TabsContent>

        {/* ── Content Tab ── */}
        <TabsContent value="content">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            <div className="relative flex-1 min-w-[180px] sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search content..." className="pl-9 h-9 sm:h-10" />
            </div>
            <Button variant="outline" size="sm" className="gap-1 h-9 sm:h-10"><Filter className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Filters</span></Button>
          </div>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">View</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.filter(c => c.status === 'published').map((course, idx) => (
                  <tr key={course.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{course.title}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="bg-green-50 text-green-700">Recorded</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(course.createdAt).toLocaleDateString()} at {new Date(course.createdAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3"><Button size="sm" variant="outline" className="gap-1" onClick={() => setContentManagerCourse(course)}><Play className="w-3 h-3" /> View</Button></td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="w-3.5 h-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setContentManagerCourse(course)} className="cursor-pointer"><Play className="w-3.5 h-3.5 mr-2" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setContentManagerCourse(course)} className="cursor-pointer"><Layers className="w-3.5 h-3.5 mr-2" /> Manage Content</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {courses.filter(c => c.status === 'published').length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No content yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {courses.filter(c => c.status === 'published').map((course, idx) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                      <p className="font-medium text-sm truncate">{course.title}</p>
                      <Badge variant="outline" className="bg-green-50 text-green-700 text-xs mt-1">Recorded</Badge>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(course.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs shrink-0" onClick={() => setContentManagerCourse(course)}><Play className="w-3 h-3" /> View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {courses.filter(c => c.status === 'published').length === 0 && (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No content yet</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Mock bulk action modal removed */}

      {/* ── Multi-Step Course Wizard ── */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-xl shadow-2xl w-full max-w-6xl my-2 sm:my-8 max-h-[98vh] sm:max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-background border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-xl font-bold truncate">{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="hidden sm:inline-flex"><Save className="w-4 h-4 mr-1" /> Save Draft</Button>
                <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Publish</span></>}</Button>
                <Button variant="ghost" size="icon" onClick={() => setWizardOpen(false)}><X className="w-5 h-5" /></Button>
              </div>
            </div>
            <div className="border-b px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {STEPS.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <button onClick={() => setCurrentStep(step.id)} className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${currentStep === step.id ? 'bg-emerald-600 text-white' : currentStep > step.id ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-muted text-muted-foreground'}`}>
                        {currentStep > step.id ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <span className={`text-xs sm:text-xs font-medium ${currentStep === step.id ? 'text-emerald-600' : 'text-muted-foreground'}`}>{step.label}</span>
                    </button>
                    {idx < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 sm:mx-2 ${currentStep > step.id ? 'bg-emerald-600' : 'bg-muted'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-6">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <h3 className="text-base sm:text-lg font-semibold">Basic Course Information</h3>
                      <div className="space-y-2"><Label>Title *</Label><Input placeholder="Enter course name" value={formData.title} onChange={(e) => update('title', e.target.value)} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2"><Label>Price (₹) *</Label><Input type="number" placeholder="0" value={formData.price} onChange={(e) => update('price', e.target.value)} /><p className="text-xs text-muted-foreground">Final price student will pay</p></div>
                        <div className="space-y-2"><Label>Category</Label><Input placeholder="e.g. Physics, JEE" value={formData.category} onChange={(e) => update('category', e.target.value)} /></div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border"><div><Label className="cursor-pointer">Featured Course</Label><p className="text-xs text-muted-foreground">Show on homepage</p></div><Switch checked={formData.featured} onCheckedChange={(v) => update('featured', v)} /></div>
                      <div className="space-y-2"><Label>Course Description</Label><Textarea placeholder="Write a detailed description..." value={formData.description} onChange={(e) => update('description', e.target.value)} rows={6} /></div>
                      <div className="space-y-2">
                        <Label>Cover Image URL</Label>
                        <div className="flex gap-2">
                          <Input placeholder="https://..." value={formData.thumbnail} onChange={(e) => update('thumbnail', e.target.value)} />
                          <Button variant="outline" size="icon" onClick={() => document.getElementById('thumb-upload')?.click()}><Upload className="w-4 h-4" /></Button>
                          <input id="thumb-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'thumbnail') }} />
                        </div>
                        {formData.thumbnail && <MediaImage src={formData.thumbnail} alt="" className="mt-2 rounded-lg border max-h-40 object-cover" />}
                      </div>
                      <div className="space-y-2">
                        <Label>Demo Video URL</Label>
                        <div className="flex gap-2">
                          <Input placeholder="https://youtube.com/watch?v=..." value={formData.demoVideo} onChange={(e) => update('demoVideo', e.target.value)} />
                          <Button variant="outline" size="icon" onClick={() => document.getElementById('video-upload')?.click()}><Video className="w-4 h-4" /></Button>
                          <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'demoVideo') }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2"><Label>Language</Label><Select value={formData.language} onValueChange={(v) => update('language', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Hindi">Hindi</SelectItem><SelectItem value="English">English</SelectItem><SelectItem value="Bilingual">Bilingual</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Level</Label><Select value={formData.level} onValueChange={(v) => update('level', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All Levels</SelectItem><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent></Select></div>
                      </div>
                      <div className="space-y-2"><Label>Course Validity</Label><Select value={formData.validityType} onValueChange={(v) => update('validityType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lifetime">Lifetime Access</SelectItem><SelectItem value="months">Limited (Months)</SelectItem><SelectItem value="end_date">End Date</SelectItem></SelectContent></Select>
                        {formData.validityType === 'months' && <Input type="number" placeholder="Months" value={formData.validityMonths} onChange={(e) => update('validityMonths', e.target.value)} />}
                        {formData.validityType === 'end_date' && <Input type="date" value={formData.validityEndDate} onChange={(e) => update('validityEndDate', e.target.value)} />}
                      </div>
                    </motion.div>
                  )}
                  {currentStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <h3 className="text-base sm:text-lg font-semibold">Pricing & Discounts</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2"><Label>MRP (Original Price)</Label><Input type="number" placeholder="999" value={formData.mrp} onChange={(e) => update('mrp', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Selling Price</Label><Input type="number" placeholder="499" value={formData.price} onChange={(e) => update('price', e.target.value)} /></div>
                      </div>
                      {parseFloat(formData.mrp) > 0 && parseFloat(formData.price) > 0 && (
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                          <div className="flex items-center justify-between">
                            <div><p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Discount</p><p className="text-2xl font-bold text-emerald-600">{Math.round((1 - parseFloat(formData.price) / parseFloat(formData.mrp)) * 100)}% OFF</p></div>
                            <div className="text-right"><p className="text-sm text-muted-foreground line-through">₹{formData.mrp}</p><p className="text-2xl font-bold">₹{formData.price}</p></div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2"><Label>Discount Codes</Label><Input placeholder="SUMMER20, FIRST50" value={formData.discountCode} onChange={(e) => update('discountCode', e.target.value)} /></div>
                    </motion.div>
                  )}
                  {currentStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <h3 className="text-base sm:text-lg font-semibold">Course Content</h3>
                      <div className="space-y-2"><Label>Additional Content / Notes</Label><Textarea placeholder="Any additional content..." value={formData.content} onChange={(e) => update('content', e.target.value)} rows={5} /></div>
                      <div className="p-4 rounded-lg border-2 border-dashed text-center">
                        <Layers className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm font-medium">Course Modules & Lessons</p>
                        <p className="text-xs text-muted-foreground mt-1">Save the course, then add modules from the Content Manager.</p>
                        {editingCourse ? <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => { setWizardOpen(false); setContentManagerCourse(editingCourse) }}><Plus className="w-3.5 h-3.5" /> Manage Modules</Button> : <Badge variant="secondary" className="mt-3 text-xs">Save course to enable</Badge>}
                      </div>
                    </motion.div>
                  )}
                  {currentStep === 4 && (
                    <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <h3 className="text-base sm:text-lg font-semibold">Additional Settings</h3>
                      <div className="space-y-2"><Label>Sorting Order</Label><Input type="number" placeholder="0" value={formData.sortOrder} onChange={(e) => update('sortOrder', e.target.value)} /></div>
                      <div className="space-y-2"><Label>Course Status</Label><Select value={formData.status} onValueChange={(v) => update('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
                      
                      <div className="pt-2 pb-2 border-t border-b">
                        <h4 className="font-medium mb-3">SEO & Snippets</h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label>SEO Meta Title</Label>
                            <Input placeholder="Enter meta title for SEO" value={formData.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label>SEO Meta Description</Label>
                            <Textarea placeholder="Enter meta description for SEO" rows={2} value={formData.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} />
                          </div>
                          <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/30">
                            <div>
                              <Label className="text-sm font-medium">Enable Rich Snippets</Label>
                              <p className="text-xs text-muted-foreground">Add schema markup for search engines</p>
                            </div>
                            <Switch checked={formData.richSnippets} onCheckedChange={(v) => update('richSnippets', v)} />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border">
                        <h4 className="font-medium mb-3">Review Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Title:</span><span className="font-medium">{formData.title || 'Not set'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Price:</span><span className="font-medium">₹{formData.price}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">MRP:</span><span className="font-medium">₹{formData.mrp}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="font-medium">{formData.category || 'None'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-medium">{formData.status}</span></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1}><ArrowLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Back</span></Button>
                  {currentStep < 4 ? <Button onClick={() => setCurrentStep(s => Math.min(4, s + 1))} className="bg-emerald-600 hover:bg-emerald-700"><span className="hidden sm:inline">Next</span> <ArrowRight className="w-4 h-4 ml-1" /></Button> : <Button onClick={() => handleSave(true)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} <span className="hidden sm:inline">Publish Course</span><span className="sm:hidden">Publish</span></Button>}
                </div>
              </div>
              {/* Live Preview */}
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-3 flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</p>
                  <Card className="overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 relative">
                      {formData.thumbnail ? <MediaImage src={formData.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-11 h-11 text-emerald-600/30" /></div>}
                      {formData.featured && <Badge className="absolute top-2 left-2 bg-amber-500"><Star className="w-3 h-3 mr-1" /> Featured</Badge>}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-lg line-clamp-2">{formData.title || 'Course Title'}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{formData.description || 'Course description...'}</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.category && <Badge variant="outline" className="text-xs">{formData.category}</Badge>}
                        <Badge variant="outline" className="text-xs">{formData.level}</Badge>
                        <Badge variant="outline" className="text-xs">{formData.language}</Badge>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-2xl font-bold text-emerald-600">₹{formData.price || '0'}</span>
                        {parseFloat(formData.mrp) > parseFloat(formData.price) && <><span className="text-sm text-muted-foreground line-through">₹{formData.mrp}</span><Badge className="bg-rose-500 text-xs">{Math.round((1 - parseFloat(formData.price) / parseFloat(formData.mrp)) * 100)}% OFF</Badge></>}
                      </div>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled>Enroll Now</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this course?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{courseToDelete?.title}". This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CoursesList
