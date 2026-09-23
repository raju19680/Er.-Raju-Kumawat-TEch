'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore, type StudentPage } from '@/lib/store'
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
  SheetClose,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Video,
  ClipboardList,
  Layers,
  FileText,
  Trophy,
  Bookmark,
  ShoppingBag,
  ShoppingCart,
  Library,
  Receipt,
  Users,
  MessageSquare,
  HelpCircle,
  Bell,
  User,
  ChevronDown,
  Pin,
  PinOff,
  LogOut,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaImage } from '@/components/ui/media-image'
import { Separator } from '@/components/ui/separator'

// Helper for accent colors
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

// Icon map
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Video,
  ClipboardList,
  Layers,
  FileText,
  Trophy,
  Bookmark,
  ShoppingBag,
  ShoppingCart,
  Library,
  Receipt,
  Users,
  MessageSquare,
  HelpCircle,
  Bell,
  User,
  LogOut
}

interface NavChild {
  id: StudentPage
  label: string
  icon: string
}

interface NavItem {
  id: StudentPage | 'group-courses' | 'group-tests' | 'group-store' | 'group-community'
  label: string
  icon: string
  children?: NavChild[]
}

const STUDENT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'teacher-hub', label: 'Teacher Hub', icon: 'GraduationCap' },
  {
    id: 'group-courses', label: 'Course Portal', icon: 'BookOpen',
    children: [
      { id: 'my-courses', label: 'My Courses', icon: 'BookOpen' },
      { id: 'live-classes', label: 'Live Classes', icon: 'Video' },
      { id: 'assignments', label: 'Assignments', icon: 'ClipboardList' },
      { id: 'flashcards', label: 'Flashcards', icon: 'Layers' },
    ],
  },
  {
    id: 'group-tests', label: 'Test Portal', icon: 'ClipboardList',
    children: [
      { id: 'test-series', label: 'Test Series', icon: 'Layers' },
      { id: 'my-tests', label: 'My Tests', icon: 'FileText' },
      { id: 'results', label: 'Test Results', icon: 'Trophy' },
      { id: 'bookmarks', label: 'My Bookmarks', icon: 'Bookmark' },
    ],
  },
  {
    id: 'group-store', label: 'Offerings & Store', icon: 'ShoppingBag',
    children: [
      { id: 'store', label: 'Store', icon: 'ShoppingCart' },
      { id: 'my-library', label: 'My Library', icon: 'Library' },
      { id: 'orders', label: 'Order History', icon: 'Receipt' },
    ],
  },
  {
    id: 'group-community', label: 'Community & Support', icon: 'Users',
    children: [
      { id: 'chat', label: 'Course Forums', icon: 'MessageSquare' },
      { id: 'doubts', label: 'Ask Doubts', icon: 'HelpCircle' },
      { id: 'announcements', label: 'Announcements', icon: 'Bell' },
      { id: 'gamification', label: 'Achievements', icon: 'Trophy' },
    ]
  },
  { id: 'profile', label: 'My Profile', icon: 'User' },
]

export function getSidebarTitle(pageId: string) {
  for (const item of STUDENT_NAV_ITEMS) {
    if (item.id === pageId) return item.label
    if (item.children) {
      const child = item.children.find(c => c.id === pageId)
      if (child) return child.label
    }
  }
  return 'Dashboard'
}

const EXPAND_DELAY = 100
const COLLAPSE_DELAY = 400
const COLLAPSED_W = 64
const EXPANDED_W = 256

