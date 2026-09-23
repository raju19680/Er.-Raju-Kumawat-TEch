'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  Plus, Search, MoreVertical, Edit, Trash2, KeyRound, CheckCircle2, XCircle, Pause, Play, Copy, User, Mail, Phone, Building2 
} from 'lucide-react'

interface Teacher {
  id: string
  email: string
  username: string
  name: string | null
  phone: string | null
  bio: string | null
  organisationId: string | null
  websiteSlug: string | null
  teacherStatus: string
  avatar: string | null
  createdAt: string
  _count: {
    coursesTaught: number
    testSeriesCreated: number
    notesCreated: number
    students: number
  }
}

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '', phone: '', bio: '', websiteSlug: ''
  })

  const fetchTeachers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/teachers')
    const data = await res.json()
    setTeachers(data.teachers || [])
    setLoading(false)
  }

  useEffect(() => { fetchTeachers() }, [])

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase()
    return !q || t.name?.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || 
           t.username.toLowerCase().includes(q) || t.organisationId?.toLowerCase().includes(q)
  })

  const openCreate = () => {
    setEditingTeacher(null)
    setForm({ name: '', email: '', username: '', password: '', phone: '', bio: '', websiteSlug: '' })
    setDialogOpen(true)
  }

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setForm({
      name: teacher.name || '',
      email: teacher.email,
      username: teacher.username,
      password: '',
      phone: teacher.phone || '',
      bio: teacher.bio || '',
      websiteSlug: teacher.websiteSlug || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { ...form }
      if (!form.password) delete payload.password
      if (!form.bio) delete payload.bio
      if (!form.phone) delete payload.phone
      if (!form.websiteSlug) delete payload.websiteSlug

      const url = editingTeacher 
        ? `/api/admin/teachers/${editingTeacher.id}`
        : '/api/admin/teachers'
      const method = editingTeacher ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save teacher')
        return
      }
      toast.success(editingTeacher ? 'Teacher updated' : 'Teacher created successfully')
      setDialogOpen(false)
      fetchTeachers()
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherStatus: status }),
    })
    if (res.ok) {
      toast.success(`Teacher ${status.toLowerCase()}`)
      fetchTeachers()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/admin/teachers/${deleteId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Teacher deleted')
      fetchTeachers()
    }
    setDeleteId(null)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    APPROVED: { label: 'Approved', variant: 'default', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    PENDING: { label: 'Pending', variant: 'secondary', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    SUSPENDED: { label: 'Suspended', variant: 'destructive' },
    NONE: { label: 'None', variant: 'outline' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Teacher Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add teachers, set their login credentials, and manage their accounts
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, username, or org ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No teachers found</p>
              <Button onClick={openCreate} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Add First Teacher
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="hidden md:table-cell">Organisation ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((teacher) => {
                    const status = statusConfig[teacher.teacherStatus] || statusConfig.NONE
                    return (
                      <TableRow key={teacher.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-semibold">
                                {teacher.name?.charAt(0).toUpperCase() || 'T'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{teacher.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                              <p className="text-xs text-muted-foreground truncate">@{teacher.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {teacher.organisationId ? (
                            <button
                              onClick={() => copyToClipboard(teacher.organisationId!, 'Organisation ID')}
                              className="font-mono text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              {teacher.organisationId}
                              <Copy className="w-3 h-3" />
                            </button>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex gap-2 text-xs">
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">{teacher._count.coursesTaught} courses</Badge>
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30">{teacher._count.testSeriesCreated} tests</Badge>
                            <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30">{teacher._count.notesCreated} notes</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEdit(teacher)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit Details
                              </DropdownMenuItem>
                              {teacher.teacherStatus !== 'APPROVED' && (
                                <DropdownMenuItem onClick={() => updateStatus(teacher.id, 'APPROVED')} className="text-emerald-600">
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                </DropdownMenuItem>
                              )}
                              {teacher.teacherStatus !== 'SUSPENDED' && (
                                <DropdownMenuItem onClick={() => updateStatus(teacher.id, 'SUSPENDED')} className="text-amber-600">
                                  <Pause className="w-4 h-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              )}
                              {teacher.teacherStatus === 'SUSPENDED' && (
                                <DropdownMenuItem onClick={() => updateStatus(teacher.id, 'APPROVED')} className="text-emerald-600">
                                  <Play className="w-4 h-4 mr-2" /> Reactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(teacher.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
            <DialogDescription>
              {editingTeacher 
                ? 'Update teacher details and login credentials'
                : 'Create a teacher account with login credentials and a unique organisation ID'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      required
                      placeholder="John Smith"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      required
                      type="email"
                      placeholder="teacher@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">@</span>
                    <Input
                      required
                      placeholder="johnsmith"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Password {editingTeacher ? '(leave blank to keep current)' : '*'}
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={editingTeacher ? '••••••••' : 'Min 6 characters'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-9"
                    required={!editingTeacher}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website Slug</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="johnsmith (for /teacher/johnsmith)"
                    value={form.websiteSlug}
                    onChange={(e) => setForm({ ...form, websiteSlug: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This creates the teacher's unique public website URL
                </p>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Brief description of the teacher's expertise..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                />
              </div>

              {!editingTeacher && (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                    What happens next?
                  </p>
                  <ul className="text-xs text-emerald-600 dark:text-emerald-500 space-y-1 ml-4 list-disc">
                    <li>A unique Organisation ID will be auto-generated</li>
                    <li>The teacher will be approved immediately</li>
                    <li>They can log in and access their CMS portal</li>
                    <li>They'll get their own website and content management system</li>
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Create Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher account and all associated content (courses, tests, notes). 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
