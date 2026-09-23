'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Send,
  Search,
  Filter,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  GraduationCap,
  Globe,
  Eye,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────
interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  targetRole: string
  senderId: string
  senderRole: string
  senderName: string | null
  recipientId: string | null
  organizationId: string
  createdAt: string
  organizationName: string | null
  organizationCode: string | null
}

interface OrganizationOption {
  id: string
  name: string
  code: string
  status: string
}

interface NotificationFormState {
  title: string
  message: string
  type: string
  targetRole: string
  organizationId: string
}

const defaultFormState: NotificationFormState = {
  title: '',
  message: '',
  type: 'info',
  targetRole: 'all',
  organizationId: '',
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Warning' },
  success: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Success' },
  error: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Error' },
}

const TARGET_ROLE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  all: { label: 'All', icon: Users },
  teacher: { label: 'Teachers', icon: GraduationCap },
  student: { label: 'Students', icon: GraduationCap },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatNumberIN(value: number): string {
  return value.toLocaleString('en-IN')
}

// ── Loading Skeletons ─────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="size-10 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <Skeleton className="size-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
                <div className="flex gap-2 mt-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="size-7 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center">
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="size-6 text-red-500" />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">Failed to load notifications</p>
        <p className="text-xs text-muted-foreground mb-4">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Send Notification Dialog ──────────────────────────────────────────────────