function SidebarNavItem({
  item,
  collapsed,
  currentPage,
  onNavigate,
  accent,
  isMobile
}: {
  item: NavItem
  collapsed: boolean
  currentPage: StudentPage
  onNavigate: (page: StudentPage) => void
  accent: any
  isMobile?: boolean
}) {
  const hasChildren = item.children && item.children.length > 0
  const [manualOpen, setManualOpen] = useState(false)
  
  // Check active state
  const isChildActive = hasChildren 
    ? item.children!.some((c) => 
        c.id === currentPage || 
        (c.id === 'my-tests' && ['take-test', 'test-result'].includes(currentPage)) ||
        (c.id === 'test-series' && currentPage === 'test-series-detail') ||
        (c.id === 'my-courses' && currentPage === 'course-detail') ||
        (c.id === 'store' && currentPage === 'store-product-detail') ||
        (c.id === 'teacher-hub' && currentPage === 'teachers')
      ) 
    : false
  
  const open = isChildActive || manualOpen
  const isSelfActive = !hasChildren && (
    item.id === currentPage ||
    (item.id === 'teacher-hub' && currentPage === 'teachers')
  )
  const isActive = isSelfActive || isChildActive
  const IconComponent = iconMap[item.icon]

  // Collapsed: just show icon with tooltip
  if (collapsed) {
    const handleCollapsedClick = () => {
      if (hasChildren && item.children && item.children.length > 0) {
        onNavigate(item.children[0].id)
      } else if (!hasChildren) {
        onNavigate(item.id as StudentPage)
      }
    }
    const button = (
      <button
        onClick={handleCollapsedClick}
        className={cn(
          'flex items-center justify-center w-full h-11 rounded-lg transition-colors duration-150 cursor-pointer',
          isActive
            ? 'text-white'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        )}
        style={isActive ? { backgroundColor: accent.bg } : undefined}
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
                ? 'font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
            style={isChildActive ? { color: accent.text, backgroundColor: accent.bgLight } : undefined}
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
          <div className="ml-5 mt-1 flex flex-col gap-1 border-l-2 border-gray-100 pl-3 py-1">
            {item.children!.map((child) => {
              const ChildIcon = iconMap[child.icon]
              const childActive = 
                child.id === currentPage ||
                (child.id === 'my-tests' && ['take-test', 'test-result'].includes(currentPage)) ||
                (child.id === 'test-series' && currentPage === 'test-series-detail') ||
                (child.id === 'my-courses' && currentPage === 'course-detail') ||
                (child.id === 'store' && currentPage === 'store-product-detail') ||
                (child.id === 'teacher-hub' && currentPage === 'teachers')

              const button = (
                <button
                  key={child.id}
                  onClick={() => onNavigate(child.id)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-md text-[13px] transition-colors duration-150 cursor-pointer',
                    childActive
                      ? 'text-white font-medium shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  style={childActive ? { backgroundColor: accent.bg } : undefined}
                >
                  {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                  <span className="truncate">{child.label}</span>
                </button>
              )
              return isMobile ? <SheetClose key={child.id} asChild>{button}</SheetClose> : button
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Expanded without children
  const button = (
    <button
      onClick={() => onNavigate(item.id as StudentPage)}
      className={cn(
        'flex items-center w-full gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-150 cursor-pointer',
        isSelfActive
          ? 'text-white font-medium shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
      style={isSelfActive ? { backgroundColor: accent.bg } : undefined}
    >
      {IconComponent && <IconComponent className="size-[18px] shrink-0" />}
      <span className="truncate">{item.label}</span>
    </button>
  )
  return isMobile ? <SheetClose asChild>{button}</SheetClose> : button
}

function SidebarContent({ collapsed, accent, isMobile }: { collapsed: boolean, accent: any, isMobile?: boolean }) {
  const { studentPage, setStudentPage, orgName, orgLogo, logout } = useAppStore()

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 border-b border-gray-100 h-[72px] transition-all duration-300',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4'
      )}>
        {orgLogo ? (
          <div className="flex items-center justify-center size-10 shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
            <MediaImage src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex items-center justify-center size-10 rounded-xl text-white font-bold text-sm shrink-0 shadow-sm" style={{ backgroundColor: accent.bg }}>
            {orgName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <div className="flex flex-col leading-tight min-w-0 overflow-hidden">
            <span className="text-[15px] font-bold text-gray-900 tracking-tight truncate">
              {orgName}
            </span>
            <span className="text-xs font-bold tracking-wider uppercase mt-0.5" style={{ color: accent.text }}>
              Student Portal
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn('flex flex-col gap-1.5', collapsed ? 'px-3' : 'px-4')}>
          {STUDENT_NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.id + item.label}
              item={item}
              collapsed={collapsed}
              currentPage={studentPage}
              onNavigate={setStudentPage}
              accent={accent}
              isMobile={isMobile}
            />
          ))}
        </nav>
      </ScrollArea>
      
      {/* Bottom LogOut */}
      <div className={cn('shrink-0 border-t border-gray-100 py-3', collapsed ? 'px-3' : 'px-4')}>
         {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="flex items-center justify-center w-full h-11 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
                >
                  <LogOut className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            isMobile ? (
              <SheetClose asChild>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
                >
                  <LogOut className="size-[18px] shrink-0" />
                  <span className="truncate">Sign Out</span>
                </button>
              </SheetClose>
            ) : (
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
              >
                <LogOut className="size-[18px] shrink-0" />
                <span className="truncate">Sign Out</span>
              </button>
            )
          )}
      </div>
    </div>
  )
}

export function StudentSidebar() {
  const [isHoverExpanded, setIsHoverExpanded] = useState(false)
  const { studentSidebarCollapsed, setStudentSidebarCollapsed, studentSidebarMobileOpen, setStudentSidebarMobileOpen } = useAppStore()
  
  // Use app store for pinned state mapping
  const isPinned = !studentSidebarCollapsed
  const setIsPinned = (val: boolean) => setStudentSidebarCollapsed(!val)

  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accent = useAccentColor(undefined)

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
    setIsPinned(!isPinned)
  }, [isPinned, setIsPinned])

  const isExpanded = isHoverExpanded || isPinned
  const collapsed = !isExpanded

  return (
    <TooltipProvider delayDuration={200}>
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
            isHoverExpanded && !isPinned
              ? 'absolute z-50 shadow-2xl rounded-r-2xl border-y border-gray-100'
              : 'relative z-0',
          )}
          style={{
            width: isExpanded ? EXPANDED_W : COLLAPSED_W,
          }}
        >
          <SidebarContent collapsed={collapsed} accent={accent} />

          {/* Pin button */}
          {!collapsed && (
            <button
              onClick={togglePin}
              className={cn(
                'absolute top-[26px] right-3 p-1.5 rounded-md transition-colors duration-150 cursor-pointer z-10 hover:bg-gray-100',
                isPinned ? 'text-gray-600' : 'text-gray-400'
              )}
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            </button>
          )}
        </aside>
      </div>

      {/* Mobile Sidebar using Sheet */}
      <Sheet open={studentSidebarMobileOpen} onOpenChange={setStudentSidebarMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-white">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent collapsed={false} accent={accent} isMobile={true} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
