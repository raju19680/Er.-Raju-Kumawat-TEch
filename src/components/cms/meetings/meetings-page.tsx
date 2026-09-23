'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Video,
  Trash2,
  Loader2,
  Link2,
  ExternalLink,
  CalendarDays,
  Timer,
  LayoutGrid,
  List,
  XCircle,
  CheckCircle2,
  Radio,
  CalendarClock,
  Monitor,
  Globe,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type MeetingPlatform = 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Custom'
type MeetingStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

interface Meeting {
  id: string
  title: string
  description: string
  platform: MeetingPlatform
  date: string
  time: string
  duration: number // minutes
  meetingLink: string
  host: string
  participantsCount: number
  status: MeetingStatus
  notes: string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<MeetingPlatform, { color: string; icon: React.ElementType }> = {
  'Zoom': { color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Video },
  'Google Meet': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Video },
  'Microsoft Teams': { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Monitor },
  'Custom': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Globe },
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; icon: React.ElementType }> = {
  scheduled: { label: 'Scheduled', color: 'bg-sky-50 text-sky-700', icon: CalendarClock },
  live: { label: 'Live', color: 'bg-red-50 text-red-700', icon: Radio },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(date: string) {
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return date
  }
}

function formatTime(time: string) {
  try {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return time
  }
}

