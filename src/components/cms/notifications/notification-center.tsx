'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Filter,
  Search,
  Loader2,
  Megaphone,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogTrigger,
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  targetRole: string
  organizationId: string
  createdAt: string
  senderId?: string | null
  senderRole?: string | null
  senderName?: string | null
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
}

const typeColors: Record<string, string> = {
  info: 'bg-blue-50 text-blue-600 border-blue-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  error: 'bg-red-50 text-red-600 border-red-200',
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function NotificationCenter() {
  const { orgCode, userRole } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info', targetRole: 'student' })
  const [socket, setSocket] = useState<Socket | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
    })

    socketInstance.on('connect', () => {
      // Join org room
      if (orgCode) {
        socketInstance.emit('join-org', { orgId: orgCode, role: userRole })
      }
    })

    socketInstance.on('notification:new', (data: Notification) => {
      setNotifications(prev => [data, ...prev])
      setUnreadCount(prev => prev + 1)
      toast.info(`New notification: ${data.title}`)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [orgCode, userRole])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        organizationId: orgCode || '',
      })
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const res = await apiFetch(`/api/notifications?${params}`)
      const data = await res.json()
      if (data.items) {
        setNotifications(data.items)
        setTotalPages(data.totalPages || 1)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, orgCode])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll for new notifications every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isRead: true }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAllRead: true, organizationId: orgCode }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await apiFetch(`/api/notifications/${deleteId}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== deleteId))
      setDeleteId(null)
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCreateNotification = async () => {
    if (!newNotif.title.trim() || !newNotif.message.trim()) {
      toast.error('Title and message are required')
      return
    }

    setCreating(true)
    try {
      const res = await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          ...newNotif,
          organizationId: orgCode,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Notification created')
        setCreateOpen(false)
        setNewNotif({ title: '', message: '', type: 'info', targetRole: 'student' })
        fetchNotifications()

        // Also emit via WebSocket (the API already does this, but emit again for local socket)
        if (socket && orgCode) {
          socket.emit('notification:new', {
            orgId: orgCode,
            ...data.notification,
          })
        }
      } else {
        toast.error(data.error || 'Failed to create notification')
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
      toast.error('Failed to create notification')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="size-6 text-amber-600" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and send notifications to your audience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              className="gap-2"
            >
              <CheckCheck className="size-4" />
              Mark all read ({unreadCount})
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Plus className="size-4" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newNotif.title}
                    onChange={(e) => setNewNotif(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={newNotif.message}
                    onChange={(e) => setNewNotif(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Notification message..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newNotif.type} onValueChange={(val) => setNewNotif(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger>
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
                    <Label>Target Role</Label>
                    <Select value={newNotif.targetRole} onValueChange={(val) => setNewNotif(prev => ({ ...prev, targetRole: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All (Teachers & Students)</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreateNotification}
                  disabled={creating}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{unreadCount} unread</span>
              <span>•</span>
              <span>Page {page} of {totalPages}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-amber-600" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="size-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
              <p className="text-muted-foreground mt-1">Create your first notification to get started</p>
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                <Plus className="size-4" />
                Create Notification
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => {
              const IconComp = typeIcons[notification.type] || Info
              const colorClass = typeColors[notification.type] || typeColors.info

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`transition-all ${!notification.isRead ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Type Icon */}
                        <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border ${colorClass}`}>
                          <IconComp className="size-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                                {!notification.isRead && (
                                  <span className="ml-2 inline-block size-2 rounded-full bg-amber-500" />
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.targetRole}
                              </Badge>
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleMarkRead(notification.id)}
                                  title="Mark as read"
                                >
                                  <Check className="size-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-red-400 hover:text-red-600"
                                onClick={() => setDeleteId(notification.id)}
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span title={new Date(notification.createdAt).toLocaleString()}>
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.senderName && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${notification.senderRole === 'platform_admin' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {notification.senderRole === 'platform_admin' ? 'Admin' : 'Teacher'}
                                  </span>
                                  {notification.senderName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
