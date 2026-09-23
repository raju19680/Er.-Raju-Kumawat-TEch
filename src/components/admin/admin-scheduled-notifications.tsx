'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  Send,
  Calendar,
  Plus,
  XCircle,
  RefreshCw,
  Bell,
  BellRing,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface ScheduledNotification {
  id: string
  title: string
  message: string
  type: string
  targetRole: string
  organizationId: string | null
  organizationName: string | null
  scheduledAt: string
  sentAt: string | null
  status: string
  sentCount: number
  createdBy: string | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  scheduled: number
  sent: number
  cancelled: number
  total: number
}

interface Organization {
  id: string
  name: string
  code: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTypeBadge(type: string) {
  switch (type) {
    case 'warning':
      return { bg: 'bg-amber-100', text: 'text-amber-700', icon: <AlertTriangle className="size-3" /> }
    case 'success':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="size-3" /> }
    case 'error':
      return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="size-3" /> }
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Info className="size-3" /> }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'scheduled':
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Scheduled' }
    case 'sent':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Sent' }
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500', label: status }
  }
}

function getTargetRoleBadge(role: string) {
  switch (role) {
    case 'teacher':
      return { label: 'Teachers', icon: <BookOpen className="size-3" /> }
    case 'student':
      return { label: 'Students', icon: <GraduationCap className="size-3" /> }
    default:
      return { label: 'All Users', icon: <Users className="size-3" /> }
  }
}

