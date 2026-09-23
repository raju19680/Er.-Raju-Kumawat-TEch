'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetchJSON } from '@/lib/api-client'
import { Plus, Video, Calendar, Users, Play, StopCircle } from 'lucide-react'
import { toast } from 'sonner'

interface LiveClass {
  id: string
  title: string
  description: string | null
  courseId: string
  course: { title: string }
  scheduledAt: string
  jitsiRoomId: string
  status: string
}

export default function LiveClassManager() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  
  const [activeClass, setActiveClass] = useState<LiveClass | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClasses()
  }, [])

  async function loadClasses() {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: LiveClass[] }>('/api/teacher/live-classes')
      if (res.success) setClasses(res.data)
    } catch (err) {
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!title || !courseId || !scheduledAt) return toast.error('Required fields missing')
    try {
      const roomStr = title.replace(/[^a-zA-Z0-9]/g, '') + Math.random().toString(36).substring(7)
      const res = await apiFetchJSON('/api/teacher/live-classes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: '',
          courseId,
          scheduledAt,
          jitsiRoomId: roomStr
        })
      })
      if (res.success) {
        toast.success('Live class scheduled')
        setCreateOpen(false)
        setTitle(''); setCourseId(''); setScheduledAt('')
        loadClasses()
      }
    } catch (err) {
      toast.error('Failed to schedule class')
    }
  }

  const handleStatusChange = async (cls: LiveClass, status: 'live' | 'ended') => {
    try {
      const res = await apiFetchJSON('/api/teacher/live-classes/status', {
        method: 'POST',
        body: JSON.stringify({ classId: cls.id, classStatus: status })
      })
      if (res.success) {
        toast.success(`Class is now ${status}`)
        if (status === 'live') setActiveClass(cls)
        else setActiveClass(null)
        loadClasses()
      }
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  if (activeClass) {
    return (
      <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
        <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-lg shadow">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              {activeClass.title} (Live)
            </h2>
            <p className="text-sm text-slate-400">Course: {activeClass.course.title}</p>
          </div>
          <Button variant="destructive" onClick={() => handleStatusChange(activeClass, 'ended')} className="gap-2">
            <StopCircle className="w-4 h-4" /> End Class
          </Button>
        </div>
        <div className="flex-1 bg-black rounded-lg overflow-hidden border-2 border-slate-800">
          <iframe 
            src={`https://meet.jit.si/${activeClass.jitsiRoomId}#config.prejoinPageEnabled=false&userInfo.displayName="Teacher"`} 
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Virtual Classrooms</h1>
          <p className="text-sm text-muted-foreground">Schedule and host real-time video sessions.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Calendar className="w-4 h-4" /> Schedule Class
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-lg">No classes scheduled</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <Card key={cls.id} className="border-indigo-100 hover:border-indigo-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={cls.status === 'live' ? 'destructive' : cls.status === 'scheduled' ? 'default' : 'secondary'}>
                    {cls.status.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2 line-clamp-1">{cls.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground font-medium mb-3">{cls.course.title}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  {new Date(cls.scheduledAt).toLocaleString()}
                </div>
                
                {cls.status === 'scheduled' && (
                  <Button onClick={() => handleStatusChange(cls, 'live')} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Play className="w-4 h-4" /> Start Class Now
                  </Button>
                )}
                {cls.status === 'live' && (
                  <Button onClick={() => setActiveClass(cls)} variant="destructive" className="w-full gap-2 animate-pulse">
                    <Video className="w-4 h-4" /> Re-enter Classroom
                  </Button>
                )}
                {cls.status === 'ended' && (
                  <Button variant="outline" className="w-full" disabled>Class Ended</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Live Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Title</label>
              <Input placeholder="e.g. Q&A Session" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Course ID</label>
              <Input placeholder="Course UUID" value={courseId} onChange={e => setCourseId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date & Time</label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
