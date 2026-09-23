'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Search, Users, UserPlus, Trash2, BookOpen, ClipboardList, Mail, Phone, User } from 'lucide-react'

interface Student {
  id: string
  name: string | null
  email: string
  username: string
  phone: string | null
  avatar: string | null
  createdAt: string
  _count: {
    enrollments: number
    testAttempts: number
  }
}

interface EnrolledStudent {
  id: string
  user: {
    id: string
    name: string | null
    email: string
    username: string
    phone: string | null
    avatar: string | null
    createdAt: string
  }
  course: { id: string; title: string }
  enrolledAt: string
}

export function StudentManager() {
  const [directStudents, setDirectStudents] = useState<Student[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', phone: '' })

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/teacher/students')
    const data = await res.json()
    setDirectStudents(data.directStudents || [])
    setEnrolledStudents(data.enrolledStudents || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Student added')
      setDialogOpen(false)
      setForm({ name: '', email: '', username: '', password: '', phone: '' })
      fetchData()
    } finally { setSubmitting(false) }
  }

  const removeStudent = async (id: string) => {
    const res = await fetch(`/api/teacher/students/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Student removed'); fetchData() }
  }

  const filteredDirect = directStudents.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)
  })

  const filteredEnrolled = enrolledStudents.filter((e) => {
    const q = search.toLowerCase()
    return !q || e.user.name?.toLowerCase().includes(q) || e.user.email.toLowerCase().includes(q) || e.course.title.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your direct students and track course enrollments</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="direct">
        <TabsList>
          <TabsTrigger value="direct">My Students ({directStudents.length})</TabsTrigger>
          <TabsTrigger value="enrolled">Course Enrollments ({enrolledStudents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : filteredDirect.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">No students yet. Add your first student!</p>
                  <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Student
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                        <TableHead className="hidden sm:table-cell">Activity</TableHead>
                        <TableHead className="hidden lg:table-cell">Joined</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDirect.map((student) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 text-sm font-semibold">
                                  {student.name?.charAt(0).toUpperCase() || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{student.name}</p>
                                <p className="text-xs text-muted-foreground truncate">@{student.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-xs space-y-0.5">
                              <p className="flex items-center gap-1 text-muted-foreground"><Mail className="w-3 h-3" /> {student.email}</p>
                              {student.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" /> {student.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="gap-1"><BookOpen className="w-3 h-3" /> {student._count.enrollments}</Badge>
                              <Badge variant="outline" className="gap-1"><ClipboardList className="w-3 h-3" /> {student._count.testAttempts}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeStudent(student.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrolled">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : filteredEnrolled.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No course enrollments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead className="hidden md:table-cell">Enrolled On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnrolled.map((enrollment) => (
                        <TableRow key={enrollment.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 text-sm font-semibold">
                                  {enrollment.user.name?.charAt(0).toUpperCase() || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{enrollment.user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{enrollment.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <BookOpen className="w-3 h-3" /> {enrollment.course.title}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Create a student account directly assigned to you</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input required placeholder="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pl-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input required type="email" placeholder="student@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input required placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input required type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Adding...' : 'Add Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