function mapApiMeeting(apiItem: Record<string, unknown>): Meeting {
  const startTime = apiItem.startTime as string
  const dateObj = startTime ? new Date(startTime) : new Date()
  // Map platform values from DB to frontend display names
  const platformMap: Record<string, MeetingPlatform> = {
    'zoom': 'Zoom',
    'google_meet': 'Google Meet',
    'Google Meet': 'Google Meet',
    'Zoom': 'Zoom',
    'teams': 'Microsoft Teams',
    'Microsoft Teams': 'Microsoft Teams',
    'custom': 'Custom',
    'Custom': 'Custom',
  }
  const rawPlatform = (apiItem.platform as string) || 'custom'
  const platform = platformMap[rawPlatform] || 'Custom'

  return {
    id: apiItem.id as string,
    title: (apiItem.title as string) || '',
    description: (apiItem.description as string) || '',
    platform,
    date: dateObj.toISOString().split('T')[0],
    time: `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`,
    duration: (apiItem.duration as number) || 30,
    meetingLink: (apiItem.meetingLink as string) || '',
    host: (apiItem.hostName as string) || '',
    participantsCount: (apiItem.participantCount as number) || 0,
    status: (apiItem.status as MeetingStatus) || 'scheduled',
    notes: (apiItem.notes as string) || '',
    createdAt: apiItem.createdAt
      ? new Date(apiItem.createdAt as string).toISOString().split('T')[0]
      : '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const { userName, orgCode } = useAppStore()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPlatform, setFormPlatform] = useState<MeetingPlatform>('Zoom')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDuration, setFormDuration] = useState('60')
  const [formLink, setFormLink] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/teacher/meetings?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        setMeetings(data.items.map((item: Record<string, unknown>) => mapApiMeeting(item)))
      }
    } catch {
      toast.error('Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    if (orgCode) {
      fetchMeetings()
    }
  }, [orgCode, fetchMeetings])

  // Filtered
  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.host.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [meetings, search, statusFilter])

  // Stats
  const totalMeetings = meetings.length
  const upcoming = meetings.filter((m) => m.status === 'scheduled').length
  const completed = meetings.filter((m) => m.status === 'completed').length
  const avgDuration = meetings.filter((m) => m.status === 'completed').length > 0
    ? Math.round(meetings.filter((m) => m.status === 'completed').reduce((a, m) => a + m.duration, 0) / meetings.filter((m) => m.status === 'completed').length)
    : 0

  function resetForm() {
    setFormTitle('')
    setFormDesc('')
    setFormPlatform('Zoom')
    setFormDate('')
    setFormTime('')
    setFormDuration('60')
    setFormLink('')
    setFormNotes('')
  }

  function openCreate() {
    resetForm()
    setEditMeeting(null)
    setShowCreate(true)
  }

  function openEdit(m: Meeting) {
    setFormTitle(m.title)
    setFormDesc(m.description)
    setFormPlatform(m.platform)
    setFormDate(m.date)
    setFormTime(m.time)
    setFormDuration(String(m.duration))
    setFormLink(m.meetingLink)
    setFormNotes(m.notes)
    setEditMeeting(m)
    setShowCreate(true)
  }

  async function handleSave() {
    if (!formTitle.trim() || !formDate || !formTime) {
      toast.error('Title, date, and time are required')
      return
    }
    setSaving(true)
    try {
      // Map frontend platform to DB platform values
      const platformMap: Record<MeetingPlatform, string> = {
        'Zoom': 'Zoom',
        'Google Meet': 'Google Meet',
        'Microsoft Teams': 'Microsoft Teams',
        'Custom': 'custom',
      }
      const startTime = new Date(`${formDate}T${formTime}:00`).toISOString()

      if (editMeeting) {
        const response = await apiFetch(`/api/teacher/meetings/${editMeeting.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            platform: platformMap[formPlatform],
            startTime,
            duration: parseInt(formDuration) || 60,
            meetingLink: formLink,
            notes: formNotes,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          await fetchMeetings()
          toast.success('Meeting updated')
        } else {
          toast.error(data.error || 'Failed to update meeting')
        }
      } else {
        const response = await apiFetch('/api/teacher/meetings', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            platform: platformMap[formPlatform],
            startTime,
            duration: parseInt(formDuration) || 60,
            meetingLink: formLink,
            hostName: userName || 'Teacher',
            notes: formNotes,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          await fetchMeetings()
          toast.success('Meeting scheduled')
        } else {
          toast.error(data.error || 'Failed to schedule meeting')
        }
      }
      setShowCreate(false)
    } catch {
      toast.error('Failed to save meeting')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      const response = await apiFetch(`/api/teacher/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled', organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, status: 'cancelled' } : m))
        toast.success('Meeting cancelled')
      } else {
        toast.error(data.error || 'Failed to cancel meeting')
      }
    } catch {
      toast.error('Failed to cancel meeting')
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await apiFetch(`/api/teacher/meetings/${id}?organizationId=${orgCode}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setMeetings((prev) => prev.filter((m) => m.id !== id))
        toast.success('Meeting deleted')
      } else {
        toast.error(data.error || 'Failed to delete meeting')
      }
    } catch {
      toast.error('Failed to delete meeting')
    }
  }

  function handleJoin(link: string) {
    if (link) {
      window.open(link, '_blank')
      toast.success('Opening meeting link...')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground text-sm">Schedule and manage online meetings</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground text-sm">Schedule and manage online meetings</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: totalMeetings, icon: Calendar, color: 'text-violet-600' },
          { label: 'Upcoming', value: upcoming, icon: CalendarClock, color: 'text-sky-600' },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Avg Duration', value: formatDuration(avgDuration), icon: Timer, color: 'text-amber-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No meetings found</p>
          <p className="text-sm">Schedule a meeting to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const pc = PLATFORM_CONFIG[m.platform]
            const sc = STATUS_CONFIG[m.status]
            const PlatformIcon = pc.icon
            const StatusIcon = sc.icon
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className={`h-1.5 ${
                  m.status === 'live' ? 'bg-red-500' :
                  m.status === 'scheduled' ? 'bg-sky-500' :
                  m.status === 'completed' ? 'bg-emerald-500' :
                  'bg-gray-300'
                }`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{m.title}</h3>
                    <Badge variant="outline" className={`${sc.color} text-xs shrink-0 h-5 gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {sc.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className={`${pc.color} gap-1 h-5 text-xs`}>
                      <PlatformIcon className="h-3 w-3" />
                      {m.platform}
                    </Badge>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(m.date)}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(m.time)}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {formatDuration(m.duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{m.participantsCount} participants</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{m.host}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {(m.status === 'scheduled' || m.status === 'live') && m.meetingLink && (
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleJoin(m.meetingLink)}>
                        <ExternalLink className="h-3 w-3" />
                        Join
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(m)}>
                      Edit
                    </Button>
                    {m.status === 'scheduled' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs text-amber-600" onClick={() => handleCancel(m.id)}>
                        Cancel
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive ml-auto" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((m) => {
                const pc = PLATFORM_CONFIG[m.platform]
                const sc = STATUS_CONFIG[m.status]
                return (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                        m.status === 'live' ? 'bg-red-100 text-red-600' :
                        m.status === 'scheduled' ? 'bg-sky-100 text-sky-600' :
                        m.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        <Video className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{m.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDate(m.date)} · {formatTime(m.time)}</span>
                          <span>· {formatDuration(m.duration)}</span>
                          <span>· {m.participantsCount} participants</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto shrink-0">
                      <Badge variant="outline" className={`${pc.color} text-xs h-5`}>{m.platform}</Badge>
                      <Badge variant="secondary" className={`${sc.color} text-xs h-5`}>{sc.label}</Badge>
                      {(m.status === 'scheduled' || m.status === 'live') && m.meetingLink && (
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleJoin(m.meetingLink)}>
                          <ExternalLink className="h-3 w-3" />
                          Join
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(m)}>
                        Edit
                      </Button>
                      {m.status === 'scheduled' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-amber-600" onClick={() => handleCancel(m.id)}>
                          Cancel
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMeeting ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
            <DialogDescription>
              {editMeeting ? 'Update meeting details' : 'Set up a new online meeting'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. JEE Doubt Clearing Session"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Meeting description..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={formPlatform} onValueChange={(v) => setFormPlatform(v as MeetingPlatform)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Select value={formDuration} onValueChange={setFormDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <Input
                placeholder="https://zoom.us/j/..."
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editMeeting ? 'Update' : 'Schedule'} Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
