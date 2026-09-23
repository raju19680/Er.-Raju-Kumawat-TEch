'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
  Menu,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CourseData, CourseStats, ProgressEntry, Lesson } from './course/types'
import { LessonContent } from './course/LessonContent'
import { CourseSidebar } from './course/CourseSidebar'
import { getLessonIcon, getLessonTypeLabel, formatCourseDuration } from './course/utils'

export default function CourseDetail() {
  const { selectedCourseId, setStudentPage } = useAppStore()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [purchase, setPurchase] = useState<{ id: string; purchasedAt: string; expiresAt: string | null } | null>(null)
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({})
  const [stats, setStats] = useState<CourseStats>({ totalLessons: 0, completedLessons: 0, totalDuration: 0, progressPercent: 0 })
  const [purchasing, setPurchasing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active lesson
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

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

        // Auto-select first lesson
        if (res.course.modules.length > 0 && res.course.modules[0].lessons.length > 0) {
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

  useEffect(() => { load() }, [load])

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

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  // Handle Purchase / Razorpay integration
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePurchase = async () => {
    if (!course) return
    setPurchasing(true)

    try {
      const res = await fetch('/api/student/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      })
      const data = await res.json()

      if (!data.success) {
        toast.error(data.message || 'Failed to initiate payment')
        setPurchasing(false)
        return
      }

      if (data.isFree) {
        toast.success('Successfully enrolled in free course!')
        load()
        setPurchasing(false)
        return
      }

      const resLoad = await loadRazorpayScript()
      if (!resLoad) {
        toast.error('Razorpay SDK failed to load. Are you offline?')
        setPurchasing(false)
        return
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: data.course.name,
        description: data.course.description,
        order_id: data.order.id,
        prefill: {
          name: data.prefill.name,
          email: data.prefill.email,
          contact: data.prefill.contact,
        },
        theme: {
          color: '#10b981', // Emerald 500
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/student/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
              })
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              toast.success('Payment successful! Course unlocked.')
              load()
            } else {
              toast.error(verifyData.message || 'Payment verification failed')
            }
          } catch (e) {
            toast.error('Payment verification failed')
          }
        },
      }

      const paymentObject = new (window as any).Razorpay(options)
      paymentObject.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment failed')
      })
      paymentObject.open()
      setPurchasing(false)
    } catch (e) {
      console.error(e)
      toast.error('Payment error')
      setPurchasing(false)
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
          <Button variant="ghost" size="icon" onClick={() => setStudentPage('my-courses')} className="shrink-0">
            <ArrowLeft className="size-5" />
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
  const allLessons = course.modules.flatMap(m => m.lessons)
  const currentIndex = allLessons.findIndex(l => l.id === activeLessonId)
  const hasNext = currentIndex < allLessons.length - 1
  const hasPrev = currentIndex > 0

  // ── Main Render ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setStudentPage('my-courses')} className="shrink-0">
          <ArrowLeft className="size-5" />
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
                {formatCourseDuration(stats.totalDuration)}
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
        
        {/* Enroll / Buy Button */}
        {!isPurchased && (
          <div className="hidden sm:block">
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? 'Processing...' : (course.price === 0) ? 'Enroll for Free' : `Buy for ₹${course.price}`}
            </Button>
          </div>
        )}

        {/* Mobile sidebar toggle */}
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
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
          {activeLesson ? (
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
                            {formatCourseDuration(activeLesson.videoDuration)}
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
                  <LessonContent
                    lesson={activeLesson}
                    isPurchased={isPurchased}
                    onMarkComplete={handleMarkComplete}
                    isCompleted={progress[activeLesson.id]?.status === 'completed'}
                    onPurchase={handlePurchase}
                    purchasing={purchasing}
                    coursePrice={course.price}
                    isFreeCourse={course.price === 0}
                    studentMobile={''}
                  />
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
            <CourseSidebar 
              course={course}
              stats={stats}
              progress={progress}
              expandedModules={expandedModules}
              toggleModule={toggleModule}
              activeLessonId={activeLessonId}
              setActiveLessonId={setActiveLessonId}
              setActiveModuleId={setActiveModuleId}
              isPurchased={isPurchased}
            />
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
              <CourseSidebar 
                course={course}
                stats={stats}
                progress={progress}
                expandedModules={expandedModules}
                toggleModule={toggleModule}
                activeLessonId={activeLessonId}
                setActiveLessonId={setActiveLessonId}
                setActiveModuleId={setActiveModuleId}
                isPurchased={isPurchased}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
