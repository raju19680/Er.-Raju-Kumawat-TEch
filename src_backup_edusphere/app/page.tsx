'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, useUIStore } from '@/lib/store'
import { AuthScreen } from '@/components/auth/auth-screen'
import { LandingPage } from '@/components/shared/landing-page'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { TeacherManagement } from '@/components/admin/teacher-management'
import { TeacherDashboard } from '@/components/teacher/teacher-dashboard'
import { CourseManager } from '@/components/teacher/course-manager'
import { TestSeriesManager } from '@/components/teacher/test-series-manager'
import { NotesManager } from '@/components/teacher/notes-manager'
import { StudentManager } from '@/components/teacher/student-manager'
import { TeacherWebsite } from '@/components/teacher/teacher-website'
import { TeacherRevenue } from '@/components/teacher/teacher-revenue'
import { AnnouncementsView } from '@/components/shared/announcements-view'
import { StudentDashboard } from '@/components/student/student-dashboard'
import { CourseCatalog } from '@/components/student/course-catalog'
import { MyCourses } from '@/components/student/my-courses'
import { TestSeriesBrowser } from '@/components/student/test-series-browser'
import { NotesBrowser } from '@/components/student/notes-browser'
import { CertificatesView } from '@/components/student/certificates-view'
import { AdminAllStudents } from '@/components/admin/admin-all-students'
import { AdminAllCourses } from '@/components/admin/admin-all-courses'
import { AdminRevenue } from '@/components/admin/admin-revenue'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const currentView = useUIStore((s) => s.currentView)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        } else {
          // Session expired or not logged in - clear any persisted user
          setUser(null)
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  const renderView = () => {
    // Shared announcements view
    if (currentView === 'admin-announcements' || currentView === 'teacher-announcements' || currentView === 'student-announcements') {
      return <AnnouncementsView />
    }

    // Admin views
    if (user.role === 'ADMIN') {
      switch (currentView) {
        case 'admin-dashboard': return <AdminDashboard />
        case 'admin-teachers': return <TeacherManagement />
        case 'admin-students': return <AdminAllStudents />
        case 'admin-courses': return <AdminAllCourses />
        case 'admin-revenue': return <AdminRevenue />
        default: return <AdminDashboard />
      }
    }

    // Teacher views
    if (user.role === 'TEACHER') {
      switch (currentView) {
        case 'teacher-dashboard': return <TeacherDashboard />
        case 'teacher-courses': return <CourseManager />
        case 'teacher-tests': return <TestSeriesManager />
        case 'teacher-notes': return <NotesManager />
        case 'teacher-students': return <StudentManager />
        case 'teacher-website': return <TeacherWebsite />
        case 'teacher-revenue': return <TeacherRevenue />
        default: return <TeacherDashboard />
      }
    }

    // Student views
    if (user.role === 'STUDENT') {
      switch (currentView) {
        case 'student-dashboard': return <StudentDashboard />
        case 'student-courses': return <CourseCatalog />
        case 'student-my-courses': return <MyCourses />
        case 'student-tests': return <TestSeriesBrowser />
        case 'student-notes': return <NotesBrowser />
        case 'student-certificates': return <CertificatesView />
        default: return <StudentDashboard />
      }
    }

    return null
  }

  return <DashboardShell>{renderView()}</DashboardShell>
}
