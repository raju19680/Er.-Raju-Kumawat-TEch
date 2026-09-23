'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface NotificationItem {
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

interface UseNotificationsOptions {
  /** Maximum number of notifications to keep locally */
  limit?: number
  /** Target role filter for fetching notifications */
  targetRole?: string
  /** Whether to also fetch via REST on mount (default: true) */
  fetchOnMount?: boolean
  /** Polling interval in ms when Socket.IO is disconnected (default: 15000) */
  fallbackPollInterval?: number
  /** Whether to show toast on new notification (default: true) */
  showToast?: boolean
}

interface UseNotificationsReturn {
  notifications: NotificationItem[]
  unreadCount: number
  connected: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

// ── Module-level singleton socket ──────────────────────────────────────────
// Prevents multiple connections across component re-mounts
let _socket: Socket | null = null
let _socketRefCount = 0
let _currentOrgId: string | null = null

function getSocket(orgId: string, userId: string): Socket {
  // If we already have a socket for the same org, reuse it
  if (_socket && _socket.connected && _currentOrgId === orgId) {
    return _socket
  }

  // Disconnect previous socket if org changed
  if (_socket) {
    _socket.disconnect()
    _socket = null
  }

  _currentOrgId = orgId

  _socket = io('/', {
    transports: ['websocket', 'polling'],
    auth: { orgId, userId },
    query: { XTransformPort: '3003' },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  })

  return _socket
}

function releaseSocket() {
  _socketRefCount = Math.max(0, _socketRefCount - 1)
  if (_socketRefCount === 0 && _socket) {
    _socket.disconnect()
    _socket = null
    _currentOrgId = null
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    limit = 20,
    targetRole,
    fetchOnMount = true,
    fallbackPollInterval = 15000,
    showToast = true,
  } = options

  const { orgCode, isAuthenticated, userRole, loggingOut, fetchModuleAccess } = useAppStore()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch notifications from REST API ──────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || loggingOut) return

    try {
      const params = new URLSearchParams({ limit: String(limit) })
      if (orgCode) params.set('organizationId', orgCode)
      if (targetRole) params.set('targetRole', targetRole)

      // Admin uses the admin endpoint; others use the general one
      const endpoint = userRole === 'platform_admin'
        ? `/api/admin/notifications?${params}`
        : `/api/notifications?${params}`

      const res = await apiFetch(endpoint)
      const data = await res.json()

      if (data.items) {
        setNotifications(data.items.slice(0, limit))
      }
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount)
      } else if (data.items) {
        setUnreadCount(data.items.filter((n: NotificationItem) => !n.isRead).length)
      }
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, [isAuthenticated, loggingOut, orgCode, targetRole, limit, userRole])

  // ── Mark single notification as read ───────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }, [])

  // ── Mark all notifications as read ─────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, organizationId: orgCode }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      toast.error('Failed to mark all notifications as read')
    }
  }, [orgCode])

  // ── Socket.IO connection management ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !orgCode || loggingOut) return

    // Initial fetch
    if (fetchOnMount) {
      fetchNotifications()
    }

    // Set up Socket.IO connection
    const userId = useAppStore.getState().userEmail || 'unknown'
    const socket = getSocket(orgCode, userId)
    socketRef.current = socket
    _socketRefCount++

    // Join the org room
    socket.emit('join-org', { orgId: orgCode, role: userRole })

    // Connection event handlers
    const onConnect = () => {
      setConnected(true)
      // Re-join room on reconnect
      socket.emit('join-org', { orgId: orgCode, role: userRole })
    }

    const onDisconnect = () => {
      setConnected(false)
    }

    // New notification handler
    const onNotificationNew = (data: NotificationItem) => {
      // Add to local state
      setNotifications(prev => [data, ...prev].slice(0, limit))
      setUnreadCount(prev => prev + 1)

      // Show toast
      if (showToast) {
        const typeToToastMethod: Record<string, typeof toast.info> = {
          info: toast.info,
          warning: toast.warning,
          success: toast.success,
          error: toast.error,
        }
        const method = typeToToastMethod[data.type] || toast.info
        method(data.title, { description: data.message })
      }
    }

    // Notification read handler
    const onNotificationRead = (data: { notificationId: string }) => {
      setNotifications(prev => prev.map(n =>
        n.id === data.notificationId ? { ...n, isRead: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    // Module access changed handler
    const onModuleAccessChanged = () => {
      // Refresh module access in store
      if (userRole === 'teacher' && fetchModuleAccess) {
        fetchModuleAccess()
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('notification:new', onNotificationNew)
    socket.on('notification:read', onNotificationRead)
    socket.on('module-access:changed', onModuleAccessChanged)
    socket.on('joined-org', () => {
      setConnected(true)
    })

    // Set initial connected state
    setConnected(socket.connected)

    // ── Fallback polling when disconnected ─────────────────────────────
    const startPolling = () => {
      if (pollIntervalRef.current) return
      pollIntervalRef.current = setInterval(fetchNotifications, fallbackPollInterval)
    }

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }

    // If socket is not connected, start polling as fallback
    if (!socket.connected) {
      startPolling()
    }

    // Listen for connection changes to toggle polling
    socket.on('connect', () => stopPolling())
    socket.on('disconnect', () => startPolling())

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('notification:new', onNotificationNew)
      socket.off('notification:read', onNotificationRead)
      socket.off('module-access:changed', onModuleAccessChanged)
      socket.off('connect', stopPolling)
      socket.off('disconnect', startPolling)
      socket.off('joined-org')

      stopPolling()
      releaseSocket()
      socketRef.current = null
    }
  }, [isAuthenticated, orgCode, loggingOut, userRole])

  // ── Disconnect on logout ───────────────────────────────────────────────
  useEffect(() => {
    if (loggingOut && _socket) {
      _socket.disconnect()
      _socket = null
      _currentOrgId = null
      _socketRefCount = 0
      setNotifications([])
      setUnreadCount(0)
      setConnected(false)
    }
  }, [loggingOut])

  return {
    notifications,
    unreadCount,
    connected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
