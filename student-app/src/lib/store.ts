import { create } from 'zustand'
import { apiFetch, initStoreAccess } from '@/lib/api-client'

// Module-level variable for the polling interval (not serializable, can't be in Zustand state)
let _moduleAccessPollingInterval: ReturnType<typeof setInterval> | null = null

// Navigation items for the sidebar
export type SidebarItem = {
  id: string
  label: string
  icon: string
  children?: SidebarItem[]
}

export type AppView = 'login' | 'cms' | 'admin' | 'student' | 'student-public'

export type CMSPage =
  | 'dashboard'
  | 'digital-products'
  | 'store'
  | 'blogs'
  | 'quick-links'
  | 'tests'
  | 'results'
  | 'bulk-uploader'
  | 'reported-questions'
  | 'question-library'
  | 'reports-sales'
  | 'reports-orders'
  | 'reports-users'
  | 'graphics'
  | 'notifications'
  | 'leads'
  | 'coupons'
  | 'payment-pages'
  | 'whatsapp-sales'
  | 'whatsapp-campaigns'
  | 'support-queries'
  | 'support-chat'
  | 'settings-profile'
  | 'settings-security'
  | 'settings-blocked'
  | 'settings-categories'
  | 'chat-manager'
  | 'meetings'
  | 'youtube-courses'
  | 'documents'

export type AdminPage =
  | 'admin-dashboard'
  | 'admin-teachers'
  | 'admin-students'
  | 'admin-organizations'
  | 'admin-analytics'
  | 'admin-orders'
  | 'admin-notifications'
  | 'admin-settings'
  | 'admin-module-access'
  | 'admin-content'
  | 'admin-security'
  | 'admin-commissions'
  | 'admin-builds'
  | 'admin-audit-log'
  | 'admin-bulk-ops'
  | 'admin-payouts'
  | 'admin-health'
  | 'admin-announcements'
  | 'admin-feature-flags'
  | 'admin-app-versions'
  | 'admin-scheduled-notifications'
  | 'admin-db-backup'
  | 'admin-white-label'
  | 'admin-dynamic-config'
  | 'admin-email-templates'
  | 'admin-student-mgmt'


export interface StudentHistoryState {
  page: StudentPage
  courseId: string
  testSeriesId: string
  testId: string
  productId: string
}
export type StudentPage =
  | 'flashcards'
  | 'dashboard'
  | 'teacher-hub'
  | 'teachers'
  | 'my-tests'
  | 'my-courses'
  | 'results'
  | 'profile'
  | 'test-series-detail'
  | 'take-test'
  | 'test-result'
  | 'course-detail'
  | 'store'
  | 'store-product-detail'
  | 'digital-products'
  | 'my-library'
  | 'orders'
  | 'announcements'
  | 'notices'
  | 'doubts'
  | 'support'
  | 'offerings'
  | 'gamification'
  | 'chat'
  | 'live-classes'
  | 'assignments'
  | 'checkout'
  | 'test-series'
  | 'bookmarks'

interface AppState {
  // Auth
  isAuthenticated: boolean
  currentView: AppView
  orgCode: string
  orgName: string
  orgLogo: string | null
  userName: string
  userEmail: string
  userRole: string
  loginMode: string // 'admin', 'cms', or 'student'

  // CMS Navigation
  currentPage: CMSPage
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean

  // Admin Navigation
  adminPage: AdminPage
  adminSidebarCollapsed: boolean
  adminSidebarMobileOpen: boolean

  // Student Navigation
  studentPageHistory: StudentHistoryState[]
  studentPage: StudentPage
  studentSidebarCollapsed: boolean
  studentSidebarMobileOpen: boolean
  selectedTestSeriesId: string
  selectedTestId: string
  takeTestMode: 'CBT' | 'PDF'
  isPracticeMode: boolean
  selectedCourseId: string
  selectedAttemptId: string
  selectedTeacherId: string

  // Global search
  globalSearchOpen: boolean
  globalSearchQuery: string

  // API token for admin requests
  apiToken: string

  // Module Access (for CMS portal - teacher's enabled modules)
  moduleAccess: Record<string, boolean>
  moduleAccessLoaded: boolean

  // Admin: pre-selected teacher for module-access page
  adminSelectedTeacherId: string | null

  // Checkout state — allows any child page to trigger payment checkout
  checkoutOpen: boolean
  checkoutItem: {
    id: string
    type: 'test_series' | 'course' | 'digital_product'
    title: string
    price: number
    mrp: number
    thumbnail: string | null
  } | null
  checkoutIntent: {
    id: string
    type: 'test_series' | 'course' | 'digital_product'
    title: string
    price: number
    mrp: number
    thumbnail: string | null
  } | null
  paymentSuccessTrigger: number

