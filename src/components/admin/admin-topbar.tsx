'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Menu,
  LogOut,
  User,
  Settings,
} from 'lucide-react'

import { useAppStore, type AdminPage } from '@/lib/store'
import { NotificationBell } from '@/components/shared/notification-bell'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
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

const adminPageNames: Record<AdminPage, string> = {
  'admin-dashboard': 'Dashboard',
  'admin-teachers': 'Teachers',
  'admin-students': 'Students',
  'admin-organizations': 'Organizations',
  'admin-analytics': 'Analytics',
  'admin-notifications': 'Notifications',
  'admin-settings': 'Settings',
  'admin-module-access': 'Module Access',
  'admin-orders': 'Orders & Payments',
  'admin-content': 'Content',
  'admin-security': 'Security & Audit',
  'admin-commissions': 'Revenue & Commissions',
  'admin-builds': 'Code Generator',
  'admin-audit-log': 'Audit Log',
  'admin-bulk-ops': 'Import / Export',
  'admin-payouts': 'Payouts',
  'admin-health': 'System Health',
  'admin-announcements': 'Announcements',
  'admin-feature-flags': 'Feature Flags',
  'admin-app-versions': 'App Versions',
  'admin-scheduled-notifications': 'Scheduled Notifications',
  'admin-db-backup': 'DB Backup',
  'admin-white-label': 'White Label',
  'admin-dynamic-config': 'Dynamic Config',
  'admin-email-templates': 'Email Templates',
  'admin-student-mgmt': 'Student Management',
  'admin-exams': 'Exam Profiles',
}

// ── Searchable pages for command palette ─────────────────────────────
const searchablePages: { id: AdminPage; label: string; group: string }[] = [
  { id: 'admin-dashboard', label: 'Dashboard', group: 'Overview' },
  { id: 'admin-teachers', label: 'Teachers', group: 'Management' },
  { id: 'admin-organizations', label: 'Organizations', group: 'Management' },
  { id: 'admin-students', label: 'Students', group: 'Management' },
  { id: 'admin-student-mgmt', label: 'Student Management', group: 'Management' },
  { id: 'admin-module-access', label: 'Module Access', group: 'Management' },
  { id: 'admin-builds', label: 'Code Generator', group: 'Management' },
  { id: 'admin-content', label: 'Content Oversight', group: 'Management' },
  { id: 'admin-analytics', label: 'Analytics', group: 'Reports' },
  { id: 'admin-commissions', label: 'Revenue & Commissions', group: 'Reports' },
  { id: 'admin-orders', label: 'Orders & Payments', group: 'Reports' },
  { id: 'admin-notifications', label: 'Notifications', group: 'Communication' },
  { id: 'admin-announcements', label: 'Announcements', group: 'Communication' },
  { id: 'admin-scheduled-notifications', label: 'Scheduled Notifications', group: 'Communication' },
  { id: 'admin-email-templates', label: 'Email Templates', group: 'Communication' },
  { id: 'admin-settings', label: 'Settings', group: 'Settings' },
  { id: 'admin-security', label: 'Security & Audit', group: 'Settings' },
  { id: 'admin-white-label', label: 'White Label', group: 'Configuration' },
  { id: 'admin-dynamic-config', label: 'Dynamic Config', group: 'Configuration' },
  { id: 'admin-app-versions', label: 'App Versions', group: 'Configuration' },
  { id: 'admin-feature-flags', label: 'Feature Flags', group: 'Configuration' },
  { id: 'admin-audit-log', label: 'Audit Log', group: 'Tools' },
  { id: 'admin-bulk-ops', label: 'Import / Export', group: 'Tools' },
  { id: 'admin-db-backup', label: 'DB Backup', group: 'Tools' },
  { id: 'admin-health', label: 'System Health', group: 'Tools' },
  { id: 'admin-payouts', label: 'Payouts', group: 'Reports' },
]

export function AdminTopbar() {
  const {
    adminPage,
    userName,
    userRole,
    orgName,
    orgCode,
    setAdminPage,
    logout,
    adminSidebarMobileOpen,
    setAdminSidebarMobileOpen,
    globalSearchOpen,
    setGlobalSearchOpen,
  } = useAppStore()

  // Format date client-side using useSyncExternalStore to avoid hydration mismatch
  const currentDate = useSyncExternalStore(
    () => () => {}, // no-op subscribe
    () => format(new Date(), 'EEEE, MMMM d, yyyy'),
    () => '' // server snapshot
  )

  // ⌘K shortcut to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(!globalSearchOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [globalSearchOpen, setGlobalSearchOpen])

  const pageName = adminPageNames[adminPage] ?? 'Dashboard'

  // Get user initials for avatar fallback
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SA'

  // Group searchable pages for the command palette
  const groups = Array.from(new Set(searchablePages.map((p) => p.group)))

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4">
        {/* ── Left side ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setAdminSidebarMobileOpen(!adminSidebarMobileOpen)}
            aria-label="Toggle sidebar menu"
          >
            <Menu className="size-5" />
          </Button>

          {/* Breadcrumb — same style as CMS */}
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              {/* Hide the "Admin · Super Admin" prefix on small screens to save space */}
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbPage className="text-sm font-medium text-muted-foreground">
                  Admin &middot; Super Admin
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="text-sm font-semibold truncate max-w-[160px] sm:max-w-none">
                  {pageName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ── Center: Search — same style as CMS ── */}
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
          title="Search Admin Portal"
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
                        setAdminPage(page.id)
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

        {/* ── Right side — same style as CMS ── */}
        <div className="flex items-center gap-3">
          {/* Date display */}
          <span
            className="hidden lg:inline text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {currentDate}
          </span>

          {/* Notification bell with real-time updates */}
          <NotificationBell
            variant="dropdown"
            accentColor="#B45309"
            onViewAll={() => setAdminPage('admin-notifications')}
            viewAllLabel="View All Notifications"
          />

          {/* Profile dropdown — same style as CMS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
                aria-label="User menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-amber-600 text-white text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium leading-tight">
                    {userName || 'Super Admin'}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    Super Admin
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userName || 'Super Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-none">
                    Super Admin &middot; {orgName}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setAdminPage('admin-settings')}
                >
                  <User className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAdminPage('admin-settings')}
                >
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} variant="destructive">
                <LogOut className="mr-2 size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}

export default AdminTopbar
