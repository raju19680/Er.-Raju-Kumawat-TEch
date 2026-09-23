'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'

// ── Lazy loader with built-in retry for stale chunks ───────────────────────
// If the chunk fails to load (stale hash after server restart), retry.
function lazyWithRetry<T>(importFn: () => Promise<T>, retries = 2): Promise<T> {
  return importFn().catch(async (error) => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      String(error?.message || '').includes('Failed to load chunk') ||
      String(error?.message || '').includes('Loading chunk')
    if (isChunkError && retries > 0) {
      await new Promise((r) => setTimeout(r, 400))
      return lazyWithRetry(importFn, retries - 1)
    }
    throw error
  })
}

// Lazy-load Sidebar and Topbar (with retry)
const AdminSidebar = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-sidebar')).catch(() => ({
    default: () => (
      <div className="w-[60px] bg-white border-r border-gray-200 flex items-center justify-center text-sm p-4 text-gray-400">
        Sidebar loading...
      </div>
    ),
  }))
)

const AdminTopbar = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-topbar')).catch(() => ({
    default: () => (
      <div className="h-16 border-b bg-white flex items-center px-6 text-sm text-gray-400">
        Topbar loading...
      </div>
    ),
  }))
)

// ── Lazy-loaded admin page components (with retry, avoids stale chunks) ────
const AdminDashboardPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-dashboard'))
)
const AdminTeachersPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-teachers'))
)
const AdminStudentsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-students'))
)
const AdminOrganizationsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-organizations'))
)
const AdminAnalyticsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-analytics'))
)
const AdminSettingsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-settings'))
)
const AdminModuleAccessPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-module-access'))
)
const AdminNotificationsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-notifications'))
)
const AdminOrdersPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-orders'))
)
const AdminContentPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-content'))
)
const AdminSecurityPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-security'))
)
const AdminCommissionsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-commissions'))
)
const AdminBuildsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-builds'))
)
const AdminPayoutsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-payouts'))
)
const AdminAuditLogPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-audit-log'))
)
const AdminBulkOpsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-bulk-ops'))
)
const AdminHealthPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-health'))
)
const AdminAnnouncementsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-announcements'))
)
const AdminFeatureFlagsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-feature-flags'))
)
const AdminAppVersionsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-app-versions'))
)
const AdminScheduledNotificationsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-scheduled-notifications'))
)
const AdminDbBackupPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-db-backup'))
)
const AdminWhiteLabelPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-white-label'))
)
const AdminDynamicConfigPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-dynamic-config'))
)
const AdminEmailTemplatesPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-email-templates'))
)
const AdminStudentMgmtPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-student-mgmt'))
)
const AdminExamsPage = React.lazy(() =>
  lazyWithRetry(() => import('@/components/admin/admin-exams'))
)

// ── Global ChunkLoadError handler (safety net) ──────────────────────────────
if (typeof window !== 'undefined') {
  const w = window as unknown as { __adminChunkHandlerInstalled?: boolean }
  if (!w.__adminChunkHandlerInstalled) {
    w.__adminChunkHandlerInstalled = true
    window.addEventListener('error', (e) => {
      const msg = e?.message || ''
      if (
        msg.includes('Failed to load chunk') ||
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError')
      ) {
        e.preventDefault()
        window.location.reload()
      }
    })
    window.addEventListener('unhandledrejection', (e) => {
      const reason = e?.reason
      const msg = (reason?.message || String(reason || '')) as string
      if (
        msg.includes('Failed to load chunk') ||
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError')
      ) {
        e.preventDefault()
        window.location.reload()
      }
    })
  }
}

function PageContent() {
  const adminPage = useAppStore((s) => s.adminPage)
  const userRole = useAppStore((s) => s.userRole)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  React.useEffect(() => {
    const role = (userRole || '').toLowerCase()
    if (!['platform_admin', 'admin', 'org_admin'].includes(role)) {
      if (role === 'student' || role === 'user') {
        setCurrentView('student')
      } else {
        setCurrentView('cms')
      }
    }
  }, [userRole, setCurrentView])

  const renderPage = () => {
    switch (adminPage) {
      case 'admin-dashboard':
        return <AdminDashboardPage />
      case 'admin-teachers':
        return <AdminTeachersPage />
      case 'admin-module-access':
        return <AdminModuleAccessPage />
      case 'admin-students':
        return <AdminStudentsPage />
      case 'admin-organizations':
        return <AdminOrganizationsPage />
      case 'admin-analytics':
        return <AdminAnalyticsPage />
      case 'admin-orders':
        return <AdminOrdersPage />
      case 'admin-settings':
        return <AdminSettingsPage />
      case 'admin-notifications':
        return <AdminNotificationsPage />
      case 'admin-content':
        return <AdminContentPage />
      case 'admin-security':
        return <AdminSecurityPage />
      case 'admin-commissions':
        return <AdminCommissionsPage />
      case 'admin-builds':
        return <AdminBuildsPage />
      case 'admin-payouts':
        return <AdminPayoutsPage />
      case 'admin-audit-log':
        return <AdminAuditLogPage />
      case 'admin-bulk-ops':
        return <AdminBulkOpsPage />
      case 'admin-health':
        return <AdminHealthPage />
      case 'admin-announcements':
        return <AdminAnnouncementsPage />
      case 'admin-feature-flags':
        return <AdminFeatureFlagsPage />
      case 'admin-app-versions':
        return <AdminAppVersionsPage />
      case 'admin-scheduled-notifications':
        return <AdminScheduledNotificationsPage />
      case 'admin-db-backup':
        return <AdminDbBackupPage />
      case 'admin-white-label':
        return <AdminWhiteLabelPage />
      case 'admin-dynamic-config':
        return <AdminDynamicConfigPage />
      case 'admin-email-templates':
        return <AdminEmailTemplatesPage />
      case 'admin-student-mgmt':
        return <AdminStudentMgmtPage />
      case 'admin-exams':
        return <AdminExamsPage />
      default:
        return <AdminDashboardPage />
    }
  }

  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      {renderPage()}
    </React.Suspense>
  )
}

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — manages its own width via hover */}
      <React.Suspense
        fallback={
          <div className="flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out w-[60px]" />
        }
      >
        <AdminSidebar />
      </React.Suspense>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <React.Suspense
          fallback={<div className="h-16 border-b bg-white flex-shrink-0" />}
        >
          <AdminTopbar />
        </React.Suspense>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
              <PageContent />
            </div>
          </div>
          {/* Copyright Footer - sticky at bottom */}
          <div className="shrink-0 border-t border-gray-200 bg-white py-4 text-center px-4">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
