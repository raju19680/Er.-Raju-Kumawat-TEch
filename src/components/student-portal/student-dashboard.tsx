'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  BookOpen,
  Trophy,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  Zap,
  HelpCircle,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface DashboardStats {
  availableTests: number
  completedTests: number
  purchasedCourses: number
  avgScore: number
}

interface BannerItem {
  id: string
  title: string
  image: string
  link?: string | null
  sortOrder?: number
  isActive?: boolean
}

interface AnnouncementItem {
  id: string
  title: string
  content: string
  priority?: string
  createdAt: string
}

interface QuickLinkItem {
  id: string
  title: string
  url: string
  icon?: string
}

interface RecentAttempt {
  id: string
  testId: string
  score: number
  totalMarks: number
  status: string
  startedAt: string
  completedAt: string | null
  test: {
    id: string
    title: string
    testSeries: { id: string; title: string } | null
  }
}

export default function StudentDashboard() {
  const { userName, setStudentPage, setSelectedAttemptId } = useAppStore()
  const [stats, setStats] = useState<DashboardStats>({ availableTests: 0, completedTests: 0, purchasedCourses: 0, avgScore: 0 })
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isHoveringBanner, setIsHoveringBanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [testSeriesRes, attemptsRes, dashboardRes, bannersRes, announcementsRes, portalDataRes] = await Promise.allSettled([
        apiFetchJSON<{ success: boolean; testSeries: any[] }>('/api/student/test-series'),
        apiFetchJSON<{ success: boolean; attempts: RecentAttempt[] }>('/api/student/test-attempts'),
        apiFetchJSON<{ success: boolean; data: any }>('/api/student/dashboard'),
        apiFetchJSON<{ success?: boolean; items?: BannerItem[]; banners?: BannerItem[] }>('/api/banners?isActive=true'),
        apiFetchJSON<{ success: boolean; announcements?: AnnouncementItem[]; items?: AnnouncementItem[] }>('/api/student/announcements'),
        apiFetchJSON<{ success: boolean; data?: any; content?: any }>('/api/public/portal-data'),
      ])

      if (testSeriesRes.status === 'fulfilled' && testSeriesRes.value.success) {
        const ts = testSeriesRes.value.testSeries || []
        let totalTests = 0
        ts.forEach((s: any) => { totalTests += (s.testCount || s.tests?.length || 0) })
        setStats(prev => ({ ...prev, availableTests: totalTests }))
      }

      if (attemptsRes.status === 'fulfilled' && attemptsRes.value.success) {
        const attempts = attemptsRes.value.attempts || []
        const completed = attempts.filter((a: RecentAttempt) => a.status === 'completed')
        const avgScore = completed.length > 0
          ? Math.round(completed.reduce((sum: number, a: RecentAttempt) => sum + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / completed.length)
          : 0
        setStats(prev => ({ ...prev, completedTests: completed.length, avgScore }))
        setRecentAttempts(attempts.slice(0, 10))
      }

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.success) {
        const d = dashboardRes.value.data || {}
        setStats(prev => ({ ...prev, purchasedCourses: d.activeCourses?.length || 0 }))
        setDashboardData(d)
      }

      if (bannersRes.status === 'fulfilled') {
        const b = bannersRes.value.items || bannersRes.value.banners || []
        if (b.length > 0) {
          setBanners(b)
        }
      }

      if (portalDataRes.status === 'fulfilled' && portalDataRes.value.success) {
        const pData = portalDataRes.value.data || portalDataRes.value.content || {}
        if (pData.banners && pData.banners.length > 0) {
          setBanners(prev => prev.length > 0 ? prev : pData.banners)
        }
        if (pData.quickLinks && pData.quickLinks.length > 0) {
          setQuickLinks(pData.quickLinks)
        }
      }

      if (announcementsRes.status === 'fulfilled' && announcementsRes.value.success) {
        const ann = announcementsRes.value.announcements || announcementsRes.value.items || []
        setAnnouncements(ann)
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (banners.length <= 1 || isHoveringBanner) return
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length, isHoveringBanner])

  const firstName = userName ? userName.split(' ')[0] : 'Student'

  const handleBannerAction = (banner: BannerItem) => {
    if (!banner.link) {
      setStudentPage('my-courses')
      return
    }
    const link = banner.link.trim()
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('wa.me')) {
      window.open(link.startsWith('wa.me') ? `https://${link}` : link, '_blank', 'noopener,noreferrer')
    } else if (link.includes('test') || link.includes('quiz')) {
      setStudentPage('my-tests')
    } else if (link.includes('notes') || link.includes('book') || link.includes('digital')) {
      setStudentPage('digital-products')
    } else if (link.includes('doubt') || link.includes('support')) {
      setStudentPage('support')
    } else {
      setStudentPage('my-courses')
    }
  }

  const statCards = [
    { label: 'Available Tests', value: stats.availableTests, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', page: 'my-tests' as const },
    { label: 'Completed Tests', value: stats.completedTests, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', page: 'results' as const },
    { label: 'My Courses', value: stats.purchasedCourses, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', page: 'my-courses' as const },
    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: Trophy, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', page: 'results' as const },
  ]

  // Data for chart
  const completedAttempts = recentAttempts.filter(a => a.status === 'completed').reverse()
  const chartData = completedAttempts.map((a, i) => ({
    name: `T${i + 1}`,
    score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
    title: a.test.title
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="py-0">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load Dashboard</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={load}>
            <RotateCcw className="size-4" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  const activeBanner = banners.length > 0 ? banners[currentBannerIndex] : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/80 text-amber-900 text-sm shadow-sm"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shrink-0 shadow-sm animate-pulse">
            <Megaphone className="size-3.5" />
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-semibold text-amber-950 text-xs px-2 py-0.5 rounded bg-amber-100 uppercase tracking-wider">
              {announcements[0].priority === 'high' ? 'Important Notice' : 'Notice'}
            </span>
            <span className="truncate font-medium text-gray-800">{announcements[0].title}</span>
            <span className="hidden sm:inline text-xs text-gray-500 truncate">— {announcements[0].content}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStudentPage('announcements')}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 text-xs h-7 px-2 font-medium shrink-0"
          >
            All Notices <ArrowRight className="size-3 ml-1" />
          </Button>
        </motion.div>
      )}

      <div
        className="relative overflow-hidden rounded-3xl shadow-lg border border-gray-100 group"
        onMouseEnter={() => setIsHoveringBanner(true)}
        onMouseLeave={() => setIsHoveringBanner(false)}
      >
        {banners.length > 0 && activeBanner ? (
          <div className="relative min-h-[190px] sm:min-h-56 lg:min-h-[240px] flex items-center bg-gray-900 text-white">
            <div className="absolute inset-0 z-0">
              {activeBanner.image ? (
                <img
                  src={activeBanner.image}
                  alt={activeBanner.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/80 to-transparent" />
            </div>
            <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white shadow-sm backdrop-blur-md">
                  <Sparkles className="size-3" /> Teacher Special Announcement
                </span>
                <span className="text-xs text-white/70">
                  {currentBannerIndex + 1} of {banners.length}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-2 drop-shadow-sm">
                {activeBanner.title}
              </h2>
              <p className="text-sm sm:text-base text-gray-200 mb-5 line-clamp-2">
                Special learning opportunity curated by your faculty. Tap below to explore details and enroll.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => handleBannerAction(activeBanner)}
                  className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-105 gap-2"
                >
                  <Zap className="size-4 fill-current" />
                  Explore Now
                  <ArrowRight className="size-4" />
                </Button>
                {activeBanner.link && (
                  <span className="text-xs text-white/60 hidden sm:inline">
                    {activeBanner.link.startsWith('http') ? 'External Offer Link' : 'Course & Test Series'}
                  </span>
                )}
              </div>
            </div>
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-opacity opacity-70 group-hover:opacity-100"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-opacity opacity-70 group-hover:opacity-100"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-3 right-6 z-20 flex items-center gap-1.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentBannerIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Go to banner ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 p-6 sm:p-8 lg:p-10 text-white">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3 text-white">
                  <Sparkles className="size-3.5" /> Empowering Exam Excellence
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight">
                  Welcome back, {firstName}! 🎓
                </h1>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                  Your customized learning dashboard is active. Practice mock tests, master course lessons, and monitor your score performance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Button
                  onClick={() => setStudentPage('my-tests')}
                  className="bg-white hover:bg-amber-50 text-amber-800 font-bold px-5 py-3 rounded-xl shadow-md gap-2"
                >
                  <ClipboardList className="size-4" />
                  Take Test
                </Button>
                <Button
                  onClick={() => setStudentPage('my-courses')}
                  variant="outline"
                  className="border-white/40 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3 rounded-xl backdrop-blur-sm gap-2"
                >
                  <BookOpen className="size-4" />
                  My Courses
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => setStudentPage(stat.page)}
            className="cursor-pointer"
          >
            <Card className={`border ${stat.border} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all py-0 rounded-2xl`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${stat.bg} shadow-inner`}>
                      <stat.icon className={`size-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-black text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {dashboardData?.recommendedStep && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 gap-4">
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-500 text-white shrink-0">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Recommended Next Step</h3>
                  <p className="text-sm text-amber-800 font-medium">{dashboardData.recommendedStep.title}</p>
                </div>
              </div>
              <Button 
                onClick={() => setStudentPage('my-courses')} 
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 w-full sm:w-auto"
              >
                Continue <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {dashboardData?.activeCourses && dashboardData.activeCourses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="size-4 text-indigo-500" /> Current Course Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.activeCourses.map((c: any) => (
              <Card key={c.id} className="border-gray-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStudentPage('my-courses')}>
                <div className="flex gap-3 p-3">
                  <img src={c.thumbnail || '/placeholder.png'} alt={c.title} className="w-20 h-20 object-cover rounded-lg bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{c.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>{c.completedLessons} / {c.totalLessons} Lessons</span>
                      <span className="font-medium text-indigo-600">{c.progressPercent}%</span>
                    </div>
                    <Progress value={c.progressPercent} className="h-1.5 bg-gray-100" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-gray-100 shadow-sm py-0 rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="size-4 text-amber-500" /> Fast Learning Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pb-4">
            <Button
              onClick={() => setStudentPage('my-tests')}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl shadow-sm"
            >
              <ClipboardList className="size-4" />
              Practice Tests
            </Button>
            <Button
              onClick={() => setStudentPage('my-courses')}
              variant="outline"
              className="gap-2 border-amber-200 text-amber-800 hover:bg-amber-50 rounded-xl"
            >
              <BookOpen className="size-4" />
              Course Lectures
            </Button>
            <Button
              onClick={() => setStudentPage('digital-products')}
              variant="outline"
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl"
            >
              <Tag className="size-4" />
              Formula Books & Notes
            </Button>
            <Button
              onClick={() => setStudentPage('support')}
              variant="outline"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
            >
              <HelpCircle className="size-4" />
              Ask Faculty Doubt
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm py-0 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <MessageCircle className="size-4 text-emerald-600" /> Faculty Connect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            <p className="text-xs text-gray-500">
              Directly reach out to your faculty for doubt resolution, batch updates, and syllabus guidance.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStudentPage('support')}
                className="text-xs gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg h-8"
              >
                <HelpCircle className="size-3.5" /> Doubt Desk
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStudentPage('orders')}
                className="text-xs gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg h-8"
              >
                <ShoppingBag className="size-3.5" /> Fee Invoices
              </Button>
              {quickLinks.slice(0, 2).map((ql) => (
                <Button
                  key={ql.id}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(ql.url, '_blank')}
                  className="text-xs gap-1.5 border-amber-200 text-amber-800 hover:bg-amber-50 rounded-lg h-8"
                >
                  <ExternalLink className="size-3.5" /> {ql.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RECENT ATTEMPTS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-100 shadow-sm py-0 rounded-2xl h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-gray-50">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="size-5 text-amber-500" />
                  Recent Test Attempts
                </CardTitle>
              </div>
              {recentAttempts.length > 0 && (
                <Button variant="ghost" size="sm" className="text-amber-600 font-semibold" onClick={() => setStudentPage('results')}>
                  All <ArrowRight className="size-3.5 ml-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4 h-80 overflow-y-auto">
              {recentAttempts.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <ClipboardList className="size-12 mx-auto mb-3 opacity-30 text-amber-600" />
                  <p className="text-sm font-medium text-gray-700">No test attempts recorded yet.</p>
                  <Button
                    size="sm"
                    className="mt-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
                    onClick={() => setStudentPage('my-tests')}
                  >
                    Browse Mock Tests
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentAttempts.slice(0, 5).map((attempt) => {
                    const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0
                    const isCompleted = attempt.status === 'completed'
                    return (
                      <div
                        key={attempt.id}
                        className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50/70 hover:bg-amber-50/40 border border-transparent hover:border-amber-100 transition-all cursor-pointer"
                        onClick={() => {
                          if (isCompleted) {
                            setSelectedAttemptId(attempt.id)
                            setStudentPage('test-result')
                          }
                        }}
                      >
                        <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isCompleted ? (
                            <CheckCircle2 className="size-5" />
                          ) : (
                            <Clock className="size-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{attempt.test.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {attempt.test.testSeries?.title || 'Mock Series'} •{' '}
                            {isCompleted ? `${attempt.score}/${attempt.totalMarks} Marks` : 'In Progress'}
                          </p>
                        </div>
                        {isCompleted ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge className={`text-xs px-3 py-1 ${
                              pct >= 70 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : pct >= 40 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}>
                              {pct}% Score
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs shrink-0 hover:bg-amber-200">
                            In Progress
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* PERFORMANCE TREND CHART */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-gray-100 shadow-sm py-0 rounded-2xl h-full">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="size-5 text-indigo-500" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-80">
              {chartData.length >= 2 ? (
                <div className="w-full h-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#6b7280' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value}%`, 'Score']}
                        labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                        activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <TrendingUp className="size-12 mx-auto mb-3 opacity-30 text-indigo-500" />
                  <p className="text-sm font-medium text-gray-700">Not enough data for trends</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                    Complete at least two tests to see your performance progress over time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
