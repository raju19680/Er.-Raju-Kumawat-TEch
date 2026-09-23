'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DashboardPage = 'home' | 'products' | 'content' | 'analytics' | 'students' | 'discussions' | 'settings' | 'test-series' | 'reports' | 'marketing' | 'support' | 'offerings'

interface DashboardState {
  activePage: DashboardPage
  sidebarCollapsed: boolean
  searchQuery: string
  sidebarMobileOpen: boolean

  setActivePage: (page: DashboardPage) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSearchQuery: (query: string) => void
  setSidebarMobileOpen: (open: boolean) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      activePage: 'analytics' as DashboardPage,
      sidebarCollapsed: true,
      searchQuery: '',
      sidebarMobileOpen: false,

      setActivePage: (page) => set({ activePage: page }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
    }),
    {
      name: 'teacher-dashboard-store',
      partialize: (state) => ({
        activePage: state.activePage,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
