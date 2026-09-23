'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  GraduationCap,
  Video,
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  Bell,
  Download,
  Play,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  Award,
  Loader2,
  RefreshCw,
  MessageSquare,
  FileCheck,
  UserCheck,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TeacherProfile {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  organizationId: string
  organizationName: string
  organizationLogo: string | null
  specialization: string
  tagline: string
  about: string
  accentColor: string
  primaryColor: string
  socialLinks?: Record<string, string> | null
  stats: {
    totalCourses: number
    totalTests: number
    totalLiveClasses: number
    totalNotes: number
  }
}

interface LiveMeeting {
  id: string
  title: string
  description: string | null
  meetingLink: string | null
  platform: string
  startTime: string
  endTime: string | null
  duration: number
  status: 'live' | 'scheduled' | 'completed' | 'cancelled'
  hostName: string | null
  notes: string | null
  recordingUrl: string | null
}

interface TeacherCourse {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  level: string
  language: string
  status: string
  isEnrolled: boolean
  progress: number
  totalLessons: number
}

interface TeacherTestSeries {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  testCount: number
  tests: {
    id: string
    title: string
    duration: number
    totalMarks: number
    passingMarks: number
  }[]
}

interface StudyDocument {
  id: string
  title: string
  description: string | null
  fileUrl: string | null
  fileType: string
  fileSize: number
  category: string | null
  downloadCount: number
  createdAt: string
}

interface TeacherNotice {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
}

interface TeacherDoubt {
  id: string
  subject: string
  message: string
  status: string
  response?: string | null
  createdAt: string
}