function SendNotificationDialog({
  open,
  onOpenChange,
  onNotificationSent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationSent: () => void
}) {
  const [form, setForm] = useState<NotificationFormState>(defaultFormState)
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)

  // Fetch organizations for the dropdown
  useEffect(() => {
    if (open) {
      apiFetch('/api/admin/organizations')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrganizations(data.organizations || [])
          }
        })
        .catch(() => {
          // Silently fail; org dropdown will just be empty
        })
    }
  }, [open])

  const resetForm = useCallback(() => {
    setForm(defaultFormState)
    setError('')
    setSuccess(false)
    setCreatedCount(0)
  }, [])

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }, [onOpenChange, resetForm])

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.message.trim()) { setError('Message is required'); return }

    setLoading(true)
    setError('')

    try {
      const body: Record<string, string> = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        targetRole: form.targetRole,
      }

      // Only include organizationId if it's not empty (empty = broadcast to ALL)
      if (form.organizationId && form.organizationId !== '__all__') {
        body.organizationId = form.organizationId
      }

      const res = await apiFetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || data.message || 'Failed to send notification')
        setLoading(false)
        return
      }

      setCreatedCount(data.createdCount || 1)
      setSuccess(true)
      toast.success(data.message || `Notification sent to ${data.createdCount || 1} organization(s)`)

      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onNotificationSent()
      }, 1500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Preview helpers
  const selectedType = TYPE_CONFIG[form.type] || TYPE_CONFIG.info
  const TypeIcon = selectedType.icon
  const targetLabel = TARGET_ROLE_LABELS[form.targetRole]?.label || 'All'
  const orgLabel = !form.organizationId || form.organizationId === '__all__'
    ? 'All Organizations'
    : organizations.find((o) => o.id === form.organizationId)?.name || 'Unknown Org'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Send className="size-5 text-amber-600" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Broadcast a notification to organizations on the platform.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">
              Notification sent to {createdCount} organization{createdCount !== 1 ? 's' : ''}!
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="notifTitle" className="text-xs font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="notifTitle"
                placeholder="e.g. Platform maintenance scheduled"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="notifMessage" className="text-xs font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="notifMessage"
                placeholder="Write your notification message here..."
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="text-sm resize-none"
              />
            </div>

            {/* Type + Target Role row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <span className="flex items-center gap-2">
                        <Info className="size-3.5 text-blue-600" />
                        Info
                      </span>
                    </SelectItem>
                    <SelectItem value="warning">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="size-3.5 text-amber-600" />
                        Warning
                      </span>
                    </SelectItem>
                    <SelectItem value="success">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Success
                      </span>
                    </SelectItem>
                    <SelectItem value="error">
                      <span className="flex items-center gap-2">
                        <XCircle className="size-3.5 text-red-600" />
                        Error
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Target Role</Label>
                <Select
                  value={form.targetRole}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, targetRole: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Users className="size-3.5" />
                        All
                      </span>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="size-3.5" />
                        Teachers
                      </span>
                    </SelectItem>
                    <SelectItem value="student">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="size-3.5" />
                        Students
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <Globe className="size-3.5" />
                Organization
              </Label>
              <Select
                value={form.organizationId || '__all__'}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    organizationId: value === '__all__' ? '' : value,
                  }))
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    <span className="flex items-center gap-2">
                      <Globe className="size-3.5 text-amber-600" />
                      All Organizations (Broadcast)
                    </span>
                  </SelectItem>
                  <Separator className="my-1" />
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              org.status === 'active'
                                ? '#10b981'
                                : org.status === 'trial'
                                ? '#f59e0b'
                                : '#94a3b8',
                          }}
                        />
                        {org.name}
                        <span className="text-muted-foreground text-xs">({org.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select &quot;All Organizations&quot; to broadcast to every org on the platform.
              </p>
            </div>

            <Separator />

            {/* Preview Card */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Preview</Label>
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${selectedType.bgColor}`}>
                    <TypeIcon className={`size-4.5 ${selectedType.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {form.title || 'Notification Title'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {form.message || 'Your notification message will appear here...'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs px-1.5 py-0 ${selectedType.bgColor} ${selectedType.color} border-0`}
                      >
                        {selectedType.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-gray-100 text-gray-600 border-0">
                        <Users className="size-2.5 mr-0.5" />
                        {targetLabel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-gray-100 text-gray-600 border-0">
                        <Globe className="size-2.5 mr-0.5" />
                        {orgLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <>
                  <Send className="size-4 mr-1" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Notification Dialog ────────────────────────────────────────────────
function DeleteNotificationDialog({
  open,
  onOpenChange,
  notification,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  notification: NotificationItem | null
  onDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!notification) return

    setLoading(true)
    try {
      const res = await apiFetch(`/api/notifications/${notification.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!data.success && data.error) {
        toast.error(data.error || 'Failed to delete notification')
        setLoading(false)
        return
      }

      toast.success('Notification deleted successfully.')
      onOpenChange(false)
      onDeleted()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!notification) return null

  const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Delete Notification</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-red-700">
                Are you sure you want to delete this notification?
              </p>
            </div>
          </div>

          {/* Preview of the notification being deleted */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-start gap-3">
              <div className={`flex items-center justify-center size-7 rounded-lg shrink-0 ${typeConfig.bgColor}`}>
                {React.createElement(typeConfig.icon, { className: `size-3.5 ${typeConfig.color}` })}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              <>
                <Trash2 className="size-4 mr-1" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')

  // Dialogs
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)

  const limit = 20

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError('')

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (typeFilter && typeFilter !== 'all') {
        params.set('type', typeFilter)
      }

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const res = await apiFetch(`/api/admin/notifications?${params.toString()}`)
      const data = await res.json()

      if (data.error) {
        setFetchError(data.error)
        return
      }

      setNotifications(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      setFetchError('Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, searchQuery])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── Computed stats ──
  const thisMonth = notifications.filter((n) => {
    const d = new Date(n.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // ── Handlers ──
  const handleSearch = () => {
    setSearchQuery(searchInput)
    setPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    setPage(1)
  }

  const handleDelete = (notification: NotificationItem) => {
    setSelectedNotification(notification)
    setDeleteDialogOpen(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Full error state
  if (fetchError && !loading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="size-6 text-amber-600" />
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Send and manage notifications across all organizations.
            </p>
          </div>
        </div>
        <ErrorState message={fetchError} onRetry={fetchNotifications} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="size-6 text-amber-600" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send and manage notifications across all organizations.
          </p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          onClick={() => setSendDialogOpen(true)}
        >
          <Send className="size-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Stats Row */}
      {loading && notifications.length === 0 ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-amber-50">
                  <Send className="size-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumberIN(total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Sent</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-50">
                  <Clock className="size-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumberIN(thisMonth)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">This Month</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-blue-50">
                  <Eye className="size-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumberIN(unreadCount)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Unread</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, message, or sender..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 bg-gray-50/80 border-gray-200"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-full sm:w-[160px] border-gray-200">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">
                  <span className="flex items-center gap-1.5">
                    <Info className="size-3 text-blue-600" /> Info
                  </span>
                </SelectItem>
                <SelectItem value="warning">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3 text-amber-600" /> Warning
                  </span>
                </SelectItem>
                <SelectItem value="success">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Success
                  </span>
                </SelectItem>
                <SelectItem value="error">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="size-3 text-red-600" /> Error
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleSearch}
              className="border-gray-200"
            >
              <Search className="size-4 mr-1.5" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification List */}
      {loading && notifications.length === 0 ? (
        <NotificationSkeleton />
      ) : notifications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="size-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No notifications found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Send your first notification to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">All Notifications</CardTitle>
              <span className="text-xs text-muted-foreground">
                {formatNumberIN(total)} notification{total !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
                  const TypeIcon = typeConfig.icon
                  const targetConfig = TARGET_ROLE_LABELS[notification.targetRole] || TARGET_ROLE_LABELS.all
                  const TargetIcon = targetConfig.icon

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Type Icon */}
                      <div
                        className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${typeConfig.bgColor}`}
                      >
                        <TypeIcon className={`size-4.5 ${typeConfig.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-muted-foreground hover:text-red-600 h-7 w-7 p-0"
                            onClick={() => handleDelete(notification)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center flex-wrap gap-1.5 mt-2">
                          {/* Type badge */}
                          <Badge
                            variant="secondary"
                            className={`text-xs px-1.5 py-0 border-0 ${typeConfig.bgColor} ${typeConfig.color}`}
                          >
                            {typeConfig.label}
                          </Badge>

                          {/* Target role badge */}
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0 bg-gray-100 text-gray-600 border-0"
                          >
                            <TargetIcon className="size-2.5 mr-0.5" />
                            {targetConfig.label}
                          </Badge>

                          {/* Organization */}
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0 bg-gray-100 text-gray-600 border-0"
                          >
                            {notification.organizationName ? (
                              <>
                                <span className="size-1.5 rounded-full bg-amber-500 mr-1 inline-block" />
                                {notification.organizationName}
                              </>
                            ) : (
                              <>
                                <Globe className="size-2.5 mr-0.5" />
                                All Organizations
                              </>
                            )}
                          </Badge>

                          {/* Sender */}
                          {notification.senderName && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 bg-gray-100 text-gray-600 border-0"
                            >
                              by {notification.senderName}
                              {notification.senderRole === 'platform_admin' && (
                                <span className="ml-1 text-amber-600">Admin</span>
                              )}
                            </Badge>
                          )}

                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}

                          {/* Time */}
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <SendNotificationDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onNotificationSent={fetchNotifications}
      />

      <DeleteNotificationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        notification={selectedNotification}
        onDeleted={fetchNotifications}
      />
    </div>
  )
}
