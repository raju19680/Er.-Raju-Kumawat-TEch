'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTheme } from 'next-themes'
import { 
  GraduationCap, LogOut, Menu, ChevronRight, Shield, Users, BookOpen, 
  FileText, DollarSign, LayoutDashboard, 
  ClipboardList, Library, Globe, Settings, Bell, Award, Moon, Sun
} from 'lucide-react'
import { useAppStore, type AppView } from '@/lib/store'

interface NavItem {
  view: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNav: NavItem[] = [
  { view: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'admin-teachers', label: 'Teachers', icon: Users },
  { view: 'admin-students', label: 'Students', icon: GraduationCap },
  { view: 'admin-courses', label: 'All Content', icon: BookOpen },
  { view: 'admin-revenue', label: 'Revenue', icon: DollarSign },
  { view: 'admin-announcements', label: 'Announcements', icon: Bell },
]

const teacherNav: NavItem[] = [
  { view: 'teacher-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'teacher-courses', label: 'Courses', icon: BookOpen },
  { view: 'teacher-tests', label: 'Test Series', icon: ClipboardList },
  { view: 'teacher-notes', label: 'Notes', icon: FileText },
  { view: 'teacher-students', label: 'Students', icon: Users },
  { view: 'teacher-website', label: 'My Website', icon: Globe },
  { view: 'teacher-revenue', label: 'Revenue', icon: DollarSign },
  { view: 'teacher-announcements', label: 'Announcements', icon: Bell },
]

const studentNav: NavItem[] = [
  { view: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'student-courses', label: 'Browse Courses', icon: BookOpen },
  { view: 'student-my-courses', label: 'My Courses', icon: Library },
  { view: 'student-tests', label: 'Test Series', icon: ClipboardList },
  { view: 'student-notes', label: 'My Notes', icon: FileText },
  { view: 'student-certificates', label: 'Certificates', icon: Award },
  { view: 'student-announcements', label: 'Announcements', icon: Bell },
]

const roleConfig = {
  ADMIN: { label: 'Admin Portal', icon: Shield, color: 'bg-purple-600' },
  TEACHER: { label: 'Teacher CMS', icon: Settings, color: 'bg-emerald-600' },
  STUDENT: { label: 'Student Portal', icon: GraduationCap, color: 'bg-cyan-600' },
}

interface SidebarContentProps {
  user: { role: string, name: string, username: string, email: string, organisationId?: string, teacherStatus?: string }
  navItems: NavItem[]
  currentAppView: string
  setAppView: (view: string) => void
  onNavigate?: () => void
  onLogout: () => void
}

function SidebarContent({ user, navItems, currentAppView, setAppView, onNavigate, onLogout }: SidebarContentProps) {
  const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || roleConfig['STUDENT']
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">EduSphere</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{roleInfo.label}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11 border-2 border-background">
            <AvatarFallback className={roleInfo.color + ' text-white text-sm font-semibold'}>
              {(user.name || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{user.name || user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        {user.role === 'TEACHER' && user.organisationId && (
          <div className="mt-3 p-2 bg-muted/50 rounded-md">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Organisation ID</p>
            <p className="text-xs font-mono mt-0.5 truncate">{user.organisationId}</p>
          </div>
        )}
        {user.role === 'TEACHER' && user.teacherStatus === 'PENDING' && (
          <Badge variant="secondary" className="mt-2 w-full justify-center bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            Pending Approval
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentAppView === item.view
            return (
              <button
                key={item.view}
                onClick={() => {
                  setAppView(item.view)
                  onNavigate?.()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : '')} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = {
    role: useAppStore((s) => s.userRole),
    name: useAppStore((s) => s.userName),
    username: useAppStore((s) => s.userName),
    email: useAppStore((s) => s.userEmail),
    organisationId: '',
    teacherStatus: 'APPROVED'
  }
  const logout = useAppStore((s) => s.logout)
  const currentAppView = user.role === 'ADMIN' ? useAppStore((s) => s.adminPage) : user.role === 'TEACHER' ? useAppStore((s) => s.currentPage) : useAppStore((s) => s.studentPage)
  const setAdminPage = useAppStore((s) => s.setAdminPage)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const setStudentPage = useAppStore((s) => s.setStudentPage)
  const setAppView = (view: string) => {
    if (user.role === 'ADMIN') setAdminPage(view as any)
    else if (user.role === 'TEACHER') setCurrentPage(view as any)
    else setStudentPage(view as any)
  }
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const { setTheme } = useTheme()

  if (!user || !user.name) return null

  const navItems = user.role === 'ADMIN' ? adminNav : user.role === 'TEACHER' ? teacherNav : studentNav
  const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || roleConfig['STUDENT']

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    setIsDark(!isDark)
  }

  const currentNav = navItems.find((n) => n.view === currentAppView)

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r">
        <SidebarContent
          user={user}
          navItems={navItems}
          currentAppView={currentAppView}
          setAppView={setAppView}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            user={user}
            navItems={navItems}
            currentAppView={currentAppView}
            setAppView={setAppView}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="flex items-center gap-2">
              {currentNav && <currentNav.icon className="w-5 h-5 text-emerald-600" />}
              <h1 className="font-semibold text-lg">{currentNav?.label || 'Dashboard'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              title="Toggle theme"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </Button>
            <div className="hidden md:flex items-center gap-2 px-2">
              <roleInfo.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{roleInfo.label}</span>
            </div>
            <Avatar className="w-8 h-8">
              <AvatarFallback className={roleInfo.color + ' text-white text-xs'}>
                {(user.name || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
