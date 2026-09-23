'use client'

import React from 'react'
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useNotifications, type NotificationItem } from '@/hooks/use-notifications'
import { useAppStore } from '@/lib/store'

// ── Types ──────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** Role filter for notifications */
  targetRole?: string
  /** Maximum notifications to display */
  limit?: number
  /** Which UI variant to use: 'dropdown' (DropdownMenu) or 'popover' (Popover) */
  variant?: 'dropdown' | 'popover'
  /** Accent color for badges (defaults to amber) */
  accentColor?: string
  /** "View All" callback — navigates to full notifications page */
  onViewAll?: () => void
  /** Label for the "View All" link */
  viewAllLabel?: string
}

// ── Icon/color maps ────────────────────────────────────────────────────────

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

// ── Time formatter ─────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── Single notification row ────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
  accentColor,
}: {
  notification: NotificationItem
  onMarkRead: (id: string) => void
  accentColor: string
}) {
  const IconComp = typeIcons[notification.type] || Info
  const iconColor = typeColors[notification.type] || typeColors.info

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-amber-50/40' : ''}`}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification.id)
      }}
    >
      <div className="flex gap-3">
        <IconComp className={`size-4 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span
                className="shrink-0 size-2 rounded-full mt-1.5"
                style={{ backgroundColor: accentColor }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {formatTimeAgo(notification.createdAt)}
            {notification.senderName && (
              <>
                <span>&middot;</span>
                <span className={`inline-flex items-center rounded px-1 py-0.5 text-[8px] font-medium ${
                  notification.senderRole === 'platform_admin'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {notification.senderRole === 'platform_admin' ? 'Admin' : 'Teacher'}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function NotificationBell({
  targetRole,
  limit = 20,
  variant = 'dropdown',
  accentColor = '#D97706',
  onViewAll,
  viewAllLabel = 'View All Notifications',
}: NotificationBellProps) {
  const { userRole } = useAppStore()
  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    limit,
    targetRole,
    showToast: true,
  })

  const displayItems = notifications.slice(0, 5)

  // ── Bell trigger button ───────────────────────────────────────────────
  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Notifications"
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex size-4">
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: accentColor }}
          />
          <span
            className="relative inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}
    </Button>
  )

  // ── Notification list content ─────────────────────────────────────────
  const notificationContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 text-xs font-medium px-1.5"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          {connected ? (
            <Wifi className="size-3 text-emerald-500" />
          ) : (
            <WifiOff className="size-3 text-gray-400" />
          )}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={(e) => {
                e.stopPropagation()
                markAllAsRead()
              }}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <ScrollArea className="max-h-96">
        {displayItems.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          <div>
            {displayItems.map((notification, idx) => (
              <React.Fragment key={notification.id}>
                <NotificationRow
                  notification={notification}
                  onMarkRead={markAsRead}
                  accentColor={accentColor}
                />
                {idx < displayItems.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* View All footer */}
      {displayItems.length > 0 && onViewAll && (
        <div className="border-t p-2">
          <button
            type="button"
            className="w-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={onViewAll}
          >
            {viewAllLabel}
          </button>
        </div>
      )}
    </>
  )

  // ── Dropdown variant (used in admin & teacher topbars) ────────────────
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {bellButton}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <DropdownMenuLabel className="p-0 font-semibold text-sm">
              Notifications
              {unreadCount > 0 && (
                <span
                  className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {unreadCount} new
                </span>
              )}
            </DropdownMenuLabel>
            <div className="flex items-center gap-2">
              {connected ? (
                <Wifi className="size-3 text-emerald-500" />
              ) : (
                <WifiOff className="size-3 text-gray-400" />
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    markAllAsRead()
                  }}
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <ScrollArea className="max-h-96">
            {displayItems.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              <div>
                {displayItems.map((notification, idx) => {
                  const IconComp = typeIcons[notification.type] || Info
                  const iconColor = typeColors[notification.type] || typeColors.info
                  return (
                    <React.Fragment key={notification.id}>
                      <DropdownMenuItem
                        className="px-4 py-3 cursor-pointer focus:bg-muted/50"
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id)
                          }
                        }}
                      >
                        <div className="flex gap-3 w-full">
                          <IconComp className={`size-4 mt-0.5 shrink-0 ${iconColor}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span
                                  className="shrink-0 size-2 rounded-full mt-1.5"
                                  style={{ backgroundColor: accentColor }}
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              {formatTimeAgo(notification.createdAt)}
                              {notification.senderName && (
                                <>
                                  <span>&middot;</span>
                                  <span className={`inline-flex items-center rounded px-1 py-0.5 text-[8px] font-medium ${
                                    notification.senderRole === 'platform_admin'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {notification.senderRole === 'platform_admin' ? 'Admin' : 'Teacher'}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      {idx < displayItems.length - 1 && <Separator />}
                    </React.Fragment>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* View All footer */}
          {displayItems.length > 0 && onViewAll && (
            <div className="border-t p-2">
              <DropdownMenuItem
                className="w-full justify-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={onViewAll}
              >
                {viewAllLabel}
              </DropdownMenuItem>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ── Popover variant (used in student topbar) ──────────────────────────
  return (
    <Popover>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {notificationContent}
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell
