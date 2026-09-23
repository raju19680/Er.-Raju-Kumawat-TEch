'use client'

import { useEffect, useState, useRef } from 'react'
import { getSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'

/**
 * useAuthSync — Restores the auth state from NextAuth session on page load/refresh.
 *
 * On mount, calls getSession() from next-auth/react (which properly reads JWT cookies).
 * If the session is valid, populates the Zustand store so the user stays logged in
 * even after a full page refresh.
 *
 * IMPORTANT: The API token is fetched BEFORE loginToStore() is called,
 * so that when the view changes and the dashboard loads, it already has the token.
 *
 * Also handles session expiry by periodically checking the session.
 *
 * Returns { loading } so the app can show a spinner while checking auth.
 */
export function useAuthSync() {
  const [loading, setLoading] = useState(true)
  const loginToStore = useAppStore((s) => s.login)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const loggingOut = useAppStore((s) => s.loggingOut)
  const fetchModuleAccess = useAppStore((s) => s.fetchModuleAccess)
  const logoutStore = useAppStore((s) => s.logout)
  const hasSynced = useRef(false)
  const sessionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Only sync once on mount
    if (hasSynced.current) return
    hasSynced.current = true

    // Don't re-authenticate if we're logging out or logged out
    const isExplicitlyLoggedOut = typeof window !== 'undefined' && sessionStorage.getItem('erkt_logged_out') === 'true'
    if (isAuthenticated || loggingOut || isExplicitlyLoggedOut) {
      setLoading(false)
      return
    }

    const syncAuth = async () => {
      try {
        // Try getSession() first (most reliable in browser)
        const session = await getSession()
        if (session?.user) {
          const u = session.user as any

          // Get API token BEFORE logging in (so dashboard fetch has the token)
          try {
            const tokenRes = await fetch('/api/auth/session-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                orgId: u.orgId,
                orgCode: u.orgCode,
                orgName: u.orgName,
                orgAccent: u.orgAccent,
                loginMode: u.loginMode,
              }),
            })
            const tokenData = await tokenRes.json()
            if (tokenData.success && tokenData.token) {
              useAppStore.getState().setApiToken(tokenData.token)
              if (process.env.NODE_ENV === 'development') {
                console.log('[AUTH-SYNC] API token stored')
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[AUTH-SYNC] Failed to get API token:', e)
            }
          }

          // NOW log in (this triggers view change)
          loginToStore(
            u.orgCode || '',
            u.orgName || 'Er. Raju Kumawat Tech',
            u.name || '',
            u.email || '',
            u.role || 'teacher',
            u.loginMode || 'cms'
          )

          // Fetch module access for CMS (teacher) users
          if (u.role === 'teacher' || u.loginMode === 'cms') {
            fetchModuleAccess()
          }
          setLoading(false)
          return
        }

        // Fallback: try /api/auth/me
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.user) {
            const u = data.user

            // Get API token BEFORE logging in
            try {
              const tokenRes = await fetch('/api/auth/session-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: u.id,
                  email: u.email,
                  name: u.name,
                  role: u.role,
                  orgId: u.orgId,
                  orgCode: u.orgCode,
                  orgName: u.orgName,
                  orgAccent: u.orgAccent,
                  loginMode: u.loginMode,
                }),
              })
              const tokenData = await tokenRes.json()
              if (tokenData.success && tokenData.token) {
                useAppStore.getState().setApiToken(tokenData.token)
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[AUTH-SYNC] Failed to get API token (me fallback):', e)
              }
            }

            loginToStore(
              u.orgCode || '',
              u.orgName || 'Er. Raju Kumawat Tech',
              u.name || '',
              u.email || '',
              u.role || 'teacher',
              u.loginMode || 'cms'
            )
            // Fetch module access for CMS (teacher) users
            if (u.role === 'teacher' || u.loginMode === 'cms') {
              fetchModuleAccess()
            }
          }
        }
      } catch {
        // Not authenticated — do nothing, login page will show
      } finally {
        setLoading(false)
      }
    }

    syncAuth()
  }, [isAuthenticated, loggingOut, loginToStore, fetchModuleAccess])

  // Periodic session check — detect session expiry while the app is open
  useEffect(() => {
    if (!isAuthenticated) return

    // Check session every 3 minutes — but add grace period after login
    sessionCheckInterval.current = setInterval(async () => {
      // Don't check if we're already logging out
      if (useAppStore.getState().loggingOut) return

      // Grace period: don't log out within 60 seconds of login
      // This prevents race conditions where the session cookie hasn't been
      // fully processed by NextAuth yet, and also handles cross-origin
      // preview environments where cookies may not persist reliably
      const timeSinceLogin = Date.now() - (window as any).__ERKT_LOGIN_TIME__
      if (timeSinceLogin < 60_000) return

      // If we have a persisted store with isAuthenticated, skip the session check
      // This handles cross-origin preview environments where cookies don't persist
      if (useAppStore.getState().isAuthenticated) return

      try {
        const session = await getSession()
        if (!session?.user) {
          // Session has expired — log out
          if (process.env.NODE_ENV === 'development') {
            console.log('[AUTH-SYNC] Session expired during periodic check — logging out')
          }
          logoutStore()
        }
      } catch {
        // Session check failed — might be expired
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH-SYNC] Session check failed — might be expired')
        }
      }
    }, 3 * 60 * 1000) // 3 minutes

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
      }
    }
  }, [isAuthenticated, logoutStore])

  return { loading }
}
