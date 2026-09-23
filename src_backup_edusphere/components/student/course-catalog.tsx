'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, BookOpen, Users, Clock, Star, Loader2, CheckCircle2 } from 'lucide-react'
import { useUIStore } from '@/lib/store'

interface CatalogCourse {
  id: string
  title: string
  description: string
  price: number
  thumbnail: string | null
  category: string | null
  level: string
  language: string
  duration: number
  teacher: { id: string; name: string | null; username: string; avatar: string | null; organisationId: string | null }
  _count: { lessons: number; enrollments: number }
  isEnrolled: boolean
}

export function CourseCatalog() {
  const [courses, setCourses] = useState<CatalogCourse[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const setView = useUIStore((s) => s.setView)

  const fetchCourses = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    const res = await fetch(`/api/catalog/courses?${params}`)
    const data = await res.json()
    setCourses(data.courses || [])
    setCategories(data.categories || [])
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(fetchCourses, 300)
    return () => clearTimeout(timer)
  }, [search, category])

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId)
    try {
      const res = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Enrolled successfully! 🎉')
      setView('student-my-courses')
    } finally { setEnrollingId(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Browse Courses</h2>
        <p className="text-sm text-muted-foreground">Discover courses from top educators</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No courses found. Try a different search!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all flex flex-col">
              <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 relative">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-emerald-600/30" /></div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className="bg-white/90 text-foreground">{course.category || 'General'}</Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90">{course.level}</Badge>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold mb-1 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{course.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {course.teacher.name?.charAt(0).toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{course.teacher.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course._count.lessons} lessons</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course._count.enrollments}</span>
                  {course.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}m</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-600">{course.price === 0 ? 'Free' : `₹${course.price}`}</span>
                  {course.isEnrolled ? (
                    <Badge className="bg-emerald-600 gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Enrolled</Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleEnroll(course.id)} disabled={enrollingId === course.id} className="bg-emerald-600 hover:bg-emerald-700">
                      {enrollingId === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      {course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
