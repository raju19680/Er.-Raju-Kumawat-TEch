'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore, type AdminPage } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  Shield,
  Building2,
  CreditCard,
  UserPlus,
  User,
  Lock,
  DollarSign,
  TrendingUp,
  UserCog,
  Bell,
  Receipt,
  BookOpen,
  IndianRupee,
  Pin,
  PinOff,
  Hammer,
  FileText,
  Upload,
  Wallet,
  Activity,
  Megaphone,
  Flag,
  Database,
  Palette,
  Clock,
  Mail,
  Smartphone,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Icon map ────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  Shield,
  Building2,
  CreditCard,
  UserPlus,
  User,
  Lock,
  DollarSign,
  TrendingUp,
  UserCog,
  Bell,
  Receipt,
  BookOpen,
  IndianRupee,
  Hammer,
  FileText,
  Upload,
  Wallet,
  Activity,
  Megaphone,
  Flag,
  Database,
  Palette,
  Clock,
  Mail,
  Smartphone,
  ClipboardCheck,
}

// ─── Nav data ────────────────────────────────────────────────────────────────
interface NavChild {
  id: AdminPage
  label: string
  icon: string
}

interface NavItem {
  id: AdminPage
  label: string
  icon: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  {
    id: 'admin-teachers', label: 'Teacher Management', icon: 'UserCog',
    children: [
      { id: 'admin-teachers', label: 'All Teachers', icon: 'Users' },
      { id: 'admin-module-access', label: 'Module Access', icon: 'Shield' },
      { id: 'admin-builds', label: 'Code Generator', icon: 'Hammer' },
      { id: 'admin-organizations', label: 'Organizations', icon: 'Building2' },
      { id: 'admin-students', label: 'Students', icon: 'GraduationCap' },
      { id: 'admin-student-mgmt', label: 'Attendance & Notes', icon: 'ClipboardCheck' },
      { id: 'admin-content', label: 'Content', icon: 'BookOpen' },
    ],
  },
  {
    id: 'admin-analytics', label: 'Revenue & Analytics', icon: 'TrendingUp',
    children: [
      { id: 'admin-analytics', label: 'Analytics', icon: 'BarChart3' },
      { id: 'admin-orders', label: 'Orders & Payments', icon: 'Receipt' },
      { id: 'admin-commissions', label: 'Commissions', icon: 'IndianRupee' },
      { id: 'admin-payouts', label: 'Payouts', icon: 'Wallet' },
    ],
  },
  { id: 'admin-notifications', label: 'Notifications', icon: 'Bell' },
  { id: 'admin-announcements', label: 'Announcements', icon: 'Megaphone' },
  {
    id: 'admin-bulk-ops', label: 'Tools', icon: 'Upload',
    children: [
      { id: 'admin-bulk-ops', label: 'Import / Export', icon: 'Upload' },
      { id: 'admin-audit-log', label: 'Audit Log', icon: 'FileText' },
      { id: 'admin-health', label: 'System Health', icon: 'Activity' },
      { id: 'admin-db-backup', label: 'DB Backup', icon: 'Database' },
      { id: 'admin-feature-flags', label: 'Feature Flags', icon: 'Flag' },
      { id: 'admin-app-versions', label: 'App Versions', icon: 'Smartphone' },
    ],
  },
  {
    id: 'admin-settings', label: 'Settings', icon: 'Settings',
    children: [
      { id: 'admin-settings', label: 'Profile', icon: 'User' },
      { id: 'admin-security', label: 'Security & Audit', icon: 'Shield' },
      { id: 'admin-white-label', label: 'White Label', icon: 'Palette' },
      { id: 'admin-dynamic-config', label: 'Dynamic Config', icon: 'Settings' },
      { id: 'admin-scheduled-notifications', label: 'Sched. Notifications', icon: 'Clock' },
      { id: 'admin-email-templates', label: 'Email Templates', icon: 'Mail' },
    ],
  },
]

// ─── Page name map ──────────────────────────────────────────────────────────
export const adminPageNameMap: Record<AdminPage, string> = {
  'admin-dashboard': 'Dashboard',
  'admin-teachers': 'Teachers',
  'admin-module-access': 'Module Access',
  'admin-students': 'Students',
  'admin-organizations': 'Organizations',
  'admin-analytics': 'Analytics',
  'admin-orders': 'Orders & Payments',
  'admin-notifications': 'Notifications',
  'admin-settings': 'Settings',
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
  'admin-exams': 'Exams',
}

// ─── Hover delay config ─────────────────────────────────────────────────────
const EXPAND_DELAY = 100
const COLLAPSE_DELAY = 400

// ─── Width constants ────────────────────────────────────────────────────────
const COLLAPSED_W = 60
const EXPANDED_W = 256

