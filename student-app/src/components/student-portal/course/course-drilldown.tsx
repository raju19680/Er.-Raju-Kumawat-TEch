'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Clock, Play, CheckCircle2, Lock, ChevronRight,
  Loader2, AlertCircle, Sparkles, RotateCcw, Award, FolderOpen,
  Video, FileText, File, Music, Radio, Monitor, Image as ImageIcon, ClipboardList, List, Grid, Download
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Lesson, Module, CourseData, CourseStats, ProgressEntry,
  formatDuration, getLessonIcon, getLessonTypeLabel, LessonContent, VideoPlayer
} from './course-components'
import { CourseCommunity, LessonDiscussions } from './course-community'
import { LessonNotes } from './lesson-notes'

// ── Type config for module cards ──
const TYPE_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
  video: { icon: Video, color: 'text-red-500' },
  pdf: { icon: File, color: 'text-orange-500' },
  text: { icon: FileText, color: 'text-blue-500' },
  live: { icon: Radio, color: 'text-purple-500' },
  youtube: { icon: Monitor, color: 'text-red-600' },
  audio: { icon: Music, color: 'text-indigo-500' },
  quiz: { icon: Award, color: 'text-amber-500' },
  test: { icon: ClipboardList, color: 'text-amber-500' },
  image: { icon: ImageIcon, color: 'text-pink-500' },
  assignment: { icon: ClipboardList, color: 'text-violet-500' },
}

type DrillLevel = 'modules' | 'lessons' | 'player'

