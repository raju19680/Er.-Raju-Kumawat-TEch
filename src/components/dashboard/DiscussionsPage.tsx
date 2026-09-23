'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, MessageSquare, Reply, Trash2, ShieldCheck, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function DiscussionsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/discussions')
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setPosts(json.posts)
        }
      }
    } catch (err) {
      toast.error('Failed to load discussions')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      const res = await fetch(`/api/teacher/discussions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Post deleted')
        loadPosts()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Error deleting post')
    }
  }

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return
    setSubmittingReply(true)
    
    try {
      const res = await fetch('/api/teacher/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          courseId: replyingTo.courseId,
          parentId: replyingTo.id,
          lessonId: replyingTo.lessonId
        })
      })
      if (res.ok) {
        toast.success('Reply posted successfully')
        setReplyContent('')
        setReplyingTo(null)
        loadPosts()
      } else {
        toast.error('Failed to post reply')
      }
    } catch {
      toast.error('Error posting reply')
    }
    setSubmittingReply(false)
  }

  const filteredPosts = posts.filter(p => 
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.course?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const topLevelPosts = filteredPosts.filter(p => !p.parentId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discussions & Q&A</h1>
          <p className="text-muted-foreground mt-1">Manage student queries across all your courses</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Queries</CardTitle>
              <CardDescription>Respond to your students</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search queries..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : topLevelPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <MessageSquare className="size-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No discussions found</p>
              <p className="text-sm">When students ask questions, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topLevelPosts.map((post) => {
                const replies = posts.filter(p => p.parentId === post.id)
                
                return (
                  <div key={post.id} className="p-6 transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="size-5 text-primary" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{post.authorName}</span>
                            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                              {post.course?.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap mt-2">{post.content}</p>
                          
                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-border/50">
                              {replies.map(reply => (
                                <div key={reply.id} className="flex gap-3">
                                  <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                                    reply.authorRole === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'bg-primary/10 text-primary'
                                  }`}>
                                    {reply.authorRole === 'teacher' ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">{reply.authorName}</span>
                                        {reply.authorRole === 'teacher' && (
                                          <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                            Teacher
                                          </span>
                                        )}
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="size-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(reply.id)}
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => setReplyingTo(post)}
                        >
                          <Reply className="size-4" /> Reply
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {replyingTo?.authorName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground mb-4 line-clamp-3">
              {replyingTo?.content}
            </div>
            <Textarea 
              placeholder="Write your response..." 
              className="min-h-[120px]"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
            <Button onClick={handleReplySubmit} disabled={submittingReply || !replyContent.trim()}>
              {submittingReply ? <Loader2 className="size-4 animate-spin mr-2" /> : <Reply className="size-4 mr-2" />}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DiscussionsPage
