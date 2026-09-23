'use client'

import { StudentSidebar, getSidebarTitle } from './student-sidebar'

import { MediaImage } from '@/components/ui/media-image'
import { apiFetchJSON } from '@/lib/api-client'
import React, { useState, lazy, Suspense, useCallback, useEffect } from 'react'
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
  Receipt,
  Bell,
  HelpCircle,
  MessageSquare,
  Video,
  GraduationCap,
  Layers,
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

// Lazy-load authenticated portal pages
const StudentDashboard = lazy(() => import('./student-dashboard'))
const TeacherHub = lazy(() => import('./teacher-hub'))
const TestSeriesList = lazy(() => import('./test-series-list'))
const TestSeriesDetail = lazy(() => import('./test-series-detail'))
const TakeTest = lazy(() => import('./take-test'))
const TestResult = lazy(() => import('./test-result'))
const MyCourses = lazy(() => import('./my-courses'))
const CourseDetail = lazy(() => import('./course-detail'))
const CourseDrilldown = lazy(() => import('./course/course-drilldown'))
const StudentResults = lazy(() => import('./student-results'))
const StudentProfile = lazy(() => import('./student-profile'))
const StudentStore = lazy(() => import('./student-store'))
const StudentProductDetail = lazy(() => import('./student-product-detail'))
const StudentLibrary = lazy(() => import('./student-library'))
const StudentFlashcards = lazy(() => import('./student-flashcards'))
const StudentGamification = lazy(() => import('./student-gamification'))
const StudentChat = lazy(() => import('./student-chat'))
const StudentLiveClasses = lazy(() => import('./student-live-classes'))
const StudentAssignments = lazy(() => import('./student-assignments'))
const StudentOrders = lazy(() => import('./student-orders'))
const StudentAnnouncements = lazy(() => import('./student-announcements'))
const StudentDoubts = lazy(() => import('./student-doubts'))
const StudentOfferings = lazy(() => import('./student-offerings'))
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

function StudentTopbar() {
  const { userName, logout, studentPage, setStudentPage, setStudentSidebarMobileOpen, toggleStudentSidebar, studentPageHistory, goBackStudentPage } = useAppStore()
  const accent = useAccentColor(undefined)
  const initials = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'ST'

  const currentLabel = getSidebarTitle(studentPage)

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setStudentSidebarMobileOpen(true)}>
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
  )
}

function StudentBottomNav() {
  const { studentPage, setStudentPage } = useAppStore()
  const accent = useAccentColor(undefined)

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'teacher-hub', label: 'Faculty', icon: GraduationCap },
    { id: 'my-courses', label: 'Courses', icon: BookOpen },
    { id: 'my-tests', label: 'Tests', icon: ClipboardList },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            studentPage === item.id ||
            (item.id === 'teacher-hub' && studentPage === 'teachers') ||
            (item.id === 'my-courses' && studentPage === 'course-detail') ||
            (item.id === 'my-tests' && ['test-series-detail', 'take-test', 'test-result'].includes(studentPage))

          return (
            <button
              key={item.id}
              onClick={() => setStudentPage(item.id as StudentPage)}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors"
            >
              <item.icon 
                className={`size-5 transition-transform ${isActive ? 'scale-110' : 'text-gray-400'}`} 
                style={isActive ? { color: accent.bg } : undefined}
              />
              <span 
                className={`text-xs font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                style={isActive ? { color: accent.bg } : undefined}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const StudentBookmarks = lazy(() => import('./student-bookmarks').then(m => ({ default: m.StudentBookmarks })))

function StudentContent() {
  const { studentPage } = useAppStore()

  const pageMap: Record<StudentPage, React.ComponentType> = {
    'dashboard': StudentDashboard,
    'teacher-hub': TeacherHub,
    'teachers': TeacherHub,
    'my-tests': TestSeriesList,
    'test-series': TestSeriesList,
    'bookmarks': StudentBookmarks,
    'my-courses': MyCourses,
    'results': StudentResults,
    'profile': StudentProfile,
    'test-series-detail': TestSeriesDetail,
    'take-test': TakeTest,
    'test-result': TestResult,
    'course-detail': CourseDrilldown,
    'store': StudentStore,
    'store-product-detail': StudentProductDetail,
    'digital-products': StudentStore,
    'my-library': StudentLibrary,
      'flashcards': StudentFlashcards as any,
      'gamification': StudentGamification as any,
      'chat': StudentChat as any,
      'live-classes': StudentLiveClasses as any,
      'assignments': StudentAssignments as any,
    'orders': StudentOrders,
    'announcements': StudentAnnouncements,
      'notices': StudentAnnouncements,
      'doubts': StudentDoubts,
      'support': StudentDoubts,
      'offerings': StudentOfferings,
      'checkout': () => null,
    }

  const PageComponent = pageMap[studentPage] || StudentDashboard

  return (
    <Suspense fallback={<PageLoader />}>
      <PageComponent />
    </Suspense>
  )
}

function AuthenticatedPortal() {
  const { studentPage, orgCode, checkoutOpen, checkoutItem, closeCheckout, checkoutIntent, setCheckoutIntent, openCheckout } = useAppStore()

  React.useEffect(() => {
    if (checkoutIntent) {
      const intent = checkoutIntent;
      setCheckoutIntent(null);
      setTimeout(() => openCheckout(intent), 100);
    }
  }, [checkoutIntent, setCheckoutIntent, openCheckout]);
  const isTakingTest = studentPage === 'take-test'

  if (isTakingTest) {
    return (
      <Suspense fallback={<PageLoader />}>
        <TakeTest />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30 pb-16 md:pb-0">
      <StudentTopbar />
      <div className="flex flex-1 overflow-hidden">
        <StudentSidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full">
              <StudentContent />
            </div>
          </div>
          {/* Footer - sticky at bottom */}
          <div className="hidden md:block shrink-0 border-t border-gray-200 bg-white py-3 text-center px-4">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
            </p>
          </div>
        </main>
      </div>
      <StudentBottomNav />
      {/* Payment Checkout Overlay */}
      <Suspense fallback={null}>
        <PaymentCheckout
          open={checkoutOpen}
          onOpenChange={(open) => { if (!open) closeCheckout() }}
          item={checkoutItem}
          orgCode={orgCode}
          onSuccess={() => { 
            toast.success('Payment successful!'); 
            useAppStore.getState().triggerPaymentSuccess(); 
            
            const storeState = useAppStore.getState();
            if (storeState.checkoutItem?.type === 'test_series') {
              storeState.setStudentPage('my-tests');
            } else if (storeState.checkoutItem?.type === 'course') {
              storeState.setStudentPage('my-courses');
            } else if (storeState.checkoutItem?.type === 'digital_product') {
              storeState.setStudentPage('my-library');
            }
            
            closeCheckout();
          }}
          onFailure={(msg) => toast.error(msg || 'Payment failed')}
        />
      </Suspense>
    </div>
  )
}

// ─── Unauthenticated Auth Page Router ─────────────────────────────────────────

export type UnauthViewType = StudentAuthPage | 'public'

function UnauthenticatedView() {
  const [authPage, setAuthPage] = useState<UnauthViewType>('public')
  const [resetToken, setResetToken] = useState('')
  const [forgotPasswordOrgId, setForgotPasswordOrgId] = useState<string | undefined>()
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string | undefined>()

  useEffect(() => {
    const savedView = sessionStorage.getItem('erkt_auth_view') as UnauthViewType | null
    if (savedView && ['public', 'login', 'signup', 'forgot-password', 'reset-password'].includes(savedView)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthPage(savedView)
      sessionStorage.removeItem('erkt_auth_view')
    }
  }, [])

  const goToPublic = useCallback(() => {
    setAuthPage('public')
    sessionStorage.removeItem('erkt_auth_view')
  }, [])

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
    case 'public':
      return <PublicPortal onNavigateToLogin={goToLogin} onNavigateToSignup={goToSignup} />
    case 'login':
      return (
        <StudentLogin
          onNavigateToSignup={goToSignup}
          onNavigateToForgotPassword={goToForgotPassword}
          onNavigateToResetPassword={goToResetPassword}
          onNavigateToHome={goToPublic}
        />
      )
    case 'signup':
      return (
        <StudentSignup
          onNavigateToLogin={goToLogin}
          onNavigateToHome={goToPublic}
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
      return <PublicPortal onNavigateToLogin={goToLogin} />
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
