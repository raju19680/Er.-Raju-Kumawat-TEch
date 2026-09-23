'use client'

import React, { useState, useMemo } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Video,
  Trash2,
  Loader2,
  MapPin,
  Link2,
  Copy,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: string
  meetingLink: string
  description: string
  participants: string[]
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  // Data
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'JEE Advanced Strategy Session',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:00',
      duration: '60',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      description: 'Interactive strategy session for JEE Advanced preparation',
      participants: ['Rahul S.', 'Priya M.', 'Amit K.'],
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Doubt Clearing - Physics',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      time: '14:00',
      duration: '45',
      meetingLink: 'https://zoom.us/j/123456789',
      description: 'Open doubt clearing session for Physics',
      participants: ['Student Group A'],
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Parent-Teacher Meeting',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      time: '11:00',
      duration: '30',
      meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
      description: 'Monthly parent-teacher meeting to discuss progress',
      participants: ['Parents of Batch 2024'],
      status: 'completed',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '4',
      title: 'NEET Biology Revision',
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
      time: '16:00',
      duration: '90',
      meetingLink: 'https://zoom.us/j/987654321',
      description: 'Comprehensive biology revision for NEET',
      participants: ['Batch A Students'],
      status: 'completed',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
  ])

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDuration, setFormDuration] = useState('60')
  const [formLink, setFormLink] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formParticipants, setFormParticipants] = useState('')

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null)

  // Split meetings
  const upcomingMeetings = useMemo(
    () => meetings.filter((m) => m.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [meetings]
  )

  const pastMeetings = useMemo(
    () => meetings.filter((m) => m.status === 'completed' || m.status === 'cancelled').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [meetings]
  )

  // ─── Create Meeting ──────────────────────────────────────────────────

  const handleCreate = () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formDate) {
      toast.error('Date is required')
      return
    }
    if (!formTime) {
      toast.error('Time is required')
      return
    }
    setSaving(true)
    setTimeout(() => {
      const newMeeting: Meeting = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        duration: formDuration || '60',
        meetingLink: formLink.trim(),
        description: formDescription.trim(),
        participants: formParticipants.trim() ? formParticipants.split(',').map((p) => p.trim()) : [],
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      }
      setMeetings((prev) => [newMeeting, ...prev])
      setDialogOpen(false)
      resetForm()
      setSaving(false)
      toast.success('Meeting scheduled')
    }, 500)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDate('')
    setFormTime('')
    setFormDuration('60')
    setFormLink('')
    setFormDescription('')
    setFormParticipants('')
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!meetingToDelete) return
    setMeetings((prev) => prev.filter((m) => m.id !== meetingToDelete.id))
    setDeleteDialogOpen(false)
    setMeetingToDelete(null)
    toast.success('Meeting deleted')
  }

  // ─── Copy Link ───────────────────────────────────────────────────────

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Meeting link copied')
  }

  // ─── Status Badge ────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      upcoming: { label: 'Upcoming', color: 'bg-blue-50 text-blue-700', icon: Calendar },
      in_progress: { label: 'In Progress', color: 'bg-emerald-50 text-emerald-700', icon: Video },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600', icon: AlertCircle },
    }
    const cfg = configs[status] || configs.upcoming
    const Icon = cfg.icon
    return (
      <Badge className={cfg.color}>
        <Icon className="size-3 mr-1" />
        {cfg.label}
      </Badge>
    )
  }

  // ─── Meeting Card ────────────────────────────────────────────────────

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
    <Card className="rounded-xl hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{meeting.title}</p>
            {meeting.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meeting.description}</p>
            )}
          </div>
          {getStatusBadge(meeting.status)}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {new Date(meeting.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            {meeting.time}
          </div>
          <div className="flex items-center gap-1">
            <Timer className="size-3" />
            {meeting.duration} min
          </div>
        </div>

        {meeting.participants.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="size-3 text-muted-foreground" />
            <div className="flex -space-x-1.5">
              {meeting.participants.slice(0, 3).map((p, i) => (
                <Avatar key={i} className="size-6 border-2 border-white">
                  <AvatarFallback className="bg-gray-100 text-[9px] text-gray-600">
                    {p[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              {meeting.participants.length > 3 ? `+${meeting.participants.length - 3} more` : meeting.participants[0]}
            </span>
          </div>
        )}

        {meeting.meetingLink && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-blue-600 flex-1 min-w-0">
              <Video className="size-3 shrink-0" />
              <span className="truncate">{meeting.meetingLink}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyLink(meeting.meetingLink)}>
              <Copy className="size-3" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {meeting.status === 'upcoming' && meeting.meetingLink && (
            <Button size="sm" className="flex-1 h-8 bg-black hover:bg-gray-800 text-white text-xs">
              <Video className="size-3 mr-1" /> Join
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-red-600 hover:text-red-700"
            onClick={() => {
              setMeetingToDelete(meeting)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage your meetings
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
          className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white"
        >
          <Plus className="size-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-blue-50">
              <Calendar className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-lg font-bold text-gray-900">{upcomingMeetings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-gray-100">
              <CheckCircle className="size-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-gray-900">{pastMeetings.filter((m) => m.status === 'completed').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
              <Clock className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-lg font-bold text-gray-900">
                {meetings.filter((m) => {
                  const d = new Date(m.date)
                  const now = new Date()
                  const weekStart = new Date(now)
                  weekStart.setDate(now.getDate() - now.getDay())
                  const weekEnd = new Date(weekStart)
                  weekEnd.setDate(weekStart.getDate() + 7)
                  return d >= weekStart && d <= weekEnd && m.status === 'upcoming'
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="size-5 text-blue-600" />
            Upcoming Meetings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="size-5 text-gray-400" />
            Past Meetings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {meetings.length === 0 && (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No meetings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Schedule your first meeting</p>
              <Button onClick={() => setDialogOpen(true)} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                <Plus className="size-4 mr-2" /> Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Schedule Meeting Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Set up a new meeting with details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Meeting title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <Label>Duration (minutes)</Label>
              <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="60" min="5" />
            </div>
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://meet.google.com/..." className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Meeting description..." className="min-h-[60px]" />
            </div>
            <div className="space-y-2">
              <Label>Participants</Label>
              <Input
                value={formParticipants}
                onChange={(e) => setFormParticipants(e.target.value)}
                placeholder="Comma separated names"
              />
              <p className="text-xs text-muted-foreground">Enter names separated by commas</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{meetingToDelete?.title}&rdquo;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
