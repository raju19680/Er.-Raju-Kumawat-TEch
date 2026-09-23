'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StudentPortalState {
  activePage: string
  searchOpen: boolean
  searchQuery: string
  userLoggedIn: boolean
  setActivePage: (page: string) => void
  toggleSearch: () => void
  setSearchQuery: (query: string) => void
  setUserLoggedIn: (loggedIn: boolean) => void
}

export const useStudentStore = create<StudentPortalState>()(
  persist(
    (set) => ({
      activePage: 'home',
      searchOpen: false,
      searchQuery: '',
      userLoggedIn: false,
      setActivePage: (page) => set({ activePage: page }),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setUserLoggedIn: (loggedIn) => set({ userLoggedIn: loggedIn }),
    }),
    {
      name: 'student-portal-store',
    }
  )
)
