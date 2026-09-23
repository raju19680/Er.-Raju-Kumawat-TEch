'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Search,
  BookOpen,
  FileText,
  Package,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ClipboardList,
  GraduationCap,
  Download,
  PlayCircle,
  Tag,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface UnifiedStoreItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  itemType: 'course' | 'test_series' | 'digital_product'
  subType?: string // 'ebook' | 'notes' | 'combo' etc.
  purchased: boolean
  featured?: boolean
  extraInfo?: string
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-xl overflow-hidden py-0 border border-gray-100">
          <Skeleton className="h-40 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function StudentStore() {
  const {
    setStudentPage,
    setSelectedCourseId,
    setSelectedTestSeriesId,
    openCheckout,
  } = useAppStore()

  const [items, setItems] = useState<UnifiedStoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'test_series' | 'notes'>('all')

  const loadStoreData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [coursesRes, testSeriesRes, digitalRes] = await Promise.all([
        apiFetchJSON<{ success: boolean; allCourses?: any[]; courses?: any[] }>('/api/student/courses'),
        apiFetchJSON<{ success: boolean; testSeries: any[] }>('/api/student/test-series'),
        apiFetchJSON<{ success: boolean; products: any[] }>('/api/student/digital-products'),
      ])

      const unified: UnifiedStoreItem[] = []

      // 1. Process Courses
      if (coursesRes.success) {
        const list = coursesRes.allCourses || []
        list.forEach((c: any) => {
          unified.push({
            id: c.id,
            title: c.title,
            description: c.description,
            thumbnail: c.thumbnail,
            price: c.price || 0,
            mrp: c.mrp || 0,
            category: c.category,
            itemType: 'course',
            subType: c.level || 'Course',
            purchased: !!c.isPurchased,
            featured: !!c.featured,
            extraInfo: `${c.totalLessons || 0} Lessons • ${c.language || 'Hindi'}`,
          })
        })
      }

      // 2. Process Test Series
      if (testSeriesRes.success) {
        testSeriesRes.testSeries.forEach((ts: any) => {
          unified.push({
            id: ts.id,
            title: ts.title,
            description: ts.description,
            thumbnail: ts.thumbnail,
            price: ts.price || 0,
            mrp: ts.mrp || 0,
            category: ts.category,
            itemType: 'test_series',
            subType: ts.isCombo ? 'Combo Package' : 'Test Series',
            purchased: !!ts.purchased,
            featured: false,
            extraInfo: `${ts.testCount || 0} Tests available`,
          })
        })
      }

      // 3. Process Digital Products (Notes / Ebooks)
      if (digitalRes.success) {
        digitalRes.products.forEach((dp: any) => {
          unified.push({
            id: dp.id,
            title: dp.title,
            description: dp.description,
            thumbnail: dp.thumbnail,
            price: dp.price || 0,
            mrp: dp.mrp || 0,
            category: dp.category,
            itemType: 'digital_product',
            subType: dp.type === 'ebook' ? 'E-Book' : 'Study Notes',
            purchased: !!dp.purchased,
            featured: !!dp.featured,
            extraInfo: dp.type ? dp.type.toUpperCase() : 'Digital PDF',
          })
        })
      }

      setItems(unified)
    } catch (err) {
      console.error('Unified store load error:', err)
      setError('Failed to load store catalog. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStoreData()
  }, [])

  const handleBuyNow = (item: UnifiedStoreItem) => {
    openCheckout({
      id: item.id,
      type: item.itemType,
      title: item.title,
      price: item.price,
      mrp: item.mrp,
      thumbnail: item.thumbnail,
    })
  }

  const handleAccessNow = (item: UnifiedStoreItem) => {
    if (item.itemType === 'course') {
      setSelectedCourseId(item.id)
      setStudentPage('course-detail')
    } else if (item.itemType === 'test_series') {
      setSelectedTestSeriesId(item.id)
      setStudentPage('test-series-detail')
    } else {
      setStudentPage('my-library')
    }
  }

  const filteredItems = items.filter((item) => {
    // Tab filter
    if (activeTab === 'courses' && item.itemType !== 'course') return false
    if (activeTab === 'test_series' && item.itemType !== 'test_series') return false
    if (activeTab === 'notes' && item.itemType !== 'digital_product') return false

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(q)
      const descMatch = item.description?.toLowerCase().includes(q)
      const catMatch = item.category?.toLowerCase().includes(q)
      return titleMatch || descMatch || catMatch
    }
    return true
  })

  const getItemTypeBadge = (item: UnifiedStoreItem) => {
    switch (item.itemType) {
      case 'course':
        return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-none font-medium text-xs">Course</Badge>
      case 'test_series':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-medium text-xs">Test Series</Badge>
      case 'digital_product':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium text-xs">Notes & E-Book</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store & Study Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Explore and enroll in premium courses, test series, and study materials</p>
        </div>
        <ProductSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store & Study Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Explore and enroll in premium courses, test series, and study materials</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load Store</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={loadStoreData}>
            <RotateCcw className="size-4" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="size-3.5 text-amber-200" />
            <span>Complete Learning Store</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Explore Courses, Test Series & Notes
          </h1>
          <p className="mt-2 text-amber-100 text-sm sm:text-base leading-relaxed">
            Upgrade your preparation with verified courses, comprehensive practice mock tests, and handwritten notes.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <ShoppingBag className="size-64 text-white" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-auto bg-gray-100/80 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm font-medium">All ({items.length})</TabsTrigger>
            <TabsTrigger value="courses" className="text-xs sm:text-sm font-medium">Courses</TabsTrigger>
            <TabsTrigger value="test_series" className="text-xs sm:text-sm font-medium">Test Series</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm font-medium">Notes</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search by title, subject, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white shadow-sm border-gray-200 rounded-xl"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="size-12 mx-auto mb-3 text-gray-300" />
          <p className="text-base font-semibold text-gray-700">No products found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => {
              const discount = item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0
              return (
                <motion.div
                  key={`${item.itemType}-${item.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                  className="flex"
                >
                  <Card className="flex flex-col w-full rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-xl hover:border-gray-200 transition-all duration-300 group py-0">
                    {/* Thumbnail */}
                    <div className="relative h-44 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden shrink-0">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                          {item.itemType === 'course' && <GraduationCap className="size-10 text-violet-400" />}
                          {item.itemType === 'test_series' && <ClipboardList className="size-10 text-amber-400" />}
                          {item.itemType === 'digital_product' && <FileText className="size-10 text-emerald-400" />}
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.subType}</span>
                        </div>
                      )}

                      {/* Badges Top Left & Right */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {getItemTypeBadge(item)}
                        {item.category && (
                          <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md border-none text-xs font-normal">
                            {item.category}
                          </Badge>
                        )}
                      </div>

                      {discount > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm">
                            {discount}% OFF
                          </span>
                        </div>
                      )}

                      {item.purchased && (
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-sm">
                            <CheckCircle2 className="size-3.5" /> Enrolled / Purchased
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="flex flex-col flex-1 p-5 justify-between space-y-4">
                      <div>
                        {item.extraInfo && (
                          <p className="text-xs font-medium text-amber-600 mb-1.5">
                            {item.extraInfo}
                          </p>
                        )}
                        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {item.description.replace(/<[^>]*>?/gm, '')}
                          </p>
                        )}
                      </div>

                      {/* Pricing & CTA */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          {item.price === 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="text-base font-extrabold text-emerald-600">FREE</span>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-extrabold text-gray-900">₹{item.price}</span>
                              {item.mrp > item.price && (
                                <span className="text-xs text-gray-400 line-through">₹{item.mrp}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          {item.purchased ? (
                            <Button
                              size="sm"
                              onClick={() => handleAccessNow(item)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow-sm"
                            >
                              <PlayCircle className="size-3.5" /> Access Now
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleBuyNow(item)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow-sm"
                            >
                              <Zap className="size-3.5" /> {item.price === 0 ? 'Enroll Free' : 'Buy Now'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
