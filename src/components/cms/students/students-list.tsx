'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Ban,
  UserPlus,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Unlock,
  GraduationCap,
  UserCheck,
  UserX,
  Smartphone,
  Monitor,
  Tablet,
  MonitorSmartphone,
  ShoppingCart,
  BookOpen,
  X,
  RefreshCw,
  ShieldBan,
  Phone,
  Calendar,
  Activity,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  isBlocked: boolean
  blockedReason: string | null
  blockedAt: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  deviceCount?: number
}

interface Stats {
  total: number
  active: number
  inactive: number
  blocked: number
  newThisMonth: number
}

interface DeviceSession {
  id: string
  deviceId: string | null
  deviceName: string | null
  deviceType: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  location: string | null
  lastActive: string
  isActive: boolean
  loginAt: string
  logoutAt: string | null
  userAgent: string | null
}

interface PurchasedCourseItem {
  id: string
  purchasedAt: string
  expiresAt: string | null
  course: {
    id: string
    title: string
    thumbnail: string | null
    price: number
  }
}

interface StudentDetail {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  isBlocked: boolean
  blockedReason: string | null
  blockedAt: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    code: string
    accentColor: string | null
  } | null
  deviceSessions: DeviceSession[]
  purchasedCourses: PurchasedCourseItem[]
  testSummary: {
    totalAttempts: number
    completedAttempts: number
    avgScore: number
  }
  orderSummary: {
    totalOrders: number
    completedOrders: number
    totalSpent: number
  }
  purchasedCoursesCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function timeAgo(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="size-4" />
    case 'desktop':
      return <Monitor className="size-4" />
    case 'tablet':
      return <Tablet className="size-4" />
    default:
      return <MonitorSmartphone className="size-4" />
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function StudentsList() {
  const { orgCode } = useAppStore()

  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, blocked: 0, newThisMonth: 0 })

  // Loading / Error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive' | 'blocked'>('')
  const [page, setPage] = useState(1)
  const limit = 20

  // Add/Edit drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  // Detail sheet
  const [detailSheet, setDetailSheet] = useState<{
    open: boolean
    studentId: string | null
    data: StudentDetail | null
    loading: boolean
  }>({ open: false, studentId: null, data: null, loading: false })

  // Block dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [studentToBlock, setStudentToBlock] = useState<Student | null>(null)
  const [blockReason, setBlockReason] = useState('')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // ─── Fetch ─────────────────────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        organizationId: orgCode,
      })
      const res = await apiFetch(`/api/teacher/students?${params}`)
      const data = await res.json()
      if (data.items) {
        setStudents(data.items)
        setTotal(data.total || 0)
        setStats(data.stats || { total: 0, active: 0, inactive: 0, blocked: 0, newThisMonth: 0 })
      } else {
        setError(data.error || 'Failed to load students')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [orgCode, debouncedSearch, statusFilter, page])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const totalPages = Math.ceil(total / limit)

  // ─── Fetch Student Detail ──────────────────────────────────────────────

  const fetchStudentDetail = useCallback(async (studentId: string) => {
    setDetailSheet((prev) => ({ ...prev, loading: true }))
    try {
      const res = await apiFetch(`/api/teacher/students/${studentId}`)
      if (!res.ok) throw new Error('Failed to load student detail')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load student detail')
      setDetailSheet({ open: true, studentId, data: json.data, loading: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load student detail')
      setDetailSheet((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  const handleOpenDetail = (student: Student) => {
    setDetailSheet({ open: true, studentId: student.id, data: null, loading: true })
    fetchStudentDetail(student.id)
  }

  // ─── Handlers ──────────────────────────────────────────────────────────

  const openAddDrawer = () => {
    setEditStudent(null)
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setFormIsActive(true)
    setDrawerOpen(true)
  }

  const openEditDrawer = (student: Student) => {
    setEditStudent(student)
    setFormName(student.name)
    setFormEmail(student.email)
    setFormPhone(student.phone || '')
    setFormIsActive(student.isActive)
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!formName || !formEmail) {
      toast.error('Name and email are required')
      return
    }
    setSubmitting(true)
    try {
      if (editStudent) {
        const res = await apiFetch(`/api/teacher/students/${editStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            phone: formPhone || null,
            isActive: formIsActive,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.success('Student updated successfully')
          setDrawerOpen(false)
          fetchStudents()
          if (detailSheet.studentId === editStudent.id) {
            fetchStudentDetail(editStudent.id)
          }
        } else {
          toast.error(data.error || 'Failed to update student')
        }
      } else {
        const res = await apiFetch('/api/teacher/students', {
          method: 'POST',
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            phone: formPhone || null,
            isActive: formIsActive,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Student added successfully')
          setDrawerOpen(false)
          fetchStudents()
        } else {
          toast.error(data.error || 'Failed to add student')
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBlockStudent = async () => {
    if (!studentToBlock) return
    if (!blockReason.trim()) {
      toast.error('Reason is required for blocking a student.')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/teacher/students/${studentToBlock.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isBlocked: true,
          blockedReason: blockReason.trim(),
          organizationId: orgCode,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Student blocked successfully')
        setBlockDialogOpen(false)
        setStudentToBlock(null)
        setBlockReason('')
        fetchStudents()
        if (detailSheet.studentId === studentToBlock.id) {
          fetchStudentDetail(studentToBlock.id)
        }
      } else {
        toast.error(data.error || 'Failed to block student')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnblockStudent = async (student: Student) => {
    setActionLoading(student.id)
    try {
      const res = await apiFetch(`/api/teacher/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isBlocked: false,
          organizationId: orgCode,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Student unblocked successfully')
        fetchStudents()
        if (detailSheet.studentId === student.id) {
          fetchStudentDetail(student.id)
        }
      } else {
        toast.error(data.error || 'Failed to unblock student')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokeDevice = async (studentId: string, sessionId: string) => {
    setActionLoading(sessionId)
    try {
      const res = await apiFetch(`/api/teacher/students/${studentId}/revoke-session`, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Device session revoked')
        if (detailSheet.studentId === studentId) {
          fetchStudentDetail(studentId)
        }
        fetchStudents()
      } else {
        toast.error(data.error || 'Failed to revoke device')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!studentToDelete) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/teacher/students/${studentToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Student deleted')
        setDeleteDialogOpen(false)
        setStudentToDelete(null)
        if (detailSheet.studentId === studentToDelete.id) {
          setDetailSheet({ open: false, studentId: null, data: null, loading: false })
        }
        fetchStudents()
      } else {
        toast.error(data.error || 'Failed to delete student')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClearSearch = () => {
    setSearch('')
  }

  // ─── Status Badge ──────────────────────────────────────────────────────

  const StatusBadge = ({ student }: { student: Student }) => {
    if (student.isBlocked) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs">
          <Ban className="size-3 mr-0.5" />
          Blocked
        </Badge>
      )
    }
    if (student.isActive) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
          Active
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 text-xs">
        Inactive
      </Badge>
    )
  }

  // ─── Stats Cards ──────────────────────────────────────────────────────

  const statsCards = [
    { label: 'Total Students', value: stats.total, icon: GraduationCap, bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    { label: 'Active', value: stats.active, icon: UserCheck, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { label: 'Inactive', value: stats.inactive, icon: UserX, bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  ]

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your student enrollments and access
          </p>
        </div>
        <Button onClick={openAddDrawer} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <UserPlus className="size-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading && students.length === 0 ? (
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
          statsCards.map((card) => (
            <Card key={card.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex items-center justify-center size-10 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`size-5 ${card.textColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{(card.value || 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filters Row */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9 bg-gray-50/80 border-gray-200"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['', 'active', 'inactive', 'blocked'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? 'bg-black hover:bg-gray-800 text-white border-black'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900'
                  }
                >
                  {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {/* Table Header Info */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Students</span>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                {total} total
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchStudents} className="text-muted-foreground">
              <RefreshCw className={`size-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {loading && students.length === 0 ? (
            <div className="space-y-0">
              <div className="hidden md:block">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
                    <Skeleton className="size-9 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36 ml-auto" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-3 px-4 pb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="size-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">Something went wrong</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchStudents}>
                Try Again
              </Button>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <GraduationCap className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No students found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter
                  ? 'Try adjusting your search or filter criteria'
                  : 'Students will appear here once they are added'}
              </p>
              {(search || statusFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Phone</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-center">Devices</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Joined</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow
                        key={student.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenDetail(student)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.phone || '—'}</TableCell>
                        <TableCell>
                          <StatusBadge student={student} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs font-normal gap-1 border-gray-200">
                            <Smartphone className="size-3" />
                            {(student.deviceCount ?? 0)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(student.createdAt)}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                disabled={actionLoading === student.id}
                              >
                                {actionLoading === student.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="size-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenDetail(student)}>
                                <Eye className="mr-2 size-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDrawer(student)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (student.email) window.location.href = `mailto:${student.email}`
                                }}
                              >
                                <Mail className="mr-2 size-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {student.isBlocked ? (
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:text-emerald-600"
                                  onClick={() => handleUnblockStudent(student)}
                                >
                                  <Unlock className="mr-2 size-4" />
                                  Unblock
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    setStudentToBlock(student)
                                    setBlockReason('')
                                    setBlockDialogOpen(true)
                                  }}
                                >
                                  <ShieldBan className="mr-2 size-4" />
                                  Block
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setStudentToDelete(student)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 px-4 py-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(student)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleOpenDetail(student)}>
                              <Eye className="mr-2 size-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDrawer(student)}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {student.isBlocked ? (
                              <DropdownMenuItem
                                className="text-emerald-600 focus:text-emerald-600"
                                onClick={() => handleUnblockStudent(student)}
                              >
                                <Unlock className="mr-2 size-4" />
                                Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setStudentToBlock(student)
                                  setBlockReason('')
                                  setBlockDialogOpen(true)
                                }}
                              >
                                <ShieldBan className="mr-2 size-4" />
                                Block
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setStudentToDelete(student)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <StatusBadge student={student} />
                      {(student.deviceCount ?? 0) > 0 && (
                        <Badge variant="outline" className="text-xs font-normal gap-1 border-gray-200">
                          <Smartphone className="size-3" />
                          {(student.deviceCount ?? 0)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        Joined {formatDate(student.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-muted-foreground">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Sheet */}
      <Sheet open={detailSheet.open} onOpenChange={(open) => {
        if (!open) setDetailSheet({ open: false, studentId: null, data: null, loading: false })
      }}>
        <SheetContent side="right" className="sm:max-w-md md:max-w-lg p-0">
          {detailSheet.loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : detailSheet.data ? (
            <>
              <SheetHeader className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-gray-100 text-gray-700 text-base font-semibold">
                      {getInitials(detailSheet.data.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg font-bold text-gray-900 truncate">
                      {detailSheet.data.name}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground truncate">
                      {detailSheet.data.email}
                    </SheetDescription>
                  </div>
                  <StatusBadge student={detailSheet.data} />
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <div className="space-y-2.5">
                      {detailSheet.data.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-gray-700">{detailSheet.data.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-gray-700">{detailSheet.data.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-gray-700">Joined {formatDate(detailSheet.data.createdAt)}</span>
                      </div>
                    </div>

                    {/* Blocked info */}
                    {detailSheet.data.isBlocked && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldBan className="size-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Blocked</span>
                        </div>
                        {detailSheet.data.blockedReason && (
                          <p className="text-xs text-red-700">Reason: {detailSheet.data.blockedReason}</p>
                        )}
                        {detailSheet.data.blockedAt && (
                          <p className="text-xs text-red-600 mt-0.5">Blocked on {formatDateTime(detailSheet.data.blockedAt)}</p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handleUnblockStudent(detailSheet.data as unknown as Student)}
                          disabled={actionLoading === detailSheet.data.id}
                        >
                          {actionLoading === detailSheet.data.id ? (
                            <Loader2 className="size-3.5 mr-1 animate-spin" />
                          ) : (
                            <Unlock className="size-3.5 mr-1" />
                          )}
                          Unblock
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Summary</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BookOpen className="size-3.5 text-gray-500" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{detailSheet.data.purchasedCoursesCount}</p>
                        <p className="text-xs text-muted-foreground">Courses</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="size-3.5 text-gray-500" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{detailSheet.data.testSummary.totalAttempts}</p>
                        <p className="text-xs text-muted-foreground">Tests</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <ShoppingCart className="size-3.5 text-gray-500" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{detailSheet.data.orderSummary.totalSpent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Spent</p>
                      </div>
                    </div>
                    {detailSheet.data.testSummary.completedAttempts > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Average test score: <span className="font-medium text-gray-700">{detailSheet.data.testSummary.avgScore}%</span> ({detailSheet.data.testSummary.completedAttempts} completed)
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Device Sessions */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Active Devices
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        ({detailSheet.data.deviceSessions.filter((d) => d.isActive).length} active)
                      </span>
                    </h3>
                    {detailSheet.data.deviceSessions.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <MonitorSmartphone className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No device sessions found</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {detailSheet.data.deviceSessions.map((device) => (
                          <div
                            key={device.id}
                            className={`p-3 rounded-lg border ${device.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${device.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                  {getDeviceIcon(device.deviceType)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {device.deviceName || device.deviceType}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {device.browser && (
                                      <span className="text-xs text-muted-foreground">{device.browser}</span>
                                    )}
                                    {device.os && (
                                      <span className="text-xs text-muted-foreground">· {device.os}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs border-0 ${
                                    device.isActive
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {device.isActive ? 'Active' : 'Offline'}
                                </Badge>
                                {device.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                    onClick={() => handleRevokeDevice(detailSheet.data!.id, device.id)}
                                    disabled={actionLoading === device.id}
                                  >
                                    {actionLoading === device.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      'Revoke'
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {device.ipAddress && (
                                <span>IP: {device.ipAddress}</span>
                              )}
                              {device.location && (
                                <span>📍 {device.location}</span>
                              )}
                              <span className="ml-auto">Last active {timeAgo(device.lastActive)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Purchased Courses */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Purchased Courses
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        ({detailSheet.data.purchasedCoursesCount})
                      </span>
                    </h3>
                    {detailSheet.data.purchasedCourses.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <BookOpen className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No purchased courses</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detailSheet.data.purchasedCourses.map((pc) => (
                          <div key={pc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-center size-9 rounded-lg bg-gray-100">
                              <BookOpen className="size-4 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{pc.course.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Purchased {formatDate(pc.purchasedAt)}
                                {pc.course.price > 0 && ` · ₹${pc.course.price}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Test Attempts */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Recent Test Attempts
                    </h3>
                    {detailSheet.data.testSummary.totalAttempts === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <Activity className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No test attempts yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {/* Show recent test attempts from the detail data */}
                        {(detailSheet.data as unknown as Record<string, unknown>).testAttempts && Array.isArray((detailSheet.data as unknown as Record<string, unknown>).testAttempts) 
                          ? ((detailSheet.data as unknown as Record<string, unknown>).testAttempts as Array<Record<string, unknown>>).slice(0, 5).map((attempt, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {(attempt.test as Record<string, string>)?.title || 'Test'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {attempt.status === 'completed' ? 'Completed' : attempt.status === 'in_progress' ? 'In Progress' : 'Abandoned'}
                                </p>
                              </div>
                              {attempt.status === 'completed' && (
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">{String(attempt.score)}/{String(attempt.totalMarks)}</p>
                                </div>
                              )}
                            </div>
                          ))
                          : null
                        }
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Student Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md md:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editStudent ? 'Edit Student' : 'Add Student'}</SheetTitle>
            <SheetDescription>
              {editStudent
                ? 'Update student information below'
                : 'Fill in the details to add a new student'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name *</Label>
              <Input
                id="student-name"
                placeholder="Enter student name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-email">Email Address *</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="student@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={!!editStudent}
              />
              {editStudent && (
                <p className="text-xs text-muted-foreground">Email cannot be changed after creation</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-phone">Phone Number</Label>
              <Input
                id="student-phone"
                placeholder="+91 00000 00000"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="student-status">Active Status</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inactive students cannot access the platform
                </p>
              </div>
              <Switch
                id="student-status"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" />{editStudent ? 'Saving...' : 'Adding...'}</>
                ) : (
                  editStudent ? 'Save Changes' : 'Add Student'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Block Student Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldBan className="size-5 text-red-600" />
              Block Student
            </DialogTitle>
            <DialogDescription>
              You are about to block{' '}
              <span className="font-semibold text-foreground">
                {studentToBlock?.name}
              </span>
              . Blocked students cannot access the platform. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="block-reason">Reason for blocking *</Label>
            <Textarea
              id="block-reason"
              placeholder="Enter the reason for blocking this student..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockStudent}
              disabled={submitting || !blockReason.trim()}
            >
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Block Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {studentToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
