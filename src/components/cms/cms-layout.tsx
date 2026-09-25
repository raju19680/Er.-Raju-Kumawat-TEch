'use client'

import React, { Component, useEffect, useRef, Suspense } from 'react'
import { useAppStore } from '@/lib/store'
import { CMS_PAGE_TO_MODULE } from '@/lib/module-registry'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

// ── Chunk-level error fallback ──────────────────────────────────────────────
function ChunkFallback({ name, onRetry }: { name: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{name} module is loading</h2>
        <p className="text-sm text-gray-500">
          If the module does not appear in a few seconds, click below to refresh.
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Module
        </button>
      </div>
    </div>
  )
}

// ── Error Boundary for lazy-loaded page chunks ──────────────────────────────
class PageChunkBoundary extends Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Failed to load chunk') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Loading CSS chunk')
    if (isChunkError) return { hasError: true }
    throw error
  }

  render() {
    if (this.state.hasError) {
      return (
        <ChunkFallback
          name={this.props.name}
          onRetry={() => this.setState({ hasError: false })}
        />
      )
    }
    return this.props.children
  }
}

// ── Eager imports (small, always needed) ────────────────────────────────────
import ModuleDisabled from '@/components/cms/module-disabled'
import DashboardPage from '@/components/cms/dashboard/dashboard-page'
import AssignmentManager from './assignments/assignment-manager'
import FlashcardManager from './flashcards/flashcard-manager'
import AchievementManager from './gamification/achievement-manager'
import LiveClassManager from './live-classes/live-class-manager'

// ── Lazy loader with built-in retry for stale chunks ───────────────────────
// If the chunk fails to load (stale hash after server restart), retry with
// a cache-busting query param to force a fresh fetch.
function lazyWithRetry<T extends { default: React.ComponentType }>(
  importFn: () => Promise<T>,
  retries = 2
): Promise<T> {
  return importFn().catch(async (error) => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      String(error?.message || '').includes('Failed to load chunk') ||
      String(error?.message || '').includes('Loading chunk')
    if (isChunkError && retries > 0) {
      // Brief delay before retry
      await new Promise((r) => setTimeout(r, 400))
      return lazyWithRetry(importFn, retries - 1)
    }
    throw error
  })
}

// ── Fast Page Skeleton Fallback ─────────────────────────────────────────────
const PageSkeletonFallback = ({ name }: { name: string }) => (
  <div className="p-4 md:p-6 space-y-6 animate-pulse max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded-md" />
      </div>
      <div className="h-9 w-32 bg-gray-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-xl border border-gray-200/60 p-4 space-y-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
    <div className="h-80 bg-gray-50 rounded-xl border border-gray-200/60 p-6 space-y-4">
      <div className="h-8 w-64 bg-gray-200 rounded-md" />
      <div className="h-48 bg-gray-100/70 rounded-lg" />
    </div>
  </div>
)

// ── Lazy page component wrapper ─────────────────────────────────────────────
const lazyPage = (
  loader: () => Promise<{ default: React.ComponentType }>,
  name: string
) => {
  const LazyComponent = React.lazy(() =>
    lazyWithRetry(loader).catch(() => ({
      default: () => <ChunkFallback name={name} onRetry={() => window.location.reload()} />,
    }))
  )
  return (props: Record<string, never>) => (
    <PageChunkBoundary name={name}>
      <Suspense fallback={<PageSkeletonFallback name={name} />}>
        <LazyComponent {...props} />
      </Suspense>
    </PageChunkBoundary>
  )
}

