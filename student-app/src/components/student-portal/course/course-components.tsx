'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  FileText,
  Video,
  Download,
  Lock,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  RotateCcw,
  Eye,
  Headphones,
  Monitor,
  Menu,
  X,
  Sparkles,
  Music,
  Image as ImageIcon,
  Link2,
  FileCode,
  ExternalLink,
  Award,
  Radio,
  ClipboardList,
  FileEdit,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SecureVideoPlayer } from '@/components/shared/secure-video-player'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────
export interface Lesson {
  id: string
  title: string
  type: string
  content: string | null
  videoUrl: string | null
  videoDuration: number
  fileUrl: string | null
  notes: string | null
  isFree: boolean
  isOptional: boolean
  allowPdfDownload?: boolean
  sortOrder: number
  translations?: any[]
}

export interface Module {
  id: string
  title: string
  description: string | null
  sortOrder: number
  lessons: Lesson[]
}

export interface CourseData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  demoVideo: string | null
  category: string | null
  content: string | null
  language: string
  level: string
  status: string
  price: number
  mrp: number
  featured: boolean
  validityType: string
  validityMonths: number | null
  validityEndDate: string | null
  modules: Module[]
}

export interface CourseStats {
  totalLessons: number
  completedLessons: number
  totalDuration: number
  progressPercent: number
}