  // Logout guard — prevents SessionSync/useAuthSync from re-authenticating during logout
  loggingOut: boolean

  // Actions
  login: (orgCode: string, orgName: string, userName: string, userEmail: string, role: string, loginMode?: string) => void
  logout: () => Promise<void>
  setCurrentView: (view: AppView) => void
  setCurrentPage: (page: CMSPage) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  setAdminPage: (page: AdminPage) => void
  toggleAdminSidebar: () => void
  setAdminSidebarCollapsed: (collapsed: boolean) => void
  setAdminSidebarMobileOpen: (open: boolean) => void
  setStudentPage: (page: StudentPage) => void
  goBackStudentPage: () => void
  toggleStudentSidebar: () => void
  setStudentSidebarCollapsed: (collapsed: boolean) => void
  setStudentSidebarMobileOpen: (open: boolean) => void
  setSelectedTestSeriesId: (id: string) => void
  setSelectedTestId: (id: string) => void
  setTakeTestMode: (mode: 'CBT' | 'PDF') => void
  setIsPracticeMode: (v: boolean) => void
  setSelectedCourseId: (id: string) => void
  setSelectedAttemptId: (id: string) => void
  setSelectedTeacherId: (id: string) => void
  setGlobalSearchOpen: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  setApiToken: (token: string) => void
  setAdminSelectedTeacherId: (id: string | null) => void
  openCheckout: (item: { id: string; type: 'test_series' | 'course' | 'digital_product'; title: string; price: number; mrp: number; thumbnail: string | null }) => void
  closeCheckout: () => void
  setCheckoutIntent: (item: { id: string; type: 'test_series' | 'course' | 'digital_product'; title: string; price: number; mrp: number; thumbnail: string | null } | null) => void
  triggerPaymentSuccess: () => void
  fetchModuleAccess: () => Promise<void>
  setModuleAccess: (access: Record<string, boolean>) => void
  setOrg: (code: string, name: string, logo?: string | null) => void
  startModuleAccessPolling: () => void
  stopModuleAccessPolling: () => void
  requireAuth: () => boolean
}

