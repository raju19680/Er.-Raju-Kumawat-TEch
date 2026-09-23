'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Clock,
  ExternalLink,
  GraduationCap,
  AlertCircle,
  RotateCcw,
  PlayCircle,
  CheckCircle2,
  Sparkles,
  Search,
  Zap,
  Folder,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CourseItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  category: string | null
  price: number
  mrp: number
  isPurchased: boolean
  totalLessons: number
  totalDuration: number
  level: string
  language: string
  parentId?: string | null
  subCourseCount?: number
}

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl overflow-hidden py-0 border border-gray-100">
          <Skeleton className="h-40 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MyCourses() {
  const { setStudentPage, setSelectedCourseId, openCheckout } = useAppStore()
  const [enrolledCourses, setEnrolledCourses] = useState<CourseItem[]>([])
  const [allCourses, setAllCourses] = useState<CourseItem[]>([])
  const [activeTab, setActiveTab] = useState<'enrolled' | 'explore'>('enrolled')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string }>>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentFolderId) params.set('parentId', currentFolderId)
      const res = await apiFetchJSON<{
        success: boolean
        courses: any[]
        allCourses: any[]
      }>(`/api/student/courses${params.toString() ? `?${params.toString()}` : ''}`)

      if (res.success) {
        // Enrolled
        const enrolled = (res.courses || []).map((item) => ({
          id: item.course?.id || item.id,
          title: item.course?.title || item.title,
          description: item.course?.description || item.description,
          thumbnail: item.course?.thumbnail || item.thumbnail,
          category: item.course?.category || item.category,
          price: item.course?.price || 0,
          mrp: item.course?.mrp || 0,
          isPurchased: true,
          totalLessons: item.course?.totalLessons || 0,
          totalDuration: item.course?.totalDuration || 0,
          level: item.course?.level || 'All Levels',
          language: item.course?.language || 'Hindi',
          parentId: item.course?.parentId || null,
          subCourseCount: item.course?.subCourseCount || item.course?._count?.children || 0,
        }))
        setEnrolledCourses(enrolled)

        // All Courses
        const all = (res.allCourses || []).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          category: item.category,
          price: item.price || 0,
          mrp: item.mrp || 0,
          isPurchased: !!item.isPurchased,
          totalLessons: item.totalLessons || 0,
          totalDuration: item.totalDuration || 0,
          level: item.level || 'All Levels',
          language: item.language || 'Hindi',
          parentId: item.parentId || null,
          subCourseCount: item.subCourseCount || item._count?.children || 0,
        }))
        setAllCourses(all)

        // If no enrolled courses, auto-switch to explore
        if (enrolled.length === 0 && all.length > 0) {
          setActiveTab('explore')
        }
      }
    } catch (err) {
      console.error('Courses load error:', err)
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [currentFolderId])

  const handleNavigateFolder = (course: CourseItem) => {
    setBreadcrumbs(prev => [...prev, { id: course.id, title: course.title }])
    setCurrentFolderId(course.id)
  }

  const handleNavigateUp = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([])
      setCurrentFolderId(null)
    } else {
      const nextBreadcrumbs = breadcrumbs.slice(0, index + 1)
      setBreadcrumbs(nextBreadcrumbs)
      setCurrentFolderId(nextBreadcrumbs[index].id)
    }
  }

  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId)
    setStudentPage('course-detail')
  }

  const handleEnrollNow = (course: CourseItem) => {
    openCheckout({
      id: course.id,
      type: 'course',
      title: course.title,
      price: course.price,
      mrp: course.mrp,
      thumbnail: course.thumbnail,
    })
  }

  const currentList = activeTab === 'enrolled' ? enrolledCourses : allCourses
  const filteredList = currentList.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses & Learning</h1>
          <p className="text-gray-500 text-sm mt-1">Access your enrolled courses and discover new programs</p>
        </div>
        <CourseSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses & Learning</h1>
          <p className="text-gray-500 text-sm mt-1">Access your enrolled courses and discover new programs</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load Courses</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={load}>
            <RotateCcw className="size-4" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="size-3.5 text-violet-200" />
            <span>Interactive Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Video Lectures & Structured Courses
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Watch recorded lectures, follow step-by-step curriculum, download lesson attachments, and earn certificates.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <GraduationCap className="size-64 text-white" />
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="bg-gray-100/80 p-1">
            <TabsTrigger value="enrolled" className="text-xs sm:text-sm font-medium">
              My Enrolled Courses ({enrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="explore" className="text-xs sm:text-sm font-medium">
              Explore All Courses ({allCourses.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white shadow-sm border-gray-200 rounded-xl"
          />
        </div>
      </div>

      {/* Breadcrumbs for folder hierarchy */}
      {(currentFolderId || breadcrumbs.length > 0) && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap bg-white/80 px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
          <button
            onClick={() => handleNavigateUp(-1)}
            className={`hover:text-indigo-600 font-medium transition-colors ${!currentFolderId ? 'text-indigo-600 font-semibold' : ''}`}
          >
            All Courses
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.id} className="flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className="size-3.5 text-gray-400" />
              <button
                onClick={() => handleNavigateUp(idx)}
                className={`hover:text-indigo-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'text-indigo-600 font-semibold' : ''}`}
              >
                {crumb.title}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Course List Grid */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="size-12 mx-auto mb-3 text-gray-300" />
          <p className="text-base font-semibold text-gray-700">
            {activeTab === 'enrolled' ? 'No Enrolled Courses Found' : 'No Courses Available'}
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {activeTab === 'enrolled'
              ? "You haven't enrolled in any courses yet. Browse our catalog and start learning today!"
              : 'Try searching with different keywords.'}
          </p>
          {activeTab === 'enrolled' && (
            <Button
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold gap-1.5"
              onClick={() => setActiveTab('explore')}
            >
              <Zap className="size-3.5" /> Explore Courses
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredList.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                className="flex"
              >
                <Card className="flex flex-col w-full rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-xl hover:border-gray-200 transition-all duration-300 group py-0">
                  {/* Thumbnail */}
                  <div className="relative h-44 w-full bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden shrink-0">
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-indigo-400 gap-2">
                        <GraduationCap className="size-12" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {c.category || 'Course'}
                        </span>
                      </div>
                    )}

                    {/* Category & Status Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {c.category && (
                        <Badge className="bg-indigo-600/90 backdrop-blur-md text-white border-none text-xs">
                          {c.category}
                        </Badge>
                      )}
                      {(c.subCourseCount || 0) > 0 && (
                        <Badge className="bg-amber-600/90 backdrop-blur-md text-white border-none text-xs flex items-center gap-1">
                          <Folder className="size-3" /> Folder ({c.subCourseCount})
                        </Badge>
                      )}
                    </div>

                    {c.isPurchased && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-sm">
                          <CheckCircle2 className="size-3.5" /> Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="flex flex-col flex-1 p-5 justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <span>{c.totalLessons} Lessons</span>
                        <span>•</span>
                        <span>{c.language}</span>
                        <span>•</span>
                        <span>{c.level}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {c.description.replace(/<[^>]*>?/gm, '')}
                        </p>
                      )}
                    </div>

                    {/* Footer / CTA */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        {(c.subCourseCount || 0) > 0 ? (
                          <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                            <Folder className="size-3.5" /> {c.subCourseCount} Items inside
                          </span>
                        ) : c.isPurchased ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> Active Access
                          </span>
                        ) : c.price === 0 ? (
                          <span className="text-base font-extrabold text-emerald-600">FREE</span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-extrabold text-gray-900">₹{c.price}</span>
                            {c.mrp > c.price && (
                              <span className="text-xs text-gray-400 line-through">₹{c.mrp}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        {(c.subCourseCount || 0) > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => handleNavigateFolder(c)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow-sm"
                          >
                            <Folder className="size-3.5" /> Open Folder
                          </Button>
                        ) : c.isPurchased ? (
                          <Button
                            size="sm"
                            onClick={() => handleViewCourse(c.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow-sm"
                          >
                            <PlayCircle className="size-3.5" /> Start Learning
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleEnrollNow(c)}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow-sm"
                          >
                            <Zap className="size-3.5" /> {c.price === 0 ? 'Enroll Free' : 'Enroll Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
