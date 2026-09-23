'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Trash2,
  Send,
} from 'lucide-react'
import { useNotifications, type NotificationItem } from '@/hooks/use-notifications'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
  promo: Bell,
}

const typeColors: Record<string, string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-emerald-500',
  error: 'text-red-500',
  promo: 'text-purple-500',
}

const typeBgColors: Record<string, string> = {
  info: 'bg-blue-50',
  warning: 'bg-amber-50',
  success: 'bg-emerald-50',
  error: 'bg-red-50',
  promo: 'bg-purple-50',
}

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    connected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ targetRole: 'teacher', limit: 50, fetchOnMount: true })

  const [loading, setLoading] = React.useState(true)
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false)

  React.useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay updated with the latest alerts and messages</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            {connected ? (
              <>
                <Wifi className="size-3.5 text-emerald-500" />
                <span className="text-emerald-600">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5 text-gray-400" />
                <span>Offline</span>
              </>
            )}
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">
              {unreadCount} unread
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllAsRead}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
          <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setSendDialogOpen(true)}>
            <Bell className="size-3.5" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <Card className="rounded-xl bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="size-5 text-amber-500" />
            All Notifications
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-semibold text-gray-900">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                When you receive notifications, they&apos;ll appear here
              </p>
            </div>

            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SendNotificationDialog 
        open={sendDialogOpen} 
        onOpenChange={setSendDialogOpen} 
      />
    </>
  )
}

function SendNotificationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({ title: '', message: '', type: 'info' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, targetRole: 'student' }),
      })
      toast.success('Notification sent successfully')
      onOpenChange(false)
      setFormData({ title: '', message: '', type: 'info' })
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>Broadcast a message to all users.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              required 
              value={formData.title} 
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))} 
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea 
              required 
              value={formData.message} 
              onChange={(e) => setFormData(f => ({ ...f, message: e.target.value }))} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData(f => ({ ...f, type: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="promo">Promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Select defaultValue="student" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">All Students</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Bulk sends to all students</p>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem
  onMarkRead: (id: string) => void
}) {
  const IconComp = typeIcons[notification.type] || Info
  const iconColor = typeColors[notification.type] || typeColors.info
  const bgColor = typeBgColors[notification.type] || 'bg-gray-50'

  return (
    <div
      className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? bgColor : ''}`}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification.id)
      }}
    >
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
        <IconComp className={`size-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="shrink-0 size-2 rounded-full bg-amber-500 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</span>
          {notification.senderName && (
            <Badge variant="outline" className="text-xs h-4 px-1.5">
              {notification.senderRole === 'platform_admin' ? 'Admin' : 'Teacher'}: {notification.senderName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
