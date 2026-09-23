'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useAppStore, type CMSPage } from '@/lib/store'
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
  ClipboardList,
  FileText,
  BarChart3,
  Upload,
  AlertCircle,
  Library,
  Package,
  PenTool,
  Link,
  ShoppingBag,
  Megaphone,
  Bell,
  UserPlus,
  Tag,
  Image,
  MessageCircle,
  Smartphone,
  Send,
  CreditCard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  LifeBuoy,
  HelpCircle,
  MessageSquare,
  Settings,
  User,
  Ban,
  Folder,
  Blocks,
  File,
  Video,
  Youtube,
  MessagesSquare,
  ChevronDown,
  LogOut,
  Lock,
  Pin,
  PinOff,
  BookOpen,
  Book,
  ListChecks,
  GraduationCap,
  Radio,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { CMS_PAGE_TO_MODULE } from '@/lib/module-registry'

// ─── Icon map ────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardList,
  FileText,
  BarChart3,
  Upload,
  AlertCircle,
  Library,
  Package,
  PenTool,
  Link,
  ShoppingBag,
  Megaphone,
  Bell,
  UserPlus,
  Tag,
  Image,
  MessageCircle,
  Smartphone,
  Send,
  CreditCard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  LifeBuoy,
  HelpCircle,
  MessageSquare,
  Settings,
  User,
  Ban,
  Folder,
  Blocks,
  File,
  Video,
  Youtube,
  MessagesSquare,
  Lock,
  BookOpen,
  Book,
  ListChecks,
  GraduationCap,
  Radio,
  Trophy,
}

// ─── Nav data ────────────────────────────────────────────────────────────────
interface NavChild {
  id: CMSPage
  label: string
  icon: string
}

