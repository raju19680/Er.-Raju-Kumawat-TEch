'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft,
  Save,
  Send,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Code,
  Quote,
  Type,
  AlignLeft,
  Eye,
  Upload,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

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

interface BlogEditorProps {
  blog: Blog | null
  onSave: () => void
  onCancel: () => void
}

// Markdown toolbar button helper
function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={onClick}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  )
}

export default function BlogEditor({ blog: initialBlog, onSave, onCancel }: BlogEditorProps) {
  const { orgCode } = useAppStore()
  const [title, setTitle] = useState(initialBlog?.title || '')
  const [content, setContent] = useState(initialBlog?.content || '')
  const [excerpt, setExcerpt] = useState(initialBlog?.excerpt || '')
  const [thumbnail, setThumbnail] = useState(initialBlog?.thumbnail || '')
  const [tags, setTags] = useState(initialBlog?.tags || '')
  const [status, setStatus] = useState(initialBlog?.status || 'draft')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentBlogId, setCurrentBlogId] = useState<string | null>(initialBlog?.id || null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!initialBlog

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  // Detect changes
  useEffect(() => {
    if (!initialBlog) {
      setHasChanges(!!(title || content || excerpt || thumbnail || tags))
      return
    }
    const changed =
      title !== initialBlog.title ||
      content !== (initialBlog.content || '') ||
      excerpt !== (initialBlog.excerpt || '') ||
      thumbnail !== (initialBlog.thumbnail || '') ||
      tags !== (initialBlog.tags || '')
    setHasChanges(changed)
  }, [title, content, excerpt, thumbnail, tags, initialBlog])

  // Auto-save to local storage every 30 seconds (for recovery)
  const autoSave = useCallback(async () => {
    if (!hasChanges || !title.trim()) return

    try {
      const payload = {
        title: title.trim(),
        content,
        excerpt,
        thumbnail: thumbnail || null,
        tags: tags || null,
        status,
        organizationId: orgCode,
      }

      if (currentBlogId) {
        await apiFetch(`/api/blogs/${currentBlogId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        // For new blogs, create first
        const res = await apiFetch('/api/blogs', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.success && data.blog) {
          setCurrentBlogId(data.blog.id)
        }
      }
      setLastSaved(new Date())
      setHasChanges(false)

      // Also save to localStorage for recovery
      localStorage.setItem('blog-autosave', JSON.stringify({
        title, content, excerpt, thumbnail, tags, status, blogId: currentBlogId,
        savedAt: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Auto-save failed:', error)
      // Save to localStorage as fallback
      localStorage.setItem('blog-autosave', JSON.stringify({
        title, content, excerpt, thumbnail, tags, status, blogId: currentBlogId,
        savedAt: new Date().toISOString(),
      }))
    }
  }, [hasChanges, title, content, excerpt, thumbnail, tags, status, orgCode, currentBlogId])

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setInterval(autoSave, 30000)
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [autoSave])

  // Recover from localStorage on mount
  useEffect(() => {
    if (initialBlog) return // Don't recover if editing existing blog
    const saved = localStorage.getItem('blog-autosave')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // Only recover if saved within the last hour
        const savedAt = new Date(data.savedAt)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (savedAt > hourAgo && data.title) {
          setTitle(data.title || '')
          setContent(data.content || '')
          setExcerpt(data.excerpt || '')
          setThumbnail(data.thumbnail || '')
          setTags(data.tags || '')
          setStatus(data.status || 'draft')
          if (data.blogId) setCurrentBlogId(data.blogId)
          toast.info('Recovered unsaved draft from previous session')
        }
      } catch {
        // Invalid localStorage data, ignore
      }
    }
  }, [initialBlog])

  // Handle thumbnail image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const res = await apiFetch('/api/teacher/upload-image?type=image', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.url) {
        setThumbnail(data.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Insert markdown syntax
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText =
      content.substring(0, start) +
      prefix +
      (selectedText || 'text') +
      suffix +
      content.substring(end)

    setContent(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + (selectedText ? selectedText.length : 4)
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  const handleSave = async (publishStatus: string) => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    const isPublish = publishStatus === 'published'
    if (isPublish) {
      setPublishing(true)
    } else {
      setSaving(true)
    }

    try {
      const payload = {
        title: title.trim(),
        content,
        excerpt,
        thumbnail: thumbnail || null,
        tags: tags || null,
        status: publishStatus,
        organizationId: orgCode,
      }

      if (currentBlogId) {
        const res = await apiFetch(`/api/blogs/${currentBlogId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to save')
      } else {
        const res = await apiFetch('/api/blogs', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success && !data.id) throw new Error(data.error || 'Failed to create')
      }

      // Clear localStorage autosave on successful save
      localStorage.removeItem('blog-autosave')

      toast.success(isPublish ? 'Blog published!' : 'Blog saved as draft')
      setLastSaved(new Date())
      setHasChanges(false)
      onSave()
    } catch (error) {
      console.error('Failed to save blog:', error)
      toast.error('Failed to save blog')
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Blog' : 'Create Blog'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {hasChanges && (
                <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">
                  Unsaved changes
                </Badge>
              )}
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving || publishing || !title.trim()}
            className="gap-2"
          >
            {saving ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Save className="size-4" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={saving || publishing || !title.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {publishing ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Send className="size-4" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left: Title + Content Editor */}
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Input
              placeholder="Blog title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold h-14 border-0 shadow-none bg-white px-4 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
          </div>

          {/* Content Editor with Tabs */}
          <Card className="overflow-hidden">
            <Tabs defaultValue="editor" className="h-full">
              <div className="flex items-center justify-between border-b px-2">
                <TabsList className="bg-transparent h-10">
                  <TabsTrigger value="editor" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                    <Type className="size-3.5 mr-1.5" /> Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                    <Eye className="size-3.5 mr-1.5" /> Preview
                  </TabsTrigger>
                  <TabsTrigger value="split" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 hidden sm:flex">
                    <AlignLeft className="size-3.5 mr-1.5" /> Split
                  </TabsTrigger>
                </TabsList>
                <span className="text-xs text-muted-foreground">
                  {wordCount} words
                </span>
              </div>

              {/* Markdown Toolbar (only in editor/split modes) */}
              <TabsContent value="editor" className="m-0">
                <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-gray-50/50 flex-wrap">
                  <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => insertMarkdown('# ')} />
                  <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => insertMarkdown('## ')} />
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <ToolbarButton icon={Bold} label="Bold" onClick={() => insertMarkdown('**', '**')} />
                  <ToolbarButton icon={Italic} label="Italic" onClick={() => insertMarkdown('*', '*')} />
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <ToolbarButton icon={List} label="Bullet List" onClick={() => insertMarkdown('- ')} />
                  <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => insertMarkdown('1. ')} />
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <ToolbarButton icon={Link2} label="Link" onClick={() => insertMarkdown('[', '](url)')} />
                  <ToolbarButton icon={ImageIcon} label="Image" onClick={() => insertMarkdown('![alt](', 'url)')} />
                  <ToolbarButton icon={Code} label="Code" onClick={() => insertMarkdown('`', '`')} />
                  <ToolbarButton icon={Quote} label="Quote" onClick={() => insertMarkdown('> ')} />
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog content in Markdown...&#10;&#10;# Heading&#10;Your content here...&#10;&#10;**Bold text** and *italic text*&#10;&#10;- Bullet point&#10;- Another point&#10;&#10;```code block```"
                  className="w-full min-h-[500px] p-4 resize-y focus:outline-none font-mono text-sm bg-white"
                />
              </TabsContent>

              <TabsContent value="preview" className="m-0">
                <div className="prose prose-sm max-w-none p-6 min-h-[500px]">
                  {content.trim() ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <p>Start writing to see a preview</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="split" className="m-0">
                <div className="grid grid-cols-2 divide-x min-h-[500px]">
                  <div>
                    <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-gray-50/50 flex-wrap">
                      <ToolbarButton icon={Bold} label="Bold" onClick={() => insertMarkdown('**', '**')} />
                      <ToolbarButton icon={Italic} label="Italic" onClick={() => insertMarkdown('*', '*')} />
                      <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => insertMarkdown('# ')} />
                      <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => insertMarkdown('## ')} />
                      <ToolbarButton icon={List} label="Bullet List" onClick={() => insertMarkdown('- ')} />
                      <ToolbarButton icon={Code} label="Code" onClick={() => insertMarkdown('`', '`')} />
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write in Markdown..."
                      className="w-full min-h-[470px] p-4 resize-y focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <div className="prose prose-sm max-w-none p-6 overflow-y-auto">
                    {content.trim() ? (
                      <ReactMarkdown>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground">Preview</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right: Metadata Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-900">Status</h3>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }
                >
                  {status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm font-semibold">Excerpt</Label>
              <p className="text-xs text-muted-foreground">A short summary for blog cards and SEO</p>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a short summary..."
                className="w-full min-h-[80px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-amber-400"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                <span className={excerpt.length > 180 ? 'text-amber-600 font-medium' : ''}>
                  {excerpt.length}/200
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Thumbnail */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm font-semibold">Thumbnail URL</Label>
              <Input
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              {thumbnail && (
                <div className="mt-2 rounded-lg overflow-hidden border bg-gray-50">
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm font-semibold">Tags</Label>
              <p className="text-xs text-muted-foreground">Comma-separated tags</p>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="education, tips, exams"
                className="text-sm"
              />
              {tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Word Count Info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Words</span>
                  <span className="font-medium">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Characters</span>
                  <span className="font-medium">{content.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Read time</span>
                  <span className="font-medium">~{Math.max(1, Math.ceil(wordCount / 200))} min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markdown Help */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Markdown Help</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><code className="bg-gray-100 px-1 rounded">**bold**</code> → <strong>bold</strong></p>
                <p><code className="bg-gray-100 px-1 rounded">*italic*</code> → <em>italic</em></p>
                <p><code className="bg-gray-100 px-1 rounded"># Heading</code> → heading</p>
                <p><code className="bg-gray-100 px-1 rounded">- item</code> → bullet list</p>
                <p><code className="bg-gray-100 px-1 rounded">`code`</code> → <code className="bg-gray-100 px-1 rounded">code</code></p>
                <p><code className="bg-gray-100 px-1 rounded">[link](url)</code> → hyperlink</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
