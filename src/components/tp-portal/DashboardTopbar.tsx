'use client'

import React from 'react'
import { Search, Filter, Settings, ShoppingBag, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useDashboardStore } from '@/lib/dashboard-store'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

interface DashboardTopbarProps {
  userName?: string
  userAvatar?: string
}

export function DashboardTopbar({ userName = 'Er. Raju Kumawat', userAvatar }: DashboardTopbarProps) {
  const { searchQuery, setSearchQuery, setSidebarMobileOpen } = useDashboardStore()

  return (
    <header className="flex items-center h-14 px-4 border-b border-border bg-card shrink-0 gap-3">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Search Bar - Centered */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses, tests, students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:bg-background focus-visible:border focus-visible:border-border"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Filter Button */}
        <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-9">
          <Filter className="size-3.5" />
          <span className="text-xs">Filter</span>
        </Button>

        {/* Admin Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 hover:bg-accent">
              <Avatar className="size-7">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={userName} />
                ) : null}
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                Admin
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground">Teacher Account</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="size-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <ShoppingBag className="size-4 mr-2" />
              Purchases
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="size-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default DashboardTopbar
