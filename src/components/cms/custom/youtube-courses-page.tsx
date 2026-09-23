'use client'

import React, { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Youtube,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  Play,
  Eye,
  EyeOff,
  Calendar,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface YTCourse {
  id: string
  title: string
  youtubeUrl: string
  description: string
  category: string
  status: 'published' | 'draft'
  addedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function getYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}`
}

// ─── Component ────────────────────────────────────────────────────────────

export default function YoutubeCoursesPage() {
  // Data
  const [courses, setCourses] = useState<YTCourse[]>([
    {
      id: '1',
      title: 'JEE Physics - Mechanics Complete Course',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'Complete mechanics course for JEE preparation',
      category: 'JEE',
      status: 'published',
      addedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      title: 'NEET Biology - Cell Biology',
      youtubeUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      description: 'Cell biology chapter for NEET preparation',
      category: 'NEET',
      status: 'published',
      addedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      title: 'UPSC GS - Indian Economy',
      youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      description: 'Indian Economy basics for UPSC GS paper',
      category: 'UPSC',
      status: 'draft',
      addedAt: new Date().toISOString(),
    },
  ])

  // Search
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCourse, setEditCourse] = useState<YTCourse | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<YTCourse | null>(null)

  // Form
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('General')
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('draft')

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let result = courses
    if (categoryFilter !== 'all') {
      result = result.filter((c) => c.category === categoryFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [courses, categoryFilter, search])

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(courses.map((c) => c.category))
    return Array.from(cats)
  }, [courses])

  // ─── Form helpers ─────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormUrl('')
    setFormDescription('')
    setFormCategory('General')
    setFormStatus('draft')
  }

  const openAddDialog = () => {
    setEditCourse(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (course: YTCourse) => {
    setEditCourse(course)
    setFormTitle(course.title)
    setFormUrl(course.youtubeUrl)
    setFormDescription(course.description)
    setFormCategory(course.category)
    setFormStatus(course.status)
    setDialogOpen(true)
  }

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formUrl.trim()) {
      toast.error('YouTube URL is required')
      return
    }
    if (!extractYouTubeId(formUrl)) {
      toast.error('Invalid YouTube URL. Please enter a valid YouTube video URL.')
      return
    }
    setSaving(true)
    setTimeout(() => {
      if (editCourse) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editCourse.id
              ? {
                  ...c,
                  title: formTitle,
                  youtubeUrl: formUrl,
                  description: formDescription,
                  category: formCategory,
                  status: formStatus,
                }
              : c
          )
        )
        toast.success('Course updated')
      } else {
        const newCourse: YTCourse = {
          id: Date.now().toString(),
          title: formTitle,
          youtubeUrl: formUrl,
          description: formDescription,
          category: formCategory,
          status: formStatus,
          addedAt: new Date().toISOString(),
        }
        setCourses((prev) => [newCourse, ...prev])
        toast.success('Course added')
      }
      setDialogOpen(false)
      setSaving(false)
    }, 500)
  }

  // ─── Toggle status ───────────────────────────────────────────────────

  const toggleStatus = (course: YTCourse) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, status: newStatus } : c))
    )
    toast.success(newStatus === 'published' ? 'Course published' : 'Moved to draft')
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!courseToDelete) return
    setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id))
    setDeleteDialogOpen(false)
    setCourseToDelete(null)
    toast.success('Course deleted')
  }

  // ─── Render ───────────────────────────────────────────────────────────

  const CATEGORY_COLORS: Record<string, string> = {
    JEE: 'bg-rose-50 text-rose-700',
    NEET: 'bg-blue-50 text-blue-700',
    UPSC: 'bg-purple-50 text-purple-700',
    GATE: 'bg-orange-50 text-orange-700',
    General: 'bg-gray-50 text-gray-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">YouTube Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your YouTube video courses and tutorials
          </p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Plus className="size-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Youtube className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {search || categoryFilter !== 'all' ? 'No courses found' : 'No courses yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Add your first YouTube course'}
              </p>
              {!search && categoryFilter === 'all' && (
                <Button onClick={openAddDialog} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                  <Plus className="size-4 mr-2" /> Add Course
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const thumbnail = getYouTubeThumbnail(course.youtubeUrl)
            const videoId = extractYouTubeId(course.youtubeUrl)

            return (
              <Card key={course.id} className="rounded-xl group hover:shadow-md transition-shadow overflow-hidden">
                {/* Thumbnail */}
                <div
                  className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer"
                  onClick={() => setPreviewUrl(previewUrl === course.id ? null : course.id)}
                >
                  {thumbnail ? (
                    <>
                      <img
                        src={thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="size-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="size-5 text-red-600 ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Youtube className="size-12 text-gray-300" />
                    </div>
                  )}

                  {/* Status badge */}
                  <Badge
                    className={`absolute top-2 right-2 ${
                      course.status === 'published'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Title */}
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">{course.title}</p>

                  {/* Description */}
                  {course.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={CATEGORY_COLORS[course.category] || CATEGORY_COLORS.General}>
                      <Tag className="size-3 mr-1" />
                      {course.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(course.addedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => openEditDialog(course)}
                    >
                      <Pencil className="size-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => toggleStatus(course)}
                    >
                      {course.status === 'published' ? (
                        <EyeOff className="size-3" />
                      ) : (
                        <Eye className="size-3" />
                      )}
                    </Button>
                    <a href={course.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        <ExternalLink className="size-3" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setCourseToDelete(course)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>

                {/* Inline Video Preview */}
                {previewUrl === course.id && videoId && (
                  <div className="border-t">
                    <iframe
                      src={getYouTubeEmbedUrl(course.youtubeUrl) || ''}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={course.title}
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Add/Edit Course Dialog ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Add YouTube Course'}</DialogTitle>
            <DialogDescription>
              {editCourse ? 'Update course details' : 'Add a new YouTube video course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Course title" />
            </div>

            <div className="space-y-2">
              <Label>YouTube URL *</Label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-red-500" />
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="pl-9"
                />
              </div>
              {/* Thumbnail preview */}
              {formUrl && extractYouTubeId(formUrl) && (
                <div className="mt-2 rounded-lg overflow-hidden border max-w-xs">
                  <img
                    src={getYouTubeThumbnail(formUrl) || ''}
                    alt="Video thumbnail"
                    className="w-full object-cover"
                  />
                </div>
              )}
              {formUrl && !extractYouTubeId(formUrl) && (
                <p className="text-xs text-red-500 mt-1">Invalid YouTube URL</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description..." className="min-h-[60px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEE">JEE</SelectItem>
                    <SelectItem value="NEET">NEET</SelectItem>
                    <SelectItem value="UPSC">UPSC</SelectItem>
                    <SelectItem value="GATE">GATE</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as 'published' | 'draft')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {editCourse ? 'Update' : 'Add Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{courseToDelete?.title}&rdquo;?
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
