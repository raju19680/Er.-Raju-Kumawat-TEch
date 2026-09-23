'use client'

import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Search,
  Tag,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  Loader2,
} from 'lucide-react'
import { useAppStore, type StudentPage } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BlogDetail = lazy(() => import('./blog-detail'))

interface BlogData {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  thumbnail: string | null
  tags: string | null
  status: string
  createdAt: string
}

// StudentPage type extension for blog detail
type ExtendedStudentPage = StudentPage | 'blog-detail'

export default function BlogListing() {
  const { orgCode, setStudentPage } = useAppStore()
  const [blogs, setBlogs] = useState<BlogData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])
  const [viewingBlogId, setViewingBlogId] = useState<string | null>(null)

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: 'published',
        limit: '50',
      })
      if (search) params.set('search', search)
      if (selectedTag) params.set('tag', selectedTag)

      const res = await apiFetch(`/api/blogs?${params}`)
      const data = await res.json()
      if (data.items) {
        setBlogs(data.items)
        // Extract all unique tags
        const tags = new Set<string>()
        data.items.forEach((blog: BlogData) => {
          if (blog.tags) {
            blog.tags.split(',').forEach((tag) => {
              const trimmed = tag.trim()
              if (trimmed) tags.add(trimmed)
            })
          }
        })
        setAllTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [search, selectedTag])

  if (viewingBlogId) {
    return (
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-amber-600" /></div>}>
        <BlogDetail
          blogId={viewingBlogId}
          onBack={() => setViewingBlogId(null)}
          onNavigateToBlog={(id: string) => setViewingBlogId(id)}
        />
      </Suspense>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="size-6 text-amber-600" />
          Blog
        </h1>
        <p className="text-muted-foreground mt-1">
          Articles, tips, and insights from our educators
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Blog Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-amber-600" />
        </div>
      ) : blogs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No articles yet</h3>
            <p className="text-muted-foreground mt-1">
              Check back later for new articles and insights
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {blogs.map((blog, idx) => {
            const wordCount = blog.content?.trim()
              ? blog.content.trim().split(/\s+/).length
              : 0
            const readTime = Math.max(1, Math.ceil(wordCount / 200))

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 py-0"
                  onClick={() => setViewingBlogId(blog.id)}
                >
                  {/* Thumbnail */}
                  {blog.thumbnail ? (
                    <div className="relative h-40 bg-gray-100">
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                      <BookOpen className="size-10 text-amber-400" />
                    </div>
                  )}

                  <CardContent className="p-4 space-y-3">
                    {/* Tags */}
                    {blog.tags && (
                      <div className="flex flex-wrap gap-1">
                        {blog.tags.split(',').slice(0, 2).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs bg-amber-50 text-amber-700"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {readTime} min
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Clear filter */}
      {(search || selectedTag) && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setSelectedTag('')
            }}
            className="text-muted-foreground"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
