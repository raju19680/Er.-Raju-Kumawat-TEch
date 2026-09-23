'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  Inbox,
  Power,
  PowerOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

const PREDEFINED_COLORS = [
  '#D97706',
  '#2563EB',
  '#059669',
  '#DC2626',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#4F46E5',
]

// ── Types ────────────────────────────────────────────────────────────────
interface Department {
  id: string
  name: string
  code: string
  description: string | null
  headName: string | null
  headEmail: string | null
  headPhone: string | null
  icon: string | null
  color: string | null
  status: string
  sortOrder: number
  organizationId: string
  createdAt: string
  updatedAt: string
  studentCount: number
}

interface DepartmentStats {
  total: number
  active: number
  inactive: number
  totalStudents: number
}

interface DepartmentForm {
  name: string
  code: string
  description: string
  headName: string
  headEmail: string
  headPhone: string
  color: string
  status: string
}

const emptyForm: DepartmentForm = {
  name: '',
  code: '',
  description: '',
  headName: '',
  headEmail: '',
  headPhone: '',
  color: PREDEFINED_COLORS[0],
  status: 'active',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DEPARTMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function DepartmentsPage() {
  const orgCode = useAppStore(s => s.orgCode)
  const [items, setItems] = useState<Department[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [stats, setStats] = useState<DepartmentStats>({ total: 0, active: 0, inactive: 0, totalStudents: 0 })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemsPerPage = 10

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Department | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [form, setForm] = useState<DepartmentForm>(emptyForm)

  // Debounced search: update debouncedSearch 400ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        organizationId: orgCode,
        page: String(currentPageNum),
        limit: String(itemsPerPage),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await apiFetch(`/api/teacher/departments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalItems(data.total || 0)
        if (data.stats) setStats(data.stats)
      }
    } catch {
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [currentPageNum, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openAddDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: Department) => {
    setEditingItem(item)
    setForm({
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      headName: item.headName || '',
      headEmail: item.headEmail || '',
      headPhone: item.headPhone || '',
      color: item.color || PREDEFINED_COLORS[0],
      status: item.status || 'active',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Department name is required')
      return
    }
    if (!form.code.trim()) {
      toast.error('Department code is required')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        // PUT - update
        const res = await apiFetch(`/api/teacher/departments/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            code: form.code.toUpperCase(),
            description: form.description || null,
            headName: form.headName || null,
            headEmail: form.headEmail || null,
            headPhone: form.headPhone || null,
            color: form.color || null,
            status: form.status,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to update department')
          return
        }
        toast.success('Department updated successfully')
      } else {
        // POST - create
        const res = await apiFetch('/api/teacher/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            code: form.code.toUpperCase(),
            description: form.description || null,
            headName: form.headName || null,
            headEmail: form.headEmail || null,
            headPhone: form.headPhone || null,
            color: form.color || null,
            status: form.status,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to create department')
          return
        }
        toast.success('Department created successfully')
      }
      setDialogOpen(false)
      setEditingItem(null)
      fetchItems()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (item: Department) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch(`/api/teacher/departments/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(newStatus === 'active' ? 'Department activated' : 'Department deactivated')
      fetchItems()
    } catch {
      toast.error('Failed to update department status')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/departments/${itemToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Department deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchItems()
    } catch {
      toast.error('Failed to delete department')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const statCards = [
    {
      title: 'Total Departments',
      value: stats.total,
      icon: Building2,
      accentBg: 'bg-amber-50',
      accentIcon: 'text-amber-600',
      accentBorder: 'border-l-amber-500',
    },
    {
      title: 'Active Departments',
      value: stats.active,
      icon: CheckCircle,
      accentBg: 'bg-emerald-50',
      accentIcon: 'text-emerald-600',
      accentBorder: 'border-l-emerald-500',
    },
    {
      title: 'Inactive Departments',
      value: stats.inactive,
      icon: XCircle,
      accentBg: 'bg-red-50',
      accentIcon: 'text-red-600',
      accentBorder: 'border-l-red-500',
    },
    {
      title: 'Total Students in Depts',
      value: stats.totalStudents,
      icon: Users,
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your organization&apos;s departments</p>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-fit"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
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
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPageNum(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val)
            setCurrentPageNum(1)
          }}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.NO</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Head</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <Building2 className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm">No departments found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create a department to get started'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id} className="group hover:bg-gray-50">
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPageNum - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-9 items-center justify-center rounded-lg shrink-0"
                        style={{
                          backgroundColor: item.color ? `${item.color}15` : '#F59E0B15',
                        }}
                      >
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: item.color || '#D97706' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <Badge
                            variant="outline"
                            className="text-xs font-mono font-bold uppercase px-1.5 py-0"
                          >
                            {item.code}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.headName ? (
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.headName}</p>
                        {item.headEmail && (
                          <p className="text-xs text-muted-foreground truncate">{item.headEmail}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      {item.studentCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.status === 'active' ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
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
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                          {item.status === 'active' ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setItemToDelete(item)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Add/Edit Department Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the department details below.' : 'Fill in the details to create a new department.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dept-name">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter department name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-code">
                Department Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g., CS, MECH, ECE"
                className="uppercase"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Short code shown as a badge (e.g., CS for Computer Science)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the department..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Department Head</p>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dept-head-name">Head Name</Label>
                  <Input
                    id="dept-head-name"
                    value={form.headName}
                    onChange={(e) => setForm({ ...form, headName: e.target.value })}
                    placeholder="Enter head name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dept-head-email">Head Email</Label>
                    <Input
                      id="dept-head-email"
                      type="email"
                      value={form.headEmail}
                      onChange={(e) => setForm({ ...form, headEmail: e.target.value })}
                      placeholder="head@department.edu"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dept-head-phone">Head Phone</Label>
                    <Input
                      id="dept-head-phone"
                      value={form.headPhone}
                      onChange={(e) => setForm({ ...form, headPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`size-8 rounded-full border-2 transition-all cursor-pointer ${
                        form.color === color
                          ? 'border-gray-900 scale-110 ring-2 ring-offset-1 ring-gray-300'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm({ ...form, color })}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dept-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger id="dept-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : editingItem ? 'Update Department' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{itemToDelete?.name}</span>? This action cannot be
              undone. Students in this department will be unlinked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
