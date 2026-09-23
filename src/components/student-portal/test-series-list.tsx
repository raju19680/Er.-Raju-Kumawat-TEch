'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  BookOpen,
  CheckCircle2,
  Lock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

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
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-purple-400',
  'from-rose-500 to-pink-400',
]

function TestSeriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-xl overflow-hidden py-0">
          <Skeleton className="h-36 w-full" />
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

export default function TestSeriesList() {
  const { setStudentPage, setSelectedTestSeriesId, openCheckout } = useAppStore()
  const [testSeries, setTestSeries] = useState<TestSeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; testSeries: TestSeriesItem[] }>('/api/student/test-series')
      if (res.success) {
        setTestSeries(res.testSeries)
      }
    } catch (err) {
      console.error('Test series load error:', err)
      setError('Failed to load test series. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categories = ['all', ...Array.from(new Set(testSeries.map(ts => ts.category).filter(Boolean))) as string[]]

  const filtered = testSeries.filter((ts) => {
    const matchesSearch = ts.title.toLowerCase().includes(search.toLowerCase()) ||
      (ts.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || ts.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleViewTests = (id: string) => {
    setSelectedTestSeriesId(id)
    setStudentPage('test-series-detail')
  }

  const handleBuyNow = (item: TestSeriesItem) => {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>
          <p className="text-gray-500 text-sm mt-1">Browse and attempt available test series</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
        <TestSeriesSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>
          <p className="text-gray-500 text-sm mt-1">Browse and attempt available test series</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={load}>
            <RotateCcw className="size-4" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Series</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and attempt available test series</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search test series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              className={categoryFilter === cat ? 'bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap' : 'whitespace-nowrap'}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Test Series Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="size-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No test series found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200 py-0">
                {/* Thumbnail */}
                <div
                  className={`relative h-36 bg-gradient-to-br ${tsGradients[idx % tsGradients.length]} flex items-center justify-center`}
                >
                  <div className="absolute inset-0 bg-black/5" />
                  <ClipboardList className="size-12 text-white/80" />
                  {item.purchased && (
                    <Badge className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold">
                      <CheckCircle2 className="size-3 mr-1" />
                      Purchased
                    </Badge>
                  )}
                  {item.isCombo && (
                    <Badge className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold">
                      Combo
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-gray-500 text-xs line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600">
                      {item.testCount} Test{item.testCount !== 1 ? 's' : ''}
                    </Badge>
                    {item.liveTestCount > 0 && (
                      <Badge variant="secondary" className="text-xs font-medium bg-emerald-50 text-emerald-600">
                        {item.liveTestCount} Live
                      </Badge>
                    )}
                    {item.category && (
                      <Badge variant="secondary" className="text-xs font-medium bg-amber-50 text-amber-700">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    {item.price > 0 ? (
                      <>
                        <span className="text-lg font-bold text-gray-900">&#8377;{item.price}</span>
                        {item.mrp > item.price && (
                          <>
                            <span className="text-sm text-gray-400 line-through">&#8377;{item.mrp}</span>
                            <span className="text-xs font-semibold text-emerald-600 ml-1">
                              {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-lg font-bold text-emerald-600">Free</span>
                    )}
                  </div>
                  {item.purchased ? (
                    <Button
                      className="w-full font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700"
                      onClick={() => handleViewTests(item.id)}
                    >
                      View Tests
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  ) : item.price > 0 ? (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 font-semibold rounded-lg"
                        variant="outline"
                        onClick={() => handleViewTests(item.id)}
                      >
                        Details
                      </Button>
                      <Button
                        className="flex-1 font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700"
                        onClick={() => handleBuyNow(item)}
                      >
                        Buy Now
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700"
                      onClick={() => handleViewTests(item.id)}
                    >
                      View Details
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
