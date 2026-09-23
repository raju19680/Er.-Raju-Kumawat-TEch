'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { setApiToken as saveApiToken, getApiToken } from '@/lib/api-client'

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { isAuthenticated, loggingOut, login, fetchModuleAccess } = useAppStore()
  const wasAuthenticated = useRef(false)

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true
    }
  }, [isAuthenticated])

  // Sync NextAuth session to Zustand store
  useEffect(() => {
    // If explicit logout happened, ignore session
    if (typeof window !== 'undefined' && sessionStorage.getItem('erkt_logged_out') === 'true') {
      return
    }

    // If NextAuth has a session but Zustand doesn't know about it (page refresh)
    if (status === 'authenticated' && session?.user && !isAuthenticated && !loggingOut) {
      const user = session.user as any

      if (!user.role && !user.email) {
        return
      }

      const role = (user.role || 'teacher').toLowerCase()
      const orgCode = user.orgCode || user.orgId || 'ERKTACADEMY'
      const orgName = user.orgName || 'Er. Raju Kumawat Tech'
      const userName = user.name || 'User'
      const userEmail = user.email || ''
      const loginMode = user.loginMode || undefined

      // Call login immediately to prevent race conditions
      login(orgCode, orgName, userName, userEmail, role, loginMode)

      if (role === 'teacher' || loginMode === 'cms') {
        fetchModuleAccess()
      }

      ;(async () => {
        try {
          const tokenRes = await fetch('/api/auth/session-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, orgId: user.orgId || orgCode }),
          })
          const tokenData = await tokenRes.json()
          if (tokenData.success && tokenData.token) {
            saveApiToken(tokenData.token)
          }
        } catch {}
      })()
    }

    // IMPORTANT: Do NOT logout when NextAuth says "unauthenticated"
    // In cross-origin preview, cookies don't persist, so NextAuth always returns
    // "unauthenticated" even when the user has a valid token in localStorage.
    // The localStorage token is our source of truth, NOT NextAuth cookies.
    // We only logout if the user explicitly clicks "Logout" button.
  }, [status, session, isAuthenticated, loggingOut, login, fetchModuleAccess])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <SessionSync>{children}</SessionSync>
    </SessionProvider>
  )
}
