'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { useSEO } from '@/hooks/use-seo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface BlogData {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  thumbnail: string | null
  tags: string | null
  status: string
  createdAt: string
  organization: {
    name: string
    logo: string | null
  }
}

interface RelatedBlog {
  id: string
  title: string
  excerpt: string | null
  thumbnail: string | null
  tags: string | null
  createdAt: string
}

interface BlogDetailProps {
  blogId: string
  orgId?: string
  onBack: () => void
  onNavigateToBlog?: (blogId: string) => void
}

export default function BlogDetail({ blogId, orgId, onBack, onNavigateToBlog }: BlogDetailProps) {
  const [blog, setBlog] = useState<BlogData | null>(null)
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBlog() {
      setLoading(true)
      try {
        const res = await apiFetch(`/api/blogs/${blogId}`)
        const data = await res.json()
        if (data.success && data.blog) {
          setBlog(data.blog)

          // Fetch related blogs by tags
          if (data.blog.tags && data.blog.organizationId) {
            const firstTag = data.blog.tags.split(',')[0].trim()
            const relatedRes = await apiFetch(
              `/api/blogs?limit=4&status=published&tag=${encodeURIComponent(firstTag)}&organizationId=${data.blog.organizationId}`
            )
            const relatedData = await relatedRes.json()
            if (relatedData.items) {
              setRelatedBlogs(
                relatedData.items
                  .filter((b: RelatedBlog) => b.id !== blogId)
                  .slice(0, 3)
              )
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch blog:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
  }, [blogId])

  useSEO({
    title: blog?.title,
    description: blog?.excerpt || undefined,
    image: blog?.thumbnail || undefined,
  })

  const handleShare = async (platform: string) => {
    const url = window.location.href
    const title = blog?.title || 'Blog Post'

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank')
        break
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="text-center py-20">
        <BookOpen className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Blog not found</h2>
        <p className="text-muted-foreground mt-1">This blog may have been removed or is unavailable.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const wordCount = blog.content?.trim() ? blog.content.trim().split(/\s+/).length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2 text-muted-foreground hover:text-gray-900">
        <ArrowLeft className="size-4" />
        Back to Blogs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Main Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Thumbnail */}
          {blog.thumbnail && (
            <div className="rounded-xl overflow-hidden mb-6 bg-gray-100">
              <img
                src={blog.thumbnail}
                alt={blog.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {readTime} min read
              </span>
              {blog.organization?.name && (
                <>
                  <span>•</span>
                  <span>{blog.organization.name}</span>
                </>
              )}
            </div>

            {/* Tags */}
            {blog.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {blog.tags.split(',').map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-700">
                    <Tag className="size-3 mr-1" />
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          <Separator className="mb-8" />

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-amber-600 prose-strong:text-gray-900">
            {blog.content ? (
              <ReactMarkdown>{blog.content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">No content available.</p>
            )}
          </div>

          <Separator className="my-8" />

          {/* Share Section */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Share this article:</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => handleShare('twitter')}
                title="Share on Twitter"
              >
                <Twitter className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => handleShare('facebook')}
                title="Share on Facebook"
              >
                <Facebook className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => handleShare('linkedin')}
                title="Share on LinkedIn"
              >
                <Linkedin className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                onClick={() => handleShare('copy')}
                title="Copy link"
              >
                <Link2 className="size-4" />
              </Button>
            </div>
          </div>
        </motion.article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Related Blogs */}
          {relatedBlogs.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Related Articles</h3>
                <div className="space-y-3">
                  {relatedBlogs.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => onNavigateToBlog?.(related.id)}
                      className="w-full text-left group"
                    >
                      <div className="flex gap-3">
                        {related.thumbnail ? (
                          <img
                            src={related.thumbnail}
                            alt={related.title}
                            className="w-16 h-12 rounded-md object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="size-4 text-amber-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                            {related.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(related.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags Cloud */}
          {blog.tags && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
