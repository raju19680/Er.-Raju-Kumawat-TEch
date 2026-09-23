'use client'

import React from 'react'
import {
  Home,
  Search,
  LayoutGrid,
  FileText,
  BarChart3,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Megaphone,
  Headphones,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useDashboardStore, type DashboardPage } from '@/lib/dashboard-store'

// ─── Navigation items ──────────────────────────────────────────────────────────
interface NavItem {
  id: DashboardPage
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'products', label: 'Products', icon: LayoutGrid },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'test-series', label: 'Test Series', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'offerings', label: 'Offerings', icon: Package },
]

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ─── Width constants ────────────────────────────────────────────────────────────
const COLLAPSED_W = 60
const EXPANDED_W = 240

// ─── SidebarNavItem ────────────────────────────────────────────────────────────
function SidebarNavItem({
  item,
  collapsed,
  isActive,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  isActive: boolean
  onNavigate: (page: DashboardPage) => void
}) {
  const Icon = item.icon

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex items-center justify-center w-full h-10 rounded-lg transition-all duration-150 cursor-pointer',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="size-5 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={cn(
        'flex items-center w-full gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 cursor-pointer',
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  )
}

// ─── SidebarContent (shared between desktop and mobile) ────────────────────────
function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { activePage, setActivePage, setSidebarMobileOpen } = useDashboardStore()

  const handleNavigate = (page: DashboardPage) => {
    setActivePage(page)
    setSidebarMobileOpen(false)
  }

  const handleLogout = () => {
    // Placeholder for logout logic
    console.log('Logout clicked')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div
        className={cn(
          'flex items-center shrink-0 border-b border-border h-14 transition-all duration-300',
          collapsed ? 'justify-center px-2' : 'gap-3 px-4'
        )}
      >
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
          RK
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none min-w-0 overflow-hidden">
            <span className="text-sm font-bold text-foreground tracking-tight truncate">
              Er. Raju Kumawat
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">
              Teacher
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav
          className={cn(
            'flex flex-col gap-1',
            collapsed ? 'px-2' : 'px-3'
          )}
        >
          {/* Search item - special style */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center w-full h-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 cursor-pointer"
                >
                  <Search className="size-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="font-medium">
                Search
              </TooltipContent>
            </Tooltip>
          ) : (
            <button className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 cursor-pointer">
              <Search className="size-[18px] shrink-0" />
              <span className="truncate">Search</span>
            </button>
          )}

          <Separator className="my-1" />

          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              isActive={activePage === item.id}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div
        className={cn(
          'shrink-0 border-t border-border pt-2 pb-3',
          collapsed ? 'px-2' : 'px-3'
        )}
      >
        {/* Settings */}
        {BOTTOM_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={activePage === item.id}
            onNavigate={handleNavigate}
          />
        ))}

        {/* Help */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center w-full h-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 cursor-pointer">
                <HelpCircle className="size-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="font-medium">
              Help
            </TooltipContent>
          </Tooltip>
        ) : (
          <button className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 cursor-pointer">
            <HelpCircle className="size-[18px] shrink-0" />
            <span className="truncate">Help</span>
          </button>
        )}

        <Separator className="my-2" />

        {/* Logout */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full h-10 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer"
              >
                <LogOut className="size-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="font-medium">
              Logout
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="size-[18px] shrink-0" />
            <span className="truncate">Logout</span>
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <div
        className={cn(
          'shrink-0 border-t border-border py-2 hidden md:flex',
          collapsed ? 'justify-center px-2' : 'justify-end px-3'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => useDashboardStore.getState().toggleSidebar()}
          className={cn(
            'size-8 rounded-md transition-all duration-150',
            collapsed && 'size-8'
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Main Sidebar Export ──────────────────────────────────────────────────────
export function DashboardSidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } =
    useDashboardStore()

  return (
    <TooltipProvider delayDuration={200}>
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:block shrink-0 h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ width: sidebarCollapsed ? COLLAPSED_W : EXPANDED_W }}
      >
        <aside className="flex flex-col h-screen bg-card border-r border-border overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: sidebarCollapsed ? COLLAPSED_W : EXPANDED_W }}
        >
          <SidebarContent collapsed={sidebarCollapsed} />
        </aside>
      </div>

      {/* Mobile Sidebar using Sheet */}
      <Sheet open={sidebarMobileOpen} onOpenChange={setSidebarMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-card">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
    </TooltipProvider>
  )
}

export default DashboardSidebar
