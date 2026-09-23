'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  username: string
  name: string | null
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  organisationId: string | null
  websiteSlug: string | null
  teacherStatus: string | null
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false })
        // Call logout API
        fetch('/api/auth/logout', { method: 'POST' })
      },
    }),
    {
      name: 'edusphere-auth',
    }
  )
)

type View = 
  | 'landing'
  | 'login'
  | 'register'
  | 'pricing'
  | 'features'
  // Admin views
  | 'admin-dashboard'
  | 'admin-teachers'
  | 'admin-students'
  | 'admin-courses'
  | 'admin-revenue'
  | 'admin-announcements'
  // Teacher views
  | 'teacher-dashboard'
  | 'teacher-courses'
  | 'teacher-tests'
  | 'teacher-notes'
  | 'teacher-students'
  | 'teacher-website'
  | 'teacher-revenue'
  | 'teacher-announcements'
  // Student views
  | 'student-dashboard'
  | 'student-courses'
  | 'student-my-courses'
  | 'student-tests'
  | 'student-notes'
  | 'student-course-view'
  | 'student-test-taking'
  | 'student-certificates'
  | 'student-announcements'

interface UIState {
  currentView: View
  selectedItemId: string | null
  authMode: 'landing' | 'login' | 'register'
  setView: (view: View) => void
  selectItem: (id: string | null) => void
  setAuthMode: (mode: 'landing' | 'login' | 'register') => void
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'landing',
  selectedItemId: null,
  authMode: 'landing',
  setView: (view) => set({ currentView: view, selectedItemId: null }),
  selectItem: (id) => set({ selectedItemId: id }),
  setAuthMode: (mode) => set({ authMode: mode }),
}))
