'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  Radio,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Play,
  FileText,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Globe,
  Monitor,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetchJSON } from '@/lib/api-client'
import { toast } from 'sonner'

export interface MeetingItem {
  id: string
  title: string
  description: string | null
  meetingLink: string | null
  platform: 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Custom' | string
  startTime: string
  endTime: string | null
  duration: number
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  hostName: string
  participantCount: number
  notes: string | null
  recordingUrl: string | null
  createdAt: string
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Zoom: Video,
  'Google Meet': Video,
  'Microsoft Teams': Monitor,
  Custom: Globe,
}

const PLATFORM_COLORS: Record<string, string> = {
  Zoom: 'bg-sky-50 text-sky-700 border-sky-200',
  'Google Meet': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Microsoft Teams': 'bg-violet-50 text-violet-700 border-violet-200',
  Custom: 'bg-amber-50 text-amber-700 border-amber-200',
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return ''
  }
}

export default function StudentLiveClasses() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const loadMeetings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; meetings: MeetingItem[] }>(
        '/api/student/meetings'
      )
      if (res.success) {
        setMeetings(res.meetings)
      } else {
        setError('Failed to load live classes')
      }
    } catch (err) {
      console.error('Failed to load student meetings:', err)
      setError('Unable to fetch live classes. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMeetings()
  }, [loadMeetings])

  const handleJoinMeeting = async (meeting: MeetingItem) => {
    if (!meeting.meetingLink) {
      toast.error('Meeting link is not available yet.')
      return
    }

    setJoiningId(meeting.id)
    try {
      await apiFetchJSON(`/api/student/meetings/${meeting.id}/join`, {
        method: 'POST',
      })
    } catch {
      // ignore join record failure, proceed to open link
    } finally {
      setJoiningId(null)
    }

    window.open(meeting.meetingLink, '_blank', 'noopener,noreferrer')
    toast.success(`Joining ${meeting.title}...`)
  }

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase())) ||
      m.hostName.toLowerCase().includes(search.toLowerCase())
    const matchesPlatform =
      platformFilter === 'all' || m.platform.toLowerCase() === platformFilter.toLowerCase()
    return matchesSearch && matchesPlatform
  })

  const liveNowMeetings = filteredMeetings.filter((m) => m.status === 'live')
  const upcomingMeetings = filteredMeetings.filter((m) => m.status === 'scheduled')
  const pastMeetings = filteredMeetings.filter((m) => m.status === 'completed')

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="py-0">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <AlertCircle className="size-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Failed to Load Live Classes</h3>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
        <Button onClick={loadMeetings} variant="outline" className="gap-2">
          <RotateCcw className="size-4" /> Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white">
              <Radio className="size-3.5 animate-pulse text-red-200" /> Live Virtual Classroom
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Interactive Live Sessions</h1>
          <p className="text-white/90 text-sm sm:text-base max-w-xl">
            Join live interactive lectures with your instructors, ask doubts in real-time, and access class recordings.
          </p>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search classes or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-4 text-gray-400 shrink-0" />
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {['all', 'Zoom', 'Google Meet', 'Microsoft Teams', 'Custom'].map((pf) => (
              <button
                key={pf}
                onClick={() => setPlatformFilter(pf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  platformFilter === pf
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {pf === 'all' ? 'All Platforms' : pf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Now Priority Alert */}
      {liveNowMeetings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wider">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-red-500" />
            </span>
            Happening Now ({liveNowMeetings.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveNowMeetings.map((meeting) => (
              <Card
                key={meeting.id}
                className="border-2 border-red-500 shadow-md bg-gradient-to-br from-red-50/50 via-white to-white relative overflow-hidden py-0"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Badge className="bg-red-600 text-white gap-1 animate-pulse">
                        <Radio className="size-3" /> LIVE NOW
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{meeting.title}</h3>
                    </div>
                    <Badge variant="outline" className={PLATFORM_COLORS[meeting.platform] || PLATFORM_COLORS.Custom}>
                      {meeting.platform}
                    </Badge>
                  </div>

                  {meeting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500 pt-1 border-t border-red-100">
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Sparkles className="size-3.5 text-amber-500" /> Host: {meeting.hostName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-gray-400" /> {formatDuration(meeting.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5 text-gray-400" /> {meeting.participantCount} joined
                    </span>
                  </div>

                  <Button
                    onClick={() => handleJoinMeeting(meeting)}
                    disabled={joiningId === meeting.id}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold gap-2 py-5 shadow-sm"
                  >
                    {joiningId === meeting.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Video className="size-5" />
                    )}
                    Join Live Classroom Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabs for Scheduled vs Recordings */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
          <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
            <Calendar className="size-4" /> Upcoming Classes ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="recordings" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
            <Play className="size-4" /> Class Recordings ({pastMeetings.filter(m => m.recordingUrl).length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">
            All Sessions ({filteredMeetings.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Classes */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <Card className="py-0">
              <CardContent className="p-8 text-center space-y-3">
                <Calendar className="size-12 text-gray-300 mx-auto" />
                <h4 className="text-base font-semibold text-gray-700">No Scheduled Live Classes</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  There are currently no upcoming live sessions scheduled for your batches. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow py-0">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                          Scheduled Session
                        </Badge>
                        <h3 className="text-base font-bold text-gray-900">{meeting.title}</h3>
                      </div>
                      <Badge variant="outline" className={PLATFORM_COLORS[meeting.platform] || PLATFORM_COLORS.Custom}>
                        {meeting.platform}
                      </Badge>
                    </div>

                    {meeting.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{meeting.description}</p>
                    )}

                    <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-gray-900">
                          <Calendar className="size-3.5 text-amber-600" /> {formatDate(meeting.startTime)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="size-3.5 text-gray-400" /> {formatTime(meeting.startTime)} ({formatDuration(meeting.duration)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500 pt-1 border-t border-gray-200/60">
                        <span>Instructor: <strong className="text-gray-700">{meeting.hostName}</strong></span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoinMeeting(meeting)}
                      variant="outline"
                      className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 gap-2"
                    >
                      <ExternalLink className="size-4" /> Open Class Link
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Class Recordings */}
        <TabsContent value="recordings" className="space-y-4">
          {pastMeetings.filter((m) => m.recordingUrl).length === 0 ? (
            <Card className="py-0">
              <CardContent className="p-8 text-center space-y-3">
                <Play className="size-12 text-gray-300 mx-auto" />
                <h4 className="text-base font-semibold text-gray-700">No Recordings Available</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Past live class recordings will appear here once uploaded by your instructors.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastMeetings
                .filter((m) => m.recordingUrl)
                .map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow py-0">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                            Recording Available
                          </Badge>
                          <h3 className="text-base font-bold text-gray-900">{meeting.title}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(meeting.startTime)}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span>Host: {meeting.hostName}</span>
                        <span>•</span>
                        <span>Duration: {formatDuration(meeting.duration)}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => window.open(meeting.recordingUrl!, '_blank')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs"
                        >
                          <Play className="size-3.5 fill-current" /> Watch Recording
                        </Button>
                        {meeting.notes && (
                          <Button
                            variant="outline"
                            onClick={() => toast.info(`Notes: ${meeting.notes}`)}
                            className="gap-1.5 text-xs"
                          >
                            <FileText className="size-3.5" /> Notes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* All Sessions */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow py-0">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 block">{formatDate(meeting.startTime)}</span>
                      <h3 className="text-base font-bold text-gray-900">{meeting.title}</h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        meeting.status === 'live'
                          ? 'bg-red-50 text-red-700 animate-pulse'
                          : meeting.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-sky-50 text-sky-700'
                      }
                    >
                      {meeting.status.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {meeting.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
                    <span>Host: {meeting.hostName}</span>
                    {meeting.meetingLink && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleJoinMeeting(meeting)}
                        className="text-amber-600 hover:text-amber-700 gap-1 text-xs h-7 px-2"
                      >
                        Join / Link <ExternalLink className="size-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
