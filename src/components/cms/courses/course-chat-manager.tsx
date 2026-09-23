/* eslint-disable */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetchJSON } from '@/lib/api-client'
import { MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function CourseChatManager({ initialCourseId }: { initialCourseId?: string }) {
  const [courses, setCourses] = useState<any[]>([])
  const [activeCourseId, setActiveCourseId] = useState(initialCourseId || '')
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCourses()
  }, [])

  useEffect(() => {
    if (activeCourseId) loadChat()
  }, [activeCourseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadCourses() {
    try {
      const res = await apiFetchJSON<{ success: boolean; data: any[] }>('/api/teacher/courses')
      if (res.success && res.data.length > 0) {
        setCourses(res.data)
        setActiveCourseId(prev => prev || res.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadChat() {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: any[] }>(`/api/teacher/chat?courseId=${activeCourseId}`)
      if (res.success) setMessages(res.data)
    } catch (err) {
      toast.error('Failed to load chat')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!text.trim() || !activeCourseId) return
    try {
      const res = await apiFetchJSON('/api/teacher/chat', {
        method: 'POST',
        body: JSON.stringify({ courseId: activeCourseId, content: text })
      })
      if (res.success) {
        setMessages([...messages, res.data])
        setText('')
      }
    } catch (err) {
      toast.error('Failed to send message')
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar for courses */}
      <Card className="w-1/4 h-full flex flex-col overflow-hidden">
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Course Forums
          </CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-y-auto">
          {courses.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveCourseId(c.id)}
              className={`p-4 border-b cursor-pointer transition-colors ${activeCourseId === c.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}`}
            >
              <h4 className="font-medium text-sm line-clamp-1">{c.title}</h4>
            </div>
          ))}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 h-full flex flex-col overflow-hidden">
        <CardHeader className="bg-white border-b py-4 shadow-sm z-10">
          <CardTitle className="text-lg">
            {courses.find(c => c.id === activeCourseId)?.title || 'Select a course'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm flex flex-col items-center">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              Be the first to start a discussion!
            </div>
          ) : (
            messages.map(msg => {
              const isTeacher = msg.authorRole === 'teacher'
              return (
                <div key={msg.id} className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                  <div className="text-xs text-muted-foreground mb-1 ml-1 mr-1">
                    {msg.authorName} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className={`px-4 py-2 rounded-2xl max-w-[75%] ${isTeacher ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border shadow-sm rounded-bl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="p-4 bg-white border-t">
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <Input 
              placeholder="Type your message..." 
              value={text} 
              onChange={e => setText(e.target.value)} 
              className="flex-1"
            />
            <Button type="submit" disabled={!text.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
