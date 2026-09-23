'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Package,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Clock,
  Tag,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { SecureVideoPlayer } from '@/components/shared/secure-video-player'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'

interface ProductDetail {
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
  updatedAt: string
  purchased: boolean
  purchaseDate: string | null
  accessUrl: string | null
  expiresAt: string | null
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

export default function StudentProductDetail() {
  const { setStudentPage, selectedCourseId, openCheckout, requireAuth } = useAppStore()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState(false)

  const load = async () => {
    if (!selectedCourseId) {
      setError('No product selected')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // The API endpoint should handle public product details even if the user isn't logged in.
      // Make sure the API allows public access for viewing product info.
      const res = await apiFetchJSON<{ success: boolean; product: ProductDetail }>(
        `/api/student/digital-products/${selectedCourseId}`
      )
      if (res.success) {
        setProduct(res.product)
      } else {
        setError('Product not found')
      }
    } catch (err) {
      console.error('Product detail load error:', err)
      setError('Failed to load product details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedCourseId])

  const handleBuyNow = () => {
    if (!requireAuth()) return
    if (!product) return
    openCheckout({
      id: product.id,
      type: 'digital_product',
      title: product.title,
      price: product.price,
      mrp: product.mrp,
      thumbnail: product.thumbnail,
    })
  }

  const handleDownload = () => {
    if (!product?.accessUrl) {
      toast.error('No access available for this product')
      return
    }
    
    // If it's a video or PDF, we can view it securely
    if (['video'].includes(product.type) || product.accessUrl.endsWith('.mp4') || 
        ['ebook', 'notes'].includes(product.type) || product.accessUrl.endsWith('.pdf')) {
      setIsViewing(true)
      return
    }

    // Fallback for other files
    window.open(product.accessUrl, '_blank')
    toast.success('Download started!')
  }

  const handleBack = () => {
    if (isViewing) {
      setIsViewing(false)
      return
    }
    setStudentPage('store')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2" onClick={handleBack}>
          <ArrowLeft className="size-4" /> Back to Store
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Product Not Found</h2>
          <p className="text-gray-500 text-sm mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={load}>
              <RotateCcw className="size-4" /> Try Again
            </Button>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleBack}>
              <ArrowLeft className="size-4" /> Back to Store
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const IconComp = typeIcons[product.type] || Package
  const gradient = typeGradients[product.type] || typeGradients.other
  const badgeColor = typeBadgeColors[product.type] || typeBadgeColors.other
  const typeLabel = typeLabels[product.type] || 'Product'
  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  if (isViewing && product.accessUrl) {
    const isVideo = ['video'].includes(product.type) || product.accessUrl.endsWith('.mp4')
    const isPdf = ['ebook', 'notes'].includes(product.type) || product.accessUrl.endsWith('.pdf')
    
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900" onClick={handleBack}>
          <ArrowLeft className="size-4" /> Back to Product Detail
        </Button>
        <Card className="border-gray-100 rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {isVideo ? (
              <SecureVideoPlayer url={product.accessUrl} title={product.title} />
            ) : isPdf ? (
              <SecurePdfViewer url={product.accessUrl} title={product.title} />
            ) : (
              <div className="p-16 text-center text-gray-500">File format not supported for secure viewing.</div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900" onClick={handleBack}>
          <ArrowLeft className="size-4" /> Back to Store
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Product Thumbnail */}
          <div className={`relative rounded-xl overflow-hidden h-48 sm:h-64 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {product.thumbnail ? (
              <MediaImage src={product.thumbnail} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-black/5" />
                <IconComp className="size-20 text-white/80" />
              </>
            )}
            {product.featured && (
              <Badge className="absolute top-4 left-4 bg-amber-500 text-white text-sm font-semibold">
                <Sparkles className="size-3.5 mr-1" />
                Featured
              </Badge>
            )}
            {product.purchased && (
              <Badge className="absolute top-4 right-4 bg-emerald-500 text-white text-sm font-semibold">
                <CheckCircle2 className="size-3.5 mr-1" />
                Purchased
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={`text-xs font-medium ${badgeColor}`}>
                  {typeLabel}
                </Badge>
                {product.category && (
                  <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600">
                    {product.category}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.title}</h1>
            </div>

            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Clock className="size-4" />
                <span>Published {new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              {product.purchased && product.purchaseDate && (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                  <span>Purchased {new Date(product.purchaseDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sidebar - Purchase Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="sticky top-20 border-gray-100 rounded-xl">
            <CardContent className="p-5 space-y-5">
              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  {product.price > 0 ? (
                    <>
                      <span className="text-3xl font-bold text-gray-900">&#8377;{product.price}</span>
                      {product.mrp > product.price && (
                        <>
                          <span className="text-lg text-gray-400 line-through">&#8377;{product.mrp}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            <Tag className="size-3 mr-1" />
                            {discountPercent}% off
                          </Badge>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-emerald-600">Free</span>
                  )}
                </div>
                {product.mrp > product.price && (
                  <p className="text-xs text-gray-400">
                    You save &#8377;{(product.mrp - product.price).toFixed(0)} on this purchase
                  </p>
                )}
              </div>

              <Separator />

              {/* Action Button */}
              {product.purchased ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span className="font-medium">You already own this product</span>
                  </div>
                  <Button
                    className="w-full font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleDownload}
                    disabled={!product.accessUrl}
                  >
                    <Download className="size-4 mr-2" />
                    {product.accessUrl ? 'Download / Access' : 'Access Not Available'}
                  </Button>
                  {product.expiresAt && (
                    <p className="text-xs text-gray-500 text-center">
                      Access expires {new Date(product.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : product.price > 0 ? (
                <Button
                  className="w-full font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white h-12 text-base"
                  onClick={handleBuyNow}
                >
                  Buy Now — &#8377;{product.price}
                </Button>
              ) : (
                <Button
                  className="w-full font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white h-12 text-base"
                  onClick={handleDownload}
                >
                  <Download className="size-4 mr-2" />
                  Get Free Access
                </Button>
              )}

              {/* Trust Badges */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Secure payment via Razorpay</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
