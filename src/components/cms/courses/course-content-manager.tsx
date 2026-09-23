'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Video, FileText, File, Link2, Edit3, Trash2,
  ChevronDown, ChevronRight, GripVertical, Clock, Eye, EyeOff, Loader2,
  Layers, Play, BookOpen, ClipboardList, Upload, Image as ImageIcon,
  Music, Monitor, FileCode, ExternalLink, Save, X, MoreVertical,
  Copy, RefreshCw, Share2, Lock, Unlock, Folder, FolderPlus, Radio,
  Grid3x3, List, Search, Settings, MessageSquare, FileEdit, Award, Calendar, Languages, Send
} from 'lucide-react'
import { apiFetch, apiFetchJSON, getApiToken } from '@/lib/api-client'
import CourseChatManager from './course-chat-manager'
import { DraggableCourseBuilder } from './draggable-course-builder'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { SecureVideoPlayer } from '@/components/shared/secure-video-player'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { CourseStudentsAnalytics } from './course-students-analytics'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Lesson {
  id: string
  title: string
  type: string
  content: string | null
  videoUrl: string | null
  videoDuration: number
  fileUrl: string | null
  notes: string | null
  isFree: boolean
  allowPdfDownload?: boolean
  securePdfWithPhone?: boolean
  isOptional?: boolean
  sortOrder: number
  createdAt: string
  translationStatus?: string
  translations?: any
}

interface Module {
  id: string
  title: string
  description: string | null
  sortOrder: number
  lessons: Lesson[]
}

interface CourseInfo {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  status: string
  category: string | null
  level: string
}

interface CourseContentManagerProps {
  courseId: string
  courseTitle: string
  onBack: () => void
}

// ── Content Types (for right sidebar) ─────────────────────────────────────────
const ADD_CONTENT_TYPES = [
  { type: 'folder', label: 'Folder', icon: FolderPlus, color: 'text-blue-500' },
  { type: 'video', label: 'Video', icon: Video, color: 'text-red-500' },
  { type: 'pdf', label: 'PDF', icon: File, color: 'text-orange-500' },
  { type: 'live', label: 'Live Stream', icon: Radio, color: 'text-purple-500' },
  { type: 'youtube', label: 'YouTube/Zoom', icon: Monitor, color: 'text-red-600' },
  { type: 'webinar', label: 'Webinar Live', icon: Radio, color: 'text-pink-500' },
  { type: 'test', label: 'Test', icon: ClipboardList, color: 'text-amber-500' },
  { type: 'assignment', label: 'Assignment', icon: ClipboardList, color: 'text-violet-500' },
  { type: 'subjective', label: 'Subjective Test', icon: FileEdit, color: 'text-indigo-500' },
  { type: 'omr', label: 'OMR Test', icon: FileText, color: 'text-teal-500' },
  { type: 'quiz', label: 'Quiz', icon: Award, color: 'text-yellow-500' },
  { type: 'audio', label: 'Audio File', icon: Music, color: 'text-indigo-500' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: 'text-pink-500' },
  { type: 'link', label: 'Link', icon: Link2, color: 'text-green-500' },
  { type: 'document', label: 'Document', icon: FileText, color: 'text-blue-500' },
  { type: 'code', label: 'Coding Problem', icon: FileCode, color: 'text-teal-500' },
]

// ── Content type display for list items ───────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  video: { label: 'Video', icon: Video, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  pdf: { label: 'PDF', icon: File, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  text: { label: 'Article', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  link: { label: 'Link', icon: Link2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  live: { label: 'Live', icon: Radio, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  youtube: { label: 'YouTube/Zoom', icon: Monitor, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  webinar: { label: 'Webinar', icon: Radio, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  image: { label: 'Image', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  audio: { label: 'Audio', icon: Music, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  quiz: { label: 'Quiz', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  test: { label: 'Test', icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  subjective: { label: 'Subjective Test', icon: FileEdit, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  omr: { label: 'OMR Test', icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  code: { label: 'Code', icon: FileCode, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  document: { label: 'Document', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  folder: { label: 'Folder', icon: Folder, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  assignment: { label: 'Assignment', icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
}

