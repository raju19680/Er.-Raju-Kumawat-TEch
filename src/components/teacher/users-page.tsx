'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { StudentDetailsSheet } from './student-details-sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  ShieldBan,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ShieldOff,
  UserMinus,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { Textarea } from '@/components/ui/textarea'

interface StudentUser {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  isBlocked: boolean
  blockedReason: string | null
  blockedAt: string | null
  createdAt: string
  testAttemptCount: number
}

interface StudentStats {
  total: number
  active: number
  blocked: number
  newThisMonth: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<StudentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState<StudentStats>({ total: 0, active: 0, blocked: 0, newThisMonth: 0 })
  const itemsPerPage = 10

  // View student dialog
  const [viewStudent, setViewStudent] = useState<StudentUser | null>(null)
  // Block/Unblock dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockTarget, setBlockTarget] = useState<StudentUser | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block')
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentUser | null>(null)
  // Action loading
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPageNum),
        limit: String(itemsPerPage),
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await apiFetch(`/api/teacher/students?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.items || [])
        setTotalItems(data.total || 0)
        if (data.stats) setStats(data.stats)
      }
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleBlockUnblock = async () => {
    if (!blockTarget) return
    setActionLoading(true)
    try {
      const res = await apiFetch('/api/teacher/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: blockTarget.id,
          action: blockAction,
          reason: blockAction === 'block' ? blockReason : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        setBlockDialogOpen(false)
        setBlockTarget(null)
        setBlockReason('')
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to update student')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/students?id=${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to delete student')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase().trim()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q))
    )
  }, [users, searchQuery])

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Students',
      value: stats.total,
      icon: Users,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Active Students',
      value: stats.active,
      icon: UserCheck,
      accentBg: 'bg-emerald-50',
      accentIcon: 'text-emerald-600',
      accentBorder: 'border-l-emerald-500',
    },
    {
      title: 'Blocked Students',
      value: stats.blocked,
      icon: ShieldBan,
      accentBg: 'bg-red-50',
      accentIcon: 'text-red-600',
      accentBorder: 'border-l-red-500',
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth,
      icon: TrendingUp,
      accentBg: 'bg-sky-50',
      accentIcon: 'text-sky-600',
      accentBorder: 'border-l-sky-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your students and their access</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={`min-w-0 rounded-xl border-l-4 ${stat.accentBorder} bg-white shadow-sm`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.title}</p>
                    <div className="text-xl font-bold tracking-tight sm:text-2xl">
                      {loading ? <Skeleton className="h-7 w-12" /> : stat.value}
                    </div>
                  </div>
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${stat.accentBg}`}>
                    <Icon className={`size-5 ${stat.accentIcon}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageNum(1) }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPageNum(1) }}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Test Attempts</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <Users className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No students found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Students will appear here when they sign up'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, idx) => (
                <TableRow key={user.id} className="group">
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-xs shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.phone || <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge className="bg-red-50 text-red-700 border-red-200">Blocked</Badge>
                    ) : user.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{user.testAttemptCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setViewStudent(user)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {user.isBlocked ? (
                          <DropdownMenuItem onClick={() => {
                            setBlockTarget(user)
                            setBlockAction('unblock')
                            setBlockDialogOpen(true)
                          }}>
                            <ShieldOff className="mr-2 h-4 w-4" /> Unblock Student
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => {
                            setBlockTarget(user)
                            setBlockAction('block')
                            setBlockReason('')
                            setBlockDialogOpen(true)
                          }}>
                            <ShieldBan className="mr-2 h-4 w-4" /> Block Student
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setDeleteTarget(user)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showing X to Y of Z */}
      {!loading && totalItems > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPageNum - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPageNum * itemsPerPage, totalItems)} of {totalItems} entries
          </p>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))}
                    className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPageNum <= 3) {
                    page = i + 1
                  } else if (currentPageNum >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPageNum - 2 + i
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPageNum}
                        onClick={() => setCurrentPageNum(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))}
                    className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* View Student Details Sheet */}
      <StudentDetailsSheet
        studentId={viewStudent?.id || null}
        open={!!viewStudent}
        onOpenChange={(open) => {
          if (!open) setViewStudent(null)
        }}
        onUpdated={fetchUsers}
      />

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{blockAction === 'block' ? 'Block Student' : 'Unblock Student'}</DialogTitle>
            <DialogDescription>
              {blockAction === 'block'
                ? `This will prevent ${blockTarget?.name} from accessing the platform.`
                : `This will restore access for ${blockTarget?.name}.`}
            </DialogDescription>
          </DialogHeader>
          {blockAction === 'block' && (
            <div className="space-y-2">
              <Label>Reason for blocking (optional)</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking this student..."
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className={blockAction === 'block' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
              onClick={handleBlockUnblock}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : blockAction === 'block' ? 'Block Student' : 'Unblock Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone. All associated data including test attempts and orders will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
