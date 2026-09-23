'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { BookOpen, Play, ChevronLeft, CheckCircle2, Circle, Clock, FileText, Video, Lock, Award } from 'lucide-react'
import { useUIStore } from '@/lib/store'

interface Enrollment {
  id: string
  progress: number
  completedLessons: string
  course: {
    id: string
    title: string
    description: string
    thumbnail: string | null
    duration: number
    teacher: { id: string; name: string | null; username: string; avatar: string | null }
    _count: { lessons: number }
  }
}

interface CourseDetail {
  course: {
    id: string
    title: string
    description: string
    price: number
    thumbnail: string | null
    duration: number
    level: string
    teacher: { id: string; name: string | null; username: string; bio: string | null; avatar: string | null }
    lessons: {
      id: string
      title: string
      content: string
      videoUrl: string | null
      duration: number
      order: number
      isPreview: boolean
    }[]
    _count: { enrollments: number }
  }
  isEnrolled: boolean
  progress: number
  completedLessons: string[]
}

export function MyCourses() {
  const setView = useUIStore((s) => s.setView)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const fetchEnrollments = async () => {
    setLoading(true)
    const res = await fetch('/api/student/enroll')
    const data = await res.json()
    setEnrollments(data.enrollments || [])
    setLoading(false)
  }

  const fetchCourseDetail = async (courseId: string) => {
    setDetailLoading(true)
    const res = await fetch(`/api/courses/${courseId}`)
    const data = await res.json()
    setCourseDetail(data)
    if (data.course?.lessons?.length) {
      const firstIncomplete = data.course.lessons.find((l: { id: string }) => !data.completedLessons.includes(l.id))
      setActiveLessonId(firstIncomplete?.id || data.course.lessons[0].id)
    }
    setDetailLoading(false)
  }

  useEffect(() => { fetchEnrollments() }, [])
  useEffect(() => { if (selectedCourseId) fetchCourseDetail(selectedCourseId) }, [selectedCourseId])

  const markComplete = async (lessonId: string) => {
    if (!selectedCourseId) return
    setCompletingId(lessonId)
    try {
      const res = await fetch('/api/student/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, lessonId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Lesson completed! ✓')
      fetchCourseDetail(selectedCourseId)
    } finally { setCompletingId(null) }
  }

  // Course detail view
  if (selectedCourseId && courseDetail) {
    const activeLesson = courseDetail.course.lessons.find((l) => l.id === activeLessonId) || courseDetail.course.lessons[0]
    
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedCourseId(null); setCourseDetail(null) }} className="-ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Courses
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lesson content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{courseDetail.course.title}</h1>
              <p className="text-sm text-muted-foreground">by {courseDetail.course.teacher.name}</p>
            </div>

            {activeLesson && (
              <Card>
                <CardContent className="p-0 overflow-hidden">
                  {activeLesson.videoUrl && (
                    <div className="aspect-video bg-black">
                      {activeLesson.videoUrl.includes('youtube') || activeLesson.videoUrl.includes('youtu.be') ? (
                        <iframe src={activeLesson.videoUrl.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
                      ) : (
                        <video src={activeLesson.videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold">{activeLesson.title}</h2>
                      {activeLesson.isPreview && <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">Free Preview</Badge>}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap">{activeLesson.content}</p>
                    </div>
                    {courseDetail.isEnrolled && (
                      <Button 
                        onClick={() => markComplete(activeLesson.id)} 
                        disabled={completingId === activeLesson.id}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {courseDetail.completedLessons.includes(activeLesson.id) ? (
                          <><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</>
                        ) : (
                          <><Circle className="w-4 h-4 mr-2" /> Mark as Complete</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lesson list sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm font-bold text-emerald-600">{courseDetail.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={courseDetail.progress} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">{courseDetail.completedLessons.length} of {courseDetail.course.lessons.length} lessons completed</p>
                {courseDetail.progress >= 100 && (
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/student/certificates', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ courseId: selectedCourseId }),
                        })
                        const data = await res.json()
                        if (!res.ok) { toast.error(data.error); return }
                        toast.success('Certificate generated! 🎉')
                        setView('student-certificates')
                      } catch {
                        toast.error('Failed to generate certificate')
                      }
                    }}
                    className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    <Award className="w-4 h-4 mr-2" /> Get Your Certificate
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Course Content</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{courseDetail.course.lessons.length} lessons</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {detailLoading ? (
                    <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                  ) : (
                    courseDetail.course.lessons.map((lesson, idx) => {
                      const isCompleted = courseDetail.completedLessons.includes(lesson.id)
                      const isActive = lesson.id === activeLessonId
                      const isLocked = !courseDetail.isEnrolled && !lesson.isPreview
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                          disabled={isLocked}
                          className={`w-full text-left p-3 border-b last:border-0 flex items-start gap-3 transition-colors ${
                            isActive ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-muted/50'
                          } ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> :
                             isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                             <Circle className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                              {idx + 1}. {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.videoUrl && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Video className="w-3 h-3" /></span>}
                              {lesson.duration > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {lesson.duration}m</span>}
                              {lesson.isPreview && <Badge variant="outline" className="text-xs py-0">Preview</Badge>}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Enrolled courses list
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">My Courses</h2>
        <p className="text-sm text-muted-foreground">Continue your learning journey</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
            <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700"><BookOpen className="w-4 h-4 mr-2" /> Browse Courses</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-all flex flex-col cursor-pointer" onClick={() => setSelectedCourseId(enrollment.course.id)}>
              <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 relative">
                {enrollment.course.thumbnail ? (
                  <img src={enrollment.course.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-emerald-600/30" /></div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"><Play className="w-5 h-5 text-emerald-600" /></div>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold mb-1 line-clamp-1">{enrollment.course.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">by {enrollment.course.teacher.name}</p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-semibold text-emerald-600">{enrollment.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1.5">{enrollment.course._count.lessons} lessons</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