export default function CourseDrilldown() {
  const { selectedCourseId, setStudentPage, paymentSuccessTrigger } = useAppStore()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [purchase, setPurchase] = useState<{ id: string; purchasedAt: string; expiresAt: string | null } | null>(null)
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({})
  const [stats, setStats] = useState<CourseStats>({ totalLessons: 0, completedLessons: 0, totalDuration: 0, progressPercent: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)

  // Drill-Down State
  const [viewLevel, setViewLevel] = useState<DrillLevel>('modules')
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [lessonViewMode, setLessonViewMode] = useState<'list' | 'grid'>('list')

  // Marking complete
  const [markingComplete, setMarkingComplete] = useState(false)

  // Load course data
  const load = useCallback(async () => {
    if (!selectedCourseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{
        success: boolean
        course: CourseData
        purchase: { id: string; purchasedAt: string; expiresAt: string | null }
        progress: Record<string, ProgressEntry>
        stats: CourseStats
      }>(`/api/student/courses/${selectedCourseId}`)
      if (res.success) {
        setCourse(res.course)
        setPurchase(res.purchase)
        setProgress(res.progress || {})
        setStats(res.stats || { totalLessons: 0, completedLessons: 0, totalDuration: 0, progressPercent: 0 })
      }
    } catch (err) {
      console.error('Course detail error:', err)
      setError('Failed to load course details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId])

  useEffect(() => {
    load()
  }, [load, paymentSuccessTrigger])

  useEffect(() => {
    if (selectedCourseId) {
      apiFetchJSON('/api/student/track-view', {
        method: 'POST',
        body: JSON.stringify({ productId: selectedCourseId, productType: 'course' })
      }).catch(console.error)
    }
  }, [selectedCourseId])

  // Derived data
  const selectedModule = useMemo(() =>
    course?.modules.find(m => m.id === selectedModuleId) || null
  , [course, selectedModuleId])

  const selectedLesson = useMemo(() =>
    course?.modules.flatMap(m => m.lessons).find(l => l.id === selectedLessonId) || null
  , [course, selectedLessonId])

  const isPurchased = !!purchase
  const isExpired = purchase?.expiresAt ? new Date(purchase.expiresAt) < new Date() : false

  // Navigation handlers
  const goToModule = (moduleId: string) => {
    setSelectedModuleId(moduleId)
    setViewLevel('lessons')
  }

  const goToLesson = (lessonId: string) => {
    if (!useAppStore.getState().requireAuth()) return;
    setSelectedLessonId(lessonId)
    setViewLevel('player')
  }

  const goBack = () => {
    if (viewLevel === 'player') {
      setViewLevel('lessons')
      setSelectedLessonId(null)
    } else if (viewLevel === 'lessons') {
      setViewLevel('modules')
      setSelectedModuleId(null)
    } else {
      setStudentPage('my-courses')
    }
  }

  // Mark lesson complete
  const handleMarkComplete = async () => {
    if (!selectedLessonId || !selectedCourseId || markingComplete) return
    setMarkingComplete(true)
    try {
      const res = await apiFetch('/api/student/lesson-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          courseId: selectedCourseId,
          status: 'completed',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setProgress(prev => ({
            ...prev,
            [selectedLessonId]: { status: 'completed', completedAt: new Date().toISOString() },
          }))
          if (data.courseStats) {
            setStats(prev => ({
              ...prev,
              completedLessons: data.courseStats.completedLessons,
              progressPercent: data.courseStats.progressPercent,
            }))
          }
          toast.success('Lesson completed! 🎉')
        }
      }
    } catch {
      toast.error('Failed to update progress')
    } finally {
      setMarkingComplete(false)
    }
  }
  const handleGenerateCertificate = async () => {
    if (!selectedCourseId) return
    setIsGeneratingCert(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; certificateUrl?: string; message?: string }>(
        '/api/student/certificates',
        { method: 'POST', body: JSON.stringify({ courseId: selectedCourseId }) }
      )
      if (res.success && res.certificateUrl) {
        window.open(res.certificateUrl, '_blank')
        toast.success('Certificate downloaded!')
      } else {
        toast.error(res.message || 'Failed to generate certificate')
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while generating certificate')
    } finally {
      setIsGeneratingCert(false)
    }
  }

  const handleProgressUpdate = async (position: string) => {
    if (!selectedLessonId || !selectedCourseId) return
    try {
      await apiFetch(`/api/student/courses/${selectedCourseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          lastPosition: position,
        }),
      })
      setProgress(prev => ({
        ...prev,
        [selectedLessonId]: { ...prev[selectedLessonId], lastPosition: position },
      }))
    } catch (e) {
      console.error('Failed to update progress position', e)
    }
  }

  // Navigate lessons within a module
  const handleNextLesson = () => {
    if (!selectedModule) return
    const lessons = selectedModule.lessons
    const idx = lessons.findIndex(l => l.id === selectedLessonId)
    if (idx < lessons.length - 1) {
      setSelectedLessonId(lessons[idx + 1].id)
    }
  }

  const handlePrevLesson = () => {
    if (!selectedModule) return
    const lessons = selectedModule.lessons
    const idx = lessons.findIndex(l => l.id === selectedLessonId)
    if (idx > 0) {
      setSelectedLessonId(lessons[idx - 1].id)
    }
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => setStudentPage('my-courses')} className="shrink-0 gap-1.5 h-8">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button onClick={load} className="gap-2">
            <RotateCcw className="size-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-base font-medium">Course not found</p>
        <Button variant="outline" className="mt-3" onClick={() => setStudentPage('my-courses')}>
          Go Back
        </Button>
      </div>
    )
  }

  // ── Breadcrumb ──
  const renderBreadcrumb = () => {
    const crumbs: { label: string; onClick: () => void }[] = [
      { label: course.title, onClick: () => { setViewLevel('modules'); setSelectedModuleId(null); setSelectedLessonId(null) } },
    ]
    if (viewLevel === 'lessons' && selectedModule) {
      crumbs.push({ label: selectedModule.title, onClick: () => {} })
    }
    if (viewLevel === 'player' && selectedModule && selectedLesson) {
      crumbs.push({ label: selectedModule.title, onClick: () => { setViewLevel('lessons'); setSelectedLessonId(null) } })
      crumbs.push({ label: selectedLesson.title, onClick: () => {} })
    }

    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 text-gray-300 shrink-0" />}
            {i < crumbs.length - 1 ? (
              <button onClick={crumb.onClick} className="hover:text-amber-700 transition-colors truncate max-w-[160px]">
                {crumb.label}
              </button>
            ) : (
              <span className="font-medium text-gray-900 truncate max-w-[200px]">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  // ── LEVEL 1: Module Grid ──
  const renderModuleGrid = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Course Overview Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 via-white to-amber-50/30">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {course.thumbnail && (
              <MediaImage src={course.thumbnail} alt={course.title} className="w-full sm:w-40 h-24 object-cover rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                {course.category && <Badge variant="secondary">{course.category}</Badge>}
                <span className="flex items-center gap-1"><BookOpen className="size-3" /> {stats.totalLessons} lessons</span>
                {stats.totalDuration > 0 && (
                  <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDuration(stats.totalDuration)}</span>
                )}
              </div>
              {isPurchased && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{stats.completedLessons}/{stats.totalLessons} completed</span>
                    <span className="text-xs font-bold text-amber-700">{stats.progressPercent}%</span>
                  </div>
                  <Progress value={stats.progressPercent} className="h-2" />
                  
                  {stats.progressPercent === 100 && (
                    <Button 
                      onClick={handleGenerateCertificate} 
                      disabled={isGeneratingCert}
                      size="sm"
                      className="mt-4 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md border-0"
                    >
                      {isGeneratingCert ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Award className="size-4 mr-2" />
                      )}
                      Download Certificate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy CTA */}
      {!purchase && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Enroll in this Course</h3>
              <p className="text-sm text-gray-600 mt-1">Get full access to all {stats.totalLessons} lessons</p>
            </div>
            <Button
              className="shrink-0 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                const state = useAppStore.getState();
                if (!state.requireAuth()) return;
                state.openCheckout({
                  id: course.id, type: 'course', title: course.title,
                  price: course.price, mrp: course.mrp, thumbnail: course.thumbnail,
                });
              }}
            >
              Enroll - &#8377;{course.price}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Module Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Course Content ({course.modules.length} {course.modules.length === 1 ? 'Module' : 'Modules'})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {course.modules.map((mod, index) => {
            const completedCount = mod.lessons.filter(l => progress[l.id]?.status === 'completed').length
            const totalCount = mod.lessons.length
            const modProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
            const typeCounts: Record<string, number> = {}
            mod.lessons.forEach(l => { typeCounts[l.type] = (typeCounts[l.type] || 0) + 1 })

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="border hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group h-full"
                  onClick={() => goToModule(mod.id)}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-amber-100 text-amber-700 shrink-0 group-hover:bg-amber-200 transition-colors">
                        <FolderOpen className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-amber-800 transition-colors">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{totalCount} {totalCount === 1 ? 'lesson' : 'lessons'}</p>
                      </div>
                      <ChevronRight className="size-4 text-gray-300 group-hover:text-amber-600 transition-colors shrink-0 mt-1" />
                    </div>

                    {mod.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{mod.description}</p>
                    )}

                    {/* Type Icons Row */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-auto mb-3">
                      {Object.entries(typeCounts).map(([type, count]) => {
                        const config = TYPE_ICONS[type] || { icon: FileText, color: 'text-gray-500' }
                        const IconComp = config.icon
                        return (
                          <span key={type} className={cn("flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-50", config.color)}>
                            <IconComp className="size-3" />
                            {count}
                          </span>
                        )
                      })}
                    </div>

                    {/* Module Progress */}
                    {isPurchased && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">{completedCount}/{totalCount}</span>
                          <span className="text-xs font-bold text-amber-700">{modProgress}%</span>
                        </div>
                        <Progress value={modProgress} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Course Community / Forum */}
        {isPurchased && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Community</h3>
            <CourseCommunity courseId={course.id} />
          </div>
        )}
      </div>
    </motion.div>
  )

  // ── LEVEL 2: Lesson List inside a Module ──
  const renderLessonList = () => {
    if (!selectedModule) return null
    const lessons = selectedModule.lessons
    const completedCount = lessons.filter(l => progress[l.id]?.status === 'completed').length
    const modProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        {/* Module Header */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedModule.title}</h2>
                {selectedModule.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{selectedModule.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</span>
                  {isPurchased && <span className="font-medium text-amber-700">{modProgress}% complete</span>}
                </div>
              </div>
              <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                <button
                  onClick={() => setLessonViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${lessonViewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  <List className="size-4" />
                </button>
                <button
                  onClick={() => setLessonViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${lessonViewMode === 'grid' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  <Grid className="size-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Cards */}
        <div className={cn(
          lessonViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"
        )}>
          {lessons.map((lesson, idx) => {
            const Icon = getLessonIcon(lesson.type)
            const isCompleted = progress[lesson.id]?.status === 'completed'
            const isLocked = !isPurchased && !lesson.isFree

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={cn(
                    "border transition-all cursor-pointer group",
                    isCompleted ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300" :
                    isLocked ? "border-gray-200 bg-gray-50/50 opacity-70" :
                    "hover:border-amber-300 hover:shadow-sm"
                  )}
                  onClick={() => !isLocked && goToLesson(lesson.id)}
                >
                  <CardContent className="p-3.5 flex items-center gap-3">
                    {/* Lesson Number / Status */}
                    <div className={cn(
                      "flex items-center justify-center size-9 rounded-lg shrink-0 text-sm font-semibold",
                      isCompleted ? "bg-emerald-100 text-emerald-600" :
                      isLocked ? "bg-gray-100 text-gray-400" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {isCompleted ? <CheckCircle2 className="size-5" /> :
                       isLocked ? <Lock className="size-4" /> :
                       <span>{idx + 1}</span>}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "text-sm font-medium truncate",
                          isCompleted ? "text-emerald-800" :
                          isLocked ? "text-gray-500" :
                          "text-gray-900 group-hover:text-amber-800"
                        )}>
                          {lesson.title}
                        </h3>
                        {lesson.isOptional && (
                          <Badge variant="outline" className="text-xs text-gray-400 shrink-0 py-0 h-4">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Icon className="size-3" />
                          {getLessonTypeLabel(lesson.type)}
                        </span>
                        {lesson.type === 'video' && lesson.videoDuration > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Clock className="size-3" />
                            {formatDuration(lesson.videoDuration)}
                          </span>
                        )}
                        {lesson.isFree && !isPurchased && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">FREE</Badge>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    {!isLocked && (
                      <ChevronRight className="size-4 text-gray-300 group-hover:text-amber-600 transition-colors shrink-0" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // ── LEVEL 3: Lesson Player ──
  const renderPlayer = () => {
    if (!selectedLesson || !selectedModule) return null

    const lessons = selectedModule.lessons
    const lessonIdx = lessons.findIndex(l => l.id === selectedLessonId)
    const hasNext = lessonIdx < lessons.length - 1
    const hasPrev = lessonIdx > 0
    const isCompleted = progress[selectedLesson.id]?.status === 'completed'

    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <Card className="border-0 shadow-sm py-0">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Lesson Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {getLessonTypeLabel(selectedLesson.type)}
                  </Badge>
                  {selectedLesson.videoDuration > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDuration(selectedLesson.videoDuration)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedLesson.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedModule.title}</p>
              </div>

              {isPurchased && (
                <Button
                  variant={isCompleted ? 'outline' : 'default'}
                  size="sm"
                  className={cn(
                    "gap-2 shrink-0",
                    isCompleted
                      ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  )}
                  onClick={handleMarkComplete}
                  disabled={markingComplete || isCompleted}
                >
                  {isCompleted ? (
                    <><CheckCircle2 className="size-4" /> Completed</>
                  ) : markingComplete ? (
                    <><Loader2 className="size-4 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle2 className="size-4" /> Mark Complete</>
                  )}
                </Button>
              )}
            </div>

            {/* Lesson Content */}
            {isExpired ? (
              <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="size-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Course Expired</h3>
                <p className="text-red-700 text-sm mb-6 max-w-md mx-auto">
                  Your access to this course has expired. Please renew your subscription or extend your access to continue learning.
                </p>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  onClick={() => useAppStore.getState().openCheckout({
                    id: course.id,
                    type: 'course',
                    title: course.title,
                    price: course.price,
                    mrp: course.mrp,
                    thumbnail: course.thumbnail,
                  })}
                >
                  Renew Access
                </Button>
              </div>
            ) : (
              <LessonContent
                lesson={selectedLesson}
                isPurchased={isPurchased}
                onMarkComplete={handleMarkComplete}
                isCompleted={isCompleted}
                lastPosition={progress[selectedLesson.id]?.lastPosition}
                onProgressUpdate={handleProgressUpdate}
              />
            )}

            {/* Lesson Smart Notes */}
            {isPurchased && !isExpired && (
              <LessonNotes courseId={course.id} lessonId={selectedLesson.id} />
            )}

            {/* Lesson Discussions */}
            {isPurchased && !isExpired && (
              <LessonDiscussions courseId={course.id} lessonId={selectedLesson.id} />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {isPurchased && (
          <div className="flex items-center justify-between">
            <Button variant="outline" className="gap-2" onClick={handlePrevLesson} disabled={!hasPrev}>
              <ArrowLeft className="size-4" /> Previous
            </Button>
            <span className="text-xs text-gray-400">{lessonIdx + 1} / {lessons.length}</span>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleNextLesson} disabled={!hasNext}>
              Next <ArrowLeft className="size-4 rotate-180" />
            </Button>
          </div>
        )}
      </motion.div>
    )
  }

  // ── Main Render ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={goBack} className="shrink-0 gap-1.5 h-8">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          {renderBreadcrumb()}
        </div>
      </div>

      {/* Content based on drill level */}
      <AnimatePresence mode="wait">
        {viewLevel === 'modules' && <div key="modules">{renderModuleGrid()}</div>}
        {viewLevel === 'lessons' && <div key="lessons">{renderLessonList()}</div>}
        {viewLevel === 'player' && <div key="player">{renderPlayer()}</div>}
      </AnimatePresence>
    </div>
  )
}