// ── Helper: Extract YouTube video ID from URL ────────────────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ── Preview Video Player (mirrors student portal VideoPlayer) ────────────────
function LessonPreviewVideo({ url, title, translations = [] }: { url: string; title: string; translations?: any[] }) {
  const youtubeId = extractYouTubeId(url)

  const mockTranslations = translations && translations.length > 0 ? translations : [
    {
      languageCode: "hi",
      languageName: "Hindi",
      subtitleVttUrl: "data:text/vtt;base64,V0VCVlRUDQoNCjAwOjAwOjAwLjAwMCAtLT4gMDA6MDA6MTAuMDAwDQpIaW5kaSBNb2NrIFN1YnRpdGxlcw==",
      audioTrackUrl: "/mock/audio/hi.mp3"
    },
    {
      languageCode: "en",
      languageName: "English",
      subtitleVttUrl: "data:text/vtt;base64,V0VCVlRUDQoNCjAwOjAwOjAwLjAwMCAtLT4gMDA6MDA6MTAuMDAwDQpFbmdsaXNoIE1vY2sgU3VidGl0bGVz",
      audioTrackUrl: "/mock/audio/en.mp3"
    }
  ]

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Check if it's a Zoom URL
  const isZoom = url.includes('zoom.us') || url.includes('zoom.com')
  if (isZoom) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <Monitor className="w-11 h-11 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Zoom Meeting</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{url}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> Join Zoom Meeting
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Direct video file (mp4, webm, etc.)
  return (
    <SecureVideoPlayer 
      url={url} 
      title={title} 
      translations={mockTranslations}
      teacherName="Admin Preview"
      watermarkText="Preview Mode" 
    />
  )
}

