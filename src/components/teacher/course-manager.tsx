'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff, Clock, Users, Play, ChevronLeft, GripVertical, FileText, Video } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  level: string
  language: string
  duration: number
  isPublished: boolean
  thumbnail: string | null
  createdAt: string
  _count: { lessons: number; enrollments: number }
}

interface Lesson {
  id: string
  title: string
  content: string
  videoUrl: string | null
  duration: number
  order: number
  isPreview: boolean
}

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Course detail view
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', price: '0', category: '', level: 'Beginner', language: 'English', duration: '0', thumbnail: ''
  })

  const [lessonForm, setLessonForm] = useState({
    title: '', content: '', videoUrl: '', duration: '0', isPreview: false
  })

  const fetchCourses = async () => {
    setLoading(true)
    const res = await fetch('/api/teacher/courses')
    const data = await res.json()
    setCourses(data.courses || [])
    setLoading(false)
  }

  const fetchLessons = async (courseId: string) => {
    setLessonsLoading(true)
    const res = await fetch(`/api/teacher/courses/${courseId}`)
    const data = await res.json()
    setLessons(data.course?.lessons || [])
    setLessonsLoading(false)
  }

  useEffect(() => { fetchCourses() }, [])
  useEffect(() => {
    if (selectedCourseId) fetchLessons(selectedCourseId)
  }, [selectedCourseId])

  const openCreate = () => {
    setEditingCourse(null)
    setForm({ title: '', description: '', price: '0', category: '', level: 'Beginner', language: 'English', duration: '0', thumbnail: '' })
    setDialogOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditingCourse(course)
    setForm({
      title: course.title,
      description: course.description,
      price: String(course.price),
      category: course.category || '',
      level: course.level,
      language: course.language,
      duration: String(course.duration),
      thumbnail: course.thumbnail || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingCourse ? `/api/teacher/courses/${editingCourse.id}` : '/api/teacher/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed'); return }
      toast.success(editingCourse ? 'Course updated' : 'Course created')
      setDialogOpen(false)
      fetchCourses()
    } finally { setSubmitting(false) }
  }

  const togglePublish = async (course: Course) => {
    const res = await fetch(`/api/teacher/courses/${course.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    })
    if (res.ok) {
      toast.success(course.isPublished ? 'Course unpublished' : 'Course published')
      fetchCourses()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/teacher/courses/${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Course deleted'); fetchCourses() }
    setDeleteId(null)
  }

  // Lesson management
  const openCreateLesson = () => {
    setEditingLesson(null)
    setLessonForm({ title: '', content: '', videoUrl: '', duration: '0', isPreview: false })
    setLessonDialogOpen(true)
  }

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl || '',
      duration: String(lesson.duration),
      isPreview: lesson.isPreview,
    })
    setLessonDialogOpen(true)
  }

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId) return
    setSubmitting(true)
    try {
      if (editingLesson) {
        const res = await fetch('/api/teacher/lessons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: editingLesson.id, ...lessonForm }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error); return }
        toast.success('Lesson updated')
      } else {
        const res = await fetch('/api/teacher/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: selectedCourseId, ...lessonForm }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error); return }
        toast.success('Lesson added')
      }
      setLessonDialogOpen(false)
      fetchLessons(selectedCourseId)
    } finally { setSubmitting(false) }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!selectedCourseId) return
    const res = await fetch(`/api/teacher/lessons?lessonId=${lessonId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Lesson deleted'); fetchLessons(selectedCourseId) }
  }

  // Lesson detail view
  if (selectedCourseId) {
    const course = courses.find((c) => c.id === selectedCourseId)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCourseId(null)} className="mb-2 -ml-2">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Courses
            </Button>
            <h2 className="text-2xl font-bold">{course?.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage lessons for this course</p>
          </div>
          <Button onClick={openCreateLesson} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
        </div>

        {lessonsLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : lessons.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No lessons yet. Add your first lesson!</p>
              <Button onClick={openCreateLesson} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add First Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, idx) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{lesson.title}</h3>
                        {lesson.isPreview && <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">Free Preview</Badge>}
                        {lesson.videoUrl && <Badge variant="outline" className="gap-1"><Video className="w-3 h-3" /> Video</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {lesson.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration} min</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLesson(lesson.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lesson Dialog */}
        <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
              <DialogDescription>{editingLesson ? 'Update lesson content' : 'Create a new lesson for this course'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLessonSubmit}>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Lesson Title *</Label>
                  <Input required placeholder="Introduction to the topic" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea required placeholder="Lesson content / description..." value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} rows={5} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video URL (optional)</Label>
                    <Input placeholder="https://..." value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min="0" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <input type="checkbox" id="isPreview" checked={lessonForm.isPreview} onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })} className="w-4 h-4 rounded" />
                  <Label htmlFor="isPreview" className="cursor-pointer">
                    <span className="font-medium">Free Preview Lesson</span>
                    <span className="block text-xs text-muted-foreground">Students can preview this lesson without enrolling</span>
                  </Label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Add Lesson'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Course list view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Courses</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your course catalog</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Create Course
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No courses yet. Create your first course!</p>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Create First Course
            </Button>
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
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-emerald-600/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {course.isPublished ? (
                    <Badge className="bg-emerald-600">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{course.category || 'General'}</Badge>
                  <Badge variant="outline" className="text-xs">{course.level}</Badge>
                </div>
                <h3 className="font-semibold mb-1 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {course._count.lessons} lessons</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course._count.enrollments} enrolled</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-emerald-600">₹{course.price}</span>
                  {course.duration > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration} min</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedCourseId(course.id)}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Lessons
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(course)}>
                    {course.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteId(course.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <DialogDescription>{editingCourse ? 'Update course details' : 'Create a new course to sell to students'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Course Title *</Label>
                <Input required placeholder="Complete Physics for JEE" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea required placeholder="What will students learn in this course?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" min="0" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="Physics" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="All Levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Bilingual">Bilingual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL (optional)</Label>
                <Input placeholder="https://..." value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the course and all its lessons. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
