import React from 'react'
import { Search, Menu, ExternalLink, LogIn, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PortalData, PortalPage } from './types'

const BLUE = '#2563EB'
const BLUE_LIGHT = '#2563EB15'
const BLUE_BORDER = '#2563EB40'

export function PublicNavbar({ data, activePage, onNavigate, onLoginClick }: {
  data: PortalData; activePage: PortalPage; onNavigate: (p: PortalPage) => void; onLoginClick: () => void
}) {
  const { setCurrentView, isAuthenticated, userRole } = useAppStore()
  const isPreviewing = isAuthenticated && (userRole === 'teacher' || userRole === 'platform_admin')
  const normalizedRole = userRole?.toLowerCase()
  const backView = normalizedRole === 'platform_admin' ? 'admin' : (normalizedRole === 'student' || normalizedRole === 'user') ? 'student' : 'cms'
  const orgInitials = data.organization.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const navItems: { key: PortalPage; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'courses', label: 'Courses' },
    { key: 'test-series', label: 'Test Series' },
    { key: 'docs', label: 'Docs' },
    { key: 'quick-links', label: 'Quick Links' },
  ]
  const moreItems: { key: PortalPage; label: string }[] = [
    { key: 'about', label: 'About Us' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: BLUE }}>
            {data.organization.logo ? (
              <img src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-lg" />
            ) : orgInitials}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-gray-900 tracking-tight line-clamp-1 max-w-[140px] sm:max-w-[200px]">{data.organization.name}</span>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: BLUE }}>Student Portal</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <Button key={item.key} variant="ghost" size="sm"
              className={`font-medium transition-colors ${activePage === item.key ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => onNavigate(item.key)}
            >{item.label}</Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-600 font-medium gap-1">More <ChevronDown className="size-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moreItems.map(item => (
                <DropdownMenuItem key={item.key} className="cursor-pointer" onClick={() => onNavigate(item.key)}>{item.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hidden sm:flex"><Search className="size-5" /></Button>
          {isPreviewing && (
            <Button variant="outline" size="sm" onClick={() => setCurrentView(backView as any)}
              className="hidden sm:flex items-center gap-1.5" style={{ borderColor: BLUE_BORDER, color: BLUE }}>
              <ExternalLink className="size-3.5" /> Back to {userRole === 'platform_admin' ? 'Admin' : 'CMS'}
            </Button>
          )}
          {!isAuthenticated ? (
            <Button size="sm" className="text-white gap-1.5" style={{ backgroundColor: BLUE }}
              onClick={onLoginClick}>
              <LogIn className="size-4" /> Login
            </Button>
          ) : (
            <Avatar className="hidden sm:flex size-8 cursor-pointer">
              <AvatarFallback className="text-sm font-semibold" style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}>
                {useAppStore.getState().userName?.charAt(0).toUpperCase() || orgInitials.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-500"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: BLUE }}>{orgInitials}</div>
                    <div className="flex flex-col leading-none">
                      <span className="text-base font-bold text-gray-900 tracking-tight">{data.organization.name}</span>
                      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: BLUE }}>Student Portal</span>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-4 gap-1">
                {[...navItems, ...moreItems].map(item => (
                  <SheetClose key={item.key} asChild>
                    <Button variant="ghost" className={`justify-start font-medium h-11 ${activePage === item.key ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                      onClick={() => onNavigate(item.key)}>{item.label}</Button>
                  </SheetClose>
                ))}
                <div className="my-2 border-t" />
                {!isAuthenticated ? (
                  <Button className="text-white gap-1.5" style={{ backgroundColor: BLUE }} onClick={onLoginClick}>
                    <LogIn className="size-4" /> Login
                  </Button>
                ) : isPreviewing ? (
                  <SheetClose asChild>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => setCurrentView(backView as any)}>
                      <ExternalLink className="size-4" />Back to {userRole === 'platform_admin' ? 'Admin' : 'CMS'}
                    </Button>
                  </SheetClose>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
