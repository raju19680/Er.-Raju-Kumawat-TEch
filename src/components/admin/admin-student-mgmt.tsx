'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck,
  StickyNote,
  MessageSquare,
  CalendarDays,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  Pin,
  PinOff,
  Trash2,
  Plus,
  Mail,
  Smartphone,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ClockIcon,
  Users,
  ChevronDown,
  Filter,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface StudentInfo {
  id: string
  name: string
  email: string
  phone?: string | null
  organizationId: string
  organization?: { id: string; name: string } | null
  attendanceStatus?: string | null
  attendanceId?: string | null
  attendanceNotes?: string | null
}

interface AttendanceSummary {
  totalStudents: number
  totalMarked: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

interface NoteItem {
  id: string
  studentId: string
  student?: StudentInfo | null
  note: string
  category: string
  priority: string
  createdBy?: string | null
  createdByName?: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

interface CommunicationItem {
  id: string
  studentId: string
  student?: StudentInfo | null
  type: string
  subject?: string | null
  message: string
  status: string
  sentBy?: string | null
  sentByName?: string | null
  sentAt?: string | null
  createdAt: string
}

interface OrganizationOption {
  id: string
  name: string
  code: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | Date): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

function formatDateTime(dateStr: string | Date): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return String(dateStr)
  }
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Status badge helpers ─────────────────────────────────────────────────────

function AttendanceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'present':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs gap-0.5">
          <UserCheck className="size-3" /> Present
        </Badge>
      )
    case 'absent':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs gap-0.5">
          <UserX className="size-3" /> Absent
        </Badge>
      )
    case 'late':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs gap-0.5">
          <Clock className="size-3" /> Late
        </Badge>
      )
    case 'excused':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs gap-0.5">
          <ClockIcon className="size-3" /> Excused
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
          Not Marked
        </Badge>
      )
  }
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    general: 'bg-gray-100 text-gray-700',
    academic: 'bg-blue-100 text-blue-700',
    behavioral: 'bg-orange-100 text-orange-700',
    financial: 'bg-emerald-100 text-emerald-700',
    communication: 'bg-purple-100 text-purple-700',
  }
  return (
    <Badge className={`${styles[category] || styles.general} border-0 text-xs`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-600',
    important: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return (
    <Badge className={`${styles[priority] || styles.normal} border-0 text-xs`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

function CommTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'email':
      return <Mail className="size-4 text-blue-500" />
    case 'sms':
      return <Smartphone className="size-4 text-emerald-500" />
    case 'whatsapp':
      return <MessageSquare className="size-4 text-green-500" />
    default:
      return <Send className="size-4 text-gray-500" />
  }
}

function CommStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs gap-0.5">
          <CheckCircle2 className="size-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs gap-0.5">
          <ClockIcon className="size-3" /> Pending
        </Badge>
      )
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs gap-0.5">
          <XCircle className="size-3" /> Failed
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

// ── Animation variants ───────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminStudentMgmtPage() {
  const [activeTab, setActiveTab] = useState('attendance')

  // ── Attendance State ──
  const [attLoading, setAttLoading] = useState(true)
  const [attError, setAttError] = useState<string | null>(null)
  const [attDate, setAttDate] = useState(getTodayStr())
  const [attOrgId, setAttOrgId] = useState<string>('')
  const [attStudents, setAttStudents] = useState<StudentInfo[]>([])
  const [attSummary, setAttSummary] = useState<AttendanceSummary>({
    totalStudents: 0, totalMarked: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0,
  })
  const [attOrganizations, setAttOrganizations] = useState<OrganizationOption[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<string>('present')
  const [markingLoading, setMarkingLoading] = useState(false)
  const [attSearch, setAttSearch] = useState('')

  // ── Notes State ──
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [notesStudents, setNotesStudents] = useState<StudentInfo[]>([])
  const [notesStudentId, setNotesStudentId] = useState<string>('')
  const [noteForm, setNoteForm] = useState({ note: '', category: 'general', priority: 'normal' })
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // ── Communications State ──
  const [commLoading, setCommLoading] = useState(true)
  const [commError, setCommError] = useState<string | null>(null)
  const [communications, setCommunications] = useState<CommunicationItem[]>([])
  const [commStudents, setCommStudents] = useState<StudentInfo[]>([])
  const [commStudentId, setCommStudentId] = useState<string>('')
  const [commForm, setCommForm] = useState({ type: 'email', subject: '', message: '' })
  const [commSubmitting, setCommSubmitting] = useState(false)
  const [commOrgId, setCommOrgId] = useState<string>('')

  // ── Delete Note Dialog ──
  const [deleteNoteDialog, setDeleteNoteDialog] = useState<{ open: boolean; noteId: string | null }>({
    open: false, noteId: null,
  })
  const [deleteNoteLoading, setDeleteNoteLoading] = useState(false)

  // ── Fetch Attendance ──
  const fetchAttendance = useCallback(async () => {
    setAttLoading(true)
    setAttError(null)
    try {
      const params = new URLSearchParams()
      params.set('type', 'attendance')
      params.set('date', attDate)
      if (attOrgId) params.set('organizationId', attOrgId)

      const res = await apiFetch(`/api/admin/student-mgmt?${params.toString()}`)
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to fetch attendance')

      setAttStudents(data.data.students || [])
      setAttSummary(data.data.summary || {
        totalStudents: 0, totalMarked: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0,
      })
      setAttOrganizations(data.data.organizations || [])
      setSelectedStudentIds([])
    } catch (err) {
      console.error('Fetch attendance error:', err)
      setAttError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setAttLoading(false)
    }
  }, [attDate, attOrgId])

  // ── Fetch Notes ──
  const fetchNotes = useCallback(async () => {
    setNotesLoading(true)
    setNotesError(null)
    try {
      const params = new URLSearchParams()
      params.set('type', 'notes')
      if (notesStudentId) params.set('studentId', notesStudentId)

      const res = await apiFetch(`/api/admin/student-mgmt?${params.toString()}`)
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to fetch notes')

      setNotes(data.data.notes || [])
      setNotesStudents(data.data.students || [])
    } catch (err) {
      console.error('Fetch notes error:', err)
      setNotesError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setNotesLoading(false)
    }
  }, [notesStudentId])

  // ── Fetch Communications ──
  const fetchCommunications = useCallback(async () => {
    setCommLoading(true)
    setCommError(null)
    try {
      const params = new URLSearchParams()
      params.set('type', 'communications')
      if (commStudentId) params.set('studentId', commStudentId)
      if (commOrgId) params.set('organizationId', commOrgId)

      const res = await apiFetch(`/api/admin/student-mgmt?${params.toString()}`)
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to fetch communications')

      setCommunications(data.data.communications || [])
      setCommStudents(data.data.students || [])
    } catch (err) {
      console.error('Fetch communications error:', err)
      setCommError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setCommLoading(false)
    }
  }, [commStudentId, commOrgId])

  // ── Data loading on tab change ──
  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance()
    else if (activeTab === 'notes') fetchNotes()
    else if (activeTab === 'communications') fetchCommunications()
  }, [activeTab, fetchAttendance, fetchNotes, fetchCommunications])

  // ── Attendance: Mark individual ──
  const handleMarkAttendance = async (studentId: string, status: string) => {
    const student = attStudents.find((s) => s.id === studentId)
    const targetOrgId = attOrgId || student?.organizationId || ''

    setMarkingLoading(true)
    try {
      const res = await apiFetch('/api/admin/student-mgmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_attendance',
          studentIds: [studentId],
          date: attDate,
          status,
          organizationId: targetOrgId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to mark attendance')
      toast.success(data.message)
      fetchAttendance()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark attendance')
    } finally {
      setMarkingLoading(false)
    }
  }

  // ── Attendance: Bulk mark ──
  const handleBulkMark = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Select at least one student.')
      return
    }
    const firstSelected = attStudents.find((s) => selectedStudentIds.includes(s.id))
    const targetOrgId = attOrgId || firstSelected?.organizationId || ''

    setMarkingLoading(true)
    try {
      const res = await apiFetch('/api/admin/student-mgmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_attendance',
          studentIds: selectedStudentIds,
          date: attDate,
          status: bulkStatus,
          organizationId: targetOrgId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to mark attendance')
      toast.success(data.message)
      setSelectedStudentIds([])
      fetchAttendance()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark attendance')
    } finally {
      setMarkingLoading(false)
    }
  }

  // ── Notes: Add note ──
  const handleAddNote = async () => {
    if (!notesStudentId) {
      toast.error('Please select a student.')
      return
    }
    if (!noteForm.note.trim()) {
      toast.error('Note text is required.')
      return
    }
    setNoteSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/student-mgmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          studentId: notesStudentId,
          note: noteForm.note.trim(),
          category: noteForm.category,
          priority: noteForm.priority,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to add note')
      toast.success('Note added successfully.')
      setNoteForm({ note: '', category: 'general', priority: 'normal' })
      fetchNotes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setNoteSubmitting(false)
    }
  }

  // ── Notes: Toggle pin ──
  const handleTogglePin = async (noteId: string) => {
    try {
      const res = await apiFetch('/api/admin/student-mgmt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_pin_note', noteId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to toggle pin')
      toast.success(data.message)
      fetchNotes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle pin')
    }
  }

  // ── Notes: Delete ──
  const handleDeleteNote = async () => {
    if (!deleteNoteDialog.noteId) return
    setDeleteNoteLoading(true)
    try {
      const res = await apiFetch(`/api/admin/student-mgmt?noteId=${deleteNoteDialog.noteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete note')
      toast.success('Note deleted successfully.')
      setDeleteNoteDialog({ open: false, noteId: null })
      fetchNotes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete note')
    } finally {
      setDeleteNoteLoading(false)
    }
  }

  // ── Communications: Send ──
  const handleSendCommunication = async () => {
    if (!commStudentId) {
      toast.error('Please select a student.')
      return
    }
    if (!commForm.message.trim()) {
      toast.error('Message text is required.')
      return
    }
    const student = commStudents.find((s) => s.id === commStudentId)
    const targetOrgId = commOrgId || student?.organizationId || ''

    setCommSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/student-mgmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_communication',
          studentId: commStudentId,
          type: commForm.type,
          subject: commForm.subject.trim(),
          message: commForm.message.trim(),
          organizationId: targetOrgId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send communication')
      toast.success('Communication sent successfully.')
      setCommForm({ type: 'email', subject: '', message: '' })
      fetchCommunications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send communication')
    } finally {
      setCommSubmitting(false)
    }
  }

  // ── Attendance: Select/deselect students ──
  const toggleStudentSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredAttStudents.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(filteredAttStudents.map((s) => s.id))
    }
  }

  // ── Filter students by search ──
  const filteredAttStudents = attStudents.filter((s) => {
    if (!attSearch) return true
    const q = attSearch.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  // ── Stats Cards Config ──
  const attendanceStatsCards = [
    { label: 'Total Present', value: attSummary.present, icon: UserCheck, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { label: 'Total Absent', value: attSummary.absent, icon: UserX, bgColor: 'bg-red-50', textColor: 'text-red-600' },
    { label: 'Late', value: attSummary.late, icon: Clock, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
    { label: 'Attendance Rate', value: `${attSummary.attendanceRate}%`, icon: TrendingUp, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Attendance & Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track attendance, manage notes, and communicate with students.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl overflow-x-auto w-full sm:w-auto inline-flex flex-nowrap">
          <TabsTrigger
            value="attendance"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 gap-1.5 px-4 shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 gap-1.5 px-4 shrink-0"
          >
            <StickyNote className="size-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="communications"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 gap-1.5 px-4 shrink-0"
          >
            <MessageSquare className="size-4" />
            Communications
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════════════
            ATTENDANCE TAB
        ════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="attendance">
          <motion.div {...fadeIn} className="space-y-4">
            {/* Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-amber-600 shrink-0" />
                    <Input
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className="bg-gray-50/80 border-gray-200 w-full sm:w-44"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="size-4 text-amber-600 shrink-0" />
                    <Select value={attOrgId} onValueChange={setAttOrgId}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200 w-full sm:w-56">
                        <SelectValue placeholder="All Organizations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Organizations</SelectItem>
                        {attOrganizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={attSearch}
                      onChange={(e) => setAttSearch(e.target.value)}
                      className="pl-9 bg-gray-50/80 border-gray-200"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchAttendance} className="text-muted-foreground shrink-0 self-start sm:self-auto">
                    <RefreshCw className={`size-3.5 mr-1 ${attLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {attLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Skeleton className="size-10 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-10" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                attendanceStatsCards.map((card) => (
                  <motion.div key={card.label} {...staggerItem}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`flex items-center justify-center size-10 rounded-lg ${card.bgColor}`}>
                          <card.icon className={`size-5 ${card.textColor}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{card.label}</p>
                          <p className="text-xl font-bold text-gray-900">{card.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Error State */}
            {attError && (
              <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="size-5 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800">Failed to load attendance</p>
                    <p className="text-xs text-red-600 mt-0.5">{attError}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchAttendance} className="shrink-0">
                    <RefreshCw className="size-3.5 mr-1.5" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bulk Actions */}
            {!attError && !attLoading && selectedStudentIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-0 shadow-sm bg-amber-50 border border-amber-200">
                  <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-amber-800">
                      {selectedStudentIds.length} student(s) selected
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-32 h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="excused">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleBulkMark}
                        disabled={markingLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white h-8"
                      >
                        {markingLoading ? (
                          <RefreshCw className="size-3.5 animate-spin mr-1" />
                        ) : (
                          <UserCheck className="size-3.5 mr-1" />
                        )}
                        Mark All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Attendance Table / Cards */}
            {!attError && (
              <Card className="border-0 shadow-sm">
                <CardContent className="px-0 pb-0">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        Student Attendance
                      </span>
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        {attSummary.totalMarked}/{attSummary.totalStudents} marked
                      </Badge>
                    </div>
                    {filteredAttStudents.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSelectAll}
                        className="text-xs text-muted-foreground"
                      >
                        <Checkbox
                          checked={
                            filteredAttStudents.length > 0 &&
                            selectedStudentIds.length === filteredAttStudents.length
                          }
                          onCheckedChange={toggleSelectAll}
                          className="mr-2"
                        />
                        Select All
                      </Button>
                    )}
                  </div>

                  {attLoading ? (
                    <div className="space-y-0">
                      <div className="hidden md:block">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
                            <Skeleton className="size-4" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-36 ml-auto" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-8 w-28 rounded-md" />
                          </div>
                        ))}
                      </div>
                      <div className="md:hidden space-y-3 px-4 pb-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Skeleton className="size-4" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-8 w-28" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : filteredAttStudents.length === 0 ? (
                    <div className="py-16 text-center">
                      <ClipboardCheck className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600">No students found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {attOrgId
                          ? 'Try selecting a different organization or date'
                          : 'Select an organization to view students'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                              <TableHead className="w-10" />
                              <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                              <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
                              <TableHead className="text-xs font-medium text-muted-foreground">Organization</TableHead>
                              <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                              <TableHead className="text-xs font-medium text-muted-foreground">Notes</TableHead>
                              <TableHead className="text-right text-xs font-medium text-muted-foreground">Mark</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <AnimatePresence>
                              {filteredAttStudents.map((student) => (
                                <motion.tr
                                  key={student.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors"
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedStudentIds.includes(student.id)}
                                      onCheckedChange={() => toggleStudentSelect(student.id)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {student.organization?.name || '—'}
                                  </TableCell>
                                  <TableCell>
                                    <AttendanceStatusBadge status={student.attendanceStatus || ''} />
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                                    {student.attendanceNotes || '—'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Select
                                      value={student.attendanceStatus || ''}
                                      onValueChange={(val) => handleMarkAttendance(student.id, val)}
                                      disabled={markingLoading}
                                    >
                                      <SelectTrigger className="w-28 h-8 text-xs">
                                        <SelectValue placeholder="Mark" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="excused">Excused</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3 px-4 py-3">
                        {filteredAttStudents.map((student) => (
                          <div
                            key={student.id}
                            className="border border-gray-100 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedStudentIds.includes(student.id)}
                                  onCheckedChange={() => toggleStudentSelect(student.id)}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                              <AttendanceStatusBadge status={student.attendanceStatus || ''} />
                            </div>
                            {student.organization && (
                              <p className="text-xs text-muted-foreground">{student.organization.name}</p>
                            )}
                            <Select
                              value={student.attendanceStatus || ''}
                              onValueChange={(val) => handleMarkAttendance(student.id, val)}
                              disabled={markingLoading}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Mark attendance..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="excused">Excused</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════════
            NOTES TAB
        ════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="notes">
          <motion.div {...fadeIn} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Add Note Form */}
              <Card className="border-0 shadow-sm lg:col-span-1">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus className="size-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Add Note</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Student</Label>
                      <Select value={notesStudentId} onValueChange={setNotesStudentId}>
                        <SelectTrigger className="mt-1 bg-gray-50/80 border-gray-200">
                          <SelectValue placeholder="Select student..." />
                        </SelectTrigger>
                        <SelectContent>
                          {notesStudents.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} — {s.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Select value={noteForm.category} onValueChange={(v) => setNoteForm((p) => ({ ...p, category: v }))}>
                        <SelectTrigger className="mt-1 bg-gray-50/80 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="communication">Communication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <Select value={noteForm.priority} onValueChange={(v) => setNoteForm((p) => ({ ...p, priority: v }))}>
                        <SelectTrigger className="mt-1 bg-gray-50/80 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Note</Label>
                      <Textarea
                        value={noteForm.note}
                        onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
                        placeholder="Write your note here..."
                        className="mt-1 bg-gray-50/80 border-gray-200 min-h-[100px] resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleAddNote}
                      disabled={noteSubmitting}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {noteSubmitting ? (
                        <RefreshCw className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Plus className="size-4 mr-1.5" />
                      )}
                      Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Student Filter */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <Users className="size-4 text-amber-600 shrink-0" />
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    <Select value={notesStudentId} onValueChange={setNotesStudentId}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200 w-64">
                        <SelectValue placeholder="All Students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Students</SelectItem>
                        {notesStudents.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={fetchNotes} className="text-muted-foreground ml-auto">
                      <RefreshCw className={`size-3.5 mr-1 ${notesLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>

                {/* Error */}
                {notesError && (
                  <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertCircle className="size-5 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-800">Failed to load notes</p>
                        <p className="text-xs text-red-600 mt-0.5">{notesError}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchNotes} className="shrink-0">
                        <RefreshCw className="size-3.5 mr-1.5" />
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Notes List */}
                {!notesError && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <div className="px-6 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">
                          Notes ({notes.length})
                        </span>
                      </div>

                      {notesLoading ? (
                        <div className="space-y-4 p-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                              </div>
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="py-16 text-center">
                          <StickyNote className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-600">No notes yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add a note for a student using the form
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[500px]">
                          <div className="divide-y divide-gray-50">
                            <AnimatePresence>
                              {notes.map((note) => (
                                <motion.div
                                  key={note.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  className="px-6 py-4 hover:bg-amber-50/30 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        {note.isPinned && (
                                          <Pin className="size-3 text-amber-600 fill-amber-600" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">
                                          {note.student?.name || 'Unknown Student'}
                                        </span>
                                        <CategoryBadge category={note.category} />
                                        <PriorityBadge priority={note.priority} />
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {note.note}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1.5">
                                        By {note.createdByName || 'Unknown'} · {formatDate(note.createdAt)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => handleTogglePin(note.id)}
                                        title={note.isPinned ? 'Unpin' : 'Pin'}
                                      >
                                        {note.isPinned ? (
                                          <PinOff className="size-3.5 text-amber-600" />
                                        ) : (
                                          <Pin className="size-3.5 text-gray-400" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-red-400 hover:text-red-600"
                                        onClick={() => setDeleteNoteDialog({ open: true, noteId: note.id })}
                                        title="Delete"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════════
            COMMUNICATIONS TAB
        ════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="communications">
          <motion.div {...fadeIn} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Send Communication Form */}
              <Card className="border-0 shadow-sm lg:col-span-1">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Send className="size-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Send Message</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Organization</Label>
                      <Select value={commOrgId} onValueChange={setCommOrgId}>
                        <SelectTrigger className="mt-1 bg-gray-50/80 border-gray-200">
                          <SelectValue placeholder="Select organization..." />
                        </SelectTrigger>
                        <SelectContent>
                          {attOrganizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Student</Label>
                      <Select value={commStudentId} onValueChange={setCommStudentId}>
                        <SelectTrigger className="mt-1 bg-gray-50/80 border-gray-200">
                          <SelectValue placeholder="Select student..." />
                        </SelectTrigger>
                        <SelectContent>
                          {commStudents.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} — {s.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={commForm.type} onValueChange={(v) => setCommForm((p) => ({ ...p, type: v }))}>
                        <SelectTrigger className="mt-1 bg-gray-50/80 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="push">Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <Input
                        value={commForm.subject}
                        onChange={(e) => setCommForm((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="Message subject..."
                        className="mt-1 bg-gray-50/80 border-gray-200"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Message</Label>
                      <Textarea
                        value={commForm.message}
                        onChange={(e) => setCommForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Write your message..."
                        className="mt-1 bg-gray-50/80 border-gray-200 min-h-[120px] resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSendCommunication}
                      disabled={commSubmitting}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {commSubmitting ? (
                        <RefreshCw className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Send className="size-4 mr-1.5" />
                      )}
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Communication History */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <Users className="size-4 text-amber-600 shrink-0" />
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    <Select value={commStudentId} onValueChange={setCommStudentId}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200 w-52">
                        <SelectValue placeholder="All Students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Students</SelectItem>
                        {commStudents.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={fetchCommunications} className="text-muted-foreground ml-auto">
                      <RefreshCw className={`size-3.5 mr-1 ${commLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>

                {/* Error */}
                {commError && (
                  <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertCircle className="size-5 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-800">Failed to load communications</p>
                        <p className="text-xs text-red-600 mt-0.5">{commError}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchCommunications} className="shrink-0">
                        <RefreshCw className="size-3.5 mr-1.5" />
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* History List */}
                {!commError && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <div className="px-6 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">
                          Communication History ({communications.length})
                        </span>
                      </div>

                      {commLoading ? (
                        <div className="space-y-4 p-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <Skeleton className="size-8 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : communications.length === 0 ? (
                        <div className="py-16 text-center">
                          <MessageSquare className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-600">No communications yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Send a message to a student using the form
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[500px]">
                          <div className="divide-y divide-gray-50">
                            <AnimatePresence>
                              {communications.map((comm) => (
                                <motion.div
                                  key={comm.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  className="px-6 py-4 hover:bg-amber-50/30 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center size-8 rounded-full bg-gray-100 shrink-0 mt-0.5">
                                      <CommTypeIcon type={comm.type} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-sm font-medium text-gray-900">
                                          {comm.student?.name || 'Unknown'}
                                        </span>
                                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-200 text-gray-500">
                                          {comm.type.toUpperCase()}
                                        </Badge>
                                        <CommStatusBadge status={comm.status} />
                                      </div>
                                      {comm.subject && (
                                        <p className="text-sm font-medium text-gray-800 mb-0.5">
                                          {comm.subject}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-600 line-clamp-2">
                                        {comm.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        By {comm.sentByName || 'System'} · {comm.sentAt ? formatDateTime(comm.sentAt) : formatDate(comm.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Delete Note Confirmation Dialog */}
      <Dialog open={deleteNoteDialog.open} onOpenChange={(open) => setDeleteNoteDialog({ open, noteId: null })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteNoteDialog({ open: false, noteId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNote}
              disabled={deleteNoteLoading}
            >
              {deleteNoteLoading ? (
                <RefreshCw className="size-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="size-4 mr-1.5" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
