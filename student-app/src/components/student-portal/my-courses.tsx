'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  Loader2,
  ExternalLink,
  GraduationCap,
  AlertCircle,
  RotateCcw,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Folder,
  ChevronRight,
  Play,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoPlayer } from './course/course-components'

interface PortalCourse {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  category: string | null
  status: string
  price: number
  mrp: number
  featured: boolean
  demoVideo?: string | null
  parentId?: string | null
  subCourseCount?: number
}

interface PurchasedCourse {
  id: string
  purchasedAt: string
  expiresAt: string | null
  course: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    category: string | null
    status: string
    price?: number
    mrp?: number
  }
}

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl overflow-hidden py-0">
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
  const { setStudentPage, setSelectedCourseId } = useAppStore()
  const [courses, setCourses] = useState<PurchasedCourse[]>([])
  const [exploreCourses, setExploreCourses] = useState<PortalCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('my-courses')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string }>>([])
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<{ url: string, title: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentFolderId) params.set('parentId', currentFolderId)
      const coursesUrl = `/api/student/courses${params.toString() ? `?${params.toString()}` : ''}`

      const [resMy, resAll] = await Promise.allSettled([
        apiFetchJSON<{ success: boolean; courses: PurchasedCourse[]; allCourses?: PortalCourse[]; unauthenticated?: boolean }>(coursesUrl),
        apiFetchJSON<{ success: boolean; data?: { courses: PortalCourse[] }; content?: { courses: PortalCourse[] } }>('/api/public/portal-data')
      ])
      
      let loadedMyCourses = false;

      if (resMy.status === 'fulfilled' && resMy.value.unauthenticated) {
        useAppStore.getState().logout()
        return
      }

      if (resMy.status === 'fulfilled' && resMy.value.success) {
        setCourses(resMy.value.courses || [])
        loadedMyCourses = true;
        
        // Use allCourses from student/courses API if available
        if (resMy.value.allCourses && resMy.value.allCourses.length > 0) {
          setExploreCourses(resMy.value.allCourses)
        } else if (resAll.status === 'fulfilled' && resAll.value.success) {
          const allCourses = resAll.value.data?.courses || resAll.value.content?.courses || []
          setExploreCourses(allCourses)
        }
      } else {
        console.error('Failed to load my courses:', resMy.status === 'rejected' ? resMy.reason : 'API returned success: false');
        setError('Failed to load your purchased courses. Please try again.')
      }
      
      // Fallback for explore courses if resMy failed but resAll succeeded
      if (!loadedMyCourses && resAll.status === 'fulfilled' && resAll.value.success) {
        const allCourses = resAll.value.data?.courses || resAll.value.content?.courses || []
        setExploreCourses(allCourses)
      }

    } catch (err) {
      console.error('Courses load error:', err)
      setError('An unexpected error occurred while loading courses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [currentFolderId])

  const handleNavigateFolder = (course: PortalCourse) => {
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

  const filteredMyCourses = courses.filter(item => 
    !searchQuery || 
    item.course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.course.category && item.course.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredExploreCourses = exploreCourses.filter(course => 
    !searchQuery || 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">Access your purchased courses and study materials</p>
        </div>
        <CourseSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 text-sm mt-1">Access your purchased courses and study materials</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 text-sm mt-1">Access your purchased courses or explore new ones</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`w-8 h-8 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`w-8 h-8 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`w-8 h-8 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="explore">Explore Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="my-courses" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {filteredMyCourses.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="size-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">{searchQuery ? 'No matching courses found' : 'No courses purchased yet'}</p>
              {!searchQuery && <p className="text-sm mt-1">Check out the Explore tab to find available courses!</p>}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" :
              viewMode === 'list' ? "flex flex-col gap-4" :
              "w-full overflow-x-auto"
            }>
              {viewMode === 'table' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Purchased</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMyCourses.map(item => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-amber-50 shrink-0 overflow-hidden flex items-center justify-center">
                            {item.course.thumbnail ? <MediaImage src={item.course.thumbnail} className="w-full h-full object-contain bg-white" /> : <BookOpen className="size-5 text-amber-600/40" />}
                          </div>
                          <span className="font-medium text-gray-900">{item.course.title}</span>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{item.course.category || '-'}</td>
                        <td className="py-3 text-sm text-gray-600">{new Date(item.purchasedAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleViewCourse(item.course.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode !== 'table' && filteredMyCourses.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  {(() => {
                    const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
                    return (
                      <Card className={`group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200 py-0 ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}>
                        {/* Thumbnail */}
                        <div className={`relative flex items-center justify-center bg-amber-50 shrink-0 ${viewMode === 'list' ? 'sm:w-48 h-40 sm:h-auto' : 'h-40'}`}>
                          {item.course.thumbnail ? (
                            <MediaImage src={item.course.thumbnail} alt={item.course.title} className="w-full h-full object-contain bg-white" />
                          ) : (
                            <BookOpen className="size-12 text-amber-600/40" />
                          )}
                          {item.course.category && viewMode === 'grid' && (
                            <Badge className="absolute top-3 left-3 text-xs font-semibold bg-amber-600 text-white">
                              {item.course.category}
                            </Badge>
                          )}
                          {isExpired && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <Badge className="bg-red-600 text-white font-bold border-0 px-2 py-1 uppercase tracking-wide">Expired</Badge>
                            </div>
                          )}
                        </div>

                        <CardContent className={`p-4 flex flex-col gap-3 flex-1 ${viewMode === 'list' ? 'justify-center' : ''}`}>
                          {viewMode === 'list' && item.course.category && (
                            <Badge className="w-fit text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">{item.course.category}</Badge>
                          )}
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
                            {item.course.title}
                          </h3>
                          {item.course.description && (
                            <p className="text-gray-500 text-xs line-clamp-2">{item.course.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="size-3.5" />
                            Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                          </div>
                          <div className={viewMode === 'list' ? 'mt-2' : ''}>
                            {isExpired ? (
                              <Button
                                className={`${viewMode === 'list' ? 'w-auto' : 'w-full'} font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  useAppStore.getState().openCheckout({
                                    id: item.course.id,
                                    type: 'course',
                                    title: item.course.title,
                                    price: item.course.price as any,
                                    mrp: item.course.mrp as any,
                                    thumbnail: item.course.thumbnail,
                                  })
                                }}
                              >
                                <AlertCircle className="size-4 mr-1" />
                                Renew Course
                              </Button>
                            ) : (
                              <Button
                                className={`${viewMode === 'list' ? 'w-auto' : 'w-full'} font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white`}
                                onClick={() => handleViewCourse(item.course.id)}
                              >
                                <GraduationCap className="size-4 mr-1" />
                                Continue Learning
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="explore" className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          {/* Breadcrumbs */}
          {(currentFolderId || breadcrumbs.length > 0) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-200">
              <button
                onClick={() => handleNavigateUp(-1)}
                className={`hover:text-amber-600 font-medium transition-colors ${!currentFolderId ? 'text-amber-600 font-semibold' : ''}`}
              >
                All Courses
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-1.5 sm:gap-2">
                  <ChevronRight className="size-3.5 text-gray-400" />
                  <button
                    onClick={() => handleNavigateUp(idx)}
                    className={`hover:text-amber-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'text-amber-600 font-semibold' : ''}`}
                  >
                    {crumb.title}
                  </button>
                </div>
              ))}
            </div>
          )}

          {filteredExploreCourses.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="size-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">{searchQuery ? 'No matching courses found' : 'No courses available right now'}</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" :
              viewMode === 'list' ? "flex flex-col gap-4" :
              "w-full overflow-x-auto"
            }>
              {viewMode === 'table' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExploreCourses.map(course => (
                      <tr key={course.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-amber-50 shrink-0 overflow-hidden flex items-center justify-center">
                            {course.thumbnail ? <MediaImage src={course.thumbnail} className="w-full h-full object-contain bg-white" /> : <BookOpen className="size-5 text-amber-600/40" />}
                          </div>
                          <span className="font-medium text-gray-900">{course.title}</span>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{course.category || '-'}</td>
                        <td className="py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <span>&#8377;{course.price}</span>
                            {course.mrp > course.price && <span className="text-xs text-gray-400 line-through">&#8377;{course.mrp}</span>}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          {(course.subCourseCount || 0) > 0 ? (
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleNavigateFolder(course)}>
                              <Folder className="size-3.5 mr-1" /> Open
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleViewCourse(course.id)}>
                              Details
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewMode !== 'table' && filteredExploreCourses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card className={`group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200 py-0 flex ${viewMode === 'list' ? 'flex-col sm:flex-row' : 'flex-col h-full'}`}>
                    {/* Thumbnail */}
                    <div className={`relative shrink-0 flex items-center justify-center bg-amber-50 ${viewMode === 'list' ? 'sm:w-48 h-40 sm:h-auto' : 'h-40'}`}>
                      {course.thumbnail ? (
                        <MediaImage src={course.thumbnail} alt={course.title} className="w-full h-full object-contain bg-white" />
                      ) : (
                        <BookOpen className="size-12 text-amber-600/40" />
                      )}
                      {course.category && viewMode === 'grid' && (
                        <Badge className="absolute top-3 left-3 text-xs font-semibold bg-amber-600 text-white">
                          {course.category}
                        </Badge>
                      )}
                      {(course.subCourseCount || 0) > 0 && viewMode === 'grid' && (
                        <Badge className="absolute top-3 right-3 text-xs font-semibold bg-amber-700 text-white flex items-center gap-1">
                          <Folder className="size-3" /> Folder ({course.subCourseCount})
                        </Badge>
                      )}
                    </div>

                    <CardContent className={`p-4 flex flex-col gap-3 flex-1 ${viewMode === 'list' ? 'justify-center' : ''}`}>
                      {viewMode === 'list' && course.category && (
                        <Badge className="w-fit text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">{course.category}</Badge>
                      )}
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className={`text-gray-500 text-xs line-clamp-2 ${viewMode === 'grid' ? 'flex-1' : ''}`}>{course.description}</p>
                      )}
                      <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-auto' : ''}`}>
                        {(course.subCourseCount || 0) > 0 ? (
                          <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                            <Folder className="size-3.5" /> {course.subCourseCount} Items inside
                          </span>
                        ) : (
                          <>
                            <span className="text-lg font-bold text-gray-900">&#8377;{course.price}</span>
                            {course.mrp > course.price && (
                              <span className="text-sm text-gray-400 line-through">&#8377;{course.mrp}</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className={viewMode === 'list' ? 'mt-2' : ''}>
                        {(course.subCourseCount || 0) > 0 ? (
                          <Button
                            className={`${viewMode === 'list' ? 'w-auto' : 'w-full'} font-semibold rounded-lg mt-2 bg-amber-600 hover:bg-amber-700 text-white`}
                            onClick={() => handleNavigateFolder(course)}
                          >
                            <Folder className="size-3.5 mr-1" /> Open Folder
                          </Button>
                        ) : (
                          <div className={`flex gap-2 mt-2 ${viewMode === 'list' ? 'flex-row w-auto' : 'flex-col'}`}>
                            {course.demoVideo && (
                              <Button
                                variant="secondary"
                                className="font-semibold rounded-lg w-full flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDemoVideo({ url: course.demoVideo!, title: course.title });
                                }}
                              >
                                <Play className="size-4" /> Watch Demo
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="font-semibold rounded-lg w-full"
                              onClick={() => handleViewCourse(course.id)}
                            >
                              View Course Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedDemoVideo} onOpenChange={(open) => !open && setSelectedDemoVideo(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-0">
          <DialogHeader className="p-4 bg-gray-900 border-b border-gray-800">
            <DialogTitle className="text-white text-base font-medium">
              Demo: {selectedDemoVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-video bg-black">
            {selectedDemoVideo && (
              <VideoPlayer url={selectedDemoVideo.url} title={selectedDemoVideo.title} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