// ── Lazy page component map ────────────────────────────────────────────────
const CoursesList = lazyPage(
  () => import('@/components/cms/courses/courses-list'),
  'Courses'
)
const TestsManager = lazyPage(
  () => import('@/components/cms/test-portal/tests-manager'),
  'Tests'
)
const TestSeriesList = lazyPage(
  () => import('@/components/cms/test-series/test-series-list'),
  'Test Series'
)
const OmrReviewPage = lazyPage(
  () => import('@/components/cms/omr-review/omr-review-page'),
  'OMR Review'
)
const StudentsList = lazyPage(
  () => import('@/components/cms/students/students-list'),
  'Students'
)
const DigitalProductsPage = lazyPage(
  () => import('@/components/cms/digital-products/digital-products-list'),
  'Digital Products'
)
const StorePage = lazyPage(
  () => import('@/components/cms/store/store-page'),
  'Store'
)
const BlogsList = lazyPage(
  () => import('@/components/cms/blogs/blogs-list'),
  'Blogs'
)
const QuickLinksPage = lazyPage(
  () => import('@/components/cms/quick-links/quick-links-page'),
  'Quick Links'
)

const ResultsPage = lazyPage(
  () => import('@/components/cms/test-portal/results-page'),
  'Results'
)
const BulkUploader = lazyPage(
  () => import('@/components/cms/test-portal/bulk-uploader'),
  'Bulk Uploader'
)
const ReportedQuestions = lazyPage(
  () => import('@/components/cms/test-portal/reported-questions'),
  'Reported Questions'
)
const QuestionLibrary = lazyPage(
  () => import('@/components/cms/test-portal/question-library'),
  'Question Library'
)
const ThemeList = lazyPage(
  () => import('@/components/cms/themes/theme-list'),
  'Themes'
)
const ThemeBuilder = lazyPage(
  () => import('@/components/cms/themes/theme-builder'),
  'Theme Builder'
)
const ReportsPage = lazyPage(
  () => import('@/components/cms/reports/reports-page'),
  'Reports'
)
const MarketingPage = lazyPage(
  () => import('@/components/cms/marketing/marketing-page'),
  'Marketing'
)
const NotificationCenter = lazyPage(
  () => import('@/components/cms/notifications/notification-center'),
  'Notifications'
)
const LeadsPage = lazyPage(
  () => import('@/components/cms/leads/leads-page'),
  'Leads'
)
const CouponsPage = lazyPage(
  () => import('@/components/cms/coupons/coupons-page'),
  'Coupons'
)
const PaymentPagesPage = lazyPage(
  () => import('@/components/cms/payment-pages/payment-pages-page'),
  'Payment Pages'
)
const WhatsAppSalesPage = lazyPage(
  () => import('@/components/cms/whatsapp/whatsapp-sales-page'),
  'WhatsApp Sales'
)
const WhatsAppCampaignsPage = lazyPage(
  () => import('@/components/cms/whatsapp/whatsapp-campaigns-page'),
  'WhatsApp Campaigns'
)
const SupportPage = lazyPage(
  () => import('@/components/cms/support/support-page'),
  'Support'
)
const SettingsPage = lazyPage(
  () => import('@/components/cms/settings/settings-page'),
  'Settings'
)
const ChatManagerPage = lazyPage(
  () => import('@/components/cms/chat/chat-manager-page'),
  'Chat Manager'
)
const MeetingsPage = lazyPage(
  () => import('@/components/cms/meetings/meetings-page'),
  'Meetings'
)
const YoutubeCoursesPage = lazyPage(
  () => import('@/components/cms/youtube/youtube-courses-page'),
  'YouTube Courses'
)
const DocumentsPage = lazyPage(
  () => import('@/components/cms/documents/documents-page'),
  'Documents'
)
const ExamProfilesPage = lazyPage(
  () => import('@/components/cms/exam-management/exam-profiles-page'),
  'Exam Profiles'
)

// ── Lazy-load Sidebar and Topbar (with retry) ───────────────────────────────
const Sidebar = React.lazy(() =>
  lazyWithRetry(() => import('@/components/cms/sidebar')).catch(() => ({
    default: () => (
      <div className="w-[60px] bg-white border-r border-gray-200 flex items-center justify-center text-sm p-4 text-gray-400">
        Loading...
      </div>
    ),
  }))
)

