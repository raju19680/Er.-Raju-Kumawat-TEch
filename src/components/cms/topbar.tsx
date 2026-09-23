'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Menu,
  LogOut,
  User,
  Settings,
} from 'lucide-react'
import NotificationBell from '@/components/cms/notification-bell'

import { useAppStore, type CMSPage } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

// ── Page name mapping ────────────────────────────────────────────────
const pageNameMap: Record<CMSPage, string> = {
  dashboard: 'Dashboard',
  courses: 'Courses',
  'test-series': 'Test Series',
  students: 'Students',
  'digital-products': 'Digital Products',
  store: 'Store',
  blogs: 'Blogs',
  'quick-links': 'Quick Links',
  tests: 'Tests',
  results: 'Results',
  'bulk-uploader': 'Bulk Uploader',
  'reported-questions': 'Reported Questions',
  'question-library': 'Question Library',
  'reports-sales': 'Sales Reports',
  'reports-orders': 'Order Reports',
  'reports-users': 'User Reports',
  graphics: 'Graphics',
  notifications: 'Notifications',
  leads: 'Leads',
  coupons: 'Coupons',
  'payment-pages': 'Payment Pages',
  'assignments': 'Assignments',
  'flashcards': 'Flashcards',
  'gamification': 'Gamification',
  'live-classes': 'Live Classes',
  'whatsapp-sales': 'WhatsApp Sales',
  'whatsapp-campaigns': 'WhatsApp Campaigns',
  'support-queries': 'Support Queries',
  'support-chat': 'Chat Support',
  'settings-profile': 'Profile Settings',
  'settings-security': 'Security Settings',
  'settings-blocked': 'Blocked Users',
  'settings-categories': 'Categories',
  'chat-manager': 'Chat Manager',
  meetings: 'Meetings',
  'youtube-courses': 'YT Courses',
  documents: 'Documents',
  'omr-review': 'OMR Review',
  'exam-profiles': 'Exam Profiles',
  'themes': 'Themes',
  'theme-builder': 'Theme Builder',
}

function getPageName(page: CMSPage): string {
  return pageNameMap[page] ?? page
}

// ── Searchable pages for command palette ─────────────────────────────
const searchablePages: { id: CMSPage; label: string; group: string }[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', group: 'Overview' },
  { id: 'courses', label: 'Courses', group: 'Courses' },
  { id: 'students', label: 'Students', group: 'Students' },

  // Offerings
  { id: 'digital-products', label: 'Digital Products', group: 'Offerings' },
  { id: 'store', label: 'Store', group: 'Offerings' },
  { id: 'blogs', label: 'Blogs', group: 'Offerings' },
  { id: 'quick-links', label: 'Quick Links', group: 'Offerings' },

  // Test Portal
  { id: 'test-series', label: 'Test Series', group: 'Test Portal' },
  { id: 'tests', label: 'Tests', group: 'Test Portal' },
  { id: 'results', label: 'Results', group: 'Test Portal' },
  { id: 'bulk-uploader', label: 'Bulk Uploader', group: 'Test Portal' },
  { id: 'reported-questions', label: 'Reported Questions', group: 'Test Portal' },
  { id: 'question-library', label: 'Question Library', group: 'Test Portal' },

  // Reports
  { id: 'reports-sales', label: 'Sales Reports', group: 'Reports' },
  { id: 'reports-orders', label: 'Order Reports', group: 'Reports' },
  { id: 'reports-users', label: 'User Reports', group: 'Reports' },

  // Marketing
  { id: 'graphics', label: 'Graphics', group: 'Marketing' },
  { id: 'notifications', label: 'Notifications', group: 'Marketing' },
  { id: 'leads', label: 'Leads', group: 'Marketing' },
  { id: 'coupons', label: 'Coupons', group: 'Marketing' },
  { id: 'payment-pages', label: 'Payment Pages', group: 'Marketing' },
  { id: 'whatsapp-sales', label: 'WhatsApp Sales', group: 'Marketing' },
  { id: 'whatsapp-campaigns', label: 'WhatsApp Campaigns', group: 'Marketing' },

  // Support
  { id: 'support-queries', label: 'Support Queries', group: 'Support' },
  { id: 'support-chat', label: 'Chat Support', group: 'Support' },

  // Settings
  { id: 'settings-profile', label: 'Profile Settings', group: 'Settings' },
  { id: 'settings-security', label: 'Security Settings', group: 'Settings' },
  { id: 'settings-blocked', label: 'Blocked Users', group: 'Settings' },
  { id: 'settings-categories', label: 'Categories', group: 'Settings' },

  // Custom Sections
  { id: 'chat-manager', label: 'Chat Manager', group: 'Custom Sections' },
  { id: 'meetings', label: 'Meetings', group: 'Custom Sections' },
  { id: 'youtube-courses', label: 'YT Courses', group: 'Custom Sections' },
  { id: 'documents', label: 'Documents', group: 'Custom Sections' },
]

// ── Component ────────────────────────────────────────────────────────
export function Topbar() {
  const {
    currentPage,
    userName,
    userRole,
    orgName,
    setCurrentPage,
    logout,
    setGlobalSearchOpen,
    globalSearchOpen,
    sidebarMobileOpen,
    setSidebarMobileOpen,
  } = useAppStore()

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(!globalSearchOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [globalSearchOpen, setGlobalSearchOpen])

  const today = format(new Date(), 'EEEE, MMM d, yyyy')
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U'

  // Group searchable pages for the command palette
  const groups = Array.from(new Set(searchablePages.map((p) => p.group)))

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4">
      {/* ── Left side ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          aria-label="Toggle sidebar menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium text-muted-foreground">
                CMS &middot; Teacher
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold">
                {getPageName(currentPage)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ── Center: Search ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setGlobalSearchOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted w-80"
        aria-label="Open search"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile search trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setGlobalSearchOpen(true)}
        aria-label="Open search"
      >
        <Search className="size-5" />
      </Button>

      {/* ── Command palette ───────────────────────────────────────── */}
      <CommandDialog
        open={globalSearchOpen}
        onOpenChange={setGlobalSearchOpen}
        title="Search Er. Raju Kumawat Tech"
        description="Search for pages, settings, and more..."
      >
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {searchablePages
                .filter((p) => p.group === group)
                .map((page) => (
                  <CommandItem
                    key={page.id}
                    value={page.label}
                    onSelect={() => {
                      setCurrentPage(page.id)
                      setGlobalSearchOpen(false)
                    }}
                  >
                    <span>{page.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      {/* ── Right side ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Date display — hidden on small screens */}
        <span className="hidden lg:inline text-sm text-muted-foreground">
          {today}
        </span>

        {/* Notification bell with dropdown */}
        <NotificationBell />

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2"
              aria-label="User menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-amber-600 text-white text-sm font-medium">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-tight">
                  {userName || 'User'}
                </span>
                <span className="text-xs text-muted-foreground capitalize leading-tight">
                  {userRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground leading-none capitalize">
                  {userRole} &middot; {orgName}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setCurrentPage('settings-profile')}
              >
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentPage('settings-profile')}
              >
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Topbar
