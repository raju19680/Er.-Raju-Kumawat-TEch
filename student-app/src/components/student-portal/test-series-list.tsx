'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BookOpen,
  CheckCircle2,
  Lock,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Award,
  PlayCircle
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface TestSeriesItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  isCombo: boolean
  status: string
  testCount: number
  liveTestCount: number
  purchased: boolean
}

const tsGradients = [
  'from-blue-600 to-indigo-500',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-violet-600 to-fuchsia-500',
  'from-rose-500 to-pink-500',
]

function EmptyStateSvg() {
  return (
    <svg className="w-48 h-48 mx-auto mb-6 opacity-80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="url(#paint0_linear)" fillOpacity="0.1" />
      <path d="M130 70H70C64.4772 70 60 74.4772 60 80V140C60 145.523 64.4772 150 70 150H130C135.523 150 140 145.523 140 140V80C140 74.4772 135.523 70 130 70Z" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 100H140" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M85 150V70" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="72.5" cy="85" r="4.5" fill="#9CA3AF" />
      <circle cx="72.5" cy="115" r="4.5" fill="#9CA3AF" />
      <circle cx="72.5" cy="135" r="4.5" fill="#9CA3AF" />
      <defs>
        <linearGradient id="paint0_linear" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6B7280" />
          <stop offset="1" stopColor="#9CA3AF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TestSeriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-2xl overflow-hidden border-0 shadow-sm bg-white/50 backdrop-blur-sm">
          <Skeleton className="h-44 w-full rounded-none" />
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-1.5 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="pt-2 flex justify-between items-end">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function TestSeriesList() {
  const { setStudentPage, setSelectedTestSeriesId, openCheckout } = useAppStore()
  const [testSeries, setTestSeries] = useState<TestSeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; message?: string; testSeries?: TestSeriesItem[], unauthenticated?: boolean }>('/api/student/test-series')
      if (res && res.unauthenticated) {
        useAppStore.getState().logout()
        return
      }
      if (res && res.success && res.testSeries) {
        setTestSeries(res.testSeries)
      } else if (res && !res.success && res.message) {
        throw new Error(res.message)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      console.error('Test series load error:', err)
      setError(err.message || 'We could not load your test series at this moment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(testSeries.map(ts => ts.category).filter(Boolean) as string[])
    return ['All', ...Array.from(cats)]
  }, [testSeries])

  const filtered = useMemo(() => {
    return testSeries.filter((ts) => {
      const matchesSearch = ts.title.toLowerCase().includes(search.toLowerCase()) ||
        (ts.description || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || ts.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [testSeries, search, categoryFilter])

  const stats = useMemo(() => {
    const totalSeries = testSeries.length
    const totalTests = testSeries.reduce((acc, ts) => acc + ts.testCount, 0)
    const totalLive = testSeries.reduce((acc, ts) => acc + ts.liveTestCount, 0)
    const purchased = testSeries.filter(ts => ts.purchased).length
    return { totalSeries, totalTests, totalLive, purchased }
  }, [testSeries])

  const handleViewTests = (id: string) => {
    setSelectedTestSeriesId(id)
    setStudentPage('test-series-detail')
  }

  const handleBuyNow = (item: TestSeriesItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!useAppStore.getState().requireAuth()) return;
    openCheckout({
      id: item.id,
      type: 'test_series',
      title: item.title,
      price: item.price,
      mrp: item.mrp,
      thumbnail: item.thumbnail,
    })
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12 max-w-7xl mx-auto">
        <div className="h-48 rounded-3xl bg-gray-100 animate-pulse" />
        <TestSeriesSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
          <AlertCircle className="w-11 h-11" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
        <Button size="lg" className="gap-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800" onClick={load}>
          <RotateCcw className="w-5 h-5" /> Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Award className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative p-8 md:p-12">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4 backdrop-blur-md">
            Premium Learning
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            My Test Series
          </h1>
          <p className="text-white/90 font-medium max-w-2xl text-lg mb-8 leading-relaxed">
            Elevate your preparation with our expertly curated test series. Track your progress, identify weak areas, and ace your exams.
          </p>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-black/20 p-6 rounded-2xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalSeries}</p>
                <p className="text-sm text-white/80 font-medium">Total Series</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <PlayCircle className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTests}</p>
                <p className="text-sm text-white/80 font-medium">Tests Available</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.purchased}</p>
                <p className="text-sm text-white/80 font-medium">Enrolled</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-violet-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalLive}</p>
                <p className="text-sm text-white/80 font-medium">Live Now</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10 bg-gray-50/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search for test series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-white border-gray-200 text-base focus-visible:ring-blue-500 w-full shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar mask-fade-edges">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              className={`rounded-xl h-12 px-6 font-medium whitespace-nowrap transition-all duration-300 ${
                categoryFilter === cat 
                  ? 'bg-gray-900 text-white shadow-md hover:bg-gray-800' 
                  : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm"
          >
            <EmptyStateSvg />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No test series found</h3>
            <p className="text-gray-500 max-w-sm text-center">
              We couldn't find any test series matching your criteria. Try adjusting your filters or search term.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-xl h-12 px-8"
              onClick={() => { setSearch(''); setCategoryFilter('All'); }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.05 } }
            }}
          >
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card 
                  className="group h-full flex flex-col cursor-pointer border-0 rounded-2xl overflow-hidden bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 ring-1 ring-gray-100 hover:ring-gray-200"
                  onClick={() => handleViewTests(item.id)}
                >
                  {/* Image/Gradient Area */}
                  <div className={`relative h-48 w-full bg-gradient-to-br ${tsGradients[idx % tsGradients.length]} overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent duration-500" />
                    {item.thumbnail ? (
                      <MediaImage src={item.thumbnail} alt={item.title} className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <BarChart3 className="w-24 h-24 text-white group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {item.category && (
                        <Badge className="bg-white/90 text-gray-900 hover:bg-white border-0 shadow-sm font-semibold backdrop-blur-sm">
                          {item.category}
                        </Badge>
                      )}
                      {item.isCombo && (
                        <Badge className="bg-amber-500 text-white border-0 shadow-sm font-semibold">
                          Combo
                        </Badge>
                      )}
                    </div>
                    {item.purchased && (
                      <Badge className="absolute top-4 right-4 bg-emerald-500 text-white border-0 shadow-sm font-semibold pl-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Purchased
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Meta Chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                          <BookOpen className="w-3.5 h-3.5" /> {item.testCount} Tests
                        </div>
                        {item.liveTestCount > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {item.liveTestCount} Live
                          </div>
                        )}
                      </div>

                      {/* Progress Simulation (using live/total) */}
                      {item.testCount > 0 && (
                        <div className="mb-6 space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>Availability</span>
                            <span>{Math.round((item.liveTestCount / item.testCount) * 100)}%</span>
                          </div>
                          <Progress value={(item.liveTestCount / item.testCount) * 100} className="h-1.5 bg-gray-100" />
                        </div>
                      )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        {item.price > 0 ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-gray-900">&#8377;{item.price}</span>
                              {item.mrp > item.price && (
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                </span>
                              )}
                            </div>
                            {item.mrp > item.price && (
                              <span className="text-sm text-gray-400 line-through">&#8377;{item.mrp}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xl font-bold text-emerald-600">Free</span>
                        )}
                      </div>
                      
                      {item.purchased ? (
                        <Button className="rounded-xl bg-gray-900 text-white hover:bg-gray-800 shadow-sm transition-transform active:scale-95 group-hover:bg-blue-600">
                          View Tests <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => handleBuyNow(item, e)}
                          className={`rounded-xl shadow-sm transition-transform active:scale-95 px-6 ${
                            item.price > 0 
                              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                        >
                          {item.price > 0 ? (
                            <>Buy Now <Lock className="w-3.5 h-3.5 ml-1.5 opacity-70" /></>
                          ) : (
                            <>Enroll <ArrowRight className="w-4 h-4 ml-1.5" /></>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
