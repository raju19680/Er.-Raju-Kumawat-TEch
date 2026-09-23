'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MediaImage } from '@/components/ui/media-image'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DigitalProductItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  file: string | null
  type: string
  category: string | null
  price: number
  mrp: number
  status: string
  featured: boolean
  createdAt: string
  purchased: boolean
}

const typeGradients: Record<string, string> = {
  ebook: 'from-amber-500 to-orange-400',
  notes: 'from-emerald-500 to-teal-400',
  other: 'from-violet-500 to-purple-400',
}

const typeIcons: Record<string, React.ElementType> = {
  ebook: BookOpen,
  notes: FileText,
  other: Package,
}

const typeLabels: Record<string, string> = {
  ebook: 'E-Book',
  notes: 'Notes',
  other: 'Other',
}

const typeBadgeColors: Record<string, string> = {
  ebook: 'bg-amber-50 text-amber-700',
  notes: 'bg-emerald-50 text-emerald-700',
  other: 'bg-violet-50 text-violet-700',
}

function ProductSkeleton() {
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

export default function StudentStore() {
  const { setStudentPage, setSelectedTestSeriesId: _setSelectedTestSeriesId, openCheckout } = useAppStore()
  const [products, setProducts] = useState<DigitalProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== 'all') {
        params.set('type', typeFilter)
      }
      if (search.trim()) {
        params.set('search', search.trim())
      }
      const queryString = params.toString()
      const url = `/api/student/digital-products${queryString ? `?${queryString}` : ''}`
      const res = await apiFetchJSON<{ success: boolean; products: DigitalProductItem[] }>(url)
      if (res.success) {
        setProducts(res.products)
      }
    } catch (err) {
      console.error('Digital products load error:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [typeFilter])

  const handleViewDetail = (id: string) => {
    // Store the selected product ID for the detail page
    useAppStore.getState().setSelectedCourseId(id) // reuse selectedCourseId for product ID
    setStudentPage('store-product-detail')
  }

  const handleBuyNow = (item: DigitalProductItem) => {
    openCheckout({
      id: item.id,
      type: 'digital_product',
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
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 text-sm mt-1">Browse E-Books, Notes, and digital products</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
        <ProductSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 text-sm mt-1">Browse E-Books, Notes, and digital products</p>
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
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 text-amber-600">
          <ShoppingBag className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-500 text-sm mt-0.5">Browse E-Books, Notes, and digital products</p>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }}
            className="pl-9"
          />
        </div>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="ebook" className="text-xs sm:text-sm">E-Books</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
            <TabsTrigger value="other" className="text-xs sm:text-sm">Other</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="size-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map((item, idx) => {
            const IconComp = typeIcons[item.type] || Package
            const gradient = typeGradients[item.type] || typeGradients.other
            const badgeColor = typeBadgeColors[item.type] || typeBadgeColors.other
            const typeLabel = typeLabels[item.type] || 'Product'

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200 py-0">
                  {/* Thumbnail */}
                  <div
                    className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}
                  >
                    {item.thumbnail ? (
                      <MediaImage src={item.thumbnail} alt={item.title} className="absolute inset-0 w-full h-full object-contain bg-white" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-black/5" />
                        <IconComp className="size-12 text-white/80" />
                      </>
                    )}
                    {item.purchased && (
                      <Badge className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold">
                        <CheckCircle2 className="size-3 mr-1" />
                        Purchased
                      </Badge>
                    )}
                    {item.featured && !item.purchased && (
                      <Badge className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold">
                        <Sparkles className="size-3 mr-1" />
                        Featured
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
                      <Badge variant="secondary" className={`text-xs font-medium ${badgeColor}`}>
                        {typeLabel}
                      </Badge>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600">
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
                        className="w-full font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => handleViewDetail(item.id)}
                      >
                        Access Now
                        <ArrowRight className="size-4 ml-1" />
                      </Button>
                    ) : item.price > 0 ? (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 font-semibold rounded-lg"
                          variant="outline"
                          onClick={() => handleViewDetail(item.id)}
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
                        onClick={() => handleViewDetail(item.id)}
                      >
                        View Details
                        <ArrowRight className="size-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
