'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Search, Menu, BookOpen, ClipboardList, FileText,
  Link2, ArrowRight, ChevronDown, Home, HelpCircle, MessageCircle,
  Shield, Lock, RotateCcw, Mail, ExternalLink, AlertCircle,
  BookMarked, Play, Smartphone, Sparkles, Trophy, User, LogIn, UserPlus,
  X, Loader2, Newspaper, Bell, Info, ChevronRight, GraduationCap as Cap,
  Phone, MapPin, Clock, Users, Star, Download, ChevronLeft,
  Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { MediaImage } from '@/components/ui/media-image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { VideoPlayer } from '../course/course-components'
// signIn removed — using /api/auth/direct-login instead

// ─── Types ──────────────────────────────────────────────────────────────────
export interface OrgData {
  id: string; name: string; code: string; logo: string | null; accentColor: string
}
export interface CourseData {
  id: string; title: string; description: string | null; thumbnail: string | null
  price: number; mrp: number; category: string | null; status: string
  demoVideo?: string | null
}
export interface TestSeriesData {
  id: string; title: string; description: string | null; thumbnail: string | null
  price: number; mrp: number; category: string | null; isCombo: boolean
  status: string; testCount: number
}
export interface QuickLinkData {
  id: string; title: string; url: string; icon: string | null; sortOrder: number
}
export interface BannerData {
  id: string; title: string; image: string; link: string | null; sortOrder: number
}
export interface CategoryData {
  id: string; name: string; slug: string; icon: string | null
}
export interface PortalData {
  organization: OrgData; courses: CourseData[]; testSeries: TestSeriesData[]
  quickLinks: QuickLinkData[]; banners: BannerData[]; categories: CategoryData[]
}

export type PortalPage = 'home' | 'courses' | 'test-series' | 'docs' | 'quick-links' | 'about'
export type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'reset-success'

export const BLUE = '#2563EB'
export const BLUE_LIGHT = '#2563EB15'
export const BLUE_MEDIUM = '#2563EB30'
export const BLUE_HOVER = '#2563EB20'
export const BLUE_BORDER = '#2563EB40'