const Topbar = React.lazy(() =>
  lazyWithRetry(() => import('@/components/cms/topbar')).catch(() => ({
    default: () => (
      <div className="h-16 border-b bg-white flex items-center px-6 text-sm text-muted-foreground">
        Loading...
      </div>
    ),
  }))
)

// ── Page access control ─────────────────────────────────────────────────────
/**
 * Check if a CMS page is accessible based on the current module access map.
 *
 * Logic:
 * - Platform admins always have access
 * - Dashboard is always accessible
 * - Before module access is loaded, allow access (grace period)
 * - If the parent module key is explicitly false → blocked
 * - If the parent module key is true (or undefined/absent) → ALLOW access
 *   (sub-features control granular operations like create/edit/delete,
 *    NOT page visibility — a page with view-only sub-feature still shows the page)
 *
 * This ensures teachers always see their enabled modules' pages,
 * even if some sub-features within those modules are disabled.
 */
function isPageAccessible(
  page: string,
  moduleAccess: Record<string, boolean>,
  moduleAccessLoaded: boolean,
  userRole: string
): boolean {
  if (userRole === 'platform_admin') return true
  if (page === 'dashboard') return true
  if (!moduleAccessLoaded) return true
  const moduleKey = CMS_PAGE_TO_MODULE[page]
  if (!moduleKey) return true
  // Only block if the parent module is explicitly disabled
  if (moduleAccess[moduleKey] === false) return false
  // If parent module is enabled (or not in the map = default allow), page is accessible
  return true
}

// ── Page content router ─────────────────────────────────────────────────────
function PageContent() {
  const currentPage = useAppStore((s) => s.currentPage)
  const moduleAccess = useAppStore((s) => s.moduleAccess)
  const moduleAccessLoaded = useAppStore((s) => s.moduleAccessLoaded)
  const userRole = useAppStore((s) => s.userRole)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)

  const accessible = isPageAccessible(currentPage, moduleAccess, moduleAccessLoaded, userRole)

  if (!accessible) {
    const moduleKey = CMS_PAGE_TO_MODULE[currentPage] || currentPage
    return <ModuleDisabled moduleKey={moduleKey} />
  }

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />
    case 'courses':
      return <CoursesList />
    case 'tests':
      return <TestsManager />
    case 'test-series':
      return <TestSeriesList />
    case 'omr-review':
      return <OmrReviewPage />
    case 'students':
      return <StudentsList />
    case 'digital-products':
      return <DigitalProductsPage />
    case 'store':
      return <StorePage />
    case 'blogs':
      return <BlogsList />
    case 'quick-links':
      return <QuickLinksPage />
    case 'exam-profiles':
      return <ExamProfilesPage />
    case 'results':
      return <ResultsPage />
    case 'bulk-uploader':
      return <BulkUploader />
    case 'reported-questions':
      return <ReportedQuestions />
    case 'question-library':
      return <QuestionLibrary />
    case 'themes':
      return <ThemeList />
    case 'theme-builder':
      return <ThemeBuilder />
    case 'reports-sales':
      return <ReportsPage />
    case 'reports-orders':
      return <ReportsPage />
    case 'reports-users':
      return <ReportsPage />
    case 'graphics':
      return <MarketingPage />
    case 'notifications':
      return <NotificationCenter />
    case 'leads':
      return <LeadsPage />
    case 'coupons':
      return <CouponsPage />
    case 'payment-pages':
      return <PaymentPagesPage />
    case 'whatsapp-sales':
      return <WhatsAppSalesPage />
    case 'whatsapp-campaigns':
      return <WhatsAppCampaignsPage />
    case 'support-queries':
      return <SupportPage />
    case 'support-chat':
      return <SupportPage />
    case 'settings-profile':
      return <SettingsPage />
    case 'settings-security':
      return <SettingsPage />
    case 'settings-blocked':
      return <SettingsPage />
    case 'settings-categories':
      return <SettingsPage />
    case 'chat-manager':
      return <ChatManagerPage />
    case 'meetings':
      return <MeetingsPage />
    case 'youtube-courses':
      return <YoutubeCoursesPage />
    case 'documents':
      return <DocumentsPage />
    case 'assignments':
      return <AssignmentManager />
    case 'flashcards':
      return <FlashcardManager />
    case 'gamification':
      return <AchievementManager />
    case 'live-classes':
      return <LiveClassManager />
    default:
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
              <Button onClick={() => setCurrentPage('dashboard')} variant="outline">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      )
  }
}

