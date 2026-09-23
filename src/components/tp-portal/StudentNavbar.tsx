'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  User,
  Menu,
  GraduationCap,
  BookOpen,
  FileText,
  Link,
  Info,
  ChevronDown,
  LogIn,
  LogOut,
  UserCircle,
  X,
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface StudentNavbarProps {
  activePage: string
  onPageChange: (page: string) => void
  teacherName: string
  teacherLogo?: string
  userLoggedIn?: boolean
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home Page', icon: <GraduationCap className="size-4" /> },
  { id: 'courses', label: 'Courses', icon: <BookOpen className="size-4" /> },
  { id: 'test-series', label: 'Test Series', icon: <FileText className="size-4" /> },
  { id: 'docs', label: 'Docs', icon: <FileText className="size-4" /> },
  { id: 'quick-links', label: 'Quick Links', icon: <Link className="size-4" /> },
]

const moreItems: NavItem[] = [
  { id: 'about', label: 'About', icon: <Info className="size-4" /> },
]

export default function StudentNavbar({
  activePage,
  onPageChange,
  teacherName,
  teacherLogo,
  userLoggedIn = false,
}: StudentNavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handlePageChange = (page: string) => {
    onPageChange(page)
    setMobileOpen(false)
    setSearchOpen(false)
  }

  const isMoreActive = moreItems.some((item) => item.id === activePage)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Teacher Logo + Name */}
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => handlePageChange('home')}
        >
          <Avatar className="size-10 border-2 border-blue-600">
            {teacherLogo ? (
              <AvatarImage src={teacherLogo} alt={teacherName} />
            ) : null}
            <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">
              {teacherName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-semibold text-gray-800 sm:inline-block">
            {teacherName}
          </span>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={cn(
                'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                activePage === item.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span className="flex items-center gap-1.5">
                {item.label}
              </span>
              {activePage === item.id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}

          {/* More Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isMoreActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                More
                <ChevronDown className="size-3.5" />
                {isMoreActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {moreItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={cn(
                    'cursor-pointer gap-2',
                    activePage === item.id && 'text-blue-600'
                  )}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right: Search + User */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex items-center">
            {searchOpen ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, tests..."
                  className="h-8 w-40 text-sm sm:w-56"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-gray-600 hover:text-gray-900"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search className="size-5" />
              </Button>
            )}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label="User menu"
              >
                {userLoggedIn ? (
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">
                      E
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-blue-600">
                    <User className="size-4 text-white" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {userLoggedIn ? (
                <>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => handlePageChange('profile')}
                  >
                    <UserCircle className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-red-600"
                    onClick={() => handlePageChange('home')}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => handlePageChange('login')}
                  >
                    <LogIn className="size-4" />
                    Login / Register
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-gray-600 hover:text-gray-900 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              {/* Mobile Header */}
              <div className="flex items-center gap-3 border-b border-gray-200 p-4">
                <Avatar className="size-10 border-2 border-blue-600">
                  {teacherLogo ? (
                    <AvatarImage src={teacherLogo} alt={teacherName} />
                  ) : null}
                  <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">
                    {teacherName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {teacherName}
                  </p>
                  <p className="text-xs text-gray-500">Education Portal</p>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex flex-col p-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      activePage === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}

                <Separator className="my-2" />

                {moreItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      activePage === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}

                <Separator className="my-2" />

                {userLoggedIn ? (
                  <>
                    <button
                      onClick={() => handlePageChange('profile')}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        activePage === 'profile'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <UserCircle className="size-4" />
                      My Profile
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handlePageChange('login')}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      activePage === 'login'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <LogIn className="size-4" />
                    Login / Register
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
