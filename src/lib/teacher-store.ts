import { create } from 'zustand'

export type TeacherPage =
  | 'dashboard'
  | 'tests'
  | 'content'
  | 'users'
  | 'departments'
  | 'digital-products'
  | 'store'
  | 'coupons'
  | 'leads'
  | 'support'
  | 'banners'
  | 'quick-links'
  | 'reports'
  | 'help'
  | 'settings'
  | 'notifications'
  | 'payment-pages'
  | 'whatsapp-sales'
  | 'whatsapp-campaigns'
  | 'chat-manager'
  | 'meetings'
  | 'youtube-courses'
  | 'documents'

export type TestSeriesTab =
  | 'tests'
  | 'results'
  | 'bulk-uploader'
  | 'reported-questions'
  | 'question-library'
  | 'sections'

export type TestContentTab =
  | 'tests'
  | 'test-pdfs'
  | 'subjective-tests'
  | 'users'

// ── Navigation State Snapshot ────────────────────────────────────────────────
// This is the "history entry" we push to browser history.
interface NavSnapshot {
  currentPage: TeacherPage
  activeTab: TestSeriesTab
  selectedTestSeriesId: string | null
  selectedTestSeriesTitle: string | null
  testContentTab: TestContentTab
}

function toSnapshot(s: TeacherState): NavSnapshot {
  return {
    currentPage: s.currentPage,
    activeTab: s.activeTab,
    selectedTestSeriesId: s.selectedTestSeriesId,
    selectedTestSeriesTitle: s.selectedTestSeriesTitle,
    testContentTab: s.testContentTab,
  }
}

// ── Push state to browser history ────────────────────────────────────────────
let _historyIgnoreNext = false // flag to skip pushState when restoring from popstate

function pushNavState(snapshot: NavSnapshot) {
  if (typeof window === 'undefined') return
  if (_historyIgnoreNext) {
    _historyIgnoreNext = false
    return
  }
  window.history.pushState(snapshot, '')
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface TeacherState {
  // Navigation
  currentPage: TeacherPage
  setCurrentPage: (page: TeacherPage, pushHistory?: boolean) => void

  // Test Series Tab
  activeTab: TestSeriesTab
  setActiveTab: (tab: TestSeriesTab, pushHistory?: boolean) => void

  // Test Series Content (drill-down)
  selectedTestSeriesId: string | null
  selectedTestSeriesTitle: string | null
  testContentTab: TestContentTab
  setTestContentTab: (tab: TestContentTab, pushHistory?: boolean) => void
  openTestSeries: (id: string, title: string) => void
  closeTestSeries: (pushHistory?: boolean) => void

  // Restore from browser history (popstate)
  restoreSnapshot: (snapshot: NavSnapshot) => void

  // Question Editor
  questionEditorOpen: boolean
  editingQuestionId: string | null
  editingTestId: string | null
  openQuestionEditor: (testId: string, questionId?: string) => void
  closeQuestionEditor: () => void

  // Add Test Series Modal
  addTestSeriesOpen: boolean
  editingTestSeriesId: string | null
  openAddTestSeries: (editId?: string) => void
  closeAddTestSeries: () => void

  // Refresh counter for test series list
  testSeriesRefreshCounter: number
  refreshTestSeries: () => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Dashboard chart
  dashboardMetric: 'sales' | 'signups' | 'sales-volume'
  setDashboardMetric: (metric: 'sales' | 'signups' | 'sales-volume') => void
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page, pushHistory = true) => {
    const state = get()
    const snapshot = toSnapshot({ ...state, currentPage: page, selectedTestSeriesId: null })
    set({ currentPage: page, selectedTestSeriesId: null })
    if (pushHistory) pushNavState(snapshot)
  },

  // Test Series Tab
  activeTab: 'tests',
  setActiveTab: (tab, pushHistory = true) => {
    const state = get()
    const snapshot = toSnapshot({ ...state, activeTab: tab })
    set({ activeTab: tab })
    if (pushHistory) pushNavState(snapshot)
  },

  // Test Series Content
  selectedTestSeriesId: null,
  selectedTestSeriesTitle: null,
  testContentTab: 'tests',
  setTestContentTab: (tab, pushHistory = true) => {
    const state = get()
    const snapshot = toSnapshot({ ...state, testContentTab: tab })
    set({ testContentTab: tab })
    if (pushHistory) pushNavState(snapshot)
  },
  openTestSeries: (id, title) => {
    const state = get()
    const snapshot = toSnapshot({ ...state, selectedTestSeriesId: id, selectedTestSeriesTitle: title, testContentTab: 'tests' })
    set({
      selectedTestSeriesId: id,
      selectedTestSeriesTitle: title,
      testContentTab: 'tests',
    })
    pushNavState(snapshot)
  },
  closeTestSeries: (pushHistory = true) => {
    const state = get()
    const snapshot = toSnapshot({ ...state, selectedTestSeriesId: null, selectedTestSeriesTitle: null, testContentTab: 'tests' })
    set({
      selectedTestSeriesId: null,
      selectedTestSeriesTitle: null,
      testContentTab: 'tests',
    })
    if (pushHistory) pushNavState(snapshot)
  },

  // Restore from browser back/forward
  restoreSnapshot: (snapshot) => {
    _historyIgnoreNext = true
    set({
      currentPage: snapshot.currentPage,
      activeTab: snapshot.activeTab,
      selectedTestSeriesId: snapshot.selectedTestSeriesId,
      selectedTestSeriesTitle: snapshot.selectedTestSeriesTitle,
      testContentTab: snapshot.testContentTab,
    })
  },

  // Question Editor
  questionEditorOpen: false,
  editingQuestionId: null,
  editingTestId: null,
  openQuestionEditor: (testId, questionId) => set({
    questionEditorOpen: true,
    editingTestId: testId,
    editingQuestionId: questionId || null,
  }),
  closeQuestionEditor: () => set({
    questionEditorOpen: false,
    editingQuestionId: null,
    editingTestId: null,
  }),

  // Add Test Series
  addTestSeriesOpen: false,
  editingTestSeriesId: null,
  openAddTestSeries: (editId) => set({
    addTestSeriesOpen: true,
    editingTestSeriesId: editId || null,
  }),
  closeAddTestSeries: () => set({
    addTestSeriesOpen: false,
    editingTestSeriesId: null,
  }),

  // Refresh counter
  testSeriesRefreshCounter: 0,
  refreshTestSeries: () => set((s) => ({ testSeriesRefreshCounter: s.testSeriesRefreshCounter + 1 })),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Dashboard
  dashboardMetric: 'sales',
  setDashboardMetric: (metric) => set({ dashboardMetric: metric }),
}))

// ── Popstate listener (browser back/forward) ─────────────────────────────────
if (typeof window !== 'undefined') {
  // Set the initial history state
  const initialSnapshot: NavSnapshot = {
    currentPage: 'dashboard',
    activeTab: 'tests',
    selectedTestSeriesId: null,
    selectedTestSeriesTitle: null,
    testContentTab: 'tests',
  }
  window.history.replaceState(initialSnapshot, '')

  window.addEventListener('popstate', (e) => {
    if (e.state && typeof e.state === 'object' && 'currentPage' in e.state) {
      useTeacherStore.getState().restoreSnapshot(e.state as NavSnapshot)
    }
  })
}

// Dev-only: expose store on window for debugging
if (typeof window !== 'undefined') {
  (window as any).__TEACHER_STORE__ = useTeacherStore
}