// ── Main CMS Layout ─────────────────────────────────────────────────────────
export default function CMSLayout() {
  const userRole = useAppStore((s) => s.userRole)
  const startModuleAccessPolling = useAppStore((s) => s.startModuleAccessPolling)
  const stopModuleAccessPolling = useAppStore((s) => s.stopModuleAccessPolling)
  const moduleAccess = useAppStore((s) => s.moduleAccess)
  const moduleAccessLoaded = useAppStore((s) => s.moduleAccessLoaded)
  const currentPage = useAppStore((s) => s.currentPage)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)

  const prevModuleAccessRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (userRole === 'teacher') {
      const timer = setTimeout(() => {
        startModuleAccessPolling()
      }, 1500)
      return () => {
        clearTimeout(timer)
        stopModuleAccessPolling()
      }
    }
    return () => {
      stopModuleAccessPolling()
    }
  }, [userRole, startModuleAccessPolling, stopModuleAccessPolling])

  // Background pre-warming of frequent pages for 0ms transition speed
  useEffect(() => {
    const prefetchTimer = setTimeout(() => {
      import('@/components/cms/test-series/test-series-list').catch(() => {})
      import('@/components/cms/courses/courses-list').catch(() => {})
      import('@/components/cms/documents/documents-page').catch(() => {})
      import('@/components/cms/marketing/marketing-page').catch(() => {})
      import('@/components/cms/leads/leads-page').catch(() => {})
      import('@/components/cms/coupons/coupons-page').catch(() => {})
      import('@/components/cms/test-portal/question-library').catch(() => {})
      import('@/components/cms/test-portal/results-page').catch(() => {})
      import('@/components/cms/whatsapp/whatsapp-sales-page').catch(() => {})
    }, 500)
    return () => clearTimeout(prefetchTimer)
  }, [])

  useEffect(() => {
    if (!moduleAccessLoaded) return
    const prev = prevModuleAccessRef.current
    const current = moduleAccess

    if (Object.keys(prev).length > 0) {
      let hasChange = false
      for (const key of Object.keys(current)) {
        if (prev[key] !== current[key]) {
          hasChange = true
          break
        }
      }
      if (!hasChange) {
        for (const key of Object.keys(prev)) {
          if (current[key] !== prev[key]) {
            hasChange = true
            break
          }
        }
      }

      if (hasChange) {
        toast.info('Module access updated — Some features have been changed by the admin')
        if (!isPageAccessible(currentPage, current, moduleAccessLoaded, userRole)) {
          setCurrentPage('dashboard')
        }
      }
    }

    prevModuleAccessRef.current = { ...current }
  }, [moduleAccess, moduleAccessLoaded, currentPage, setCurrentPage, userRole])

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* Sidebar */}
      <React.Suspense
        fallback={
          <div className="flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out w-[60px]" />
        }
      >
        <Sidebar />
      </React.Suspense>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <React.Suspense fallback={<div className="h-16 border-b bg-white flex-shrink-0" />}>
          <Topbar />
        </React.Suspense>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-3 sm:p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <PageContent />
          </div>
          {/* Copyright Footer */}
          <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 pb-2 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
