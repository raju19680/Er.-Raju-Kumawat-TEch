'use client'

import React, { useState } from 'react'
import StudentNavbar from './StudentNavbar'
import StudentFooter from './StudentFooter'
import HomePage from '@/components/teacher-portal-pages/HomePage'
import CoursesPage from '@/components/teacher-portal-pages/CoursesPage'
import TestSeriesPage from '@/components/teacher-portal-pages/TestSeriesPage'
import DocsPage from '@/components/teacher-portal-pages/DocsPage'
import QuickLinksPage from '@/components/teacher-portal-pages/QuickLinksPage'
import AboutPage from '@/components/teacher-portal-pages/AboutPage'
import LoginPage from '@/components/teacher-portal-pages/LoginPage'
import ProfilePage from '@/components/teacher-portal-pages/ProfilePage'

const TEACHER_CONFIG = {
  name: 'Er. Raju Kumawat',
  institution: 'Computer Anudeshak',
  logo: '/logo.svg',
}

const pageComponents: Record<string, React.ComponentType> = {
  home: HomePage,
  courses: CoursesPage,
  'test-series': TestSeriesPage,
  docs: DocsPage,
  'quick-links': QuickLinksPage,
  about: AboutPage,
  login: LoginPage,
  profile: ProfilePage,
}

export default function PublicPortalLayout() {
  const [activePage, setActivePage] = useState('home')
  const [userLoggedIn, setUserLoggedIn] = useState(false)

  const PageComponent = pageComponents[activePage] || HomePage

  const handlePageChange = (page: string) => {
    setActivePage(page)
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <StudentNavbar
        activePage={activePage}
        onPageChange={handlePageChange}
        teacherName={TEACHER_CONFIG.name}
        teacherLogo={TEACHER_CONFIG.logo}
        userLoggedIn={userLoggedIn}
      />

      <main className="flex-1">
        <PageComponent />
      </main>

      <StudentFooter
        teacherName={TEACHER_CONFIG.name}
        teacherInstitution={TEACHER_CONFIG.institution}
        teacherLogo={TEACHER_CONFIG.logo}
      />
    </div>
  )
}
