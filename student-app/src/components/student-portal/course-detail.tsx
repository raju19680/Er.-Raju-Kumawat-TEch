'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Menu,
  X,
  Sparkles,
  RotateCcw,
  Award
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { useSEO } from '@/hooks/use-seo'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Lesson, Module, CourseData, CourseStats, ProgressEntry,
  formatDuration, getLessonIcon, getLessonTypeLabel, LessonContent, VideoPlayer
} from './course/course-components'
import { CourseCommunity, LessonDiscussions } from './course/course-community'

export default function CourseDetail() {
  const { selectedCourseId, setStudentPage, paymentSuccessTrigger } = useAppStore()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [purchase, setPurchase] = useState<{ id: string; purchasedAt: string; expiresAt: string | null } | null>(null)
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({})
  const [stats, setStats] = useState<CourseStats>({ totalLessons: 0, completedLessons: 0, totalDuration: 0, progressPercent: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active lesson
  const [activeLessonId, setActiveLessonId] = useState<string | null>('overview')
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // Marking complete
  const [markingComplete, setMarkingComplete] = useState(false)

  // Expand all modules that have lessons
  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }))
  }

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

        // Auto-select first lesson
        if (!res.purchase) {
          setActiveLessonId('overview')
          if (res.course.modules.length > 0) {
            setActiveModuleId(res.course.modules[0].id)
            const expanded: Record<string, boolean> = {}
            res.course.modules.forEach(m => { expanded[m.id] = true })
            setExpandedModules(expanded)
          }
        } else if (res.course.modules.length > 0 && res.course.modules[0].lessons.length > 0) {
          // Find first incomplete lesson, or first lesson
          let firstIncomplete: Lesson | null = null
          for (const mod of res.course.modules) {
            for (const lsn of mod.lessons) {
              if (res.progress[lsn.id]?.status !== 'completed') {
                firstIncomplete = lsn
                break
              }
            }
            if (firstIncomplete) break
          }
          const targetLesson = firstIncomplete || res.course.modules[0].lessons[0]
          setActiveLessonId(targetLesson.id)
          setActiveModuleId(res.course.modules[0].id)
          // Expand all modules that have lessons
          const expanded: Record<string, boolean> = {}
          res.course.modules.forEach(m => { expanded[m.id] = true })
          setExpandedModules(expanded)
        }
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

  useSEO({
    title: course?.title,
    description: course?.description || undefined,
    image: course?.thumbnail || undefined,
  })

  // Find active lesson object
  const activeLesson = course?.modules
    .flatMap(m => m.lessons)
    .find(l => l.id === activeLessonId) || null

  const activeModule = course?.modules.find(m => m.id === activeModuleId) || null

  // Mark lesson complete
  const handleMarkComplete = async () => {
    if (!activeLessonId || !selectedCourseId || markingComplete) return
    setMarkingComplete(true)
    try {
      const res = await apiFetch('/api/student/lesson-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLessonId,
          courseId: selectedCourseId,
          status: 'completed',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setProgress(prev => ({
            ...prev,
            [activeLessonId]: { status: 'completed', completedAt: new Date().toISOString() },
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

  // Navigate to next lesson
  const handleNextLesson = () => {
    if (!course) return
    const allLessons = course.modules.flatMap(m => m.lessons)
    const currentIndex = allLessons.findIndex(l => l.id === activeLessonId)
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1]
      setActiveLessonId(next.id)
      // Find which module this lesson belongs to
      for (const mod of course.modules) {
        if (mod.lessons.some(l => l.id === next.id)) {
          setActiveModuleId(mod.id)
          setExpandedModules(prev => ({ ...prev, [mod.id]: true }))
          break
        }
      }
    }
  }

  // Navigate to previous lesson
  const handlePrevLesson = () => {
    if (!course) return
    const allLessons = course.modules.flatMap(m => m.lessons)
    const currentIndex = allLessons.findIndex(l => l.id === activeLessonId)
    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1]
      setActiveLessonId(prev.id)
      for (const mod of course.modules) {
        if (mod.lessons.some(l => l.id === prev.id)) {
          setActiveModuleId(mod.id)
          setExpandedModules(prev2 => ({ ...prev2, [mod.id]: true }))
          break
        }
      }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 mt-4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setStudentPage('my-courses')} className="shrink-0 gap-1.5 h-8">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={load}>
            <RotateCcw className="size-4" /> Try Again
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

  const isPurchased = !!purchase
  const isExpired = purchase?.expiresAt ? new Date(purchase.expiresAt) < new Date() : false
  const allLessons = course.modules.flatMap(m => m.lessons)
  const currentIndex = allLessons.findIndex(l => l.id === activeLessonId)
  const hasNext = currentIndex < allLessons.length - 1
  const hasPrev = currentIndex > 0

  // ── Sidebar: Module & Lesson List ──
  const renderSidebarContent = () => (
    <div className="space-y-1">
      {/* Course Progress */}
      <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Progress</span>
          <span className="text-sm font-bold text-amber-700">{stats.progressPercent}%</span>
        </div>
        <Progress value={stats.progressPercent} className="h-2" />
        <p className="text-xs text-gray-500 mt-1.5">
          {stats.completedLessons} of {stats.totalLessons} lessons completed
        </p>
      </div>

      {/* Modules */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-2">
          {/* Overview button */}
          <button
            onClick={() => setActiveLessonId('overview')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors mb-2",
              activeLessonId === 'overview'
                ? "bg-amber-50 text-amber-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className={cn(
              "flex items-center justify-center size-7 rounded-md shrink-0",
              activeLessonId === 'overview' ? "bg-amber-200/50 text-amber-700" : "bg-gray-100 text-gray-500"
            )}>
              <BookOpen className="size-4" />
            </div>
            <span className="flex-1 text-sm">Course Overview</span>
          </button>
          
          {/* Community button */}
          {isPurchased && (
            <button
              onClick={() => setActiveLessonId('community')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors mb-4",
                activeLessonId === 'community'
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-center size-7 rounded-md shrink-0",
                activeLessonId === 'community' ? "bg-amber-200/50 text-amber-700" : "bg-gray-100 text-gray-500"
              )}>
                <Menu className="size-4" />
              </div>
              <span className="flex-1 text-sm">Community Forum & Chat</span>
            </button>
          )}

          {course.modules.map((mod) => {
            const isExpanded = expandedModules[mod.id]
            const moduleLessons = mod.lessons
            const completedInModule = moduleLessons.filter(l => progress[l.id]?.status === 'completed').length

            return (
              <div key={mod.id} className="mb-1">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight className="size-4 text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{mod.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {completedInModule}/{moduleLessons.length} lessons
                      {mod.description && ` · ${mod.description.slice(0, 40)}`}
                    </p>
                  </div>
                </button>

                {/* Lessons */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 pl-3 border-l border-gray-100 space-y-0.5">
                        {moduleLessons.map((lesson) => {
                          const Icon = getLessonIcon(lesson.type)
                          const isActive = lesson.id === activeLessonId
                          const isCompleted = progress[lesson.id]?.status === 'completed'
                          const isLocked = !isPurchased && !lesson.isFree

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setActiveLessonId(lesson.id)
                                setActiveModuleId(mod.id)
                                setSidebarOpen(false)
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all',
                                isActive
                                  ? 'bg-amber-50 text-amber-900 font-medium'
                                  : isCompleted
                                    ? 'text-emerald-700 hover:bg-emerald-50/50'
                                    : isLocked
                                      ? 'text-gray-500 hover:bg-gray-50'
                                      : 'text-gray-600 hover:bg-gray-50',
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                              ) : isLocked ? (
                                <Lock className="size-3.5 text-gray-300 shrink-0" />
                              ) : isActive ? (
                                <Play className="size-4 text-amber-600 shrink-0 fill-amber-600" />
                              ) : (
                                <Icon className="size-4 text-gray-400 shrink-0" />
                              )}
                              <span className="flex-1 truncate">{lesson.title}</span>
                              <span className="text-xs text-gray-400 shrink-0">
                                {lesson.type === 'video' && lesson.videoDuration
                                  ? formatDuration(lesson.videoDuration)
                                  : getLessonTypeLabel(lesson.type)}
                              </span>
                              {lesson.isFree && !isPurchased && (
                                <Badge className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">FREE</Badge>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  // ── Main Render ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setStudentPage('my-courses')} className="shrink-0 gap-1.5 h-8">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{course.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            {course.category && <Badge variant="secondary">{course.category}</Badge>}
            {course.level && course.level !== 'All' && <Badge variant="outline">{course.level}</Badge>}
            {course.language && <Badge variant="outline">{course.language}</Badge>}
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {stats.totalLessons} lessons
            </span>
            {stats.totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDuration(stats.totalDuration)}
              </span>
            )}
            {/* Validity info */}
            {course.validityType === 'lifetime' && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Sparkles className="size-3" /> Lifetime Access
              </span>
            )}
            {course.validityType === 'months' && course.validityMonths && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {course.validityMonths} Months Access
              </span>
            )}
            {course.validityType === 'end_date' && course.validityEndDate && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> Valid till {new Date(course.validityEndDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {/* Mobile sidebar toggle */}
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        {/* Buy Now Button if not purchased */}
        {!purchase && (
          <Button
            className="shrink-0 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => useAppStore.getState().openCheckout({
              id: course.id,
              type: 'course',
              title: course.title,
              price: course.price,
              mrp: course.mrp,
              thumbnail: course.thumbnail,
            })}
          >
            Enroll Now - &#8377;{course.price}
          </Button>
        )}
      </div>

      {/* Mobile Progress Bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">{stats.completedLessons}/{stats.totalLessons} completed</span>
          <span className="text-xs font-bold text-amber-700">{stats.progressPercent}%</span>
        </div>
        <Progress value={stats.progressPercent} className="h-1.5" />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {activeLessonId === 'overview' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-0 shadow-sm py-0">
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Course Overview</h2>
                    {course.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
                    )}
                  </div>
                  
                  {course.demoVideo && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Play className="size-4 text-amber-600" />
                        Demo Video
                      </h3>
                      <VideoPlayer url={course.demoVideo} title="Course Demo" />
                    </div>
                  )}

                  {course.content && (
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <h3 className="font-semibold text-gray-900">About this Course</h3>
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-amber-600">
                        <div dangerouslySetInnerHTML={{ __html: course.content }} />
                      </div>
                    </div>
                  )}

                  {!isPurchased ? (
                    <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 text-center">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Ready to start learning?</h3>
                      <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                        Enroll in this course to unlock all lessons, materials, and track your progress.
                      </p>
                      <Button
                        className="font-semibold bg-amber-600 hover:bg-amber-700 text-white px-8"
                        onClick={() => useAppStore.getState().openCheckout({
                          id: course.id,
                          type: 'course',
                          title: course.title,
                          price: course.price,
                          mrp: course.mrp,
                          thumbnail: course.thumbnail,
                        })}
                      >
                        Enroll Now - &#8377;{course.price}
                      </Button>
                    </div>
                  ) : stats.progressPercent === 100 ? (
                    <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 text-center">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Congratulations! 🎉</h3>
                      <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                        You have successfully completed this course. You can now download your certificate of completion.
                      </p>
                      <Button
                        className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                        onClick={async () => {
                          const res = await apiFetchJSON<{ success: boolean, certificate: { id: string } }>(`/api/student/certificates/${course.id}`)
                          if (res.success && res.certificate) {
                            window.open(`/certificate/${res.certificate.id}`, '_blank')
                          } else {
                            toast.error('Failed to generate certificate')
                          }
                        }}
                      >
                        <Award className="size-4 mr-2" />
                        View Certificate
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          ) : activeLessonId === 'community' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CourseCommunity courseId={course.id} />
            </motion.div>
          ) : activeLesson ? (
            <motion.div
              key={activeLesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-0 shadow-sm py-0">
                <CardContent className="p-4 sm:p-6">
                  {/* Lesson Header */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className={cn(
                      'flex items-center justify-center size-10 rounded-xl shrink-0',
                      activeLesson.type === 'video' ? 'bg-red-50' :
                      activeLesson.type === 'pdf' ? 'bg-blue-50' :
                      activeLesson.type === 'quiz' ? 'bg-purple-50' :
                      'bg-amber-50'
                    )}>
                      {(() => {
                        const Icon = getLessonIcon(activeLesson.type)
                        return <Icon className={cn(
                          'size-5',
                          activeLesson.type === 'video' ? 'text-red-500' :
                          activeLesson.type === 'pdf' ? 'text-blue-500' :
                          activeLesson.type === 'quiz' ? 'text-purple-500' :
                          'text-amber-600'
                        )} />
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getLessonTypeLabel(activeLesson.type)}
                        </Badge>
                        {activeLesson.videoDuration > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDuration(activeLesson.videoDuration)}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{activeLesson.title}</h2>
                      {activeModule && (
                        <p className="text-xs text-gray-400 mt-0.5">{activeModule.title}</p>
                      )}
                    </div>
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
                      lesson={activeLesson}
                      isPurchased={isPurchased}
                      onMarkComplete={handleMarkComplete}
                      isCompleted={progress[activeLesson.id]?.status === 'completed'}
                    />
                  )}

                  {/* Lesson Discussions */}
                  {isPurchased && !isExpired && (
                    <LessonDiscussions courseId={course.id} lessonId={activeLesson.id} />
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              {isPurchased && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handlePrevLesson}
                    disabled={!hasPrev}
                  >
                    <ArrowLeft className="size-4" />
                    Previous
                  </Button>
                  <span className="text-xs text-gray-400">
                    {currentIndex + 1} / {allLessons.length}
                  </span>
                  <Button
                    className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleNextLesson}
                    disabled={!hasNext}
                  >
                    Next
                    <ArrowLeft className="size-4 rotate-180" />
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <Card className="border-0 shadow-sm py-0">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Sparkles className="size-10 text-amber-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Select a lesson to start</h2>
                  <p className="text-sm text-gray-500">Choose a lesson from the sidebar to begin learning</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Card className="border-0 shadow-sm py-0 sticky top-4">
            {renderSidebarContent()}
          </Card>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">Course Content</h3>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="size-5" />
                </Button>
              </div>
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
