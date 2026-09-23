'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Skeleton } from '@/components/ui/skeleton'
import {
  NavbarSkeleton, CardSkeleton, ErrorState, PublicNavbar, HeroBanner,
  BrowseTiles, FeaturedSection, CoursesSection, CoursesListPage,
  TestSeriesListPage, DocsPage, QuickLinksPage, AboutPage, Footer,
  PortalData, PortalPage, AuthView
} from './public/public-components'

export default function PublicPortal({
  onNavigateToLogin,
  onNavigateToSignup,
}: {
  onNavigateToLogin?: () => void
  onNavigateToSignup?: () => void
}) {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activePage, setActivePage] = useState<PortalPage>('home')
  
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const openAuthDialog = useCallback((view?: AuthView) => {
    if (view === 'signup' && onNavigateToSignup) {
      onNavigateToSignup()
      return
    }
    if (view && view !== 'login') {
      sessionStorage.setItem('erkt_auth_view', view)
    }
    if (onNavigateToLogin) {
      onNavigateToLogin()
    } else {
      setCurrentView('student')
    }
  }, [setCurrentView, onNavigateToLogin, onNavigateToSignup])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const orgCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY'
      const res = await fetch(`/api/student/portal-data?orgCode=${orgCode}`)
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Check for reset_token in URL on mount — navigate to reset view
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) {
      openAuthDialog('reset-password')
    }
  }, [openAuthDialog])

  // Scroll to top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [activePage])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NavbarSkeleton />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <Skeleton className="h-48 sm:h-64 rounded-2xl mb-8" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState onRetry={fetchData} />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <>
            <HeroBanner data={data} />
            <BrowseTiles data={data} onNavigate={setActivePage} />
            <FeaturedSection data={data} onNavigate={setActivePage} onLoginClick={openAuthDialog} />
            <CoursesSection data={data} onNavigate={setActivePage} onLoginClick={openAuthDialog} />
          </>
        )
      case 'courses':
        return <CoursesListPage data={data} onLoginClick={openAuthDialog} />
      case 'test-series':
        return <TestSeriesListPage data={data} onLoginClick={openAuthDialog} />
      case 'docs':
        return <DocsPage data={data} />
      case 'quick-links':
        return <QuickLinksPage data={data} />
      case 'about':
        return <AboutPage data={data} onLoginClick={openAuthDialog} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar data={data} activePage={activePage} onNavigate={setActivePage} onLoginClick={openAuthDialog} onSignupClick={() => openAuthDialog('signup')} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={activePage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer data={data} />
    </div>
  )
}