function getTimeDisplay(scheduledAt: string, status: string, sentAt: string | null) {
  const now = new Date()
  const scheduled = new Date(scheduledAt)

  if (status === 'sent' && sentAt) {
    const sentDate = new Date(sentAt)
    const diffMs = now.getTime() - sentDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Sent just now'
    if (diffMins < 60) return `Sent ${diffMins}m ago`
    if (diffHours < 24) return `Sent ${diffHours}h ago`
    return `Sent ${diffDays}d ago`
  }

  if (status === 'cancelled') {
    return 'Cancelled'
  }

  // Scheduled — show countdown
  const diffMs = scheduled.getTime() - now.getTime()
  if (diffMs <= 0) {
    return 'Due now'
  }

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `In ${diffMins}m`
  if (diffHours < 24) return `In ${diffHours}h`
  return `In ${diffDays}d`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminScheduledNotificationsPage() {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([])
  const [stats, setStats] = useState<Stats>({ scheduled: 0, sent: 0, cancelled: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ScheduledNotification | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduledNotification | null>(null)

  // Organizations for the create dialog
  const [organizations, setOrganizations] = useState<Organization[]>([])

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formType, setFormType] = useState('info')
  const [formTargetRole, setFormTargetRole] = useState('all')
  const [formOrganizationId, setFormOrganizationId] = useState('all')
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const query = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await apiFetch(`/api/admin/scheduled-notifications${query}`)
      const json = await res.json()
      if (json.success) {
        setNotifications(json.notifications)
        setStats(json.stats)
      }
    } catch {
      toast.error('Failed to load scheduled notifications')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/organizations')
      const json = await res.json()
      if (json.success) {
        setOrganizations(json.organizations)
      }
    } catch {
      // Silently fail — organizations list is not critical
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (createOpen) {
      fetchOrganizations()
    }
  }, [createOpen, fetchOrganizations])

  // Refresh time display every minute
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const resetForm = () => {
    setFormTitle('')
    setFormMessage('')
    setFormType('info')
    setFormTargetRole('all')
    setFormOrganizationId('all')
    setFormScheduledAt('')
  }

  const handleCreate = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Title and message are required.')
      return
    }
    if (!formScheduledAt) {
      toast.error('Scheduled date and time are required.')
      return
    }

    const scheduledDate = new Date(formScheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      toast.error('Invalid scheduled date.')
      return
    }

    setFormSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/scheduled-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          targetRole: formTargetRole,
          organizationId: formOrganizationId === 'all' ? null : formOrganizationId,
          scheduledAt: formScheduledAt,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Scheduled notification created!')
        setCreateOpen(false)
        resetForm()
        fetchNotifications()
      } else {
        toast.error(json.message || 'Failed to create notification')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleCancel = async (notification: ScheduledNotification) => {
    setCancelling(notification.id)
    try {
      const res = await apiFetch('/api/admin/scheduled-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id, status: 'cancelled' }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Notification cancelled')
        fetchNotifications()
      } else {
        toast.error(json.message || 'Failed to cancel notification')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCancelling(null)
      setCancelTarget(null)
    }
  }

  const handleDelete = async (notification: ScheduledNotification) => {
    setDeleting(notification.id)
    try {
      const res = await apiFetch('/api/admin/scheduled-notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Notification deleted')
        fetchNotifications()
      } else {
        toast.error(json.message || 'Failed to delete notification')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  // Get minimum datetime-local value (now)
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BellRing className="size-6 text-amber-600" />
            Scheduled Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage notification broadcasts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Plus className="size-4" />
                Schedule Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px]">
              <DialogHeader>
                <DialogTitle>Schedule Notification</DialogTitle>
                <DialogDescription>
                  Create a new scheduled notification to be sent at a specific time.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Title</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Notification title"
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Message</Label>
                  <Textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={4}
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Role</Label>
                    <Select value={formTargetRole} onValueChange={setFormTargetRole}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="teacher">Teachers</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Organization</Label>
                  <Select value={formOrganizationId} onValueChange={setFormOrganizationId}>
                    <SelectTrigger className="bg-gray-50/80 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Scheduled At</Label>
                  <Input
                    type="datetime-local"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    min={getMinDateTime()}
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleCreate}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Scheduling...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Clock className="size-4" />
                      Schedule
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Scheduled</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.scheduled}</p>
                    <p className="text-xs text-orange-600 mt-1">Pending delivery</p>
                  </div>
                  <div className="flex items-center justify-center size-10 sm:size-12 rounded-xl bg-orange-50">
                    <Clock className="size-5 sm:size-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sent</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.sent}</p>
                    <p className="text-xs text-emerald-600 mt-1">Delivered</p>
                  </div>
                  <div className="flex items-center justify-center size-10 sm:size-12 rounded-xl bg-emerald-50">
                    <Send className="size-5 sm:size-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Cancelled</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.cancelled}</p>
                    <p className="text-xs text-gray-500 mt-1">Not delivered</p>
                  </div>
                  <div className="flex items-center justify-center size-10 sm:size-12 rounded-xl bg-gray-100">
                    <XCircle className="size-5 sm:size-6 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-amber-600 mt-1">All notifications</p>
                  </div>
                  <div className="flex items-center justify-center size-10 sm:size-12 rounded-xl bg-amber-50">
                    <Bell className="size-5 sm:size-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Status Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-white border-gray-200">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Notification List */}
      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <BellRing className="size-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No scheduled notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} notifications found. Try a different filter.`
                  : 'Schedule your first notification to broadcast messages at a specific time.'
                }
              </p>
              {statusFilter === 'all' && (
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-4" />
                  Schedule Notification
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
          <AnimatePresence>
            {notifications.map((notification) => {
              const typeBadge = getTypeBadge(notification.type)
              const statusBadge = getStatusBadge(notification.status)
              const roleBadge = getTargetRoleBadge(notification.targetRole)
              const timeDisplay = getTimeDisplay(notification.scheduledAt, notification.status, notification.sentAt)

              return (
                <motion.div
                  key={notification.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className={`border-0 shadow-sm ${notification.status === 'cancelled' ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Status icon */}
                        <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${statusBadge.bg}`}>
                          {notification.status === 'sent' ? (
                            <Send className={`size-5 ${statusBadge.text}`} />
                          ) : notification.status === 'cancelled' ? (
                            <XCircle className={`size-5 ${statusBadge.text}`} />
                          ) : (
                            <Clock className={`size-5 ${statusBadge.text}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                            <Badge className={`${typeBadge.bg} ${typeBadge.text} border-0 gap-1 text-xs`}>
                              {typeBadge.icon}
                              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </Badge>
                            <Badge className={`${statusBadge.bg} ${statusBadge.text} border-0 text-xs`}>
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(notification.scheduledAt)}
                            </span>
                            <span className={`flex items-center gap-1 font-medium ${
                              notification.status === 'scheduled' && new Date(notification.scheduledAt) > new Date()
                                ? 'text-orange-600'
                                : notification.status === 'sent'
                                ? 'text-emerald-600'
                                : ''
                            }`}>
                              <Clock className="size-3" />
                              {timeDisplay}
                            </span>
                            <Badge variant="outline" className="text-xs gap-1 py-0 h-5">
                              {roleBadge.icon}
                              {roleBadge.label}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3" />
                              {notification.organizationName || 'All Organizations'}
                            </span>
                          </div>
                          {notification.status === 'sent' && notification.sentCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <Send className="size-3" />
                              Delivered to {notification.sentCount} recipient{notification.sentCount !== 1 ? 's' : ''}
                            </div>
                          )}
                          {notification.createdByName && (
                            <p className="text-xs text-muted-foreground">
                              Created by: {notification.createdByName}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {notification.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelTarget(notification)}
                              disabled={cancelling === notification.id}
                              className="text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                              title="Cancel notification"
                            >
                              {cancelling === notification.id ? (
                                <RefreshCw className="size-4 animate-spin" />
                              ) : (
                                <XCircle className="size-4" />
                              )}
                            </Button>
                          )}
                          {(notification.status === 'cancelled' || notification.status === 'scheduled') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(notification)}
                              disabled={deleting === notification.id}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete notification"
                            >
                              {deleting === notification.id ? (
                                <RefreshCw className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel &ldquo;{cancelTarget?.title}&rdquo;? This will prevent the notification from being sent. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelTarget(null)}>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelTarget && handleCancel(cancelTarget)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Cancel Notification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