interface NavItem {
  id: CMSPage
  label: string
  icon: string
  children?: NavChild[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  {
    id: 'courses', label: 'Course Portal', icon: 'BookOpen',
    children: [
      { id: 'courses', label: 'All Courses', icon: 'Book' },
      { id: 'live-classes', label: 'Live Classes', icon: 'Radio' },
      { id: 'assignments', label: 'Assignments', icon: 'ClipboardList' },
      { id: 'flashcards', label: 'Flashcards', icon: 'BookOpen' },
    ],
  },
  {
    id: 'tests', label: 'Test Portal', icon: 'ClipboardList',
    children: [
      { id: 'test-series', label: 'Test Series', icon: 'ListChecks' },
      { id: 'tests', label: 'Tests', icon: 'FileText' },
      { id: 'results', label: 'Results', icon: 'BarChart3' },
      { id: 'bulk-uploader', label: 'Bulk Uploader', icon: 'Upload' },
      { id: 'reported-questions', label: 'Reported Questions', icon: 'AlertCircle' },
      { id: 'question-library', label: 'Question Library', icon: 'Library' },
      { id: 'themes', label: 'Themes', icon: 'Palette' },
      { id: 'exam-profiles', label: 'Exam Profiles', icon: 'GraduationCap' },
    ],
  },
  {
    id: 'students', label: 'Students', icon: 'Users',
    children: [
      { id: 'students', label: 'All Students', icon: 'GraduationCap' },
    ],
  },
  {
    id: 'digital-products', label: 'Offerings', icon: 'Package',
    children: [
      { id: 'digital-products', label: 'Digital Products', icon: 'File' },
      { id: 'store', label: 'Store', icon: 'ShoppingBag' },
      { id: 'blogs', label: 'Blogs', icon: 'PenTool' },
      { id: 'quick-links', label: 'Quick Links', icon: 'Link' },
    ],
  },
  {
    id: 'reports-sales', label: 'Reports', icon: 'TrendingUp',
    children: [
      { id: 'reports-sales', label: 'Sales', icon: 'DollarSign' },
      { id: 'reports-orders', label: 'Orders', icon: 'ShoppingCart' },
      { id: 'reports-users', label: 'Users', icon: 'Users' },
    ],
  },
  {
    id: 'graphics', label: 'Marketing', icon: 'Megaphone',
    children: [
      { id: 'graphics', label: 'Graphics', icon: 'Image' },
      { id: 'notifications', label: 'Notifications', icon: 'Bell' },
      { id: 'leads', label: 'Leads', icon: 'UserPlus' },
      { id: 'coupons', label: 'Coupons', icon: 'Tag' },
      { id: 'payment-pages', label: 'Payment Pages', icon: 'CreditCard' },
      { id: 'whatsapp-sales', label: 'WhatsApp Sales', icon: 'Smartphone' },
      { id: 'whatsapp-campaigns', label: 'WhatsApp Campaigns', icon: 'Send' },
    ],
  },
  {
    id: 'support-queries', label: 'Support', icon: 'LifeBuoy',
    children: [
      { id: 'support-queries', label: 'Queries', icon: 'HelpCircle' },
      { id: 'support-chat', label: 'Chat', icon: 'MessageSquare' },
    ],
  },
  {
    id: 'settings-profile', label: 'Settings', icon: 'Settings',
    children: [
      { id: 'settings-profile', label: 'Profile', icon: 'User' },
      { id: 'settings-security', label: 'Security', icon: 'Lock' },
      { id: 'settings-blocked', label: 'Blocked Users', icon: 'Ban' },
      { id: 'settings-categories', label: 'Categories', icon: 'Folder' },
    ],
  },
  {
    id: 'chat-manager', label: 'Custom Sections', icon: 'Blocks',
    children: [
      { id: 'gamification', label: 'Gamification', icon: 'Trophy' },
      { id: 'chat-manager', label: 'Chat Manager', icon: 'MessagesSquare' },
      { id: 'meetings', label: 'Meetings', icon: 'Video' },
      { id: 'youtube-courses', label: 'YT Courses', icon: 'Youtube' },
      { id: 'documents', label: 'Documents', icon: 'FileText' },
    ],
  },
]

// ─── Filter nav items based on module access ──────────────────────────────────
function filterNavItems(
  items: NavItem[],
  moduleAccess: Record<string, boolean>,
  isModuleAccessLoaded: boolean
): NavItem[] {
  if (!isModuleAccessLoaded || Object.keys(moduleAccess).length === 0) return items

  // Only check parent module key — sub-features control operations (create/edit/delete),
  // NOT page visibility. If a parent module is enabled, its pages are always visible.
  const isPageAccessible = (pageId: string): boolean => {
    const moduleKey = CMS_PAGE_TO_MODULE[pageId]
    if (!moduleKey) return true
    if (moduleAccess[moduleKey] === false) return false
    return true
  }

  return items
    .map(item => {
      if (!item.children || item.children.length === 0) {
        return isPageAccessible(item.id) ? item : null
      }
      const filteredChildren = item.children.filter(child => isPageAccessible(child.id))
      if (filteredChildren.length === 0) return null
      return { ...item, children: filteredChildren }
    })
    .filter(Boolean) as NavItem[]
}

// ─── Hover delay config ─────────────────────────────────────────────────────
const EXPAND_DELAY = 100
const COLLAPSE_DELAY = 400

// ─── Width constants ────────────────────────────────────────────────────────
const COLLAPSED_W = 60
const EXPANDED_W = 256

// ─── SidebarNavItem ──────────────────────────────────────────────────────────
function SidebarNavItem({
  item,
  collapsed,
  currentPage,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  currentPage: CMSPage
  onNavigate: (page: CMSPage) => void
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
  // When clicking a parent with children while collapsed, navigate to the first child
  if (collapsed) {
    const handleCollapsedClick = () => {
      if (hasChildren && item.children && item.children.length > 0) {
        onNavigate(item.children[0].id)
      } else {
        onNavigate(item.id)
      }
    }
    const button = (
      <button
        onClick={handleCollapsedClick}
        className={cn(
          'flex items-center justify-center w-full h-10 rounded-lg transition-colors duration-150 cursor-pointer',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
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
          {hasChildren && <span className="ml-1 text-slate-400 text-xs">▸</span>}
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
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {IconComponent && <IconComponent className="size-[18px] shrink-0" />}
            <span className="flex-1 text-left truncate">{item.label}</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 transition-transform duration-200 text-slate-400',
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
                  key={child.id}
                  onClick={() => onNavigate(child.id)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-md text-[13px] transition-colors duration-150 cursor-pointer',
                    childActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
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
          ? 'bg-indigo-50 text-indigo-700 font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      {IconComponent && <IconComponent className="size-[18px] shrink-0" />}
      <span className="truncate">{item.label}</span>
    </button>
  )
}

// ─── SidebarContent ──────────────────────────────────────────────────────────
function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { currentPage, setCurrentPage, userRole, logout, orgName, moduleAccess, moduleAccessLoaded } = useAppStore()
  const roleLabel = userRole === 'platform_admin' ? 'Super Admin' : 'Teacher'
  const displayName = orgName || 'Er. Raju Kumawat Tech'

  const navItems = useMemo(() => {
    if (userRole === 'platform_admin') return ALL_NAV_ITEMS
    return filterNavItems(ALL_NAV_ITEMS, moduleAccess, moduleAccessLoaded)
  }, [userRole, moduleAccess, moduleAccessLoaded])

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 border-b border-gray-100 h-14 transition-all duration-300',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4'
      )}>
        <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white font-bold text-sm shrink-0">
          {displayName.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none min-w-0 overflow-hidden">
            <span className="text-sm font-bold text-slate-900 tracking-tight truncate">
              {displayName}
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600">
              {roleLabel}
            </span>
          </div>
        )}
      </div>

      {/* Navigation with scroll */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <nav className={cn('flex flex-col gap-0.5', collapsed ? 'px-2' : 'px-3 pb-8')}>
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id + item.label}
              item={item}
              collapsed={collapsed}
              currentPage={currentPage}
              onNavigate={setCurrentPage}
            />
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className={cn('shrink-0 border-t border-gray-100', collapsed ? 'px-2 py-2' : 'px-3 py-2')}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex items-center justify-center w-full h-10 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
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
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
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
export function CMSSidebar() {
  const { sidebarMobileOpen, setSidebarMobileOpen } = useAppStore()

  const [isHoverExpanded, setIsHoverExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(true)
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
            'flex flex-col h-screen bg-slate-50 border-r border-slate-200/60 overflow-hidden',
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
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-amber-100'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              )}
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </button>
          )}
        </aside>
      </div>

      {/* ── Mobile sidebar using Sheet ── */}
      <Sheet open={sidebarMobileOpen} onOpenChange={setSidebarMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-white">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

export default CMSSidebar
