'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  GraduationCap,
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  ShieldBan,
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  LogOut,
  KeyRound,
  Trash2,
  Ban,
  Unlock,
  Phone,
  Building2,
  Users,
  Activity,
  ShoppingCart,
  BookOpen,
  ChevronDown,
  MonitorSmartphone,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface StudentOrganization {
  id: string
  name: string
  code: string
  accentColor: string | null
}

interface StudentTeacher {
  id: string
  name: string
  organization?: { id: string; name: string } | null
  studentCount?: number
}

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  isBlocked?: boolean
  blockedReason?: string | null
  createdAt: string
  updatedAt: string
  organization: StudentOrganization | null
  teacher: StudentTeacher | null
  deviceCount?: number
}

interface Stats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  blocked: number
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
}

interface StudentDetail {
  student: Student & {
    blockedAt?: string | null
  }
  devices: DeviceSession[]
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

interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface ApiResponse {
  success: boolean
  students: Student[]
  stats: Stats
  teachers: StudentTeacher[]
  pagination: Pagination
  message?: string
}

interface OrganizationOption {
  id: string
  name: string
}

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20
const DEBOUNCE_MS = 400

type StatusFilter = '' | 'active' | 'inactive' | 'blocked'

// ── Helpers ──────────────────────────────────────────────────────────────────
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  // Data state
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, newThisMonth: 0, blocked: 0 })
  const [teachers, setTeachers] = useState<StudentTeacher[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 })
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Detail sheet state
  const [detailSheet, setDetailSheet] = useState<{
    open: boolean
    studentId: string | null
    data: StudentDetail | null
    loading: boolean
  }>({ open: false, studentId: null, data: null, loading: false })

  // Add Student Dialog
  const [addDialog, setAddDialog] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', organizationId: '' })
  const [addLoading, setAddLoading] = useState(false)

  // Edit Student Dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; student: Student | null }>({ open: false, student: null })
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', organizationId: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Block Student Dialog
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; student: Student | null }>({ open: false, student: null })
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)

  // Delete Student Dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; student: Student | null }>({ open: false, student: null })
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Reset page when filter changes ──
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, selectedTeacherId])

  // ── Fetch organizations for Add/Edit ──
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await apiFetch('/api/admin/organizations')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.organizations) {
            setOrganizations(data.organizations.map((o: any) => ({ id: o.id, name: o.name })))
          }
        }
      } catch {
        // Silently fail
      }
    }
    fetchOrgs()
  }, [])

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      if (selectedTeacherId) params.set('teacherId', selectedTeacherId)
      params.set('page', String(currentPage))
      params.set('pageSize', String(PAGE_SIZE))

      const url = `/api/admin/students?${params.toString()}`
      const res = await apiFetch(url)

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      const data: ApiResponse = await res.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch students')
      }

      setStudents(data.students)
      setStats(data.stats)
      setTeachers(data.teachers || [])
      setPagination(data.pagination || { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 })
    } catch (err) {
      console.error('Fetch students error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, selectedTeacherId, currentPage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Fetch student detail ──
  const fetchStudentDetail = useCallback(async (studentId: string) => {
    setDetailSheet((prev) => ({ ...prev, loading: true }))
    try {
      const res = await apiFetch(`/api/admin/students/${studentId}`)
      if (!res.ok) throw new Error('Failed to load student detail')
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to load student detail')
      // Map flat API response to StudentDetail structure
      const d = json.data
      const detail: StudentDetail = {
        student: {
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          avatar: d.avatar,
          isActive: d.isActive,
          isBlocked: d.isBlocked,
          blockedReason: d.blockedReason,
          blockedAt: d.blockedAt,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          organization: d.organization,
          teacher: d.teacher,
        },
        devices: d.deviceSessions || [],
        testSummary: d.testSummary || { totalAttempts: 0, completedAttempts: 0, avgScore: 0 },
        orderSummary: d.orderSummary || { totalOrders: 0, completedOrders: 0, totalSpent: 0 },
        purchasedCoursesCount: d.purchasedCoursesCount || 0,
      }
      setDetailSheet({ open: true, studentId, data: detail, loading: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load student detail')
      setDetailSheet((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  // ── Handle open detail ──
  const handleOpenDetail = (student: Student) => {
    setDetailSheet({ open: true, studentId: student.id, data: null, loading: true })
    fetchStudentDetail(student.id)
  }

  // ── Handle action (block/unblock/activate/deactivate/force_logout/reset_password) ──
  const handleAction = async (studentId: string, action: string, extra?: { reason?: string; deviceId?: string }) => {
    setActionLoading(studentId + action)
    try {
      const res = await apiFetch(`/api/admin/students/${studentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: extra?.reason, deviceId: extra?.deviceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Action failed')
      toast.success(data.message)
      // Refresh data
      fetchData()
      // If detail sheet is open for this student, refresh it
      if (detailSheet.studentId === studentId) {
        fetchStudentDetail(studentId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Handle revoke device ──
  const handleRevokeDevice = async (studentId: string, deviceId: string) => {
    setActionLoading(deviceId)
    try {
      const res = await apiFetch(`/api/admin/students/${studentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_device', deviceId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to revoke device')
      toast.success(data.message)
      if (detailSheet.studentId === studentId) {
        fetchStudentDetail(studentId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke device')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Add Student ──
  const handleAddStudent = async () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.organizationId) {
      toast.error('Name, email, and organization are required.')
      return
    }
    setAddLoading(true)
    try {
      const res = await apiFetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim() || null,
          organizationId: addForm.organizationId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create student')
      toast.success('Student created successfully!')
      setAddDialog(false)
      setAddForm({ name: '', email: '', phone: '', organizationId: '' })
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create student')
    } finally {
      setAddLoading(false)
    }
  }

  // ── Edit Student ──
  const handleEditStudent = async () => {
    if (!editDialog.student) return
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error('Name and email are required.')
      return
    }
    setEditLoading(true)
    try {
      const res = await apiFetch(`/api/admin/students/${editDialog.student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update student')
      toast.success('Student updated successfully!')
      setEditDialog({ open: false, student: null })
      fetchData()
      if (detailSheet.studentId === editDialog.student.id) {
        fetchStudentDetail(editDialog.student.id)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update student')
    } finally {
      setEditLoading(false)
    }
  }

  // ── Block Student ──
  const handleBlockStudent = async () => {
    if (!blockDialog.student) return
    if (!blockReason.trim()) {
      toast.error('Reason is required for blocking a student.')
      return
    }
    setBlockLoading(true)
    try {
      await handleAction(blockDialog.student.id, 'block', { reason: blockReason.trim() })
      setBlockDialog({ open: false, student: null })
      setBlockReason('')
    } finally {
      setBlockLoading(false)
    }
  }

  // ── Delete Student ──
  const handleDeleteStudent = async () => {
    if (!deleteDialog.student) return
    if (deleteConfirmName !== deleteDialog.student.name) {
      toast.error('Student name does not match.')
      return
    }
    setDeleteLoading(true)
    try {
      const res = await apiFetch(`/api/admin/students/${deleteDialog.student.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete student')
      toast.success(data.message)
      setDeleteDialog({ open: false, student: null })
      setDeleteConfirmName('')
      setDetailSheet({ open: false, studentId: null, data: null, loading: false })
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Clear search ──
  const handleClearSearch = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setCurrentPage(1)
  }

  // ── Get teacher for a selected org (for add dialog auto-fill) ──
  const selectedOrgTeacher = useMemo(() => {
    if (!addForm.organizationId) return null
    return teachers.find((t) => t.organization?.id === addForm.organizationId) || null
  }, [addForm.organizationId, teachers])

  // ── Status badge ──
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
      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0 text-xs">
        Inactive
      </Badge>
    )
  }

  // ── Stats Cards ──
  const statsCards = [
    { label: 'Total Students', value: stats.total, icon: GraduationCap, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
    { label: 'Active', value: stats.active, icon: UserCheck, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { label: 'Inactive', value: stats.inactive, icon: UserX, bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { label: 'Blocked', value: stats.blocked, icon: ShieldBan, bgColor: 'bg-red-50', textColor: 'text-red-600' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all students across the platform.
          </p>
        </div>
        <Button
          onClick={() => setAddDialog(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white self-start sm:self-auto"
        >
          <UserPlus className="size-4 mr-1.5" />
          Add Student
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
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
                  <p className="text-xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Teacher-wise Filter Bar */}
      {teachers.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Teacher</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedTeacherId === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTeacherId('')}
                className={
                  selectedTeacherId === ''
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                    : 'border-gray-200 text-gray-600 hover:text-gray-900'
                }
              >
                All Teachers
              </Button>
              {teachers.map((teacher) => (
                <Button
                  key={teacher.id}
                  variant={selectedTeacherId === teacher.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={
                    selectedTeacherId === teacher.id
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900'
                  }
                >
                  <span>{teacher.name}</span>
                  {teacher.organization && (
                    <span className="text-xs opacity-70 ml-1.5">
                      ({teacher.organization.name})
                    </span>
                  )}
                  {teacher.studentCount !== undefined && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 bg-white/20">
                      {teacher.studentCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search / Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 bg-gray-50/80 border-gray-200"
              />
              {searchQuery && (
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
              {(['', 'active', 'inactive', 'blocked'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
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

      {/* Error State */}
      {error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Failed to load students</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0">
              <RefreshCw className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Students Table / Cards */}
      {!error && (
        <Card className="border-0 shadow-sm">
          <CardContent className="px-0 pb-0">
            {/* Table Header Info */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {selectedTeacherId
                    ? teachers.find((t) => t.id === selectedTeacherId)?.name || 'Students'
                    : 'All Students'}
                </span>
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  {pagination.totalItems} total
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchData} className="text-muted-foreground">
                <RefreshCw className={`size-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
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
            ) : students.length === 0 ? (
              <div className="py-16 text-center">
                <GraduationCap className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">No students found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery || statusFilter || selectedTeacherId
                    ? 'Try adjusting your search or filters'
                    : 'Students will appear here once they are added'}
                </p>
                {(searchQuery || statusFilter || selectedTeacherId) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSearchQuery('')
                      setDebouncedSearch('')
                      setStatusFilter('')
                      setSelectedTeacherId('')
                      setCurrentPage(1)
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
                        <TableHead className="text-xs font-medium text-muted-foreground">Teacher / Org</TableHead>
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
                          className="border-b border-gray-50 hover:bg-amber-50/30 cursor-pointer transition-colors"
                          onClick={() => handleOpenDetail(student)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarImage src={student.avatar || undefined} />
                                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{student.phone || '—'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700">{student.teacher?.name || '—'}</span>
                              {student.organization && (
                                <span className="text-xs text-muted-foreground">{student.organization.name}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge student={student} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs font-normal gap-1 border-gray-200">
                              <Smartphone className="size-3" />
                              {student.deviceCount ?? 0}
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
                                  disabled={actionLoading?.startsWith(student.id) ?? false}
                                >
                                  {actionLoading?.startsWith(student.id) ? (
                                    <RefreshCw className="size-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="size-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => handleOpenDetail(student)}>
                                  <Eye className="mr-2 size-4" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditForm({
                                      name: student.name,
                                      email: student.email,
                                      phone: student.phone || '',
                                      organizationId: student.organization?.id || '',
                                    })
                                    setEditDialog({ open: true, student })
                                  }}
                                >
                                  <Activity className="mr-2 size-4" />
                                  Edit Student
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
                                    onClick={() => handleAction(student.id, 'unblock')}
                                    disabled={!!actionLoading}
                                  >
                                    <Unlock className="mr-2 size-4" />
                                    Unblock
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => setBlockDialog({ open: true, student })}
                                  >
                                    <ShieldBan className="mr-2 size-4" />
                                    Block
                                  </DropdownMenuItem>
                                )}
                                {student.isActive ? (
                                  <DropdownMenuItem
                                    className="text-orange-600 focus:text-orange-600"
                                    onClick={() => handleAction(student.id, 'deactivate')}
                                    disabled={!!actionLoading}
                                  >
                                    <UserX className="mr-2 size-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-600"
                                    onClick={() => handleAction(student.id, 'activate')}
                                    disabled={!!actionLoading}
                                  >
                                    <UserCheck className="mr-2 size-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleAction(student.id, 'force_logout')}
                                  disabled={!!actionLoading}
                                >
                                  <LogOut className="mr-2 size-4" />
                                  Force Logout All
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAction(student.id, 'reset_password')}
                                  disabled={!!actionLoading}
                                >
                                  <KeyRound className="mr-2 size-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    setDeleteConfirmName('')
                                    setDeleteDialog({ open: true, student })
                                  }}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete Student
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
                      className="border border-gray-100 rounded-lg p-4 hover:bg-amber-50/30 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(student)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={student.avatar || undefined} />
                            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <StatusBadge student={student} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7 -mr-1">
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenDetail(student)}>
                                <Eye className="mr-2 size-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditForm({
                                    name: student.name,
                                    email: student.email,
                                    phone: student.phone || '',
                                    organizationId: student.organization?.id || '',
                                  })
                                  setEditDialog({ open: true, student })
                                }}
                              >
                                <Activity className="mr-2 size-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {student.isBlocked ? (
                                <DropdownMenuItem
                                  className="text-emerald-600"
                                  onClick={() => handleAction(student.id, 'unblock')}
                                >
                                  <Unlock className="mr-2 size-4" /> Unblock
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setBlockDialog({ open: true, student })}
                                >
                                  <ShieldBan className="mr-2 size-4" /> Block
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeleteConfirmName('')
                                  setDeleteDialog({ open: true, student })
                                }}
                              >
                                <Trash2 className="mr-2 size-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {student.organization && (
                          <>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Building2 className="size-3" />
                              {student.organization.name}
                            </span>
                            <span className="text-muted-foreground">·</span>
                          </>
                        )}
                        {student.teacher && (
                          <>
                            <span className="text-muted-foreground">{student.teacher.name}</span>
                            <span className="text-muted-foreground">·</span>
                          </>
                        )}
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Smartphone className="size-3" />
                          {student.deviceCount ?? 0}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">Joined {formatDate(student.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground order-2 sm:order-1">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, pagination.totalItems)} of {pagination.totalItems}
                    </p>
                    <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (page === 1 || page === pagination.totalPages) return true
                          if (Math.abs(page - currentPage) <= 1) return true
                          return false
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1]
                          const showEllipsis = prevPage !== undefined && page - prevPage > 1
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="text-xs text-muted-foreground px-1">…</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="icon"
                                className={`size-8 text-xs ${
                                  currentPage === page
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                                    : ''
                                }`}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STUDENT DETAIL SHEET
      ═══════════════════════════════════════════════════════════════════════ */}
      <Sheet
        open={detailSheet.open}
        onOpenChange={(open) => {
          if (!open) setDetailSheet({ open: false, studentId: null, data: null, loading: false })
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          {detailSheet.loading ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : detailSheet.data ? (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Header */}
                <SheetHeader className="p-0 space-y-0">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16">
                      <AvatarImage src={detailSheet.data.student.avatar || undefined} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-lg font-bold">
                        {getInitials(detailSheet.data.student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-lg font-bold text-gray-900 truncate">
                        {detailSheet.data.student.name}
                      </SheetTitle>
                      <p className="text-sm text-muted-foreground truncate">{detailSheet.data.student.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge student={detailSheet.data.student} />
                        <span className="text-xs text-muted-foreground">
                          Joined {formatDate(detailSheet.data.student.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {detailSheet.data.student.isBlocked && detailSheet.data.student.blockedReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs font-medium text-red-800">Blocked Reason:</p>
                      <p className="text-sm text-red-700 mt-0.5">{detailSheet.data.student.blockedReason}</p>
                    </div>
                  )}
                </SheetHeader>

                <Separator />

                {/* Basic Info Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Name</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{detailSheet.data.student.name}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{detailSheet.data.student.email}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{detailSheet.data.student.phone || '—'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Organization</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {detailSheet.data.student.organization?.name || '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Teacher</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {detailSheet.data.student.teacher?.name || '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Status</p>
                      <StatusBadge student={detailSheet.data.student} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Device Sessions Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Device Sessions</h3>
                    <Badge variant="secondary" className="text-xs">{detailSheet.data.devices.length} devices</Badge>
                  </div>
                  {detailSheet.data.devices.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <MonitorSmartphone className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No device sessions found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {detailSheet.data.devices.map((device) => (
                        <div
                          key={device.id}
                          className={`rounded-lg border p-3 transition-colors ${
                            device.isActive ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-md ${
                                device.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {getDeviceIcon(device.deviceType)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {device.deviceName || device.deviceId?.slice(0, 8) || 'Unknown Device'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  {device.browser && <span>{device.browser}</span>}
                                  {device.browser && device.os && <span>·</span>}
                                  {device.os && <span>{device.os}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                className={`text-xs border-0 ${
                                  device.isActive
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {device.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={actionLoading === device.id}
                                onClick={() => handleRevokeDevice(detailSheet.data!.student.id, device.id)}
                              >
                                {actionLoading === device.id ? (
                                  <RefreshCw className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {device.ipAddress && (
                              <span>IP: {device.ipAddress}</span>
                            )}
                            {device.location && (
                              <span>📍 {device.location}</span>
                            )}
                            <span>Last active: {timeAgo(device.lastActive)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Activity Summary Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="size-4 text-blue-600" />
                        <p className="text-xs uppercase tracking-wider text-blue-600">Tests</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {detailSheet.data.testSummary.totalAttempts}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {detailSheet.data.testSummary.completedAttempts} completed · {detailSheet.data.testSummary.avgScore}% avg
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50/50 p-3 border border-amber-100/50">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="size-4 text-amber-600" />
                        <p className="text-xs uppercase tracking-wider text-amber-600">Orders</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {detailSheet.data.orderSummary.totalOrders}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {detailSheet.data.orderSummary.completedOrders} completed · ₹{detailSheet.data.orderSummary.totalSpent}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50/50 p-3 border border-emerald-100/50 col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="size-4 text-emerald-600" />
                        <p className="text-xs uppercase tracking-wider text-emerald-600">Purchased Courses</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {detailSheet.data.purchasedCoursesCount}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Control Actions Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Control Actions</h3>
                  <div className="space-y-2">
                    {/* Edit */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 border-gray-200"
                      onClick={() => {
                        const s = detailSheet.data!.student
                        setEditForm({
                          name: s.name,
                          email: s.email,
                          phone: s.phone || '',
                          organizationId: s.organization?.id || '',
                        })
                        setEditDialog({ open: true, student: s })
                      }}
                    >
                      <Activity className="size-4 mr-2" />
                      Edit Student Info
                    </Button>

                    {/* Block/Unblock */}
                    {detailSheet.data.student.isBlocked ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-emerald-600 hover:text-emerald-700 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
                        onClick={() => {
                          handleAction(detailSheet.data!.student.id, 'unblock')
                        }}
                        disabled={!!actionLoading}
                      >
                        <Unlock className="size-4 mr-2" />
                        Unblock Student
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 border-gray-200 hover:border-red-200 hover:bg-red-50"
                        onClick={() => setBlockDialog({ open: true, student: detailSheet.data!.student })}
                      >
                        <ShieldBan className="size-4 mr-2" />
                        Block Student
                      </Button>
                    )}

                    {/* Activate/Deactivate */}
                    {detailSheet.data.student.isActive ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-orange-600 hover:text-orange-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50"
                        onClick={() => handleAction(detailSheet.data!.student.id, 'deactivate')}
                        disabled={!!actionLoading}
                      >
                        <UserX className="size-4 mr-2" />
                        Deactivate Student
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-emerald-600 hover:text-emerald-700 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleAction(detailSheet.data!.student.id, 'activate')}
                        disabled={!!actionLoading}
                      >
                        <UserCheck className="size-4 mr-2" />
                        Activate Student
                      </Button>
                    )}

                    {/* Force Logout */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 border-gray-200"
                      onClick={() => handleAction(detailSheet.data!.student.id, 'force_logout')}
                      disabled={!!actionLoading}
                    >
                      <LogOut className="size-4 mr-2" />
                      Force Logout All Devices
                    </Button>

                    {/* Reset Password */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 border-gray-200"
                      onClick={() => handleAction(detailSheet.data!.student.id, 'reset_password')}
                      disabled={!!actionLoading}
                    >
                      <KeyRound className="size-4 mr-2" />
                      Reset Password
                    </Button>

                    <Separator />

                    {/* Delete */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={() => {
                        setDeleteConfirmName('')
                        setDeleteDialog({ open: true, student: detailSheet.data!.student })
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete Student
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════════
          ADD STUDENT DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Create a new student account on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                placeholder="Student name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="student@email.com"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                placeholder="Phone number"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-org">Organization *</Label>
              <Select
                value={addForm.organizationId}
                onValueChange={(val) => setAddForm((f) => ({ ...f, organizationId: val }))}
              >
                <SelectTrigger id="add-org">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOrgTeacher && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs text-muted-foreground">Teacher (auto-detected from org)</p>
                <p className="text-sm font-medium text-amber-800">{selectedOrgTeacher.name}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={addLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {addLoading && <RefreshCw className="size-4 animate-spin mr-1.5" />}
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT STUDENT DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => !open && setEditDialog({ open: false, student: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="Student name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="student@email.com"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                placeholder="Phone number"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input
                value={
                  organizations.find((o) => o.id === editForm.organizationId)?.name || '—'
                }
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">Organization cannot be changed after creation.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, student: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStudent}
              disabled={editLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {editLoading && <RefreshCw className="size-4 animate-spin mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          BLOCK STUDENT DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={blockDialog.open}
        onOpenChange={(open) => !open && setBlockDialog({ open: false, student: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block Student</DialogTitle>
            <DialogDescription>
              Block &quot;{blockDialog.student?.name}&quot; from accessing the platform. They will not be able to login or use any services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason for blocking *</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter the reason for blocking this student..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>
            {blockDialog.student?.isBlocked && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-xs font-medium text-red-800">Note: This student is already blocked.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBlockDialog({ open: false, student: null }); setBlockReason('') }}>
              Cancel
            </Button>
            <Button
              onClick={handleBlockStudent}
              disabled={blockLoading || !blockReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {blockLoading && <RefreshCw className="size-4 animate-spin mr-1.5" />}
              <ShieldBan className="size-4 mr-1.5" />
              Block Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, student: null })
            setDeleteConfirmName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Student</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-medium text-red-800 mb-2">
                Warning: This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Student profile &quot;{deleteDialog.student?.name}&quot;</li>
                <li>All test attempts and scores</li>
                <li>All orders and payment records</li>
                <li>All purchased courses</li>
                <li>All device sessions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <strong>{deleteDialog.student?.name}</strong> to confirm:
              </Label>
              <Input
                id="delete-confirm"
                placeholder={deleteDialog.student?.name}
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteDialog({ open: false, student: null }); setDeleteConfirmName('') }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteStudent}
              disabled={deleteLoading || deleteConfirmName !== deleteDialog.student?.name}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading && <RefreshCw className="size-4 animate-spin mr-1.5" />}
              <Trash2 className="size-4 mr-1.5" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