export function CourseContentManager({ courseId, courseTitle, onBack }: CourseContentManagerProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [availableTests, setAvailableTests] = useState<{ id: string; title: string }[]>([])
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [contentSearch, setContentSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDesc, setModuleDesc] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [lessonModuleId, setLessonModuleId] = useState('')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonData, setLessonData] = useState({
    title: '', type: 'video', content: '', videoUrl: '', videoDuration: '0',
    fileUrl: '', notes: '', isFree: false, allowPdfDownload: false, securePdfWithPhone: false, isOptional: false
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingField, setUploadingField] = useState<'videoUrl' | 'fileUrl' | null>(null)
  const [autoSaveTrigger, setAutoSaveTrigger] = useState(0)

  useEffect(() => {
    if (autoSaveTrigger > 0) {
      handleSaveLesson()
    }
  }, [autoSaveTrigger])

  // Preview dialog (shows lesson as student sees it)
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)

  const fetchModules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/courses/${courseId}`)
      const data = await res.json()
      setModules(data.modules || [])
      setCourseInfo({
        id: courseId,
        title: data.title || courseTitle,
        description: data.description,
        thumbnail: data.thumbnail,
        price: data.price,
        mrp: data.mrp,
        status: data.status,
        category: data.category,
        level: data.level,
      })
      
      // Also fetch tests for the dropdown
      const testsRes = await apiFetch(`/api/teacher/tests?limit=100`)
      if (testsRes.ok) {
        const testsData = await testsRes.json()
        if (testsData.items) {
          setAvailableTests(testsData.items.map((t: any) => ({ id: t.id, title: t.title })))
        }
      }
    } catch {
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [courseId, courseTitle])

  useEffect(() => { fetchModules() }, [fetchModules])

  // ── Module handlers ──
  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) { toast.error('Module title required'); return }
    setSaving(true)
    try {
      if (editingModuleId) {
        await apiFetchJSON(`/api/teacher/courses/${courseId}/modules`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingModuleId, title: moduleTitle, description: moduleDesc })
        })
        toast.success('Module updated')
      } else {
        await apiFetchJSON(`/api/teacher/courses/${courseId}/modules`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: moduleTitle, description: moduleDesc })
        })
        toast.success('Module added')
      }
      setModuleDialogOpen(false)
      setModuleTitle(''); setModuleDesc(''); setEditingModuleId(null)
      fetchModules()
    } catch (err: any) { toast.error(err.message || 'Failed to save module') }
    finally { setSaving(false) }
  }

  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null)
  const deleteModule = async (moduleId: string) => {
    setModuleToDelete(moduleId)
  }
  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return
    try {
      await apiFetchJSON(`/api/teacher/courses/${courseId}/modules?id=${moduleToDelete}`, {
        method: 'DELETE',
      })
      toast.success('Module deleted')
      fetchModules()
    } catch (err: any) { toast.error(err.message || 'Failed to delete module') }
    setModuleToDelete(null)
  }

  // ── Lesson handlers ──
  const openAddLesson = (moduleId: string, type: string = 'video') => {
    setLessonModuleId(moduleId)
    setLessonData({ title: '', type, content: '', videoUrl: '', videoDuration: '0', fileUrl: '', notes: '', isFree: false, allowPdfDownload: false, securePdfWithPhone: false, isOptional: false })
    setEditingLessonId(null)
    setLessonDialogOpen(true)
  }

  async function handleSaveLesson() {
    if (!lessonData.title.trim()) { toast.error('Lesson title required'); return }
    if (['video', 'youtube', 'live'].includes(lessonData.type) && !lessonData.videoUrl.trim()) { toast.error('Video/Live URL is required for this lesson type'); return }
    if (['pdf', 'document'].includes(lessonData.type) && !lessonData.fileUrl.trim()) { toast.error('File URL is required for this lesson type'); return }
    
    setSaving(true)
    try {
      const url = `/api/teacher/courses/${courseId}/modules/lessons?moduleId=${lessonModuleId}`
      const payload = { ...lessonData, videoDuration: parseInt(lessonData.videoDuration) || 0 }

      if (editingLessonId) {
        await apiFetchJSON(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: editingLessonId, ...payload }) })
        toast.success('Lesson updated')
      } else {
        await apiFetchJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        toast.success('Lesson added')
      }
      setLessonDialogOpen(false)
      setLessonData({ title: '', type: 'video', content: '', videoUrl: '', videoDuration: '0', fileUrl: '', notes: '', isFree: false, allowPdfDownload: false, securePdfWithPhone: false, isOptional: false })
      setEditingLessonId(null)
      fetchModules()
    } catch (err: any) { toast.error(err.message || 'Failed to save lesson') }
    finally { setSaving(false) }
  }

  const [lessonToDelete, setLessonToDelete] = useState<{ moduleId: string; lessonId: string } | null>(null)
  const deleteLesson = (moduleId: string, lessonId: string) => {
    setLessonToDelete({ moduleId, lessonId })
  }
  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return
    try {
      await apiFetchJSON(`/api/teacher/courses/${courseId}/modules/lessons?moduleId=${lessonToDelete.moduleId}&lessonId=${lessonToDelete.lessonId}`, { method: 'DELETE' })
      toast.success('Lesson deleted')
      fetchModules()
    } catch (err: any) { toast.error(err.message || 'Failed to delete lesson') }
    setLessonToDelete(null)
  }

  const toggleFree = async (moduleId: string, lesson: Lesson) => {
    try {
      await apiFetchJSON(`/api/teacher/courses/${courseId}/modules/lessons?moduleId=${moduleId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, isFree: !lesson.isFree })
      })
      fetchModules()
    } catch (err: any) { toast.error(err.message || 'Failed to update') }
  }

  const togglePublish = async () => {
    if (!courseInfo) return
    try {
      await apiFetchJSON(`/api/teacher/courses/${courseId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: courseInfo.status === 'published' ? 'draft' : 'published' })
      })
      toast.success(courseInfo.status === 'published' ? 'Unpublished' : 'Published')
      fetchModules()
    } catch (err: any) { toast.error(err.message || 'Failed') }
  }

  const handleTranslateVideo = async (lessonId: string) => {
    try {
      const res = await apiFetch(`/api/teacher/lessons/${lessonId}/translate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      toast.success('Translation job queued! Processing will continue in the background.');
      fetchModules(); // refresh to show processing status
    } catch (error: any) {
      toast.error(error.message || 'Failed to start translation');
    }
  }

  const handleFileUpload = async (file: File, field: 'videoUrl' | 'fileUrl') => {
    if (!file) return
    setIsUploading(true)
    setUploadProgress(0)
    setUploadingField(field)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // Determine upload type based on file MIME type and target field
      let uploadType = 'document'
      if (field === 'videoUrl' || file.type.startsWith('video/')) uploadType = 'video'
      else if (file.type === 'application/pdf') uploadType = 'pdf'
      else if (file.type.startsWith('audio/')) uploadType = 'audio'
      else if (file.type.startsWith('image/')) uploadType = 'image'

      const token = getApiToken()
      if (!token) throw new Error('Not authenticated')

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/teacher/upload-image?type=${uploadType}`, true)
      xhr.setRequestHeader('x-auth-token', token)
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(percentComplete)
        }
      }

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              setLessonData(prev => {
                const updated = { ...prev, [field]: data.url }
                // Auto-fill title if empty
                if (!updated.title && data.originalName) {
                  updated.title = String(data.originalName).replace(/\.[^/.]+$/, "")
                }
                return updated
              })
              toast.success(`${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} uploaded!`)
              // Trigger auto-save on next render
              setTimeout(() => setAutoSaveTrigger(prev => prev + 1), 100)
              resolve(data)
            } catch (e) {
              reject(new Error('Invalid response from server'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || 'Upload failed'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(fd)
      })
    } catch (err: any) { 
      toast.error(err.message || 'Upload failed') 
    } finally {
      setIsUploading(false)
      setUploadingField(null)
      setTimeout(() => setUploadProgress(0), 1500)
    }
  }

  // Get all lessons flattened for the content list
  const allLessons = modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title, moduleId: m.id })))
  const filteredLessons = contentSearch
    ? allLessons.filter(l => l.title.toLowerCase().includes(contentSearch.toLowerCase()))
    : allLessons

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{courseTitle}</h1>
            <p className="text-sm text-muted-foreground">{courseInfo?.category} · {courseInfo?.level}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => {
            // Open preview of the first lesson (or first video lesson if available)
            const firstLesson = allLessons.find(l => l.type === 'video' && l.videoUrl) || allLessons[0]
            if (firstLesson) {
              setPreviewLesson(firstLesson)
            } else {
              toast.info('Add a lesson first to preview')
            }
          }}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button
            size="sm"
            variant={courseInfo?.status === 'published' ? 'default' : 'outline'}
            onClick={togglePublish}
            className={courseInfo?.status === 'published' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {courseInfo?.status === 'published' ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {courseInfo?.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="forum">Forum</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
              <div><p className="text-2xl font-bold">{modules.length}</p><p className="text-xs text-muted-foreground">Modules</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div><p className="text-2xl font-bold">{allLessons.length}</p><p className="text-xs text-muted-foreground">Lessons</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div><p className="text-2xl font-bold">{Math.floor(allLessons.reduce((s, l) => s + (l.videoDuration || 0), 0) / 60)}m</p><p className="text-xs text-muted-foreground">Duration</p></div>
            </CardContent></Card>
          </div>

          {courseInfo?.description && (
            <Card><CardContent className="p-4">
              <h3 className="font-semibold mb-2">Course Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{courseInfo.description}</p>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-4">
            <h3 className="font-semibold mb-3">Modules Overview</h3>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No modules yet. Go to Content tab to add modules.</p>
            ) : (
              <div className="space-y-2">
                {modules.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 font-semibold text-sm">{i + 1}</div>
                      <div>
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.lessons.length} lessons</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setActiveTab('content') }}>Manage</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* ── Content Tab ── */}
        <TabsContent value="content">
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1 space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search content..." value={contentSearch} onChange={(e) => setContentSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={() => { setEditingModuleId(null); setModuleTitle(''); setModuleDesc(''); setModuleDialogOpen(true) }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4" /> Add Module
                </Button>
              </div>

              {/* Modules & Lessons */}
              {modules.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">No modules yet. Create your first module!</p>
                  <Button onClick={() => { setModuleTitle(''); setModuleDesc(''); setEditingModuleId(null); setModuleDialogOpen(true) }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4" /> Add First Module
                  </Button>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  <DraggableCourseBuilder
                  modules={modules.filter(m => !contentSearch || m.title.toLowerCase().includes(contentSearch.toLowerCase()) || m.lessons.some(l => l.title.toLowerCase().includes(contentSearch.toLowerCase())))}
                  onReorderModules={async (newModules) => {
                    setModules(newModules)
                    try {
                      await apiFetchJSON('/api/teacher/course-builder/reorder', {
                        method: 'POST',
                        body: JSON.stringify({
                          type: 'module',
                          items: newModules.map((m, i) => ({ id: m.id, sortOrder: i }))
                        })
                      })
                      toast.success('Modules reordered')
                    } catch {
                      toast.error('Failed to save order')
                    }
                  }}
                  onReorderLessons={async (moduleId, newLessons) => {
                    const updatedModules = modules.map(m => m.id === moduleId ? { ...m, lessons: newLessons } : m)
                    setModules(updatedModules)
                    try {
                      await apiFetchJSON('/api/teacher/course-builder/reorder', {
                        method: 'POST',
                        body: JSON.stringify({
                          type: 'lesson',
                          items: newLessons.map((l, i) => ({ id: l.id, sortOrder: i, moduleId }))
                        })
                      })
                      toast.success('Lessons reordered')
                    } catch {
                      toast.error('Failed to save order')
                    }
                  }}
                  renderModuleHeader={(module, dragHandle) => (
                    <div className="flex items-center justify-between p-3 bg-muted/20">
                      <div className="flex items-center gap-3 flex-1">
                        {dragHandle}
                        <div>
                          <h3 className="font-semibold text-sm">{module.title}</h3>
                          <p className="text-xs text-muted-foreground">{module.lessons.length} lessons</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAddLesson(module.id, 'video')}>
                            <Plus className="w-3.5 h-3.5 mr-2" /> Add Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingModuleId(module.id); setModuleTitle(module.title); setModuleDesc(module.description || ''); setModuleDialogOpen(true) }}>
                            <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Module
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteModule(module.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Module
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  renderLessonActions={(lesson) => {
                    const parentModule = modules.find(m => m.lessons.some(l => l.id === lesson.id))
                    if (!parentModule) return null
                    return (
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                        {lesson.type === 'video' && lesson.videoUrl && lesson.translationStatus !== 'processing' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Translate Video" title="Translate Video" onClick={() => handleTranslateVideo(lesson.id)}>
                            <Languages className="w-3.5 h-3.5 text-indigo-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Preview lesson as student" title="Preview as student" onClick={() => setPreviewLesson(lesson)}>
                          <Play className="w-3.5 h-3.5 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={lesson.isFree ? "Make locked" : "Make free preview"} title={lesson.isFree ? "Free preview" : "Locked"} onClick={() => toggleFree(parentModule.id, lesson)}>
                          {lesson.isFree ? <Unlock className="w-3.5 h-3.5 text-cyan-500" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit lesson" onClick={() => {
                          setLessonModuleId(parentModule.id)
                          setEditingLessonId(lesson.id)
                          setLessonData({
                            title: lesson.title, type: lesson.type, content: lesson.content || '',
                            videoUrl: lesson.videoUrl || '', videoDuration: String(lesson.videoDuration),
                            fileUrl: lesson.fileUrl || '', notes: lesson.notes || '', isFree: lesson.isFree,
                            allowPdfDownload: lesson.allowPdfDownload || false,
                            securePdfWithPhone: lesson.securePdfWithPhone || false,
                            isOptional: lesson.isOptional || false,
                          })
                          setLessonDialogOpen(true)
                        }}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Delete lesson" onClick={() => deleteLesson(parentModule.id, lesson.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  }}
                />
                  </div>
              )}
            </div>

            {/* ── Right Sidebar: ADD CONTENT (desktop) ── */}
            <div className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Content</p>
                <div className="space-y-1">
                  {ADD_CONTENT_TYPES.map(ct => (
                    <button
                      key={ct.type}
                      onClick={() => {
                        if (modules.length === 0) { toast.error('Create a module first'); return }
                        // Preserve the actual content type (no silent conversion)
                        openAddLesson(modules[0].id, ct.type)
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <ct.icon className={`w-4 h-4 ${ct.color}`} />
                      <span>{ct.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile ADD CONTENT Sheet (below lg breakpoint) ── */}
          <div className="lg:hidden flex justify-end mt-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4" /> Add Content
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>Add Content</SheetTitle>
                </SheetHeader>
                <div className="p-4 overflow-y-auto">
                  {modules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Create a module first to add content.</p>
                  ) : (
                    <div className="space-y-1">
                      {ADD_CONTENT_TYPES.map(ct => (
                        <button
                          key={ct.type}
                          onClick={() => {
                            openAddLesson(modules[0].id, ct.type)
                          }}
                          className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                        >
                          <ct.icon className={`w-4 h-4 ${ct.color}`} />
                          <span>{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </TabsContent>
        
        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics">
          <CourseStudentsAnalytics courseId={courseId} />
        </TabsContent>


          {/* ── Forum Tab ── */}
          <TabsContent value="forum">
            <CourseForumTab courseId={courseId} />
          </TabsContent>
          <TabsContent value="chat">
            <CourseChatManager initialCourseId={courseId} />
          </TabsContent>
          <TabsContent value="posts">
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <MessageSquare className="size-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Course Announcements</p>
              <p className="text-sm mt-1">Use the Notifications module to post announcements to enrolled students.</p>
            </CardContent></Card>
          </TabsContent>
      </Tabs>

      {/* ── Module Dialog ── */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingModuleId ? 'Edit Module' : 'Add Module'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Module Title *</Label>
              <Input placeholder="e.g. Introduction to Arduino" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What will students learn in this module?" value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModule} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingModuleId ? 'Update' : 'Add'} Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lesson Dialog ── */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lesson Title *</Label>
              <Input placeholder="e.g. What is Arduino? - Complete Overview" value={lessonData.title} onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })} />
            </div>

            {/* Content Type Selector */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'folder').map(([key, tc]) => (
                  <button key={key} onClick={() => setLessonData({ ...lessonData, type: key })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${lessonData.type === key ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border hover:border-emerald-400'}`}>
                    <tc.icon className={`w-4 h-4 ${tc.color}`} /><span className="text-sm font-medium">{tc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Video URL */}
            {(lessonData.type === 'video' || lessonData.type === 'live' || lessonData.type === 'youtube' || lessonData.type === 'webinar') && (
              <div className="space-y-2">
                <Label>{lessonData.type === 'live' ? 'Meeting Link / Jitsi Room ID *' : 'Video URL *'}</Label>
                <div className="flex gap-2">
                  <Input placeholder={lessonData.type === 'live' ? "e.g. https://meet.google.com/... or room-id" : "https://youtube.com/watch?v=..."} value={lessonData.videoUrl} onChange={(e) => setLessonData({ ...lessonData, videoUrl: e.target.value })} disabled={isUploading && uploadingField === 'videoUrl'} />
                  <Button variant="outline" size="icon" aria-label="Upload video" onClick={() => document.getElementById('video-upload')?.click()} disabled={isUploading}><Upload className="w-4 h-4" /></Button>
                  <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'videoUrl') }} />
                </div>
                {isUploading && uploadingField === 'videoUrl' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Uploading Video...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Paste YouTube/Vimeo/Zoom URL or upload video file</p>
                )}
              </div>
            )}

            {/* File URL (Main File or Attachment) - hidden for text/folder */}
            {lessonData.type !== 'text' && lessonData.type !== 'folder' && (
              <div className="space-y-2">
                <Label>
                  {lessonData.type === 'test' ? 'Select Test *' : 
                   (['pdf', 'audio', 'image', 'code', 'document', 'link'].includes(lessonData.type)) ? 'Main Link / File *' : 
                   'Attachment File (Optional)'}
                </Label>
                <div className="flex gap-2">
                  {lessonData.type === 'test' ? (
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={lessonData.fileUrl || ''} 
                      onChange={(e) => setLessonData({ ...lessonData, fileUrl: e.target.value })}
                    >
                      <option value="" disabled>Select a test...</option>
                      {availableTests.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  ) : (
                    <Input placeholder={lessonData.type === 'link' ? "https://..." : "https://... or upload"} value={lessonData.fileUrl || ''} onChange={(e) => setLessonData({ ...lessonData, fileUrl: e.target.value })} disabled={isUploading && uploadingField === 'fileUrl'} />
                  )}
                  {lessonData.type !== 'link' && lessonData.type !== 'test' && (
                    <>
                      <Button variant="outline" size="icon" aria-label="Upload file" onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading}><Upload className="w-4 h-4" /></Button>
                      <input id="file-upload" type="file" accept={lessonData.type === 'pdf' ? '.pdf' : lessonData.type === 'audio' ? 'audio/*' : lessonData.type === 'image' ? 'image/*' : lessonData.type === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip' : '*/*'} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'fileUrl') }} />
                    </>
                  )}
                </div>
                {isUploading && uploadingField === 'fileUrl' && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                    <p className="text-xs text-slate-500 text-right">Uploading...</p>
                  </div>
                )}
              </div>
            )}
              {/* CMS PDF Secure Controls */}
              {lessonData.type === 'pdf' && (
                <div className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
                  <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2"><Lock className="w-4 h-4" /> Secure PDF Settings</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-amber-900">Allow Download</Label>
                      <p className="text-xs text-amber-700/80">Can students download this PDF?</p>
                    </div>
                    <Switch checked={lessonData.allowPdfDownload || false} onCheckedChange={(c) => setLessonData({ ...lessonData, allowPdfDownload: c })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-amber-900">Mobile Number Password</Label>
                      <p className="text-xs text-amber-700/80">Require student's phone number to open downloaded PDF.</p>
                    </div>
                    <Switch checked={lessonData.securePdfWithPhone || false} onCheckedChange={(c) => setLessonData({ ...lessonData, securePdfWithPhone: c })} disabled={!lessonData.allowPdfDownload} />
                  </div>
                </div>
              )}

            {/* Text Content (Description/Instructions) */}
            <div className="space-y-2">
              <Label>
                {lessonData.type === 'quiz' ? 'Quiz JSON Data (questions, options, correctAnswer index)' : 
                 (lessonData.type === 'test' || lessonData.type === 'subjective' || lessonData.type === 'omr') ? 'Test Description / Instructions' : 
                 'Text Content / Description'}
              </Label>
              <Textarea 
                placeholder={lessonData.type === 'quiz' ? '[\n  {\n    "question": "What is 2+2?",\n    "options": ["3", "4", "5"],\n    "correctAnswer": 1\n  }\n]' : "Write your lesson content, description, or instructions here..."} 
                value={lessonData.content || ''} 
                onChange={(e) => setLessonData({ ...lessonData, content: e.target.value })} 
                rows={lessonData.type === 'quiz' ? 10 : 6} 
                className="font-mono text-sm" 
              />
            </div>

              {/* Duration + Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(lessonData.type === 'video' || lessonData.type === 'youtube' || lessonData.type === 'live' || lessonData.type === 'webinar' || lessonData.type === 'audio') ? (
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input type="number" min="0" placeholder="0" value={lessonData.videoDuration} onChange={(e) => setLessonData({ ...lessonData, videoDuration: e.target.value })} />
                    <p className="text-xs text-muted-foreground">e.g. 600 = 10 minutes</p>
                  </div>
                ) : (
                  <div className="hidden sm:block"></div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="cursor-pointer text-sm">Free Preview</Label>
                      <p className="text-xs text-muted-foreground leading-tight">Accessible without enrollment</p>
                    </div>
                    <Switch checked={lessonData.isFree} onCheckedChange={(v) => setLessonData({ ...lessonData, isFree: v })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label className="cursor-pointer text-sm">Optional Content</Label>
                      <p className="text-xs text-muted-foreground leading-tight">Does not block course completion</p>
                    </div>
                    <Switch checked={lessonData.isOptional} onCheckedChange={(v) => setLessonData({ ...lessonData, isOptional: v })} />
                  </div>
                </div>
              </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea placeholder="Notes or instructions for this lesson..." value={lessonData.notes} onChange={(e) => setLessonData({ ...lessonData, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson} disabled={saving || isUploading} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isUploading ? `Uploading... ${uploadProgress}%` : editingLessonId ? 'Update Lesson' : 'Add Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Module Confirmation ── */}
      <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this module?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the module and all its lessons. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteModule} className="bg-destructive hover:bg-destructive/90">
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Lesson Confirmation ── */}
      <AlertDialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lesson. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLesson} className="bg-destructive hover:bg-destructive/90">
              Delete Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Lesson Preview Dialog (shows lesson exactly as student sees it) ── */}
      <Dialog open={!!previewLesson} onOpenChange={(open) => !open && setPreviewLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              Student Preview
              <Badge variant="outline" className="ml-2 text-xs">As student sees</Badge>
            </DialogTitle>
          </DialogHeader>
          {previewLesson && (
            <div className="space-y-4">
              {/* Lesson Title Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{previewLesson.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const tc = TYPE_CONFIG[previewLesson.type] || TYPE_CONFIG.text
                      return <Badge variant="outline" className={`text-xs ${tc.bg} ${tc.color}`}><tc.icon className="w-3 h-3 mr-1" /> {tc.label}</Badge>
                    })()}
                    {previewLesson.videoDuration > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {Math.floor(previewLesson.videoDuration / 60)}m {previewLesson.videoDuration % 60}s
                      </span>
                    )}
                    {previewLesson.isFree && <Badge className="text-xs bg-cyan-100 text-cyan-700">Free Preview</Badge>}
                  </div>
                </div>
              </div>

              {/* ── Video Player (video, live, youtube, webinar) ── */}
              {['video', 'live', 'youtube', 'webinar'].includes(previewLesson.type) && (
                previewLesson.videoUrl ? (
                  <LessonPreviewVideo 
                    url={previewLesson.videoUrl} 
                    title={previewLesson.title} 
                    translations={previewLesson.translations}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                    <Video className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No video URL provided.</p>
                  </div>
                )
              )}
              {/* ── PDF Viewer ── */}
              {previewLesson.type === 'pdf' && (
                previewLesson.fileUrl ? (
                  <div className="space-y-3">
                    <SecurePdfViewer 
                      url={previewLesson.fileUrl} 
                      title={previewLesson.title} 
                      teacherName="Preview" 
                      allowDownload={previewLesson.allowPdfDownload || false}
                      isPasswordProtected={previewLesson.securePdfWithPhone || false}
                    />
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={previewLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" /> Open PDF in new tab
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                    <FileText className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No PDF file provided.</p>
                  </div>
                )
              )}

              {/* ── Audio Player ── */}
              {previewLesson.type === 'audio' && previewLesson.fileUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                    <Music className="w-11 h-11 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{previewLesson.title}</p>
                      <audio controls className="w-full mt-2">
                        <source src={previewLesson.fileUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Image Viewer ── */}
              {previewLesson.type === 'image' && previewLesson.fileUrl && (
                <div className="rounded-xl overflow-hidden border">
                  <MediaImage src={previewLesson.fileUrl} alt={previewLesson.title} className="w-full" />
                </div>
              )}

              {/* ── External Link ── */}
              {previewLesson.type === 'link' && previewLesson.fileUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                    <Link2 className="w-8 h-8 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{previewLesson.fileUrl}</p>
                      <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
                        <a href={previewLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" /> Open Link
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Document Download ── */}
              {previewLesson.type === 'document' && previewLesson.fileUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <FileText className="w-11 h-11 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{previewLesson.fileUrl.split('/').pop() || 'Document'}</p>
                      <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
                        <a href={previewLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" /> View / Download
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Code / Text Content ── */}
              {['text', 'code'].includes(previewLesson.type) && (
                previewLesson.content ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border overflow-x-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">{previewLesson.content}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                    <FileText className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No content provided.</p>
                  </div>
                )
              )}

              {/* ── Test / Subjective / OMR / Quiz ── */}
              {['test', 'subjective', 'omr', 'quiz'].includes(previewLesson.type) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <ClipboardList className="w-11 h-11 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{TYPE_CONFIG[previewLesson.type]?.label || 'Test'} Lesson</p>
                      {previewLesson.content && <p className="text-xs text-muted-foreground mt-1">{previewLesson.content.slice(0, 200)}{previewLesson.content.length > 200 ? '...' : ''}</p>}
                      {previewLesson.fileUrl && (
                        <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
                          <a href={previewLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" /> Open Test Link
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Notes ── */}
              {previewLesson.notes && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">Lesson Notes</span>
                  </div>
                  <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{previewLesson.notes}</p>
                </div>
              )}

              {/* ── No content placeholder ── */}
              {!previewLesson.videoUrl && !previewLesson.content && !previewLesson.fileUrl && !previewLesson.notes && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-11 h-11 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No content added to this lesson yet.</p>
                  <p className="text-xs mt-1">Add a video URL, file, or text content to see it here.</p>
                </div>
              )}

              {/* Preview footer hint */}
              <div className="pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span>This is exactly how students will see this lesson. Free preview lessons are visible to everyone; others require purchase.</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewLesson(null)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Forum Tab (Teacher can view & reply to student posts) ──
function CourseForumTab({ courseId }: { courseId: string }) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/courses/${courseId}/forum`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch { setPosts([]) }
    setLoading(false)
  }, [courseId])

  useEffect(() => { loadPosts() }, [loadPosts])

  const handleReply = async (postId: string) => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await apiFetchJSON(`/api/courses/${courseId}/forum/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() })
      })
      setReplyText('')
      setReplyTo(null)
      loadPosts()
      toast.success('Reply posted')
    } catch { toast.error('Failed to reply') }
    setSending(false)
  }

  if (loading) return <Card><CardContent className="p-8 text-center"><Loader2 className="size-6 animate-spin mx-auto" /></CardContent></Card>

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Student Forum ({posts.length} posts)</h3>
          <Button variant="outline" size="sm" onClick={loadPosts}><RefreshCw className="size-3 mr-2" /> Refresh</Button>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="size-10 mx-auto mb-3 text-gray-300" />
            <p>No forum posts yet. Students will post questions here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {posts.map((post: any) => (
              <div key={post.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{post.authorName || post.authorRole}</p>
                    <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{post.lesson?.title || 'General'}</Badge>
                </div>
                <p className="text-sm">{post.content}</p>
                {post.comments?.map((c: any) => (
                  <div key={c.id} className="ml-6 border-l-2 border-blue-200 pl-3 py-1">
                    <p className="text-xs font-medium text-blue-700">{c.authorName || c.authorRole}</p>
                    <p className="text-sm">{c.content}</p>
                  </div>
                ))}
                {replyTo === post.id ? (
                  <div className="flex gap-2 ml-6">
                    <Input placeholder="Type your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)} />
                    <Button size="sm" onClick={() => handleReply(post.id)} disabled={sending}>{sending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyText('') }}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setReplyTo(post.id)}>
                    <MessageSquare className="size-3 mr-1" /> Reply
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Chat Tab (Teacher can view & send chat messages) ──
function CourseChatTab({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const loadChat = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/courses/${courseId}/chat`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch { setMessages([]) }
    setLoading(false)
  }, [courseId])

  useEffect(() => { loadChat() }, [loadChat])

  const sendMessage = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await apiFetchJSON(`/api/courses/${courseId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() })
      })
      setText('')
      loadChat()
    } catch { toast.error('Failed to send') }
    setSending(false)
  }

  if (loading) return <Card><CardContent className="p-8 text-center"><Loader2 className="size-6 animate-spin mx-auto" /></CardContent></Card>

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Course Chat</h3>
          <Button variant="outline" size="sm" onClick={loadChat}><RefreshCw className="size-3 mr-2" /> Refresh</Button>
        </div>
        <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet.</p>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.role === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${msg.role === 'teacher' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                  <p className="text-xs font-medium mb-0.5 opacity-70">{msg.author?.name || msg.role}</p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
          <Button onClick={sendMessage} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
