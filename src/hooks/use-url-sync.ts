import { useEffect, useRef } from 'react'
import { useAppStore, AppView, CMSPage, AdminPage, StudentPage } from '@/lib/store'

export function useUrlSync() {
  const isHydrating = useRef(true)

  // 1. Initial hydration from URL & popstate listener
  useEffect(() => {
    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search)
      const view = searchParams.get('view') as AppView | null
      const page = searchParams.get('page')
      const testSeriesId = searchParams.get('ts') || ''
      const testId = searchParams.get('t') || ''
      const courseId = searchParams.get('c') || ''
      const attemptId = searchParams.get('a') || ''
      const folderId = searchParams.get('f') || ''

      const store = useAppStore.getState()

      // Only attempt to hydrate view and page if they are present in URL
      if (view && ['login', 'cms', 'admin', 'student'].includes(view)) {
        if (store.currentView !== view) store.setCurrentView(view)

        if (page) {
          if (view === 'cms' && store.currentPage !== page) {
            store.setCurrentPage(page as CMSPage)
          } else if (view === 'admin' && store.adminPage !== page) {
            store.setAdminPage(page as AdminPage)
          } else if (view === 'student' && store.studentPage !== page) {
            store.setStudentPage(page as StudentPage)
          }
        }
      }

      if (store.selectedTestSeriesId !== testSeriesId) store.setSelectedTestSeriesId(testSeriesId)
      if (store.selectedTestId !== testId) store.setSelectedTestId(testId)
      if (store.selectedCourseId !== courseId) store.setSelectedCourseId(courseId)
      if (store.selectedAttemptId !== attemptId) store.setSelectedAttemptId(attemptId)
      if (store.folderId !== folderId) store.setFolderId(folderId)
    }

    // Hydrate immediately
    handleUrlChange()
    isHydrating.current = false

    // Listen for back/forward
    window.addEventListener('popstate', handleUrlChange)
    return () => window.removeEventListener('popstate', handleUrlChange)
  }, [])

  // 2. Sync State changes back to URL
  useEffect(() => {
    return useAppStore.subscribe((state, prevState) => {
      if (isHydrating.current) return

      // We only care about navigation state changes
      if (
        state.currentView !== prevState.currentView ||
        state.currentPage !== prevState.currentPage ||
        state.adminPage !== prevState.adminPage ||
        state.studentPage !== prevState.studentPage ||
        state.selectedTestSeriesId !== prevState.selectedTestSeriesId ||
        state.selectedTestId !== prevState.selectedTestId ||
        state.selectedCourseId !== prevState.selectedCourseId ||
        state.selectedAttemptId !== prevState.selectedAttemptId ||
        state.folderId !== prevState.folderId
      ) {
        const searchParams = new URLSearchParams(window.location.search)
        
        // Don't sync login view unless we are logging out, generally we want cleaner URL for login
        if (state.currentView === 'login') {
          if (window.location.search !== '') {
            window.history.pushState({}, '', window.location.pathname)
          }
          return
        }

        searchParams.set('view', state.currentView)

        if (state.currentView === 'cms') searchParams.set('page', state.currentPage)
        else if (state.currentView === 'admin') searchParams.set('page', state.adminPage)
        else if (state.currentView === 'student') searchParams.set('page', state.studentPage)

        if (state.selectedTestSeriesId) searchParams.set('ts', state.selectedTestSeriesId)
        else searchParams.delete('ts')

        if (state.selectedTestId) searchParams.set('t', state.selectedTestId)
        else searchParams.delete('t')

        if (state.selectedCourseId) searchParams.set('c', state.selectedCourseId)
        else searchParams.delete('c')

        if (state.selectedAttemptId) searchParams.set('a', state.selectedAttemptId)
        else searchParams.delete('a')

        if (state.folderId) searchParams.set('f', state.folderId)
        else searchParams.delete('f')

        const newUrl = `${window.location.pathname}?${searchParams.toString()}`
        
        if (newUrl !== window.location.pathname + window.location.search) {
          window.history.pushState({}, '', newUrl)
        }
      }
    })
  }, [])
}
