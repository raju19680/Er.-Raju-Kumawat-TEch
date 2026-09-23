'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Image as ImageIcon,
  BookOpen,
  GraduationCap,
  Inbox,
  Loader2,
  Globe,
  GlobeLock,
  StickyNote,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

type ContentTab = 'blogs' | 'courses'

const contentTabs: { id: ContentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'blogs', label: 'Blogs', icon: StickyNote },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
]

// ── Types ────────────────────────────────────────────────────────────────
interface BlogItem {
  id: string
  title: string
  content: string
  excerpt: string | null
  tags: string | null
  thumbnail: string | null
  status: string
  createdAt: string
  [key: string]: unknown
}

interface CourseItem {
  id: string
  title: string
  description: string | null
  content: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  status: string
  createdAt: string
  [key: string]: unknown
}

// ── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'draft'
  if (s === 'published' || s === 'live' || s === 'active') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{status}</Badge>
  }
  if (s === 'archived') {
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200">{status}</Badge>
  }
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{status || 'Draft'}</Badge>
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CONTENT PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('blogs')

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {contentTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'blogs' && <BlogsTab />}
      {activeTab === 'courses' && <CoursesTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOGS TAB
// ═══════════════════════════════════════════════════════════════════════════
function BlogsTab() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<BlogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search: update debouncedSearch 400ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BlogItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<BlogItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    thumbnail: '',
    status: 'draft',
  })

  const itemsPerPage = 10

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        organizationId: orgCode,
        page: String(currentPageNum),
        limit: String(itemsPerPage),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await apiFetch(`/api/teacher/blogs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalItems(data.total || 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch])

  useEffect(() => { fetchItems() }, [fetchItems])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm({ title: '', content: '', excerpt: '', tags: '', thumbnail: '', status: 'draft' })
    setDialogOpen(true)
  }

  const openEditDialog = (item: BlogItem) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      content: item.content || '',
      excerpt: item.excerpt || '',
      tags: item.tags || '',
      thumbnail: item.thumbnail || '',
      status: item.status || 'draft',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        organizationId: orgCode,
        ...(editingItem ? { id: editingItem.id } : {}),
      }
      const res = await apiFetch('/api/teacher/blogs', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(editingItem ? 'Blog updated successfully' : 'Blog created successfully')
      setDialogOpen(false)
      setEditingItem(null)
      fetchItems()
    } catch {
      toast.error('Failed to save blog')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (item: BlogItem) => {
    try {
      const newStatus = item.status?.toLowerCase() === 'published' ? 'draft' : 'published'
      const res = await apiFetch('/api/teacher/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(newStatus === 'published' ? 'Blog published' : 'Blog unpublished')
      fetchItems()
    } catch {
      toast.error('Failed to update blog status')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/blogs?id=${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Blog deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete blog')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Blogs</h2>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Blog
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageNum(1) }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead className="w-16">Thumbnail</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-11 w-11 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <Inbox className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No blogs found. Create one to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    {item.thumbnail ? (
                      <div className="h-11 w-11 rounded-lg overflow-hidden bg-gray-100">
                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{item.title}</div>
                    {item.excerpt && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{item.excerpt}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.tags || '').split(',').filter(Boolean).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">{tag.trim()}</Badge>
                      ))}
                      {!item.tags && <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(item)}>
                          {item.status?.toLowerCase() === 'published' ? (
                            <><GlobeLock className="mr-2 h-4 w-4" /> Unpublish</>
                          ) : (
                            <><Globe className="mr-2 h-4 w-4" /> Publish</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true) }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showing entries */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {totalItems === 0 ? 0 : (currentPageNum - 1) * itemsPerPage + 1} to {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} entries
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))} className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink isActive={page === currentPageNum} onClick={() => setCurrentPageNum(page)} className="cursor-pointer">{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))} className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Blog Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Blog' : 'Add Blog'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the blog details below.' : 'Fill in the details to create a new blog.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="blog-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter blog title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blog-content">Content</Label>
              <Textarea
                id="blog-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your blog content..."
                rows={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Brief summary of the blog..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blog-tags">Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input
                id="blog-tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g., JEE, Physics, Tips"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blog-thumbnail">Thumbnail URL</Label>
              <Input
                id="blog-thumbnail"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="blog-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="blog-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : editingItem ? 'Update Blog' : 'Create Blog'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{itemToDelete?.title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COURSES TAB
// ═══════════════════════════════════════════════════════════════════════════
function CoursesTab() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<CourseItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CourseItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CourseItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    thumbnail: '',
    price: '',
    mrp: '',
    category: '',
    status: 'draft',
  })

  const itemsPerPage = 10

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        organizationId: orgCode,
        page: String(currentPageNum),
        limit: String(itemsPerPage),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await apiFetch(`/api/teacher/courses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalItems(data.total || 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch])

  useEffect(() => { fetchItems() }, [fetchItems])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm({ title: '', description: '', content: '', thumbnail: '', price: '', mrp: '', category: '', status: 'draft' })
    setDialogOpen(true)
  }

  const openEditDialog = (item: CourseItem) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      description: item.description || '',
      content: item.content || '',
      thumbnail: item.thumbnail || '',
      price: String(item.price ?? ''),
      mrp: String(item.mrp ?? ''),
      category: item.category || '',
      status: item.status || 'draft',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        price: Number(form.price) || 0,
        mrp: Number(form.mrp) || 0,
        organizationId: orgCode,
        ...(editingItem ? { id: editingItem.id } : {}),
      }
      const res = await apiFetch('/api/teacher/courses', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(editingItem ? 'Course updated successfully' : 'Course created successfully')
      setDialogOpen(false)
      setEditingItem(null)
      fetchItems()
    } catch {
      toast.error('Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (item: CourseItem) => {
    try {
      const newStatus = item.status?.toLowerCase() === 'published' ? 'draft' : 'published'
      const res = await apiFetch('/api/teacher/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(newStatus === 'published' ? 'Course published' : 'Course unpublished')
      fetchItems()
    } catch {
      toast.error('Failed to update course status')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/courses?id=${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Course deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete course')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Courses</h2>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageNum(1) }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead className="w-16">Thumbnail</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-11 w-11 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No courses found. Create one to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    {item.thumbnail ? (
                      <div className="h-11 w-11 rounded-lg overflow-hidden bg-gray-100">
                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{item.title}</div>
                    {item.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{item.description}</div>}
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm">₹{item.price ?? 0}</span>
                    {item.mrp > (item.price ?? 0) && (
                      <span className="ml-1.5 text-xs text-muted-foreground line-through">₹{item.mrp}</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(item)}>
                          {item.status?.toLowerCase() === 'published' ? (
                            <><GlobeLock className="mr-2 h-4 w-4" /> Unpublish</>
                          ) : (
                            <><Globe className="mr-2 h-4 w-4" /> Publish</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true) }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showing entries */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {totalItems === 0 ? 0 : (currentPageNum - 1) * itemsPerPage + 1} to {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} entries
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))} className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink isActive={page === currentPageNum} onClick={() => setCurrentPageNum(page)} className="cursor-pointer">{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))} className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Course' : 'Add Course'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the course details below.' : 'Fill in the details to create a new course.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="course-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter course title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the course..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-content">Content</Label>
              <Textarea
                id="course-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Course content details..."
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-thumbnail">Thumbnail URL</Label>
              <Input
                id="course-thumbnail"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="course-price">Selling Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  id="course-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="499"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-mrp">MRP (₹)</Label>
                <Input
                  id="course-mrp"
                  type="number"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  placeholder="999"
                />
              </div>
            </div>
            {form.price && form.mrp && Number(form.mrp) > Number(form.price) && (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)}% OFF
                </Badge>
                <span className="text-xs text-muted-foreground">Discount preview</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="course-category">Category</Label>
              <Input
                id="course-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g., JEE, NEET, UPSC"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="course-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : editingItem ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{itemToDelete?.title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
