/* eslint-disable */
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiFetchJSON } from '@/lib/api-client'
import { Video, Calendar, Play, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface LiveClass {
  id: string
  title: string
  description: string | null
  course: { title: string }
  scheduledAt: string
  jitsiRoomId: string
  status: string
}

export default function StudentLiveClasses() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [activeClass, setActiveClass] = useState<LiveClass | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClasses()
  }, [])

  async function loadClasses() {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: LiveClass[] }>('/api/student/live-classes')
      if (res.success) setClasses(res.data)
    } catch (err) {
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  if (activeClass) {
    if (activeClass.status !== 'live') {
      return (
        <div className="text-center py-20 space-y-4">
          <Video className="w-16 h-16 text-indigo-300 mx-auto" />
          <h2 className="text-2xl font-bold">Class has not started yet</h2>
          <p className="text-muted-foreground">The teacher will start the class soon. Please wait.</p>
          <Button onClick={() => setActiveClass(null)} variant="outline">Go Back</Button>
        </div>
      )
    }

    return (
      <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
        <div className="flex justify-between items-center bg-indigo-900 text-white p-4 rounded-lg shadow">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              {activeClass.title}
            </h2>
            <p className="text-sm text-indigo-200">Course: {activeClass.course.title}</p>
          </div>
          <Button variant="secondary" onClick={() => setActiveClass(null)} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Leave Class
          </Button>
        </div>
        <div className="flex-1 bg-black rounded-lg overflow-hidden border-2 border-indigo-900/50">
          <iframe 
            src={`https://meet.jit.si/${activeClass.jitsiRoomId}#config.prejoinPageEnabled=false&userInfo.displayName="Student"`} 
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Classes</h1>
        <p className="text-sm text-muted-foreground">Join your scheduled virtual classrooms.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-lg">No upcoming classes</h3>
          <p className="text-sm text-muted-foreground mt-1">You are all caught up for now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <Card key={cls.id} className="border-indigo-100 hover:border-indigo-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={cls.status === 'live' ? 'destructive' : 'default'} className={cls.status === 'live' ? 'animate-pulse' : ''}>
                    {cls.status.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2 line-clamp-1">{cls.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground font-medium mb-3">{cls.course.title}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded-md">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {new Date(cls.scheduledAt).toLocaleString()}
                </div>
                
                <Button 
                  onClick={() => setActiveClass(cls)} 
                  className="w-full gap-2" 
                  disabled={cls.status === 'ended'}
                  variant={cls.status === 'live' ? 'default' : 'secondary'}
                >
                  <Play className="w-4 h-4" /> 
                  {cls.status === 'live' ? 'Join Class Now' : 'Enter Waiting Room'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