export const useAppStore = create<AppState>((set) => ({
  // Auth defaults
  isAuthenticated: false,
  currentView: 'login',
  orgCode: '',
  orgName: 'Er. Raju Kumawat Tech',
  orgLogo: null,
  userName: '',
  userEmail: '',
  userRole: '',
  loginMode: '',

  // CMS Navigation
  currentPage: 'dashboard',
  sidebarCollapsed: true,
  sidebarMobileOpen: false,

  // Admin Navigation
  adminPage: 'admin-dashboard',
  adminSidebarCollapsed: true,
  adminSidebarMobileOpen: false,

  // Student Navigation
  studentPageHistory: [],
    studentPageHistory: [],
        studentPage: 'dashboard',
  studentSidebarCollapsed: false,
  studentSidebarMobileOpen: false,
  selectedTestSeriesId: '',
  selectedTestId: '',
    takeTestMode: 'CBT',
  isPracticeMode: false,
  selectedCourseId: '',
  selectedAttemptId: '',
  selectedTeacherId: '',

  // Search
  globalSearchOpen: false,
  globalSearchQuery: '',

  // API token
  apiToken: '',

  // Module Access
  moduleAccess: {},
  moduleAccessLoaded: false,

  // Admin: pre-selected teacher
  adminSelectedTeacherId: null,

  // Checkout
  checkoutOpen: false,
  checkoutItem: null,
  checkoutIntent: null,
  paymentSuccessTrigger: 0,

  // Logout guard
  loggingOut: false,

  // Actions
  login: (orgCode, orgName, userName, userEmail, role, loginMode) => {
    // Role-based portal redirect:
    // platform_admin → Admin Portal
    // teacher → CMS Portal
    // student → Student Portal
    const mode = loginMode || (role === 'platform_admin' ? 'admin' : role === 'student' ? 'student' : 'cms')

    console.log(`[STORE] login() called: role=${role}, loginMode=${loginMode}, computed mode=${mode}`)

    // Record login time for grace period in session checks
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('erkt_logged_out')
      } catch {}
      ;(window as any).__ERKT_LOGIN_TIME__ = Date.now()
    }

    let view: AppView = 'cms'
    if (mode === 'admin') {
      view = 'admin'
    } else if (mode === 'student') {
      view = 'student'
    } else {
      view = 'cms'
    }

    set({
      isAuthenticated: true,
      loggingOut: false,
      currentView: view,
      orgCode,
      orgName,
      userName,
      userEmail,
      userRole: role,
      loginMode: mode,
    })
  },

  logout: async () => {
    // Set loggingOut flag FIRST to prevent SessionSync/useAuthSync from re-authenticating
    set({ loggingOut: true })

    // Clear tokens and set explicit logged out marker
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('erkt_logged_out', 'true')
        localStorage.removeItem('erkt_api_token')
        localStorage.removeItem('auth-storage')
        // Expire all possible NextAuth cookies
        const cookies = [
          'next-auth.session-token',
          '__Secure-next-auth.session-token',
          'next-auth.callback-url',
          '__Secure-next-auth.callback-url',
          'next-auth.csrf-token',
          '__Host-next-auth.csrf-token',
        ]
        cookies.forEach((cookieName) => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax;`
        })
      } catch {}
    }

    // Clear polling interval directly before resetting state
    if (_moduleAccessPollingInterval) {
      clearInterval(_moduleAccessPollingInterval)
      _moduleAccessPollingInterval = null
    }

    set({
      isAuthenticated: false,
      orgCode: '',
      orgName: 'Er. Raju Kumawat Tech',
      orgLogo: null,
      userName: '',
      userEmail: '',
      userRole: '',
      loginMode: '',
      studentPage: 'dashboard',
      studentSidebarCollapsed: false,
      studentSidebarMobileOpen: false,
      selectedTestSeriesId: '',
      selectedTestId: '',
    takeTestMode: 'CBT',
      isPracticeMode: false,
      selectedCourseId: '',
      selectedAttemptId: '',
      apiToken: '',
      checkoutOpen: false,
      checkoutItem: null,
      checkoutIntent: null,
    })

    // Call server logout endpoint and await it
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout fetch error:', e)
    }

    // Sign out from NextAuth and await it
    try {
      const { signOut } = await import('next-auth/react')
      await signOut({ redirect: false })
    } catch (e) {
      console.error('NextAuth signout error:', e)
    }

    // Hard reload/redirect to '/' to clear all in-memory caches
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  },

  setCurrentView: (view) => set({ currentView: view }),
  setCurrentPage: (page) => set({ currentPage: page, sidebarMobileOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  setAdminPage: (page) => {
    // Auto-prefix with 'admin-' if not present, to be forgiving of callers
    const normalizedPage = page.startsWith('admin-') ? page : `admin-${page}` as typeof page
    set({ adminPage: normalizedPage, adminSidebarMobileOpen: false })
  },
  toggleAdminSidebar: () => set((s) => ({ adminSidebarCollapsed: !s.adminSidebarCollapsed })),
  setAdminSidebarCollapsed: (collapsed) => set({ adminSidebarCollapsed: collapsed }),
  setAdminSidebarMobileOpen: (open) => set({ adminSidebarMobileOpen: open }),

  setStudentPage: (page) => set((state) => { if (state.studentPage === page) return { studentSidebarMobileOpen: false }; const newHistory = [...(state.studentPageHistory || []), { page: state.studentPage, courseId: state.selectedCourseId, testSeriesId: state.selectedTestSeriesId, testId: state.selectedTestId, productId: state.selectedProductId }].slice(-20); return { studentPage: page, studentPageHistory: newHistory, studentSidebarMobileOpen: false }; }),
  goBackStudentPage: () => set((state) => { const history = state.studentPageHistory || []; if (history.length === 0) { return { studentPage: 'dashboard' }; } const newHistory = [...history]; const prevState = newHistory.pop(); return { studentPageHistory: newHistory, studentPage: prevState.page, selectedCourseId: prevState.courseId, selectedTestSeriesId: prevState.testSeriesId, selectedTestId: prevState.testId, selectedProductId: prevState.productId }; }),
  toggleStudentSidebar: () => set((s) => ({ studentSidebarCollapsed: !s.studentSidebarCollapsed })),
  setStudentSidebarCollapsed: (collapsed) => set({ studentSidebarCollapsed: collapsed }),
  setStudentSidebarMobileOpen: (open) => set({ studentSidebarMobileOpen: open }),
  setSelectedTestSeriesId: (id) => set({ selectedTestSeriesId: id }),
  setSelectedTestId: (id) => set({ selectedTestId: id }),
    setTakeTestMode: (mode) => set({ takeTestMode: mode }),
  setIsPracticeMode: (v) => set({ isPracticeMode: v }),
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSelectedAttemptId: (id) => set({ selectedAttemptId: id }),
  setSelectedTeacherId: (id) => set({ selectedTeacherId: id }),

  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  setApiToken: (token) => set({ apiToken: token }),
  setAdminSelectedTeacherId: (id) => set({ adminSelectedTeacherId: id }),
  setOrg: (code, name, logo) => set((state) => ({ orgCode: code, orgName: name, orgLogo: logo !== undefined ? logo : state.orgLogo })),

  openCheckout: (item) => {
    const state = useAppStore.getState()
    if (!state.isAuthenticated) {
      set({ checkoutIntent: item })
      state.requireAuth()
      return
    }
    set({ checkoutOpen: true, checkoutItem: item })
  },
  closeCheckout: () => set({ checkoutOpen: false, checkoutItem: null }),
  setCheckoutIntent: (item) => set({ checkoutIntent: item }),
  triggerPaymentSuccess: () => set((s) => ({ paymentSuccessTrigger: s.paymentSuccessTrigger + 1 })),

  setModuleAccess: (access) => set({ moduleAccess: access, moduleAccessLoaded: true }),

  fetchModuleAccess: async () => {
    const MAX_RETRIES = 2
    const RETRY_DELAY_MS = 1000

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await apiFetch('/api/teacher/module-access')

        // If we get a 401, the API token may not be set yet — retry after a delay
        if (res.status === 401 && attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }

        const data = await res.json()
        if (data.success) {
          set({ moduleAccess: data.modules, moduleAccessLoaded: true })
        } else {
          // Only mark as loaded after exhausting retries
          set({ moduleAccessLoaded: true })
        }
        return
      } catch {
        // If this isn't the last attempt, wait and retry
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
        // All retries exhausted — mark as loaded so the UI isn't stuck in grace period forever
        set({ moduleAccessLoaded: true })
      }
    }
  },

  startModuleAccessPolling: () => {
    // Don't start if already polling
    if (_moduleAccessPollingInterval) return

    // Fetch immediately
    const { fetchModuleAccess, userRole } = useAppStore.getState()
    if (userRole !== 'teacher') return
    fetchModuleAccess()

    // Set up interval to poll every 30 seconds
    _moduleAccessPollingInterval = setInterval(() => {
      const state = useAppStore.getState()
      // Only fetch if still a teacher and authenticated
      if (state.isAuthenticated && state.userRole === 'teacher') {
        state.fetchModuleAccess()
      } else {
        // Stop polling if no longer a teacher
        if (_moduleAccessPollingInterval) {
          clearInterval(_moduleAccessPollingInterval)
          _moduleAccessPollingInterval = null
        }
      }
    }, 30000)
  },

  stopModuleAccessPolling: () => {
    if (_moduleAccessPollingInterval) {
      clearInterval(_moduleAccessPollingInterval)
      _moduleAccessPollingInterval = null
    }
  },

  requireAuth: () => {
    const state = useAppStore.getState()
    if (!state.isAuthenticated) {
      state.setCurrentView('login')
      return false
    }
    return true
  },
}))

// Export the module-level interval accessors for use in components
export function isModuleAccessPolling(): boolean {
  return _moduleAccessPollingInterval !== null
}

// Dev-only: expose store on window for debugging
if (typeof window !== 'undefined') {
  (window as any).__APP_STORE__ = useAppStore
}


// ── Manual localStorage hydration (replaces persist middleware for Turbopack compatibility) ──
const STORAGE_KEY = 'erkt-auth-store'

function saveToStorage() {
  if (typeof window === 'undefined') return
  try {
    const state = useAppStore.getState()
    const persistData = {
      isAuthenticated: state.isAuthenticated,
      currentView: state.currentView,
      orgCode: state.orgCode,
      orgName: state.orgName,
      orgLogo: state.orgLogo,
      userName: state.userName,
      userEmail: state.userEmail,
      userRole: state.userRole,
      loginMode: state.loginMode,
      apiToken: state.apiToken,
      studentPage: state.studentPage,
      selectedCourseId: state.selectedCourseId,
      selectedTestSeriesId: state.selectedTestSeriesId,
      selectedTestId: state.selectedTestId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistData))
  } catch {}
}

function loadFromStorage() {
  if (typeof window === 'undefined') return
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      useAppStore.setState(parsed)
    }
  } catch {}
}

// Hydrate on load (client-side only)
if (typeof window !== 'undefined') {
  loadFromStorage()
  
  // Subscribe to state changes and save
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  useAppStore.subscribe(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveToStorage, 100)
  })
}

// Initialize store access for api-client (breaks circular dependency)
initStoreAccess(() => useAppStore)
