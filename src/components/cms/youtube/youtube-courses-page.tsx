'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Youtube,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  Play,
  Eye,
  Clock,
  Tag,
  BookOpen,
  Globe2,
  Star,
  DollarSign,
  Video,
  GraduationCap,
  Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'
type CourseStatus = 'published' | 'draft' | 'archived'

interface YTCourse {
  id: string
  title: string
  description: string
  playlistUrl: string
  playlistId: string
  channelName: string
  totalVideos: number
  totalDuration: string
  category: string
  level: CourseLevel
  language: string
  price: number
  mrp: number
  featured: boolean
  status: CourseStatus
  thumbnail: string
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────

const CATEGORIES = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General', 'English', 'Computer Science']
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu']

// ─── Helpers ──────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<CourseLevel, { color: string }> = {
  Beginner: { color: 'bg-emerald-50 text-emerald-700' },
  Intermediate: { color: 'bg-amber-50 text-amber-700' },
  Advanced: { color: 'bg-red-50 text-red-700' },
}

const STATUS_CONFIG: Record<CourseStatus, { label: string; color: string }> = {
  published: { label: 'Published', color: 'bg-emerald-50 text-emerald-700' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  archived: { label: 'Archived', color: 'bg-amber-50 text-amber-700' },
}

const CATEGORY_COLORS: Record<string, string> = {
  Mathematics: 'bg-violet-50 text-violet-700',
  Physics: 'bg-sky-50 text-sky-700',
  Chemistry: 'bg-orange-50 text-orange-700',
  Biology: 'bg-emerald-50 text-emerald-700',
  General: 'bg-gray-50 text-gray-700',
  English: 'bg-pink-50 text-pink-700',
  'Computer Science': 'bg-teal-50 text-teal-700',
}

// Colorful placeholder thumbnails by category
const THUMBNAIL_GRADIENTS: Record<string, string> = {
  Mathematics: 'from-violet-500 to-purple-600',
  Physics: 'from-sky-500 to-blue-600',
  Chemistry: 'from-orange-500 to-red-500',
  Biology: 'from-emerald-500 to-teal-600',
  General: 'from-gray-500 to-slate-600',
  English: 'from-pink-500 to-rose-600',
  'Computer Science': 'from-teal-500 to-cyan-600',
}

function formatPrice(price: number) {
  if (price === 0) return 'Free'
  return `₹${price.toLocaleString('en-IN')}`
}

function formatDurationFromMinutes(totalMinutes: number): string {
  if (!totalMinutes) return '0h'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function mapApiCourse(apiItem: Record<string, unknown>): YTCourse {
  const totalDurationMinutes = (apiItem.totalDuration as number) || 0
  return {
    id: apiItem.id as string,
    title: (apiItem.title as string) || '',
    description: (apiItem.description as string) || '',
    playlistUrl: (apiItem.playlistUrl as string) || '',
    playlistId: (apiItem.playlistId as string) || '',
    channelName: (apiItem.channelName as string) || '',
    totalVideos: (apiItem.totalVideos as number) || 0,
    totalDuration: formatDurationFromMinutes(totalDurationMinutes),
    category: (apiItem.category as string) || 'General',
    level: (apiItem.level as CourseLevel) || 'Intermediate',
    language: (apiItem.language as string) || 'Hindi',
    price: (apiItem.price as number) || 0,
    mrp: (apiItem.mrp as number) || 0,
    featured: (apiItem.featured as boolean) || false,
    status: (apiItem.status as CourseStatus) || 'draft',
    thumbnail: (apiItem.thumbnail as string) || '',
    createdAt: apiItem.createdAt
      ? new Date(apiItem.createdAt as string).toISOString().split('T')[0]
      : '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function YoutubeCoursesPage() {
  const { userName, orgCode } = useAppStore()
  const [courses, setCourses] = useState<YTCourse[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editCourse, setEditCourse] = useState<YTCourse | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPlaylistUrl, setFormPlaylistUrl] = useState('')
  const [formPlaylistId, setFormPlaylistId] = useState('')
  const [formChannel, setFormChannel] = useState('')
  const [formTotalVideos, setFormTotalVideos] = useState('')
  const [formTotalDuration, setFormTotalDuration] = useState('')
  const [formCategory, setFormCategory] = useState('Mathematics')
  const [formLevel, setFormLevel] = useState<CourseLevel>('Intermediate')
  const [formLanguage, setFormLanguage] = useState('Hinglish')
  const [formPrice, setFormPrice] = useState('')
  const [formMrp, setFormMrp] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/teacher/youtube-courses?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        setCourses(data.items.map((item: Record<string, unknown>) => mapApiCourse(item)))
      }
    } catch {
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    if (orgCode) {
      fetchCourses()
    }
  }, [orgCode, fetchCourses])

  // Filtered
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.channelName.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter
      const matchLevel = levelFilter === 'all' || c.level === levelFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchCategory && matchLevel && matchStatus
    })
  }, [courses, search, categoryFilter, levelFilter, statusFilter])

  // Stats
  const totalCourses = courses.length
  const publishedCourses = courses.filter((c) => c.status === 'published').length
  const totalVideos = courses.reduce((a, c) => a + c.totalVideos, 0)
  const totalDuration = courses.reduce((a, c) => {
    // Parse "80h 30m" → minutes
    const match = c.totalDuration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/)
    if (match) {
      return a + (parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0'))
    }
    return a
  }, 0)
  const totalHours = Math.floor(totalDuration / 60)

  function resetForm() {
    setFormTitle('')
    setFormDesc('')
    setFormPlaylistUrl('')
    setFormPlaylistId('')
    setFormChannel('')
    setFormTotalVideos('')
    setFormTotalDuration('')
    setFormCategory('Mathematics')
    setFormLevel('Intermediate')
    setFormLanguage('Hinglish')
    setFormPrice('')
    setFormMrp('')
    setFormFeatured(false)
  }

  function openCreate() {
    resetForm()
    setEditCourse(null)
    setShowCreate(true)
  }

  function openEdit(c: YTCourse) {
    setFormTitle(c.title)
    setFormDesc(c.description)
    setFormPlaylistUrl(c.playlistUrl)
    setFormPlaylistId(c.playlistId)
    setFormChannel(c.channelName)
    setFormTotalVideos(String(c.totalVideos))
    setFormTotalDuration(c.totalDuration)
    setFormCategory(c.category)
    setFormLevel(c.level)
    setFormLanguage(c.language)
    setFormPrice(String(c.price))
    setFormMrp(String(c.mrp))
    setFormFeatured(c.featured)
    setEditCourse(c)
    setShowCreate(true)
  }

  // Parse duration string like "80h 30m" to minutes for API
  function parseDurationToMinutes(durationStr: string): number {
    const match = durationStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/)
    if (match) {
      return (parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0'))
    }
    return 0
  }

  async function handleSave() {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const totalDurationMinutes = parseDurationToMinutes(formTotalDuration)

      if (editCourse) {
        const response = await apiFetch(`/api/teacher/youtube-courses/${editCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            playlistUrl: formPlaylistUrl,
            playlistId: formPlaylistId,
            channelName: formChannel,
            totalVideos: parseInt(formTotalVideos) || editCourse.totalVideos,
            totalDuration: totalDurationMinutes,
            category: formCategory,
            level: formLevel,
            language: formLanguage,
            price: parseInt(formPrice) || 0,
            mrp: parseInt(formMrp) || 0,
            featured: formFeatured,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          await fetchCourses()
          toast.success('Course updated')
        } else {
          toast.error(data.error || 'Failed to update course')
        }
      } else {
        const response = await apiFetch('/api/teacher/youtube-courses', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            playlistUrl: formPlaylistUrl,
            playlistId: formPlaylistId,
            channelName: formChannel,
            totalVideos: parseInt(formTotalVideos) || 0,
            totalDuration: totalDurationMinutes,
            category: formCategory,
            level: formLevel,
            language: formLanguage,
            price: parseInt(formPrice) || 0,
            mrp: parseInt(formMrp) || 0,
            featured: formFeatured,
            status: 'draft',
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          await fetchCourses()
          toast.success('Course added')
        } else {
          toast.error(data.error || 'Failed to add course')
        }
      }
      setShowCreate(false)
    } catch {
      toast.error('Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await apiFetch(`/api/teacher/youtube-courses/${id}?organizationId=${orgCode}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setCourses((prev) => prev.filter((c) => c.id !== id))
        toast.success('Course deleted')
      } else {
        toast.error(data.error || 'Failed to delete course')
      }
    } catch {
      toast.error('Failed to delete course')
    }
  }

  async function handleToggleFeatured(course: YTCourse) {
    try {
      const response = await apiFetch(`/api/teacher/youtube-courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: !course.featured, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setCourses((prev) =>
          prev.map((c) => c.id === course.id ? { ...c, featured: !c.featured } : c)
        )
        toast.success(course.featured ? 'Removed from featured' : 'Added to featured')
      } else {
        toast.error(data.error || 'Failed to toggle featured')
      }
    } catch {
      toast.error('Failed to toggle featured')
    }
  }

  async function handleToggleStatus(course: YTCourse) {
    const newStatus: CourseStatus = course.status === 'published' ? 'draft' : 'published'
    try {
      const response = await apiFetch(`/api/teacher/youtube-courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setCourses((prev) =>
          prev.map((c) => c.id === course.id ? { ...c, status: newStatus } : c)
        )
        toast.success(`Status changed to ${newStatus}`)
      } else {
        toast.error(data.error || 'Failed to change status')
      }
    } catch {
      toast.error('Failed to change status')
    }
  }

  function openYouTube(url: string) {
    if (url) window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">YouTube Courses</h1>
          <p className="text-muted-foreground text-sm">Manage YouTube playlist-based courses</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">YouTube Courses</h1>
          <p className="text-muted-foreground text-sm">Manage YouTube playlist-based courses</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'text-violet-600' },
          { label: 'Published', value: publishedCourses, icon: Eye, color: 'text-emerald-600' },
          { label: 'Total Videos', value: totalVideos, icon: Video, color: 'text-sky-600' },
          { label: 'Total Duration', value: `${totalHours}h+`, icon: Clock, color: 'text-amber-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Youtube className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No courses found</p>
          <p className="text-sm">Add a YouTube course to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const catColor = CATEGORY_COLORS[c.category] || 'bg-gray-50 text-gray-700'
            const levelColor = LEVEL_CONFIG[c.level]?.color || 'bg-gray-50 text-gray-600'
            const statusColor = STATUS_CONFIG[c.status]?.color || 'bg-gray-100 text-gray-600'
            const gradient = THUMBNAIL_GRADIENTS[c.category] || 'from-gray-500 to-slate-600'
            const discount = c.mrp > c.price && c.mrp > 0 ? Math.round(((c.mrp - c.price) / c.mrp) * 100) : 0
            return (
              <Card key={c.id} className="overflow-hidden group">
                {/* Thumbnail placeholder */}
                <div className={`h-36 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
                  <div className="text-white/90 text-center">
                    <Play className="h-11 w-11 mx-auto mb-1 opacity-80" />
                    <p className="text-sm font-medium">{c.totalVideos} videos</p>
                  </div>
                  {c.featured && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  )}
                  {discount > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
                      {discount}% OFF
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{c.title}</h3>
                    <Badge variant="secondary" className={`${statusColor} text-xs shrink-0 h-5`}>
                      {STATUS_CONFIG[c.status]?.label || c.status}
                    </Badge>
                  </div>

                  {/* Channel */}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Youtube className="h-3 w-3" />
                    {c.channelName}
                  </p>

                  {/* Category + Level + Language */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`${catColor} text-xs h-5`}>{c.category}</Badge>
                    <Badge variant="outline" className={`${levelColor} text-xs h-5`}>{c.level}</Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs h-5">
                      <Globe2 className="h-2.5 w-2.5 mr-0.5" />
                      {c.language}
                    </Badge>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {c.totalVideos} videos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {c.totalDuration}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{formatPrice(c.price)}</span>
                    {c.mrp > c.price && c.mrp > 0 && (
                      <span className="text-sm text-muted-foreground line-through">₹{c.mrp.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openYouTube(c.playlistUrl)}>
                      <ExternalLink className="h-3 w-3" />
                      YouTube
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(c)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive ml-auto" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Add YouTube Course'}</DialogTitle>
            <DialogDescription>
              {editCourse ? 'Update course details' : 'Add a new YouTube playlist-based course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. JEE Mathematics Complete Course"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Course description..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Playlist URL</Label>
                <Input
                  placeholder="https://youtube.com/playlist?list=..."
                  value={formPlaylistUrl}
                  onChange={(e) => setFormPlaylistUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Playlist ID</Label>
                <Input
                  placeholder="PL..."
                  value={formPlaylistId}
                  onChange={(e) => setFormPlaylistId(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Channel Name</Label>
                <Input
                  placeholder="Channel name"
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Videos</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formTotalVideos}
                  onChange={(e) => setFormTotalVideos(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Duration</Label>
                <Input
                  placeholder="e.g. 80h 30m"
                  value={formTotalDuration}
                  onChange={(e) => setFormTotalDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={formLevel} onValueChange={(v) => setFormLevel(v as CourseLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={formLanguage} onValueChange={setFormLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="0 for free"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>MRP (₹)</Label>
                <Input
                  type="number"
                  placeholder="Original price"
                  value={formMrp}
                  onChange={(e) => setFormMrp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formFeatured} onCheckedChange={setFormFeatured} />
              <Label>Featured Course</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editCourse ? 'Update' : 'Add'} Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
