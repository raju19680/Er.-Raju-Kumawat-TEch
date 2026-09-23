'use client'

import React, { useState, lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import {
  Menu,
  BookOpen,
  ClipboardList,
  Trophy,
  User,
  LogOut,
  LayoutDashboard,
  Loader2,
  ShoppingBag,
  Library,
  Radio,
  Receipt,
  Bell,
  HelpCircle,
} from 'lucide-react'

import { useAppStore, type StudentPage } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { NotificationBell } from '@/components/shared/notification-bell'
import { useNotifications } from '@/hooks/use-notifications'

// A small 0.1s beep audio
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAHwwAECgoODg4QEBAUFBQWFhYYGBgcHBwgICAiIiIkJCQnJycpKSksLCwuLi4wMDAzMzM1NTU3Nzc5OTo6PDw+Pj5AQEBCQkREREZGRkhISEpKSkxMTE5OTlBQUFNTU1VVVVdXV1lZWVtbW11dXWJiYmRkZGZmZmhpaWtra21tbW9vb3FxcXNzc3V1dXd3eHh6enp8fHx+fn6AgICAgoKCg4OEg4OEhISFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYX//uQZBAAAAB1JAAAAAAH//////////+7hkQQAAcMAQIAAAAAD//////////7uGRDAABwwBAgAAAAAP//////////u4ZFEAAHDAECAAAAAA//////////+7hkWAAAcMAQIAAAAAD//////////7uGRZAABwwBAgAAAAAP//////////u4ZGQAAHDAECAAAAAA//////////+7hkbAAAcMAQIAAAAAD//////////7uGRwAABwwBAgAAAAAP//////////u4ZHUAAHDAECAAAAAA//////////+7hkeAAAcMAQIAAAAAD//////////7uGR7AABwwBAgAAAAAP//////////u4ZH4AAHDAECAAAAAA//////////+7hkggAAcMAQIAAAAAD//////////7uGSEgABwwBAgAAAAAP//////////u4ZIUAAHDAECAAAAAA//////////+7hkjAAAcMAQIAAAAAD//////////7uGSUAABwwBAgAAAAAP//////////u4ZJ0AAHDAECAAAAAA==========';

function playNotificationSound() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND)
    audio.play().catch(() => {})
  } catch (e) {
    // ignore
  }
}

// Lazy-load authenticated portal pages
const StudentDashboard = lazy(() => import('./student-dashboard'))
const TestSeriesList = lazy(() => import('./test-series-list'))
const TestSeriesDetail = lazy(() => import('./test-series-detail'))
const TakeTest = lazy(() => import('./take-test'))
const TestResult = lazy(() => import('./test-result'))
const MyCourses = lazy(() => import('./my-courses'))
const LiveClasses = lazy(() => import('./live-classes'))
const CourseDetail = lazy(() => import('./course-detail'))
const StudentResults = lazy(() => import('./student-results'))
const StudentProfile = lazy(() => import('./student-profile'))
const StudentStore = lazy(() => import('./student-store'))
const StudentProductDetail = lazy(() => import('./student-product-detail'))
const StudentLibrary = lazy(() => import('./student-library'))
const StudentOrders = lazy(() => import('./student-orders'))
const StudentAnnouncements = lazy(() => import('./student-announcements'))
const StudentDoubts = lazy(() => import('./student-doubts'))
const PaymentCheckout = lazy(() => import('./payment-checkout'))
const PublicPortal = lazy(() => import('./public-portal'))


// Auth pages - eagerly loaded for better UX
import StudentLogin from './student-login'
import StudentSignup from './student-signup'
import StudentForgotPassword from './student-forgot-password'
import StudentResetPassword from './student-reset-password'

// ─── Types ──────────────────────────────────────────────────────────────────────

export type StudentAuthPage = 'login' | 'signup' | 'forgot-password' | 'reset-password'

// CheckoutItem is now in the store
interface CheckoutItem {
  id: string
  type: 'test_series' | 'course'
  title: string
  price: number
  mrp: number
  thumbnail: string | null
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function useAccentColor(accent: string | undefined) {
  const defaultAccent = '#D97706'
  const color = accent || defaultAccent
  return {
    bg: color,
    bgLight: `${color}15`,
    bgMedium: `${color}30`,
    text: color,
    hover: `${color}20`,
    border: `${color}40`,
  }
}

// ─── Page Loader ────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="size-8 animate-spin text-amber-600" />
    </div>
  )
}

