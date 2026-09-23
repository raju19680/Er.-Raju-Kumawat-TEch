'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  targetRole: string
  organizationId: string
  createdAt: string
  senderName?: string | null
  senderRole?: string | null
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
}

const typeColors: Record<string, string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-emerald-500',
  error: 'text-red-500',
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
  })
}

export default function NotificationBell() {
  const { orgCode, setCurrentPage } = useAppStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const prevCountRef = useRef(0)

  // Poll for unread count every 15 seconds
  const fetchUnreadCount = async () => {
    if (!orgCode) return // Skip if no org code available
    try {
      const res = await apiFetch(`/api/notifications?limit=5&organizationId=${orgCode || ''}`)
      const data = await res.json()
      if (data.unreadCount !== undefined) {
        const newCount = data.unreadCount
        setUnreadCount(newCount)
        prevCountRef.current = newCount
      }
      if (data.items) {
        setRecentNotifications(data.items.slice(0, 5))
      }
    } catch (error) {
      // Silently fail
    }
  }

  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      fetchUnreadCount()
    }, 0)
    const interval = setInterval(fetchUnreadCount, 15000)
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [orgCode])

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAllRead: true, organizationId: orgCode }),
      })
      setUnreadCount(0)
      setRecentNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isRead: true }),
      })
      setRecentNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute right-1.5 top-1.5 flex size-4">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-4 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-amber-600 hover:text-amber-700 gap-1"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {recentNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {recentNotifications.map((notification, idx) => {
                const IconComp = typeIcons[notification.type] || Info
                const iconColor = typeColors[notification.type] || typeColors.info

                return (
                  <React.Fragment key={notification.id}>
                    <div
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-amber-50/50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkRead(notification.id)
                        }
                        setCurrentPage('notifications')
                        setOpen(false)
                      }}
                    >
                      <div className="flex gap-3">
                        <IconComp className={`size-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 size-2 rounded-full bg-amber-500 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {formatTimeAgo(notification.createdAt)}
                            {notification.senderName && (
                              <>
                                <span>•</span>
                                <span className={`inline-flex items-center rounded px-1 py-0.5 text-[8px] font-medium ${notification.senderRole === 'platform_admin' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {notification.senderRole === 'platform_admin' ? 'Admin' : 'Teacher'}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {idx < recentNotifications.length - 1 && <Separator />}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {recentNotifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-amber-600 hover:text-amber-700"
              onClick={() => {
                setCurrentPage('notifications')
                setOpen(false)
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