export default function TeacherHub() {
  const {
    setStudentPage,
    setSelectedCourseId,
    setSelectedTestSeriesId,
    selectedTeacherId,
    setSelectedTeacherId,
    openCheckout,
    orgCode,
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [teachersList, setTeachersList] = useState<{ id: string; name: string; specialization: string; avatar: string | null }[]>([])
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null)
  const [liveClasses, setLiveClasses] = useState<LiveMeeting[]>([])
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [testSeries, setTestSeries] = useState<TeacherTestSeries[]>([])
  const [documents, setDocuments] = useState<StudyDocument[]>([])
  const [notices, setNotices] = useState<TeacherNotice[]>([])
  const [doubts, setDoubts] = useState<TeacherDoubt[]>([])
  
  // UI Filters & State
  const [activeTab, setActiveTab] = useState('live')
  const [docSearch, setDocSearch] = useState('')
  const [docCategory, setDocCategory] = useState('all')

  // Doubt submission modal
  const [doubtOpen, setDoubtOpen] = useState(false)
  const [doubtSubject, setDoubtSubject] = useState('')
  const [doubtMessage, setDoubtMessage] = useState('')
  const [submittingDoubt, setSubmittingDoubt] = useState(false)

  // Load Teachers directory first
  const loadTeachersList = useCallback(async () => {
    try {
      const res = await apiFetchJSON<{ success: boolean; teachers: any[] }>(`/api/student/teachers?orgCode=${orgCode}`)
      if (res.success && res.teachers.length > 0) {
        setTeachersList(res.teachers)
        if (!selectedTeacherId) {
          setSelectedTeacherId(res.teachers[0].id)
        }
      }
    } catch (err) {
      console.warn('Failed to load teachers list:', err)
    }
  }, [orgCode, selectedTeacherId, setSelectedTeacherId])

  // Load teacher-specific modules
  const loadTeacherModules = useCallback(async (teacherIdToLoad?: string) => {
    try {
      setLoading(true)
      const targetId = teacherIdToLoad || selectedTeacherId || ''
      const url = targetId ? `/api/student/teacher-modules?teacherId=${targetId}` : `/api/student/teacher-modules`
      
      const res = await apiFetchJSON<{
        success: boolean
        teacher: TeacherProfile
        liveClasses: LiveMeeting[]
        courses: TeacherCourse[]
        testSeries: TeacherTestSeries[]
        documents: StudyDocument[]
        notices: TeacherNotice[]
        doubts: TeacherDoubt[]
      }>(url)

      if (res.success && res.teacher) {
        setTeacher(res.teacher)
        setLiveClasses(res.liveClasses || [])
        setCourses(res.courses || [])
        setTestSeries(res.testSeries || [])
        setDocuments(res.documents || [])
        setNotices(res.notices || [])
        setDoubts(res.doubts || [])
        if (!selectedTeacherId) {
          setSelectedTeacherId(res.teacher.id)
        }
      }
    } catch (err) {
      console.error('Error loading teacher modules:', err)
      toast.error('Failed to sync teacher modules')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedTeacherId, setSelectedTeacherId])

  useEffect(() => {
    loadTeachersList()
  }, [loadTeachersList])

  useEffect(() => {
    loadTeacherModules(selectedTeacherId)
  }, [selectedTeacherId, loadTeacherModules])

  const handleTeacherChange = (newTeacherId: string) => {
    setSelectedTeacherId(newTeacherId)
    loadTeacherModules(newTeacherId)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadTeacherModules(selectedTeacherId)
  }

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCat = docCategory === 'all' || doc.category === docCategory
      const matchesSearch = !docSearch || doc.title.toLowerCase().includes(docSearch.toLowerCase()) || (doc.description && doc.description.toLowerCase().includes(docSearch.toLowerCase()))
      return matchesCat && matchesSearch
    })
  }, [documents, docCategory, docSearch])

  const docCategories = useMemo(() => {
    const cats = new Set<string>()
    documents.forEach((d) => {
      if (d.category) cats.add(d.category)
    })
    return Array.from(cats)
  }, [documents])

  // Submit Doubt
  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doubtSubject.trim() || !doubtMessage.trim()) {
      toast.error('Please enter a subject and your question')
      return
    }

    try {
      setSubmittingDoubt(true)
      const res = await apiFetchJSON<{ success: boolean; query?: any; message?: string }>('/api/support-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[Faculty: ${teacher?.name || 'Teacher'}] ${doubtSubject}`,
          message: doubtMessage,
          teacherId: teacher?.id,
          priority: 'high',
        }),
      })

      if (res.success) {
        toast.success('Your doubt has been submitted to faculty!')
        setDoubtOpen(false)
        setDoubtSubject('')
        setDoubtMessage('')
        // Refresh doubts list
        setDoubts((prev) => [
          {
            id: res.query?.id || Date.now().toString(),
            subject: doubtSubject,
            message: doubtMessage,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        toast.error(res.message || 'Failed to submit question')
      }
    } catch (err) {
      console.error('Error submitting doubt:', err)
      toast.error('Failed to submit question')
    } finally {
      setSubmittingDoubt(false)
    }
  }

  if (loading && !teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="size-10 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-gray-500">Syncing Teacher Portal & Modules...</p>
      </div>
    )
  }

  const accentColor = teacher?.accentColor || '#D97706'
  const liveSessions = liveClasses.filter((c) => c.status === 'live')
  const upcomingSessions = liveClasses.filter((c) => c.status === 'scheduled')
  const pastSessions = liveClasses.filter((c) => c.status === 'completed')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Top Bar & Teacher Switcher ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg text-white" style={{ backgroundColor: accentColor }}>
            <GraduationCap className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Teacher Hub / शिक्षक पोर्टल</h2>
              <Badge variant="outline" className="text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200">
                Synced by Teacher ID
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Access all live classes, courses, tests, study materials, and direct doubts for your faculty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {teachersList.length > 1 && (
            <Select value={selectedTeacherId} onValueChange={handleTeacherChange}>
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <Users className="size-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                {teachersList.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 gap-1.5 text-xs text-gray-600"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Dialog open={doubtOpen} onOpenChange={setDoubtOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 text-xs font-medium text-white shadow-sm" style={{ backgroundColor: accentColor }}>
                <HelpCircle className="size-3.5" />
                Ask Doubt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleSubmitDoubt}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="size-4 text-amber-600" />
                    Ask Question to {teacher?.name || 'Faculty'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Your doubt will be sent directly to your teacher with Teacher ID: <span className="font-mono text-gray-800">{teacher?.id.slice(-8)}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Topic / Subject</label>
                    <Input
                      placeholder="e.g., Physics Chapter 4 Doubt / Question 12"
                      value={doubtSubject}
                      onChange={(e) => setDoubtSubject(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Describe your Doubt in detail</label>
                    <Textarea
                      placeholder="Type your question or concept you didn't understand..."
                      value={doubtMessage}
                      onChange={(e) => setDoubtMessage(e.target.value)}
                      rows={4}
                      className="text-xs resize-none"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDoubtOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submittingDoubt}
                    className="gap-1.5 text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {submittingDoubt ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    Submit Doubt
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ─── Faculty Hero Profile Card ────────────────────────────────────────── */}
      {teacher && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-orange-500/5 border border-amber-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <Avatar className="size-20 ring-4 ring-white shadow-md rounded-2xl">
                {teacher.avatar ? (
                  <AvatarImage src={teacher.avatar} alt={teacher.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-2xl font-bold bg-amber-600 text-white rounded-2xl">
                  {teacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-gray-900">{teacher.name}</h1>
                  <Badge className="bg-amber-600 text-white text-xs gap-1 py-0.5">
                    <Award className="size-3" /> Verified Faculty
                  </Badge>
                  <Badge variant="outline" className="text-xs text-gray-600 border-gray-200">
                    ID: {teacher.id.slice(-8)}
                  </Badge>
                </div>
                <p className="text-xs font-semibold" style={{ color: accentColor }}>
                  {teacher.specialization}
                </p>
                <p className="text-xs text-gray-600 max-w-xl line-clamp-2">
                  {teacher.about}
                </p>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0">
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 text-center shadow-2xs">
                <div className="flex items-center justify-center size-7 rounded-lg bg-amber-100 text-amber-700 mx-auto mb-1">
                  <Video className="size-3.5" />
                </div>
                <p className="text-base font-bold text-gray-900">{teacher.stats.totalLiveClasses}</p>
                <p className="text-xs font-medium text-gray-500">Live Classes</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 text-center shadow-2xs">
                <div className="flex items-center justify-center size-7 rounded-lg bg-blue-100 text-blue-700 mx-auto mb-1">
                  <BookOpen className="size-3.5" />
                </div>
                <p className="text-base font-bold text-gray-900">{teacher.stats.totalCourses}</p>
                <p className="text-xs font-medium text-gray-500">Courses</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 text-center shadow-2xs">
                <div className="flex items-center justify-center size-7 rounded-lg bg-emerald-100 text-emerald-700 mx-auto mb-1">
                  <ClipboardList className="size-3.5" />
                </div>
                <p className="text-base font-bold text-gray-900">{teacher.stats.totalTests}</p>
                <p className="text-xs font-medium text-gray-500">Tests</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 text-center shadow-2xs">
                <div className="flex items-center justify-center size-7 rounded-lg bg-purple-100 text-purple-700 mx-auto mb-1">
                  <FileText className="size-3.5" />
                </div>
                <p className="text-base font-bold text-gray-900">{teacher.stats.totalNotes}</p>
                <p className="text-xs font-medium text-gray-500">Notes/PDFs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Tabs Navigation ────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0 gap-2 flex-wrap">
            <TabsTrigger
              value="live"
              className="gap-2 data-[state=active]:border-b-2 rounded-none pb-3 pt-2 text-xs font-semibold data-[state=active]:bg-transparent"
              style={activeTab === 'live' ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              <Video className="size-4" />
              Live Classes
              {liveSessions.length > 0 && (
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="courses"
              className="gap-2 data-[state=active]:border-b-2 rounded-none pb-3 pt-2 text-xs font-semibold data-[state=active]:bg-transparent"
              style={activeTab === 'courses' ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              <BookOpen className="size-4" />
              Courses ({courses.length})
            </TabsTrigger>

            <TabsTrigger
              value="tests"
              className="gap-2 data-[state=active]:border-b-2 rounded-none pb-3 pt-2 text-xs font-semibold data-[state=active]:bg-transparent"
              style={activeTab === 'tests' ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              <ClipboardList className="size-4" />
              Test Series ({testSeries.length})
            </TabsTrigger>

            <TabsTrigger
              value="notes"
              className="gap-2 data-[state=active]:border-b-2 rounded-none pb-3 pt-2 text-xs font-semibold data-[state=active]:bg-transparent"
              style={activeTab === 'notes' ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              <FileText className="size-4" />
              Study Notes ({documents.length})
            </TabsTrigger>

            <TabsTrigger
              value="doubts"
              className="gap-2 data-[state=active]:border-b-2 rounded-none pb-3 pt-2 text-xs font-semibold data-[state=active]:bg-transparent"
              style={activeTab === 'doubts' ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              <HelpCircle className="size-4" />
              My Doubts ({doubts.length})
            </TabsTrigger>

            <TabsTrigger
              value="notices"
              className="gap-2 data-[state=active]:border-b-2 rounded-none pb-3 pt-2 text-xs font-semibold data-[state=active]:bg-transparent"
              style={activeTab === 'notices' ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              <Bell className="size-4" />
              Notices ({notices.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: Live Classes ────────────────────────────────────────── */}
        <TabsContent value="live" className="space-y-6">
          {/* Active Live Class Banner */}
          {liveSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2.5 bg-red-500"></span>
                </span>
                Happening Right Now / लाइव कक्षाएं
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveSessions.map((meeting) => (
                  <Card key={meeting.id} className="border-red-200 bg-red-50/30 overflow-hidden shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-red-600 text-white animate-pulse text-xs">
                          ● LIVE STREAM
                        </Badge>
                        <Badge variant="outline" className="text-xs uppercase font-semibold text-red-700 bg-white">
                          {meeting.platform}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-gray-900 mt-2">
                        {meeting.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-600">
                        {meeting.description || 'Interactive live session with faculty.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-red-500" />
                          Duration: {meeting.duration} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="size-3.5 text-gray-500" />
                          Host: {meeting.hostName || teacher?.name}
                        </span>
                      </div>
                      <Button
                        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm"
                        onClick={() => {
                          if (meeting.meetingLink) {
                            window.open(meeting.meetingLink, '_blank')
                          } else {
                            toast.info('Live stream link will be connected shortly.')
                          }
                        }}
                      >
                        <Play className="size-4 fill-white" />
                        Join Live Class Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Classes */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="size-4 text-amber-600" />
              Scheduled Upcoming Classes / आगामी कक्षाएं
            </h3>
            {upcomingSessions.length === 0 ? (
              <Card className="p-8 text-center bg-gray-50/50 border-dashed">
                <Video className="size-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">No upcoming live classes right now</p>
                <p className="text-xs text-gray-400 mt-1">Check back later or view past recordings below.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                          {session.platform}
                        </Badge>
                        <span className="text-xs font-semibold text-gray-500">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-bold text-gray-900 line-clamp-1">
                        {session.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 line-clamp-2">
                        {session.description || 'Upcoming live lecture by faculty.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="size-3.5 text-gray-400" />
                        <span>{new Date(session.startTime).toLocaleDateString()}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        onClick={() => {
                          if (session.meetingLink) {
                            window.open(session.meetingLink, '_blank')
                          } else {
                            toast.info('Meeting link will activate before session start.')
                          }
                        }}
                      >
                        <ExternalLink className="size-3.5" />
                        Class Link Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Class Recordings */}
          {pastSessions.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="size-4 text-emerald-600" />
                Past Class Recordings & Notes / पिछली कक्षाएं
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pastSessions.map((session) => (
                  <Card key={session.id} className="bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-gray-900 line-clamp-1">
                        {session.title}
                      </CardTitle>
                      <p className="text-xs text-gray-400">
                        Conducted on {new Date(session.startTime).toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {session.recordingUrl ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs gap-1.5"
                          onClick={() => window.open(session.recordingUrl!, '_blank')}
                        >
                          <Play className="size-3 text-amber-600" />
                          Watch Recording
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Recording not available</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: Courses ────────────────────────────────────────────── */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Faculty Published Courses</h3>
              <p className="text-xs text-gray-500">Comprehensive video courses and curriculum created by this teacher</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50/50 border-dashed">
              <BookOpen className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No courses listed by faculty yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                  <div className="aspect-video relative bg-gray-100 overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50">
                        <BookOpen className="size-10 text-amber-600/40" />
                      </div>
                    )}
                    {course.category && (
                      <Badge className="absolute top-2 left-2 bg-black/60 text-white backdrop-blur-sm text-xs">
                        {course.category}
                      </Badge>
                    )}
                    {course.isEnrolled && (
                      <Badge className="absolute top-2 right-2 bg-emerald-600 text-white text-xs gap-1">
                        <CheckCircle2 className="size-3" /> Enrolled
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="p-4 pb-2 flex-1">
                    <CardTitle className="text-sm font-bold text-gray-900 line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {course.description || 'Master key concepts with structured video lectures and assignments.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    {course.isEnrolled ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-gray-600">
                          <span>Learning Progress</span>
                          <span className="font-bold text-amber-700">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                        <Button
                          className="w-full text-xs font-semibold gap-1.5 text-white mt-2"
                          style={{ backgroundColor: accentColor }}
                          onClick={() => {
                            setSelectedCourseId(course.id)
                            setStudentPage('course-detail')
                          }}
                        >
                          <Play className="size-3.5" />
                          Continue Learning
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-gray-900">
                              {course.price === 0 ? 'Free' : `₹${course.price}`}
                            </span>
                            {course.mrp > course.price && (
                              <span className="text-xs text-gray-400 line-through">₹{course.mrp}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{course.totalLessons} Lessons</p>
                        </div>
                        <Button
                          size="sm"
                          className="text-xs font-medium text-white shadow-sm"
                          style={{ backgroundColor: accentColor }}
                          onClick={() => {
                            if (course.price === 0) {
                              setSelectedCourseId(course.id)
                              setStudentPage('course-detail')
                            } else {
                              openCheckout({
                                id: course.id,
                                type: 'course',
                                title: course.title,
                                price: course.price,
                                mrp: course.mrp,
                                thumbnail: course.thumbnail,
                              })
                            }
                          }}
                        >
                          {course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: Test Series ────────────────────────────────────────── */}
        <TabsContent value="tests" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Faculty Test Series & Mock Exams</h3>
              <p className="text-xs text-gray-500">Regular assessments and quizzes prepared by your teacher</p>
            </div>
          </div>

          {testSeries.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50/50 border-dashed">
              <ClipboardList className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No test series uploaded yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testSeries.map((ts) => (
                <Card key={ts.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="aspect-video relative bg-amber-50/50 flex items-center justify-center p-4">
                    {ts.thumbnail ? (
                      <MediaImage src={ts.thumbnail} alt={ts.title} className="w-full h-full object-contain rounded-md bg-white" />
                    ) : (
                      <div className="text-center">
                        <ClipboardList className="size-10 text-amber-600 mx-auto mb-1 opacity-75" />
                        <span className="text-xs font-bold text-amber-900">{ts.testCount} Tests Included</span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-4 pb-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50">
                        {ts.category || 'Mock Tests'}
                      </Badge>
                      <span className="text-xs font-bold text-gray-700">{ts.testCount} Tests</span>
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 mt-2 line-clamp-1">
                      {ts.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 line-clamp-2">
                      {ts.description || 'Timed online tests with instant analysis and leaderboard.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-base font-extrabold text-gray-900">
                          {ts.price === 0 ? 'Free' : `₹${ts.price}`}
                        </span>
                        {ts.mrp > ts.price && (
                          <span className="text-xs text-gray-400 line-through ml-1.5">₹{ts.mrp}</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="text-xs font-medium text-white shadow-sm gap-1"
                        style={{ backgroundColor: accentColor }}
                        onClick={() => {
                          setSelectedTestSeriesId(ts.id)
                          setStudentPage('test-series-detail')
                        }}
                      >
                        Start Tests <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 4: Notes & Study Material ──────────────────────────────── */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Study Materials & Notes</h3>
              <p className="text-xs text-gray-500">Hand-written notes, handouts, formula sheets, and PDFs</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="size-3.5 absolute left-2.5 top-3 text-gray-400" />
                <Input
                  placeholder="Search notes..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {docCategories.length > 0 && (
                <Select value={docCategory} onValueChange={setDocCategory}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                    {docCategories.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50/50 border-dashed">
              <FileText className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No study materials found</p>
              <p className="text-xs text-gray-400 mt-1">Faculty has not uploaded notes in this category yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <Card key={doc.id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                        <FileText className="size-5" />
                      </div>
                      <Badge variant="outline" className="text-xs uppercase font-bold text-gray-600">
                        {doc.fileType}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {doc.description || 'Study material for regular revision and exam preparation.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {doc.fileSize ? `${doc.fileSize.toFixed(0)} KB` : 'Document'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                      onClick={() => {
                        if (doc.fileUrl) {
                          window.open(doc.fileUrl, '_blank')
                        } else {
                          toast.info('Document link opening...')
                        }
                      }}
                    >
                      <Download className="size-3" /> Download / View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 5: Doubts ────────────────────────────────────────────── */}
        <TabsContent value="doubts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Faculty Doubt Desk</h3>
              <p className="text-xs text-gray-500">Track questions sent directly to your teacher</p>
            </div>
            <Button
              size="sm"
              className="text-xs font-medium text-white shadow-sm gap-1.5"
              style={{ backgroundColor: accentColor }}
              onClick={() => setDoubtOpen(true)}
            >
              <HelpCircle className="size-3.5" /> Ask New Question
            </Button>
          </div>

          {doubts.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50/50 border-dashed">
              <HelpCircle className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No questions asked yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Ask New Question" above to ask your faculty any concept doubt.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {doubts.map((d) => (
                <Card key={d.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">{d.subject}</h4>
                    <Badge
                      className={`text-xs ${
                        d.status === 'answered' || d.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                      variant="outline"
                    >
                      {d.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {d.message}
                  </p>
                  {d.response && (
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <GraduationCap className="size-3.5 text-amber-700" />
                        Faculty Response ({teacher?.name}):
                      </div>
                      <p className="text-xs text-gray-700">{d.response}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Asked on {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 6: Teacher Notices ────────────────────────────────────── */}
        <TabsContent value="notices" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Teacher Announcements & Notices</h3>
              <p className="text-xs text-gray-500">Official class updates, tips, and guidelines from your faculty</p>
            </div>
          </div>

          {notices.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50/50 border-dashed">
              <Bell className="size-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No announcements posted yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <Card key={n.id} className="p-4 border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-600" />
                      {n.title}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    {n.message}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