export interface ProgressEntry {
  status: string
  completedAt: string | null
  lastPosition?: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────
export function formatDuration(seconds: number): string {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function getLessonIcon(type: string) {
  switch (type) {
    case 'video': return Video
    case 'youtube': return Monitor
    case 'webinar': return Radio
    case 'live': return Radio
    case 'text': return FileText
    case 'pdf': return FileText
    case 'audio': return Music
    case 'image': return ImageIcon
    case 'link': return Link2
    case 'document': return FileText
    case 'code': return FileCode
    case 'quiz': return Award
    case 'test': return ClipboardList
    case 'subjective': return FileEdit
    case 'omr': return FileText
    case 'folder': return BookOpen
    default: return Play
  }
}

export function getLessonTypeLabel(type: string) {
  switch (type) {
    case 'video': return 'Video'
    case 'youtube': return 'YouTube'
    case 'webinar': return 'Webinar'
    case 'live': return 'Live'
    case 'text': return 'Article'
    case 'pdf': return 'PDF'
    case 'audio': return 'Audio'
    case 'image': return 'Image'
    case 'link': return 'Link'
    case 'document': return 'Document'
    case 'code': return 'Code'
    case 'quiz': return 'Quiz'
    case 'test': return 'Test'
    case 'subjective': return 'Subjective'
    case 'omr': return 'OMR Test'
    case 'folder': return 'Folder'
    default: return 'Lesson'
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function resolveMediaUrl(url: string | null): string {
  if (!url) return ''
  if (url.startsWith('/uploads/')) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${url}`
  }
  return url
}

// ── Video Player Component ───────────────────────────────────────────────
export function VideoPlayer({ url, title, translations = [] }: { url: string; title: string; translations?: any[] }) {
  const youtubeId = extractYouTubeId(url)

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

  // Zoom meeting link
  const isZoom = url.includes('zoom.us') || url.includes('zoom.com')
  if (isZoom) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
        <Monitor className="size-10 text-red-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900">Zoom Meeting</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{url}</p>
          <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Join Meeting
            </a>
          </Button>
        </div>
      </div>
    )
  }

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

  return (
    <SecureVideoPlayer 
      url={url} 
      title={title} 
      translations={mockTranslations}
      teacherName={useAppStore.getState().orgName || 'Er. Raju Kumawat APP'}
      watermarkText={useAppStore.getState().userName || 'Student'} 
    />
  )
}

// ── Lesson Content Component ─────────────────────────────────────────────
export function InteractiveQuiz({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Award className="size-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Quiz Lesson</h3>
        <p className="text-gray-500 text-sm mt-1">No questions added yet.</p>
      </div>
    )
  }
  
  try {
    const quizData = JSON.parse(content)
    // Basic implementation to avoid TS errors
    return (
      <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
        <h3 className="text-xl font-bold text-amber-900 mb-4">Interactive Quiz</h3>
        <p className="text-amber-800">Ready to take the quiz?</p>
        <Button className="mt-4 bg-amber-600 hover:bg-amber-700">Start Quiz</Button>
      </div>
    )
  } catch (e) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Invalid quiz format.</div>
  }
}

export function LessonContent({ lesson, isPurchased, onMarkComplete, isCompleted, lastPosition, onProgressUpdate }: {
  lesson: Lesson
  isPurchased: boolean
  onMarkComplete: () => void
  isCompleted: boolean
  lastPosition?: string | null
  onProgressUpdate?: (position: string) => void
}) {
  if (!isPurchased && !lesson.isFree) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-4">
          <Lock className="size-10 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Premium Lesson</h2>
        <p className="text-gray-500 text-sm">Purchase this course to unlock all lessons</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Video Player (video, live, youtube, webinar) */}
      {['video', 'live', 'youtube', 'webinar'].includes(lesson.type) && lesson.videoUrl && (
        <VideoPlayer url={resolveMediaUrl(lesson.videoUrl)} title={lesson.title} translations={lesson.translations} />
      )}

      {/* Text Content (text, quiz) */}
      {['text', 'quiz'].includes(lesson.type) && lesson.content && (
        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-amber-600">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {/* PDF Viewer */}
      {lesson.type === 'pdf' && lesson.fileUrl && (
        <div className="space-y-4">
          <SecurePdfViewer 
            url={resolveMediaUrl(lesson.fileUrl)} 
            title={lesson.title} 
            teacherName={useAppStore.getState().orgName || 'Er. Raju Kumawat APP'}
            watermarkText={useAppStore.getState().userName || 'Student'} 
            allowDownload={lesson.allowPdfDownload}
          />
        </div>
      )}

      {/* Audio Player */}
      {lesson.type === 'audio' && lesson.fileUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
          <Music className="size-10 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{lesson.title}</p>
            <audio controls className="w-full mt-2">
              <source src={resolveMediaUrl(lesson.fileUrl)} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {lesson.type === 'image' && lesson.fileUrl && (
        <div className="rounded-xl overflow-hidden border">
          <MediaImage src={resolveMediaUrl(lesson.fileUrl)} alt={lesson.title} className="w-full" />
        </div>
      )}

      {/* External Link */}
      {lesson.type === 'link' && lesson.fileUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <Link2 className="size-8 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{lesson.fileUrl}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href={resolveMediaUrl(lesson.fileUrl)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" /> Open Link
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Document Download */}
      {lesson.type === 'document' && lesson.fileUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <FileText className="size-10 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{lesson.fileUrl.split('/').pop() || 'Document'}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href={resolveMediaUrl(lesson.fileUrl)} target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" /> View / Download
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Code / Programming */}
      {lesson.type === 'code' && lesson.content && (
        <div className="p-4 rounded-xl bg-gray-900 border overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <FileCode className="size-4 text-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase">Code</span>
          </div>
          <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">{lesson.content}</pre>
        </div>
      )}

      {/* Test / Subjective / OMR */}
      {['test', 'subjective', 'omr'].includes(lesson.type) && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            {lesson.type === 'test' && <ClipboardList className="size-10 text-amber-500 shrink-0" />}
            {lesson.type === 'subjective' && <FileEdit className="size-10 text-indigo-500 shrink-0" />}
            {lesson.type === 'omr' && <FileText className="size-10 text-teal-500 shrink-0" />}
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">
                {lesson.type === 'test' ? 'Test' : lesson.type === 'subjective' ? 'Subjective Test' : 'OMR Test'}
              </p>
              {lesson.content && <p className="text-xs text-gray-600 mt-1">{lesson.content.slice(0, 200)}{lesson.content.length > 200 ? '...' : ''}</p>}
              {lesson.fileUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 gap-2"
                  onClick={() => {
                    useAppStore.getState().setSelectedTestId(lesson.fileUrl!)
                    useAppStore.getState().setStudentPage('take-test')
                  }}
                >
                  <ClipboardList className="size-3.5" /> Start Test
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Lesson */}
      {lesson.type === 'quiz' && (
        <InteractiveQuiz content={lesson.content || ''} />
      )}

      {/* Live Class */}
      {lesson.type === 'live' && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-purple-50 rounded-xl border border-purple-200">
          <Radio className="size-12 text-purple-600 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Live Class</h3>
          {!lesson.videoUrl ? (
            <p className="text-gray-500 text-sm mt-1">Join the live session at the scheduled time</p>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6 max-w-md">The live session is ready. Click the button below to join the class.</p>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-semibold" asChild>
                <a href={lesson.videoUrl.startsWith('http') ? lesson.videoUrl : `https://meet.jit.si/${lesson.videoUrl}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-5" /> Join Live Class
                </a>
              </Button>
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {lesson.notes && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Lesson Notes</span>
            </div>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{lesson.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Content fallback for video lessons with text content */}
      {['video', 'live', 'youtube', 'webinar'].includes(lesson.type) && lesson.content && (
        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-amber-600">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {/* No content placeholder */}
      {!lesson.videoUrl && !lesson.content && !lesson.fileUrl && !lesson.notes && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Lesson content will be available soon.</p>
        </div>
      )}

      {/* Mark Complete Button */}
      {isPurchased && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Completed</span>
              </>
            ) : (
              <>
                <div className="size-5 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-gray-500">Mark as complete</span>
              </>
            )}
          </div>
          {!isCompleted && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={onMarkComplete}
            >
              <CheckCircle2 className="size-4" />
              Complete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COURSE DETAIL / PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