// ─── Password Strength Indicator ────────────────────────────────────────────
export function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, feedback: [] as string[] }
    const feedback: string[] = []
    let metCount = 0
    if (password.length >= 8) metCount++; else feedback.push('8+ characters')
    if (/[A-Z]/.test(password)) metCount++; else feedback.push('uppercase letter')
    if (/[a-z]/.test(password)) metCount++; else feedback.push('lowercase letter')
    if (/\d/.test(password)) metCount++; else feedback.push('number')
    if (/[^A-Za-z0-9]/.test(password)) metCount++; else feedback.push('special character')
    let score: number
    if (metCount <= 2) { score = 1 }
    else if (metCount === 3) { score = 2 }
    else if (metCount === 4) { score = 3 }
    else { score = 4 }
    return { score, feedback }
  }, [password])

  if (!password) return null
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-600']
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const textColors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-emerald-500', 'text-emerald-700']

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? colors[strength.score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColors[strength.score]}`}>{labels[strength.score]}</span>
        {strength.feedback.length > 0 && strength.score < 4 && (
          <span className="text-xs text-gray-400">Need: {strength.feedback.join(', ')}</span>
        )}
      </div>
    </div>
  )
}

// ─── Verified Org Badge for Auth Dialog ────────────────────────────────────
export function VerifiedOrgBadge({ org }: { org: OrgData }) {
  const accent = org.accentColor || BLUE
  const initials = org.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
      <div className="flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-xs" style={{ backgroundColor: accent }}>{initials}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-emerald-900 truncate">{org.name}</p>
        <p className="text-xs text-emerald-600">Verified</p>
      </div>
      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
    </motion.div>
  )
}

const heroGradients = [
  'from-blue-700 via-blue-600 to-indigo-500',
  'from-indigo-700 via-blue-600 to-sky-500',
  'from-blue-800 via-blue-500 to-cyan-400',
]
const cardGradients = [
  'from-blue-500 to-indigo-500', 'from-sky-500 to-blue-500',
  'from-indigo-500 to-violet-500', 'from-blue-600 to-cyan-500',
]
const tags = ['Bestseller', 'Popular', 'New', 'Trending']

// ─── Skeletons ──────────────────────────────────────────────────────────────
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-32 h-5" />
        </div>
        <div className="hidden lg:flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-16 h-8 rounded-md" />)}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </header>
  )
}

export function CardSkeleton() {
  return (
    <Card className="rounded-xl overflow-hidden py-0">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Error / Empty ──────────────────────────────────────────────────────────
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-50 mx-auto mb-6">
          <AlertCircle className="size-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
        <p className="text-gray-500 mb-6">We couldn&apos;t load the portal data. Please try again.</p>
        <Button onClick={onRetry} className="gap-2 text-white" style={{ backgroundColor: BLUE }}>
          <RotateCcw className="size-4" /> Try Again
        </Button>
      </motion.div>
    </div>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
export function PublicNavbar({ data, activePage, onNavigate, onLoginClick, onSignupClick }: {
  data: PortalData; activePage: PortalPage; onNavigate: (p: PortalPage) => void; onLoginClick: () => void; onSignupClick?: () => void
}) {
  const { setCurrentView, isAuthenticated, userRole } = useAppStore()
  const isStudentAuth = isAuthenticated && (userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'user' || !userRole)
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
              <MediaImage src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-lg" />
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
          {!isStudentAuth ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 font-medium" onClick={onLoginClick}>
                <LogIn className="size-4" /> Login
              </Button>
              <Button size="sm" className="text-white gap-1.5 font-medium" style={{ backgroundColor: BLUE }}
                onClick={onSignupClick || onLoginClick}>
                <UserPlus className="size-4" /> Register
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" className="text-white gap-1.5 hidden sm:flex" style={{ backgroundColor: BLUE }}
                onClick={() => setCurrentView('student')}>
                <User className="size-4" /> Dashboard
              </Button>
              <Avatar className="hidden sm:flex size-8 cursor-pointer" onClick={() => setCurrentView('student')}>
                <AvatarFallback className="text-sm font-semibold" style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}>
                  {useAppStore.getState().userName?.charAt(0).toUpperCase() || orgInitials.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
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
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: BLUE }}>
                      {data.organization.logo ? (
                        <MediaImage src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-lg" />
                      ) : orgInitials}
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-base font-bold text-gray-900 tracking-tight">{data.organization.name}</span>
                      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: BLUE }}>Student Portal</span>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-4 gap-2">
                {[...navItems, ...moreItems].map(item => (
                  <SheetClose key={item.key} asChild>
                    <Button variant="ghost" className={`justify-start font-medium h-11 ${activePage === item.key ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                      onClick={() => onNavigate(item.key)}>{item.label}</Button>
                  </SheetClose>
                ))}
                <div className="my-2 border-t" />
                {!isStudentAuth ? (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button variant="outline" className="gap-1.5 justify-start" onClick={onLoginClick}>
                        <LogIn className="size-4" /> Login
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button className="text-white gap-1.5 justify-start" style={{ backgroundColor: BLUE }} onClick={onSignupClick || onLoginClick}>
                        <UserPlus className="size-4" /> Register / Sign Up
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button className="text-white gap-1.5 justify-start" style={{ backgroundColor: BLUE }} onClick={() => setCurrentView('student')}>
                        <User className="size-4" /> Dashboard
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

// ─── Hero Banner Carousel ───────────────────────────────────────────────────
export function HeroBanner({ data }: { data: PortalData }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const { setStudentPage, setSelectedCourseId, setSelectedTestSeriesId } = useAppStore()
  
  const handleBannerAction = (link: string | null) => {
    if (!link) return
    const l = link.trim()
    if (l.startsWith('http://') || l.startsWith('https://') || l.startsWith('wa.me')) {
      window.open(l.startsWith('wa.me') ? `https://${l}` : l, '_blank', 'noopener,noreferrer')
    } else if (l.startsWith('/product/')) {
      const parts = l.split('/')
      const type = parts[2]
      const id = parts[3]
      if (type === 'course') {
        setSelectedCourseId(id)
        setStudentPage('course-detail')
      } else if (type === 'test-series') {
        setSelectedTestSeriesId(id)
        setStudentPage('test-series-detail')
      } else if (type === 'digital-product') {
        setSelectedCourseId(id)
        setStudentPage('store-product-detail')
      }
    } else if (l.includes('test') || l.includes('quiz')) {
      setStudentPage('store')
    } else if (l.includes('notes') || l.includes('book') || l.includes('digital')) {
      setStudentPage('store')
    } else {
      setStudentPage('store')
    }
  }

  const bannerSlides = data.banners.length > 0
    ? data.banners.map((b, i) => ({
        id: b.id, title: b.title, subtitle: `Welcome to ${data.organization.name}`,
        cta: 'Explore Now', gradient: heroGradients[i % heroGradients.length], image: b.image, link: b.link,
      }))
    : [
        { id: 'd1', title: `Welcome to ${data.organization.name}`, subtitle: 'Discover courses crafted by expert educators', cta: 'Explore Courses', gradient: heroGradients[0], image: null, link: null },
        { id: 'd2', title: 'Ace Your Exams with Test Series', subtitle: 'Practice with comprehensive mock tests', cta: 'Start Testing', gradient: heroGradients[1], image: null, link: null },
        { id: 'd3', title: 'Learn Anytime, Anywhere', subtitle: 'Access study material on the go', cta: 'Get Started', gradient: heroGradients[2], image: null, link: null },
      ]

  useEffect(() => {
    if (!api) return
    const h = () => setCurrent(api.selectedScrollSnap())
    api.on('select', h)
    return () => { api.off('select', h) }
  }, [api])

  useEffect(() => {
    if (!api) return
    const i = setInterval(() => api.scrollNext(), 5000)
    return () => clearInterval(i)
  }, [api])

  return (
    <section className="w-full">
      <Carousel setApi={setApi} opts={{ loop: true, align: 'start' }} className="w-full">
        <CarouselContent>
          {bannerSlides.map(banner => (
            <CarouselItem key={banner.id}>
              {banner.image ? (
                <div className="relative mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-gray-100 aspect-video sm:aspect-[2/1] lg:aspect-[3/1]">
                  <MediaImage src={banner.image} alt={banner.title} className="w-full h-full object-contain" />
                  {banner.link && (
                    <button onClick={() => handleBannerAction(banner.link)} className="absolute inset-0 z-20 w-full h-full cursor-pointer text-left focus:outline-none" aria-label={banner.title} />
                  )}
                </div>
              ) : (
                <div className={`relative overflow-hidden bg-gradient-to-r ${banner.gradient} rounded-xl sm:rounded-2xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 shadow-xl aspect-video sm:aspect-[2/1] lg:aspect-[3/1] flex flex-col justify-center`}>
                  <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative z-10 px-6 sm:px-12 lg:px-20 flex flex-col items-start gap-4 sm:gap-6">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-xl">{banner.title}</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="text-white/90 text-sm sm:text-base max-w-lg">{banner.subtitle}</motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90 font-semibold rounded-lg shadow-lg mt-2">
                        {banner.cta} <ArrowRight className="size-4 ml-1" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex items-center justify-center gap-2 mt-2 mb-4">
        {bannerSlides.map((_, idx) => (
          <button key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === current ? 'w-8' : 'w-2 bg-gray-300'}`}
            style={idx === current ? { backgroundColor: BLUE } : undefined} aria-label={`Slide ${idx + 1}`} />
        ))}
      </div>
    </section>
  )
}

// ─── Browse Tiles ────────────────────────────────────────────────────────────
export function BrowseTiles({ data, onNavigate }: { data: PortalData; onNavigate: (p: PortalPage) => void }) {
  const tiles = [
    { icon: BookOpen, label: 'Courses', count: data.courses.length, page: 'courses' as PortalPage, gradient: 'from-blue-500 to-blue-600' },
    { icon: ClipboardList, label: 'Test Series', count: data.testSeries.length, page: 'test-series' as PortalPage, gradient: 'from-indigo-500 to-indigo-600' },
    { icon: FileText, label: 'Study Material', count: data.categories.length, page: 'docs' as PortalPage, gradient: 'from-sky-500 to-sky-600' },
    { icon: Link2, label: 'Quick Links', count: data.quickLinks.length, page: 'quick-links' as PortalPage, gradient: 'from-cyan-500 to-cyan-600' },
  ]

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map(tile => (
            <motion.div key={tile.label} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
              className="cursor-pointer" onClick={() => onNavigate(tile.page)}>
              <Card className="border border-white/40 bg-white/60 backdrop-blur-md rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl py-0">
                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} text-white shrink-0 shadow-md`}>
                    <tile.icon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{tile.label}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{tile.count} items</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Test Series ───────────────────────────────────────────────────
export function FeaturedSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout, setCheckoutIntent, userRole } = useAppStore()
  const isStudentAuth = isAuthenticated && (userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'user' || !userRole)
  if (data.testSeries.length === 0) return null

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-blue-50/30">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Test Series</h2>
            <p className="text-gray-500 mt-1 text-sm">Top picks to boost your exam preparation</p>
          </div>
          <Button variant="outline" className="hidden sm:flex items-center gap-1.5"
            style={{ color: BLUE, borderColor: BLUE_BORDER }} onClick={() => onNavigate('test-series')}>
            View All <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 scrollbar-thin">
          {data.testSeries.slice(0, 6).map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
              className="flex-shrink-0 w-64 sm:w-72">
              <Card className="group cursor-pointer border border-white/40 bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 py-0 flex flex-col h-full">
                <div className={`relative aspect-video bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} flex items-center justify-center shrink-0`}>
                  {item.thumbnail ? (
                    <MediaImage src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <ClipboardList className="size-12 text-white/80" />
                  )}
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-semibold">{tags[idx % tags.length]}</Badge>
                  {item.isCombo && <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold">Combo</Badge>}
                </div>
                <CardContent className="p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{item.testCount} Tests</Badge>
                    {item.category && <Badge variant="secondary" className="text-xs" style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}>{item.category}</Badge>}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold text-gray-900">&#8377;{item.price}</span>
                    {item.mrp > item.price && (
                      <><span className="text-sm text-gray-400 line-through">&#8377;{item.mrp}</span>
                        <span className="text-xs font-semibold text-emerald-600">{Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off</span></>
                    )}
                  </div>
                  <Button className="w-full font-semibold rounded-lg text-white" style={{ backgroundColor: BLUE }}
                    onClick={() => (() => { const payload = { id: item.id, type: "test_series", title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })()}>Buy Now</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Courses Section ─────────────────────────────────────────────────────────
export function CoursesSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout, setCheckoutIntent, userRole } = useAppStore()
  const isStudentAuth = isAuthenticated && (userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'user' || !userRole)
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<{ url: string, title: string } | null>(null)
  
  if (data.courses.length === 0) return null

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular Courses</h2>
            <p className="text-gray-500 mt-1 text-sm">Learn from the best educators</p>
          </div>
          <Button variant="outline" className="hidden sm:flex items-center gap-1.5"
            style={{ color: BLUE, borderColor: BLUE_BORDER }} onClick={() => onNavigate('courses')}>
            View All <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data.courses.slice(0, 6).map((course, idx) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 py-0 bg-white/70 backdrop-blur-sm flex flex-col h-full"
                onClick={() => (() => { const payload = { id: course.id, type: "course", title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })()}>
                <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50 shrink-0">
                  {course.thumbnail ? (
                    <MediaImage src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="size-12" style={{ color: BLUE, opacity: 0.4 }} />
                  )}
                  {course.category && <Badge className="absolute top-3 left-3 text-xs text-white" style={{ backgroundColor: BLUE }}>{course.category}</Badge>}
                </div>
                <CardContent className="p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{course.title}</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold text-gray-900">&#8377;{course.price}</span>
                    {course.mrp > course.price && (
                      <><span className="text-sm text-gray-400 line-through">&#8377;{course.mrp}</span>
                        <span className="text-xs font-semibold text-emerald-600">{Math.round(((course.mrp - course.price) / course.mrp) * 100)}% off</span></>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {course.demoVideo && (
                      <Button
                        variant="secondary"
                        className="font-semibold rounded-lg flex-1 flex items-center justify-center gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDemoVideo({ url: course.demoVideo!, title: course.title });
                        }}
                      >
                        <Play className="size-3.5" /> Watch Demo
                      </Button>
                    )}
                    <Button variant="outline" className={`font-semibold rounded-lg ${course.demoVideo ? 'flex-1' : 'w-full'}`}
                      style={{ borderColor: BLUE_BORDER, color: BLUE }}
                      onClick={(e) => { e.stopPropagation(); (() => { const payload = { id: course.id, type: "course", title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })() }}>Enroll Now</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedDemoVideo} onOpenChange={(open) => !open && setSelectedDemoVideo(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-0">
          <DialogHeader className="p-4 bg-gray-900 border-b border-gray-800">
            <DialogTitle className="text-white text-base font-medium">
              Demo: {selectedDemoVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-video bg-black">
            {selectedDemoVideo && (
              <VideoPlayer url={selectedDemoVideo.url} title={selectedDemoVideo.title} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function CoursesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout, setCheckoutIntent, userRole } = useAppStore()
  const isStudentAuth = isAuthenticated && (userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'user' || !userRole)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<{ url: string, title: string } | null>(null)
  const allCats = [...new Set(data.courses.map(c => c.category).filter(Boolean))]
  const filtered = data.courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCat && c.category !== selectedCat) return false
    return true
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Courses</h2>
        <p className="text-gray-500 text-sm mb-6">{data.courses.length} courses available</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant={selectedCat === null ? 'default' : 'outline'} size="sm"
              className={`shrink-0 rounded-full ${selectedCat === null ? 'text-white' : ''}`}
              style={selectedCat === null ? { backgroundColor: BLUE } : { borderColor: BLUE_BORDER, color: BLUE }}
              onClick={() => setSelectedCat(null)}>All</Button>
            {allCats.map(cat => (
              <Button key={cat} variant={selectedCat === cat ? 'default' : 'outline'} size="sm"
                className={`shrink-0 rounded-full ${selectedCat === cat ? 'text-white' : ''}`}
                style={selectedCat === cat ? { backgroundColor: BLUE } : { borderColor: BLUE_BORDER, color: BLUE }}
                onClick={() => setSelectedCat(cat)}>{cat}</Button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16"><BookOpen className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No courses found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((course, idx) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg py-0 flex flex-col h-full"
                  onClick={() => (() => { const payload = { id: course.id, type: "course", title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })()}>
                  <div className="relative aspect-video flex items-center justify-center shrink-0" style={{ backgroundColor: BLUE_LIGHT }}>
                    {course.thumbnail ? <MediaImage src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      : <BookOpen className="size-12" style={{ color: BLUE, opacity: 0.4 }} />}
                    {course.category && <Badge className="absolute top-3 left-3 text-xs text-white" style={{ backgroundColor: BLUE }}>{course.category}</Badge>}
                  </div>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{course.title}</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-gray-900">&#8377;{course.price}</span>
                      {course.mrp > course.price && <><span className="text-sm text-gray-400 line-through">&#8377;{course.mrp}</span>
                        <span className="text-xs font-semibold text-emerald-600">{Math.round(((course.mrp - course.price) / course.mrp) * 100)}% off</span></>}
                    </div>
                    <div className="flex gap-2">
                      {course.demoVideo && (
                        <Button
                          variant="secondary"
                          className="font-semibold rounded-lg flex-1 flex items-center justify-center gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDemoVideo({ url: course.demoVideo!, title: course.title });
                          }}
                        >
                          <Play className="size-3.5" /> Watch Demo
                        </Button>
                      )}
                      <Button variant="outline" className={`font-semibold rounded-lg ${course.demoVideo ? 'flex-1' : 'w-full'}`}
                        style={{ borderColor: BLUE_BORDER, color: BLUE }}
                        onClick={(e) => { e.stopPropagation(); (() => { const payload = { id: course.id, type: "course", title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })() }}>Enroll Now</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDemoVideo} onOpenChange={(open) => !open && setSelectedDemoVideo(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-0">
          <DialogHeader className="p-4 bg-gray-900 border-b border-gray-800">
            <DialogTitle className="text-white text-base font-medium">
              Demo: {selectedDemoVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-video bg-black">
            {selectedDemoVideo && (
              <VideoPlayer url={selectedDemoVideo.url} title={selectedDemoVideo.title} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Full Test Series List Page ──────────────────────────────────────────────
export function TestSeriesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout, setCheckoutIntent, userRole } = useAppStore()
  const isStudentAuth = isAuthenticated && (userRole?.toLowerCase() === 'student' || userRole?.toLowerCase() === 'user' || !userRole)
  const [search, setSearch] = useState('')
  const filtered = data.testSeries.filter(ts => !search || ts.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Test Series</h2>
        <p className="text-gray-500 text-sm mb-6">{data.testSeries.length} test series available</p>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input placeholder="Search test series..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-lg border-gray-200" />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16"><ClipboardList className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No test series found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg py-0 flex flex-col h-full"
                  onClick={() => (() => { const payload = { id: item.id, type: "test_series", title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })()}>
                  <div className={`relative aspect-video bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} flex items-center justify-center shrink-0`}>
                    {item.thumbnail ? <MediaImage src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      : <ClipboardList className="size-12 text-white/80" />}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-semibold">{tags[idx % tags.length]}</Badge>
                    {item.isCombo && <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold">Combo</Badge>}
                  </div>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{item.testCount} Tests</Badge>
                      {item.category && <Badge variant="secondary" className="text-xs" style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}>{item.category}</Badge>}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-gray-900">&#8377;{item.price}</span>
                      {item.mrp > item.price && <><span className="text-sm text-gray-400 line-through">&#8377;{item.mrp}</span>
                        <span className="text-xs font-semibold text-emerald-600">{Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off</span></>}
                    </div>
                    <Button className="w-full font-semibold rounded-lg text-white" style={{ backgroundColor: BLUE }}
                      onClick={() => (() => { const payload = { id: item.id, type: "test_series", title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail } as any; if (!isStudentAuth) { setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } })()}>Buy Now</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Docs Page ──────────────────────────────────────────────────────────────
export function DocsPage({ data }: { data: PortalData }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Study Material & Docs</h2>
        <p className="text-gray-500 text-sm mb-6">Browse study resources organized by category</p>
        {data.categories.length === 0 ? (
          <div className="text-center py-16"><FileText className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No categories available yet</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.categories.map((cat, idx) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer py-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} text-white shrink-0`}>
                      <BookMarked className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.slug}</p>
                    </div>
                    <ChevronRight className="size-5 text-gray-400 shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quick Links Page ───────────────────────────────────────────────────────
export function QuickLinksPage({ data }: { data: PortalData }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quick Links</h2>
        <p className="text-gray-500 text-sm mb-6">Important links and resources</p>
        {data.quickLinks.length === 0 ? (
          <div className="text-center py-16"><Link2 className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No quick links available yet</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.quickLinks.map((link, idx) => (
              <motion.div key={link.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <Card className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200 py-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-11 h-11 rounded-lg text-white shrink-0" style={{ backgroundColor: BLUE }}>
                        <Link2 className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{link.title}</h3>
                      </div>
                      <ExternalLink className="size-4 text-gray-400 shrink-0" />
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── About Page ─────────────────────────────────────────────────────────────
export function AboutPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {
  const orgInitials = data.organization.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl text-white font-bold text-2xl mx-auto mb-4"
            style={{ backgroundColor: BLUE }}>
            {data.organization.logo ? (
              <MediaImage src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-2xl" />
            ) : orgInitials}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{data.organization.name}</h2>
          <p className="text-gray-500 mt-2">Empowering education through technology</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Courses', value: data.courses.length },
            { icon: ClipboardList, label: 'Test Series', value: data.testSeries.length },
            { icon: FileText, label: 'Categories', value: data.categories.length },
            { icon: Link2, label: 'Quick Links', value: data.quickLinks.length },
          ].map(stat => (
            <Card key={stat.label} className="border border-gray-100 rounded-xl text-center py-0">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <stat.icon className="size-6" style={{ color: BLUE }} />
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border border-gray-100 rounded-xl py-0">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">About Our Platform</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              {data.organization.name} provides a comprehensive learning platform designed to help students
              achieve their academic goals. Our expert educators create high-quality courses and test series
              that cover all essential topics and exam patterns.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Join thousands of students who trust us for their exam preparation. Access courses, practice
              tests, and study material — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="text-white gap-2" style={{ backgroundColor: BLUE }}
                onClick={() => onLoginClick()}>
                <LogIn className="size-4" /> Login to Get Started
              </Button>
              <Button variant="outline" style={{ borderColor: BLUE_BORDER, color: BLUE }} className="gap-2">
                <Mail className="size-4" /> Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export function Footer({ data }: { data: PortalData }) {
  const orgInitials = data.organization.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <footer className="bg-[#111827] text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6">
          {/* Org logo and name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: BLUE }}>
              {data.organization.logo ? (
                <MediaImage src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-lg" />
              ) : orgInitials}
            </div>
            <span className="text-base font-bold text-white">{data.organization.name}</span>
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a>
          </div>

          {/* Google Play badge placeholder */}
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
            <Smartphone className="size-5 text-white" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Get it on</span>
              <span className="text-sm font-semibold text-white">Google Play</span>
            </div>
          </a>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-gray-800 w-full justify-center">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} {data.organization.name}. All Rights Reserved.</p>
            <p className="text-gray-600 text-xs">Powered by <span style={{ color: BLUE }} className="font-medium">Er. Raju Kumawat Tech</span></p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
