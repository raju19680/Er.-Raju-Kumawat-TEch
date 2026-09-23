'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Send, MessageSquare, Plus, Reply } from 'lucide-react'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function CourseCommunity({ courseId }: { courseId: string }) {
  const [activeTab, setActiveTab] = useState('forum')
  
  // States
  const [posts, setPosts] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newChatMessage, setNewChatMessage] = useState('')

  const loadForum = useCallback(async () => {
    setLoading(true)
    const res = await apiFetchJSON<any>(`/api/student/courses/${courseId}/forum`)
    if (res && res.success && res.posts) {
      setPosts(res.posts)
    } else {
      setPosts([])
    }
    setLoading(false)
  }, [courseId])

  const loadChat = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetchJSON<any>(`/api/student/courses/${courseId}/chat`)
      if (res && res.success && res.messages) {
        setChatMessages(res.messages)
      } else {
        setChatMessages([])
      }
    } catch {
      setChatMessages([])
    }
    setLoading(false)
  }, [courseId])

  useEffect(() => {
    if (activeTab === 'forum') loadForum()
    if (activeTab === 'chat') loadChat()
  }, [activeTab, loadForum, loadChat])

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return toast.error('Message is required')
    
    const res = await apiFetch(`/api/student/courses/${courseId}/forum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newPostContent
      })
    })
    
    if (res.ok) {
      toast.success('Posted successfully')
      setNewPostContent('')
      loadForum()
    } else {
      toast.error('Failed to post')
    }
  }

  const handleSendMessage = async () => {
    if (!newChatMessage.trim()) return
    const res = await apiFetch(`/api/student/courses/${courseId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newChatMessage
      })
    })
    if (res.ok) {
      setNewChatMessage('')
      loadChat()
    } else {
      toast.error('Failed to send message')
    }
  }

  return (
    <Card className="border-0 shadow-sm py-0 h-[600px] flex flex-col">
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Course Community</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="forum">Forum (Q&A)</TabsTrigger>
            <TabsTrigger value="chat">Live Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="forum" className="flex-1 flex flex-col mt-4 min-h-0">
            {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-amber-600" /></div> : (
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {posts.map(post => (
                  <ForumPostItem key={post.id} post={post} courseId={courseId} onReplySuccess={loadForum} />
                ))}
                {posts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageSquare className="size-10 mb-2 opacity-20" />
                    <p>No questions yet. Be the first to ask!</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-auto border-t pt-4 space-y-2 bg-white">
              <textarea 
                placeholder="Ask a question or start a discussion..." 
                className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" rows={3}
                value={newPostContent} onChange={e => setNewPostContent(e.target.value)}
              />
              <Button onClick={handleCreatePost} className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Send className="size-4" /> Post Question
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-4 min-h-0">
            {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-amber-600" /></div> : (
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 flex flex-col-reverse">
                {[...chatMessages].reverse().map(msg => {
                  const userEmail = useAppStore.getState().userEmail
                  const isMe = msg.authorName === useAppStore.getState().userName || msg.authorName === 'You' // Rough check
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-gray-400 mb-0.5 mx-1">
                        {msg.authorName || 'Unknown'}
                      </span>
                      <div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${isMe ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 h-full">
                    <p>No messages yet. Say hi!</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-auto border-t pt-4 flex gap-2">
              <input 
                placeholder="Type a message..." 
                className="flex-1 p-2 border rounded-md"
                value={newChatMessage} onChange={e => setNewChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} size="icon" className="bg-amber-600 hover:bg-amber-700">
                <Send className="size-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export function LessonDiscussions({ courseId, lessonId }: { courseId: string, lessonId: string }) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')

  const loadForum = useCallback(async () => {
    setLoading(true)
    const res = await apiFetchJSON<any>(`/api/student/courses/${courseId}/forum?lessonId=${lessonId}`)
    if (res && res.success && res.posts) {
      setPosts(res.posts)
    } else {
      setPosts([])
    }
    setLoading(false)
  }, [courseId, lessonId])

  useEffect(() => {
    loadForum()
  }, [loadForum])

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return toast.error('Message is required')
    
    const res = await apiFetch(`/api/student/courses/${courseId}/forum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newPostContent,
        lessonId
      })
    })
    
    if (res.ok) {
      toast.success('Posted successfully')
      setNewPostContent('')
      loadForum()
    } else {
      toast.error('Failed to post')
    }
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Lesson Discussions</h3>
      
      {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-amber-600" /></div> : (
        <div className="space-y-4 mb-4">
          {posts.map(post => (
            <ForumPostItem key={post.id} post={post} courseId={courseId} onReplySuccess={loadForum} />
          ))}
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <MessageSquare className="size-8 mb-2 opacity-20" />
              <p className="text-sm">No discussions for this lesson yet. Be the first to ask!</p>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        <textarea 
          placeholder="Ask a question about this lesson..." 
          className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" rows={3}
          value={newPostContent} onChange={e => setNewPostContent(e.target.value)}
        />
        <Button onClick={handleCreatePost} className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          <Send className="size-4" /> Post Question
        </Button>
      </div>
    </div>
  )
}

function ForumPostItem({ post, courseId, onReplySuccess }: { post: any, courseId: string, onReplySuccess: () => void }) {
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReply = async () => {
    if (!replyContent.trim()) return toast.error('Reply is required')
    setLoading(true)
    const res = await apiFetch(`/api/student/courses/${courseId}/forum/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent })
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Replied successfully')
      setReplyContent('')
      setShowReply(false)
      onReplySuccess()
    } else {
      toast.error('Failed to post reply')
    }
  }

  return (
    <div className="p-4 border border-gray-100 rounded-lg bg-gray-50/50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${post.authorRole === 'teacher' ? 'bg-indigo-500' : 'bg-amber-500'}`}>
            {post.authorName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">{post.authorName}</span>
            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded ml-2 text-gray-600 uppercase tracking-wider">
              {post.authorRole}
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-gray-700 text-sm whitespace-pre-wrap">{post.content}</p>
      
      <div className="mt-3 flex items-center gap-4">
        <button onClick={() => setShowReply(!showReply)} className="text-xs text-gray-500 hover:text-amber-600 flex items-center gap-1 font-medium">
          <Reply className="size-3" /> {post.comments?.length || 0} Replies
        </button>
      </div>

      {post.comments && post.comments.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
          {post.comments.map((comment: any) => (
            <div key={comment.id} className="bg-white p-3 rounded border border-gray-50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">{comment.authorName}</span>
                  <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded text-gray-500 uppercase tracking-wider">
                    {comment.authorRole}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-600">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className="mt-3 flex gap-2 pl-4 border-l-2 border-transparent">
          <input 
            placeholder="Write a reply..." 
            className="flex-1 p-2 text-xs border rounded bg-white focus:outline-amber-500"
            value={replyContent} onChange={e => setReplyContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()}
            disabled={loading}
          />
          <Button onClick={handleReply} size="sm" disabled={loading} className="bg-amber-600 hover:bg-amber-700 h-8">
            <Send className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
