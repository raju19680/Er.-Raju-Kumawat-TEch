'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Calendar,
  Image as ImageIcon,
  MoreVertical,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import BlogEditor from './blog-editor'

interface Blog {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  thumbnail: string | null
  tags: string | null
  status: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export default function BlogsList() {
  const { orgCode } = useAppStore()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        organizationId: orgCode || '',
      })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await apiFetch(`/api/blogs?${params}`)
      const data = await res.json()
      if (data.items) {
        setBlogs(data.items)
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, orgCode])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await apiFetch(`/api/blogs/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      fetchBlogs()
    } catch (error) {
      console.error('Failed to delete blog:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleTogglePublish = async (blog: Blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published'
    try {
      await apiFetch(`/api/blogs/${blog.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      fetchBlogs()
    } catch (error) {
      console.error('Failed to toggle publish:', error)
    }
  }

  const handleEditorSave = () => {
    setEditingBlog(null)
    setCreating(false)
    fetchBlogs()
  }

  // Blog Editor
  if (creating || editingBlog) {
    return (
      <BlogEditor
        blog={editingBlog}
        onSave={handleEditorSave}
        onCancel={() => {
          setEditingBlog(null)
          setCreating(false)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="size-5 sm:size-6 text-amber-600" />
            Blogs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your blog posts and articles
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Create Blog
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search blogs by title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>{total} blog{total !== 1 ? 's' : ''} total</span>
        <span>•</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="size-6 animate-spin text-amber-600 mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading blogs...</p>
                  </TableCell>
                </TableRow>
              ) : blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileText className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">No blogs yet</p>
                    <p className="text-sm text-muted-foreground">Create your first blog post to get started</p>
                    <Button
                      onClick={() => setCreating(true)}
                      className="mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    >
                      <Plus className="size-4" />
                      Create Blog
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog, idx) => (
                  <TableRow key={blog.id} className="group">
                    <TableCell>
                      {blog.thumbnail ? (
                        <img
                          src={blog.thumbnail}
                          alt={blog.title}
                          className="w-11 h-11 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-md bg-amber-50 flex items-center justify-center">
                          <ImageIcon className="size-4 text-amber-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                        {blog.excerpt && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{blog.excerpt}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={blog.status === 'published' ? 'default' : 'secondary'}
                        className={
                          blog.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        }
                      >
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {blog.tags ? blog.tags.split(',').map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground">No tags</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingBlog(blog)}>
                            <Edit3 className="size-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(blog)}>
                            {blog.status === 'published' ? (
                              <>
                                <EyeOff className="size-4 mr-2" /> Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="size-4 mr-2" /> Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(blog.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="size-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-amber-600" />
          </div>
        ) : blogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">No blogs yet</p>
              <Button
                onClick={() => setCreating(true)}
                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                <Plus className="size-4" />
                Create Blog
              </Button>
            </CardContent>
          </Card>
        ) : (
          blogs.map((blog) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {blog.thumbnail ? (
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="size-6 text-amber-400" />
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={blog.status === 'published' ? 'default' : 'secondary'}
                          className={
                            blog.status === 'published'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          }
                        >
                          {blog.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      {blog.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {blog.tags.split(',').slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Tag className="size-2.5 mr-0.5" />{tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingBlog(blog)}>
                          <Edit3 className="size-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(blog)}>
                          {blog.status === 'published' ? (
                            <><EyeOff className="size-4 mr-2" /> Unpublish</>
                          ) : (
                            <><Eye className="size-4 mr-2" /> Publish</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(blog.id)} className="text-red-600 focus:text-red-600">
                          <Trash2 className="size-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