// ─── AdminSidebarNavItem ─────────────────────────────────────────────────────
function AdminSidebarNavItem({
  item,
  collapsed,
  currentPage,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  currentPage: AdminPage
  onNavigate: (page: AdminPage) => void
}) {
  const hasChildren = item.children && item.children.length > 0
  const [manualOpen, setManualOpen] = useState(false)
  const isChildActive = hasChildren ? item.children!.some((c) => c.id === currentPage) : false
  const open = isChildActive || manualOpen
  const isSelfActive = !hasChildren && item.id === currentPage
  const isActive = isSelfActive || isChildActive
  const IconComponent = iconMap[item.icon]

  const handleParentClick = () => {
    if (collapsed) return
    if (hasChildren) {
      setManualOpen((prev) => !prev)
    } else {
      onNavigate(item.id)
    }
  }

  // Collapsed: just show icon with tooltip
  if (collapsed) {
    const button = (
      <button
        onClick={hasChildren ? undefined : () => onNavigate(item.id)}
        className={cn(
          'flex items-center justify-center w-full h-10 rounded-lg transition-colors duration-150 cursor-pointer',
          isActive
            ? 'bg-amber-50 text-amber-700'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        {IconComponent && <IconComponent className="size-5 shrink-0" />}
      </button>
    )
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium">
          {item.label}
          {hasChildren && <span className="ml-1 text-gray-400 text-xs">▸</span>}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Expanded with children
  if (hasChildren) {
    return (
      <Collapsible open={open} onOpenChange={setManualOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center w-full gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-150 cursor-pointer',
              isChildActive
                ? 'bg-amber-50 text-amber-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {IconComponent && <IconComponent className="size-[18px] shrink-0" />}
            <span className="flex-1 text-left truncate">{item.label}</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 transition-transform duration-200 text-gray-400',
                open && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l-2 border-gray-100 pl-3 py-1">
            {item.children!.map((child) => {
              const ChildIcon = iconMap[child.icon]
              const childActive = child.id === currentPage
              return (
                <button
                  key={child.id + child.label}
                  onClick={() => onNavigate(child.id)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-md text-[13px] transition-colors duration-150 cursor-pointer',
                    childActive
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                  <span className="truncate">{child.label}</span>
                </button>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Expanded without children
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={cn(
        'flex items-center w-full gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-150 cursor-pointer',
        isSelfActive
          ? 'bg-amber-50 text-amber-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {IconComponent && <IconComponent className="size-[18px] shrink-0" />}
      <span className="truncate">{item.label}</span>
    </button>
  )
}

// ─── SidebarContent ──────────────────────────────────────────────────────────
function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { adminPage, setAdminPage, logout, orgName } = useAppStore()
  const displayName = orgName || 'Er. Raju Kumawat Tech'

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 border-b border-gray-100 h-14 transition-all duration-300',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4'
      )}>
        <div className="flex items-center justify-center size-8 rounded-lg bg-amber-600 text-white font-bold text-sm shrink-0">
          <Shield className="size-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none min-w-0 overflow-hidden">
            <span className="text-sm font-bold text-gray-900 tracking-tight truncate">
              Admin Portal
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-600">
              Super Admin
            </span>
          </div>
        )}
      </div>

      {/* Navigation with scroll */}
      <ScrollArea className="flex-1 py-2">
        <nav className={cn('flex flex-col gap-0.5', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item) => (
            <AdminSidebarNavItem
              key={item.id + item.label}
              item={item}
              collapsed={collapsed}
              currentPage={adminPage}
              onNavigate={setAdminPage}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className={cn('shrink-0 border-t border-gray-100', collapsed ? 'px-2 py-2' : 'px-3 py-2')}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex items-center justify-center w-full h-10 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
              >
                <LogOut className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              Logout
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="size-[18px] shrink-0" />
            <span className="truncate">Logout</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Sidebar Export ─────────────────────────────────────────────────────
export function AdminSidebar() {
  const { adminSidebarMobileOpen, setAdminSidebarMobileOpen } = useAppStore()

  const [isHoverExpanded, setIsHoverExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current)
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
    expandTimerRef.current = setTimeout(() => {
      setIsHoverExpanded(true)
    }, EXPAND_DELAY)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current)
      expandTimerRef.current = null
    }
    if (isPinned) return
    collapseTimerRef.current = setTimeout(() => {
      setIsHoverExpanded(false)
    }, COLLAPSE_DELAY)
  }, [isPinned])

  const togglePin = useCallback(() => {
    setIsPinned((prev) => !prev)
  }, [])

  const isExpanded = isHoverExpanded || isPinned
  const collapsed = !isExpanded

  return (
    <TooltipProvider delayDuration={200}>
      {/* ── Desktop sidebar ──
          Architecture:
          - Outer wrapper always occupies layout space (COLLAPSED_W normally, EXPANDED_W when pinned)
          - Inner <aside> is the visual panel. When hover-expanded but NOT pinned,
            it becomes absolute + overlays the content area, so the layout doesn't shift.
          - When pinned, the outer wrapper grows smoothly and the aside is relative.
      */}
      <div
        className="hidden md:block shrink-0 h-screen"
        style={{
          width: isPinned ? EXPANDED_W : COLLAPSED_W,
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'flex flex-col h-screen bg-white border-r border-gray-200 overflow-hidden',
            'transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            // Overlay mode when hover-expanded but NOT pinned
            isHoverExpanded && !isPinned
              ? 'absolute z-50 shadow-xl rounded-r-lg'
              : 'relative z-0',
          )}
          style={{
            width: isExpanded ? EXPANDED_W : COLLAPSED_W,
          }}
        >
          <SidebarContent collapsed={collapsed} />

          {/* Pin button — only visible when expanded */}
          {!collapsed && (
            <button
              onClick={togglePin}
              className={cn(
                'absolute top-3 right-2 p-1.5 rounded-md transition-colors duration-150 cursor-pointer z-10',
                isPinned
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              )}
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </button>
          )}
        </aside>
      </div>

      {/* ── Mobile sidebar using Sheet ── */}
      <Sheet open={adminSidebarMobileOpen} onOpenChange={setAdminSidebarMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-white">
          <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

export default AdminSidebar