// ─── Authenticated Student Portal ──────────────────────────────────────────────

const sidebarItems: { id: StudentPage; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-tests', label: 'My Tests', icon: ClipboardList },
  { id: 'my-courses', label: 'My Courses', icon: BookOpen },
  { id: 'live-classes', label: 'Live Classes', icon: Radio },
  { id: 'store', label: 'Store & Books', icon: ShoppingBag },
  { id: 'my-library', label: 'My Library', icon: Library },
  { id: 'results', label: 'Results', icon: Trophy },
  { id: 'orders', label: 'Orders & Invoices', icon: Receipt },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'doubts', label: 'Ask Doubts', icon: HelpCircle },
  { id: 'profile', label: 'Profile', icon: User },
]


function StudentSidebar() {
  const { studentPage, setStudentPage, studentSidebarCollapsed, orgName } = useAppStore()
  const accent = useAccentColor(undefined)

  return (
    <aside className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${studentSidebarCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Org Name */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm shrink-0" style={{ backgroundColor: accent.bg }}>
            {orgName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {!studentSidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{orgName}</p>
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: accent.text }}>Student Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = studentPage === item.id || (item.id === 'my-tests' && ['test-series-detail', 'take-test', 'test-result'].includes(studentPage)) || (item.id === 'my-courses' && studentPage === 'course-detail') || (item.id === 'store' && studentPage === 'store-product-detail')
          return (
            <button
              key={item.id}
              onClick={() => setStudentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={isActive ? { backgroundColor: accent.bg } : undefined}
              title={studentSidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="size-5 shrink-0" />
              {!studentSidebarCollapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function StudentTopbar() {
  const { userName, logout, studentPage, setStudentPage, toggleStudentSidebar } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const accent = useAccentColor(undefined)
  const initials = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'ST'

  const currentLabel = sidebarItems.find(i => i.id === studentPage)?.label
    || (studentPage === 'store-product-detail' ? 'Product Detail' : 'Dashboard')

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleStudentSidebar}>
              <Menu className="size-5" />
            </Button>
            <h1 className="text-sm font-semibold text-gray-900">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell with real-time updates */}
            <NotificationBell
              targetRole="student"
              variant="popover"
              accentColor={accent.bg}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs font-bold bg-amber-50 text-amber-700">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{userName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setStudentPage('profile')} className="cursor-pointer">
                  <User className="size-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut className="size-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: accent.bg }}>
                  {initials}
                </div>
                <span className="text-base font-bold">{userName}</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col p-3 gap-1">
            {sidebarItems.map((item) => {
              const isActive = studentPage === item.id
              return (
                <SheetClose key={item.id} asChild>
                  <button
                    onClick={() => setStudentPage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={isActive ? { backgroundColor: accent.bg } : undefined}
                  >
                    <item.icon className="size-5" />
                    <span>{item.label}</span>
                  </button>
                </SheetClose>
              )
            })}
            <Separator className="my-2" />
            <SheetClose asChild>
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="size-5" /> Sign Out
              </button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function StudentContent() {
  const { studentPage } = useAppStore()

  const pageMap: Record<StudentPage, React.ComponentType> = {
    'dashboard': StudentDashboard,
    'my-tests': TestSeriesList,
    'my-courses': MyCourses,
    'live-classes': LiveClasses,
    'results': StudentResults,
    'profile': StudentProfile,
    'test-series-detail': TestSeriesDetail,
    'take-test': TakeTest,
    'test-result': TestResult,
    'course-detail': CourseDetail,
    'store': StudentStore,
    'store-product-detail': StudentProductDetail,
    'digital-products': StudentStore,
    'my-library': StudentLibrary,
    'orders': StudentOrders,
    'notices': StudentAnnouncements,
    'announcements': StudentAnnouncements,
    'doubts': StudentDoubts,
    'support': StudentDoubts,
  }


  const PageComponent = pageMap[studentPage] || StudentDashboard

  return (
    <Suspense fallback={<PageLoader />}>
      <PageComponent />
    </Suspense>
  )
}

function AuthenticatedPortal() {
  const { studentPage, orgCode, checkoutOpen, checkoutItem, closeCheckout } = useAppStore()
  const isTakingTest = studentPage === 'take-test'

  // Web Push & Sound logic
  const { unreadCount, notifications } = useNotifications({ fetchOnMount: false, showToast: false, limit: 1, targetRole: 'student' })
  const prevCount = useRef(unreadCount)

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Listen for new notifications to play sound and show push
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      playNotificationSound()
      if ('Notification' in window && Notification.permission === 'granted' && notifications[0]) {
        try {
          new Notification(notifications[0].title, {
            body: notifications[0].message,
          })
        } catch (e) {
          // Ignore if blocked
        }
      }
    }
    prevCount.current = unreadCount
  }, [unreadCount, notifications])

  if (isTakingTest) {
    return (
      <Suspense fallback={<PageLoader />}>
        <TakeTest />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <StudentTopbar />
      <div className="flex flex-1 overflow-hidden">
        <StudentSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
              <StudentContent />
            </div>
          </div>
          {/* Footer - sticky at bottom */}
          <div className="shrink-0 border-t border-gray-200 bg-white py-3 text-center px-4">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
            </p>
          </div>
        </main>
      </div>
      {/* Payment Checkout Overlay */}
      <Suspense fallback={null}>
        <PaymentCheckout
          open={checkoutOpen}
          onOpenChange={(open) => { if (!open) closeCheckout() }}
          item={checkoutItem}
          orgCode={orgCode}
          onSuccess={() => { toast.success('Payment successful!'); closeCheckout() }}
          onFailure={(msg) => toast.error(msg || 'Payment failed')}
        />
      </Suspense>
    </div>
  )
}

// ─── Unauthenticated Auth Page Router ─────────────────────────────────────────

function UnauthenticatedView() {
  const [authPage, setAuthPage] = useState<StudentAuthPage>('login')
  const [resetToken, setResetToken] = useState('')
  const [forgotPasswordOrgId, setForgotPasswordOrgId] = useState<string | undefined>()
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string | undefined>()

  const goToLogin = useCallback(() => {
    setAuthPage('login')
    setResetToken('')
    setForgotPasswordOrgId(undefined)
    setForgotPasswordEmail(undefined)
  }, [])

  const goToSignup = useCallback(() => {
    setAuthPage('signup')
  }, [])

  const goToForgotPassword = useCallback((orgId?: string, email?: string) => {
    setForgotPasswordOrgId(orgId)
    setForgotPasswordEmail(email)
    setAuthPage('forgot-password')
  }, [])

  const goToResetPassword = useCallback((token: string) => {
    setResetToken(token)
    setAuthPage('reset-password')
  }, [])

  switch (authPage) {
    case 'login':
      return (
        <StudentLogin
          onNavigateToSignup={goToSignup}
          onNavigateToForgotPassword={goToForgotPassword}
          onNavigateToResetPassword={goToResetPassword}
        />
      )
    case 'signup':
      return (
        <StudentSignup
          onNavigateToLogin={goToLogin}
        />
      )
    case 'forgot-password':
      return (
        <StudentForgotPassword
          onNavigateToLogin={goToLogin}
          initialOrgId={forgotPasswordOrgId}
          initialEmail={forgotPasswordEmail}
        />
      )
    case 'reset-password':
      return (
        <StudentResetPassword
          token={resetToken}
          onNavigateToLogin={goToLogin}
          onNavigateToForgotPassword={goToForgotPassword}
        />
      )
    default:
      return (
        <StudentLogin
          onNavigateToSignup={goToSignup}
          onNavigateToForgotPassword={goToForgotPassword}
          onNavigateToResetPassword={goToResetPassword}
        />
      )
  }
}

// ─── Main Layout ───────────────────────────────────────────────────────────────

export default function StudentLayout() {
  const { isAuthenticated, userRole } = useAppStore()

  // If logged in as student, show authenticated portal
  if (isAuthenticated && (userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'user' || !userRole)) {
    return <AuthenticatedPortal />
  }

  // Unauthenticated users see the full-page auth flow
  return <UnauthenticatedView />
}
