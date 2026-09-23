'use client'

import React, { lazy, Suspense } from 'react'
import DashboardSidebar from '@/components/tp-portal/DashboardSidebar'
import DashboardTopbar from '@/components/tp-portal/DashboardTopbar'
import { useDashboardStore } from '@/lib/dashboard-store'
import { Loader2 } from 'lucide-react'

// ─── Lazy-load all page modules ───────────────────────────────────────────────
const AnalyticsPage   = lazy(() => import('@/components/dashboard/AnalyticsPage'))
const ProductsPage    = lazy(() => import('@/components/dashboard/ProductsPage'))
const ContentPage     = lazy(() => import('@/components/dashboard/ContentPage'))
const StudentsPage    = lazy(() => import('@/components/dashboard/StudentsPage'))
const DiscussionsPage = lazy(() => import('@/components/dashboard/DiscussionsPage'))
const SettingsPage    = lazy(() => import('@/components/dashboard/SettingsPage'))
const TestSeriesPage  = lazy(() => import('@/components/dashboard/TestSeriesPage'))
const ReportsPage     = lazy(() => import('@/components/dashboard/ReportsPage'))
const MarketingPage   = lazy(() => import('@/components/dashboard/MarketingPage'))
const SupportPage     = lazy(() => import('@/components/dashboard/SupportPage'))
const OfferingsPage   = lazy(() => import('@/components/dashboard/OfferingsPage'))

// ─── Full-page loader ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center flex-1 h-full py-32">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}

// ─── Page renderer ────────────────────────────────────────────────────────────
function PageContent() {
  const { activePage } = useDashboardStore()

  return (
    <Suspense fallback={<PageLoader />}>
      {(() => {
        switch (activePage) {
          case 'home':
          case 'analytics':
            return <AnalyticsPage />
          case 'products':
            return <ProductsPage />
          case 'content':
            return <ContentPage />
          case 'students':
            return <StudentsPage />
          case 'discussions':
            return <DiscussionsPage />
          case 'settings':
            return <SettingsPage />
          case 'test-series':
            return <TestSeriesPage />
          case 'reports':
            return <ReportsPage />
          case 'marketing':
            return <MarketingPage />
          case 'support':
            return <SupportPage />
          case 'offerings':
            return <OfferingsPage />
          default:
            return <AnalyticsPage />
        }
      })()}
    </Suspense>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <DashboardTopbar userName="Er. Raju Kumawat" />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <PageContent />
          </div>
          {/* Footer */}
          <div className="mt-8 border-t border-border pt-4 pb-2 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
