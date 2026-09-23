'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  FileText,
  Link2,
  Image,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Globe,
  Clock,
  ExternalLink,
  Music,
  File,
  Video,
} from 'lucide-react'

// ─── Blog data ─────────────────────────────────────────────────────────────────
interface Blog {
  id: number
  title: string
  status: 'published' | 'draft'
  date: string
  views: string
  excerpt: string
}

const blogs: Blog[] = [
  { id: 1, title: 'How to Prepare for NEET 2026', status: 'published', date: 'Jun 5, 2026', views: '3.2K', excerpt: 'A comprehensive guide for NEET preparation covering physics, chemistry, and biology...' },
  { id: 2, title: 'JEE Advanced Tips & Tricks', status: 'published', date: 'Jun 3, 2026', views: '2.8K', excerpt: 'Expert strategies and tips to crack JEE Advanced with high scores...' },
  { id: 3, title: 'Best Study Material for Physics', status: 'draft', date: 'Jun 1, 2026', views: '--', excerpt: 'Curated list of the best books, notes, and resources for physics preparation...' },
  { id: 4, title: 'Time Management During Exams', status: 'published', date: 'May 28, 2026', views: '1.9K', excerpt: 'Learn effective time management techniques to maximize your exam performance...' },
  { id: 5, title: 'Chemistry Lab Practical Guide', status: 'draft', date: 'May 25, 2026', views: '--', excerpt: 'Step-by-step guide for chemistry lab practicals and viva preparation...' },
  { id: 6, title: 'Understanding Organic Chemistry', status: 'published', date: 'May 20, 2026', views: '4.1K', excerpt: 'Simplifying organic chemistry concepts with easy-to-remember mnemonics...' },
]

// ─── Quick links data ──────────────────────────────────────────────────────────
interface QuickLink {
  id: number
  title: string
  url: string
  icon: string
  clicks: number
  active: boolean
}

const quickLinks: QuickLink[] = [
  { id: 1, title: 'Free NEET Practice Tests', url: 'https://example.com/neet-tests', icon: 'clipboard', clicks: 1245, active: true },
  { id: 2, title: 'Telegram Study Group', url: 'https://t.me/studygroup', icon: 'message', clicks: 876, active: true },
  { id: 3, title: 'Download Syllabus PDF', url: 'https://example.com/syllabus', icon: 'file', clicks: 2341, active: true },
  { id: 4, title: 'YouTube Channel', url: 'https://youtube.com/@teacher', icon: 'video', clicks: 567, active: true },
  { id: 5, title: 'WhatsApp Support', url: 'https://wa.me/919876543210', icon: 'message', clicks: 321, active: false },
]

// ─── Media data ─────────────────────────────────────────────────────────────────
interface MediaItem {
  id: number
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: string
  date: string
}

const mediaItems: MediaItem[] = [
  { id: 1, name: 'course-thumbnail-physics.jpg', type: 'image', size: '2.4 MB', date: 'Jun 4, 2026' },
  { id: 2, name: 'intro-video-neet.mp4', type: 'video', size: '128 MB', date: 'Jun 2, 2026' },
  { id: 3, name: 'chemistry-notes.pdf', type: 'document', size: '5.6 MB', date: 'May 30, 2026' },
  { id: 4, name: 'lecture-audio-01.mp3', type: 'audio', size: '34 MB', date: 'May 28, 2026' },
  { id: 5, name: 'banner-neet-2026.png', type: 'image', size: '1.2 MB', date: 'May 25, 2026' },
  { id: 6, name: 'demo-class-recording.mp4', type: 'video', size: '256 MB', date: 'May 22, 2026' },
]

function getMediaIcon(type: string) {
  switch (type) {
    case 'image': return Image
    case 'video': return Video
    case 'audio': return Music
    case 'document': return File
    default: return File
  }
}

function getMediaColor(type: string) {
  switch (type) {
    case 'image': return 'bg-purple-100 text-purple-600'
    case 'video': return 'bg-red-100 text-red-600'
    case 'audio': return 'bg-amber-100 text-amber-600'
    case 'document': return 'bg-emerald-100 text-emerald-600'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ─── Content Page ───────────────────────────────────────────────────────────────
export function ContentPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('blogs')

  const filteredBlogs = blogs.filter(
    (b) => b.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content</h1>
          <p className="text-muted-foreground mt-1">Manage blogs, quick links, and digital content</p>
        </div>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus className="size-4" />
          Add Content
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="quick-links">Quick Links</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* ─── Blogs Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="blogs" className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Blog List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBlogs.map((blog) => (
              <Card key={blog.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText className="size-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{blog.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{blog.excerpt}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer"><Edit3 className="size-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer"><Eye className="size-4" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`text-xs border-0 ${
                          blog.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {blog.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      {blog.views} views
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Quick Links Tab ───────────────────────────────────────────────── */}
        <TabsContent value="quick-links" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search links..." className="pl-9" />
            </div>
            <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="size-4" />
              Add Link
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {quickLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Link2 className="size-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{link.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Globe className="size-3" />
                          <span className="truncate max-w-[200px] lg:max-w-none">{link.url}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-foreground">{link.clicks.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                      </div>
                      <Badge
                        className={`text-xs border-0 ${
                          link.active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {link.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="size-8">
                        <ExternalLink className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Media Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="media" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search media..." className="pl-9" />
            </div>
            <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="size-4" />
              Upload
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((item) => {
              const Icon = getMediaIcon(item.type)
              const color = getMediaColor(item.type)
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground">{item.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="size-7">
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7">
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ContentPage
