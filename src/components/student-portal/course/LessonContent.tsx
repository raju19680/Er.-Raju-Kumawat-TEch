import React from 'react'
import {
  Play,
  Monitor,
  Video,
  FileText,
  Music,
  Link2,
  FileCode,
  Award,
  ClipboardList,
  FileEdit,
  BookOpen,
  Lock,
  Download,
  ExternalLink,
  CheckCircle2,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'
import { Lesson } from './types'

import { SecureVideoPlayer } from '@/components/shared/secure-video-player'

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

function VideoPlayer({ url, title, translations, studentMobile }: { url: string; title: string; translations?: { languageCode: string; languageName: string; subtitleVttUrl: string | null; audioTrackUrl: string | null }[], studentMobile?: string }) {
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

  return (
    <div className="shadow-lg rounded-xl overflow-hidden">
      <SecureVideoPlayer 
        url={url} 
        title={title} 
        translations={translations || []} 
        watermarkText={studentMobile}
      />
    </div>
  )
}

export function LessonContent({ lesson, isPurchased, onMarkComplete, isCompleted, onPurchase, purchasing, coursePrice, isFreeCourse, studentMobile }: {
  lesson: Lesson
  isPurchased: boolean
  onMarkComplete: () => void
  isCompleted: boolean
  onPurchase: () => void
  purchasing: boolean
  coursePrice: number
  isFreeCourse: boolean
  studentMobile?: string
}) {
  if (!isPurchased && !lesson.isFree) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-4">
          <Lock className="size-10 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Premium Lesson</h2>
        <p className="text-gray-500 text-sm mb-6">Purchase this course to unlock all lessons</p>
        <Button 
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 px-8"
          onClick={onPurchase}
          disabled={purchasing}
        >
          {purchasing ? 'Processing...' : isFreeCourse ? 'Enroll for Free' : `Unlock Course for ₹${coursePrice}`}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {['video', 'live', 'youtube', 'webinar'].includes(lesson.type) && lesson.videoUrl && (
        <VideoPlayer url={lesson.videoUrl} title={lesson.title} translations={lesson.translations} studentMobile={studentMobile} />
      )}

      {['text', 'quiz'].includes(lesson.type) && lesson.content && (
        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-amber-600">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {lesson.type === 'pdf' && lesson.fileUrl && (
        <div className="mt-4">
          <SecurePdfViewer 
            url={lesson.fileUrl} 
            title={lesson.title} 
            teacherName="Teacher" 
            watermarkText={studentMobile} // dynamic mobile number watermark
          />
        </div>
      )}

      {lesson.type === 'audio' && lesson.fileUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
          <Music className="size-10 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{lesson.title}</p>
            <audio controls className="w-full mt-2">
              <source src={lesson.fileUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}

      {lesson.type === 'image' && lesson.fileUrl && (
        <div className="rounded-xl overflow-hidden border">
          <img src={lesson.fileUrl} alt={lesson.title} className="w-full" />
        </div>
      )}

      {lesson.type === 'link' && lesson.fileUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <Link2 className="size-8 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{lesson.fileUrl}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" /> Open Link
              </a>
            </Button>
          </div>
        </div>
      )}

      {lesson.type === 'document' && lesson.fileUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <FileText className="size-10 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{lesson.fileUrl.split('/').pop() || 'Document'}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
              <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" /> View / Download
              </a>
            </Button>
          </div>
        </div>
      )}

      {lesson.type === 'code' && lesson.content && (
        <div className="p-4 rounded-xl bg-gray-900 border overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <FileCode className="size-4 text-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase">Code</span>
          </div>
          <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">{lesson.content}</pre>
        </div>
      )}

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
                <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
                  <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" /> Open Test
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {lesson.type === 'quiz' && !lesson.content && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="size-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Quiz Lesson</h3>
          <p className="text-gray-500 text-sm mt-1">Interactive quiz will appear here</p>
        </div>
      )}

      {lesson.type === 'live' && !lesson.videoUrl && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Radio className="size-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Live Session</h3>
          <p className="text-gray-500 text-sm mt-1">Join the live session at the scheduled time</p>
        </div>
      )}

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

      {['video', 'live', 'youtube', 'webinar'].includes(lesson.type) && lesson.content && (
        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-amber-600">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {!lesson.videoUrl && !lesson.content && !lesson.fileUrl && !lesson.notes && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="size-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Lesson content will be available soon.</p>
        </div>
      )}

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
