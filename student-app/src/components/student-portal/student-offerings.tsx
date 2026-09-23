'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Search, BookOpen, ClipboardList, Star, Clock,
  CheckCircle2, Tag, Loader2, ShoppingCart, AlertCircle,
  ArrowRight, Sparkles, X, ChevronDown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { toast } from 'sonner'

interface IncludedItem { id: string; title: string }
interface Offering {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  validityMode: string
  validityDays: number | null
  endDate: string | null
  featuredBulletsList: string[]
  courses: IncludedItem[]
  testSeriesItems: IncludedItem[]
  purchased?: boolean
}

function ValidityText({ mode, days, endDate }: { mode: string; days: number | null; endDate: string | null }) {
  if (mode === 'lifetime') return <span>♾ Lifetime Access</span>
  if (mode === 'days' && days) return <span>⏱ {days}-Day Access</span>
  if (mode === 'end_date' && endDate) return <span>📅 Access until {new Date(endDate).toLocaleDateString('en-IN')}</span>
  return <span>Lifetime Access</span>
}

function OfferingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden rounded-2xl">
          <Skeleton className="h-44 w-full" />
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function StudentOfferings() {
  const { openCheckout } = useAppStore()
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Offering | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{ discount: number; type: string; message: string } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const fetchOfferings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetchJSON<{ success: boolean; offerings: Offering[] }>(
        '/api/student/offerings'
      )
      if (data?.success) setOfferings(data.offerings || [])
    } catch {
      toast.error('Failed to load offerings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOfferings() }, [fetchOfferings])

  const filtered = offerings.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase())
  )

  const discount = (o: Offering) =>
    o.mrp > 0 ? Math.round(((o.mrp - o.price) / o.mrp) * 100) : 0

  const validateCoupon = async () => {
    if (!selected || !couponCode.trim()) return
    setCouponLoading(true)
    setCouponResult(null)
    try {
      const data = await apiFetchJSON<{
        success: boolean; valid: boolean;
        discount?: number; discountType?: string; message?: string
      }>('/api/student/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), offeringId: selected.id }),
      })
      if (data?.success && data.valid) {
        setCouponResult({
          discount: data.discount || 0,
          type: data.discountType || 'percentage',
          message: data.message || 'Coupon applied!',
        })
        toast.success(data.message || 'Coupon applied!')
      } else {
        toast.error(data?.message || 'Invalid coupon code')
      }
    } catch {
      toast.error('Could not validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const finalPrice = (o: Offering) => {
    if (!couponResult) return o.price
    if (couponResult.type === 'percentage') return Math.max(0, o.price - (o.price * couponResult.discount / 100))
    return Math.max(0, o.price - couponResult.discount)
  }

  const handleBuy = (o: Offering) => {
    const price = finalPrice(o)
    openCheckout({
      id: o.id,
      type: 'offering' as any,
      title: o.title,
      price,
      mrp: o.mrp,
      thumbnail: o.thumbnail,
    })
    setSelected(null)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="size-6 text-amber-600" />
          Bundles & Offerings
        </h1>
        <p className="text-sm text-gray-500">Premium combo packs with courses and test series</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Search offerings..."
          className="pl-9 bg-white rounded-xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <OfferingSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Layers className="size-8 text-amber-500" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">No offerings available</h3>
          <p className="text-sm text-gray-500">
            {search ? 'Try a different search term' : 'Check back soon for new bundles!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((o, idx) => {
            const pct = discount(o)
            const isFree = o.price === 0
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className="group overflow-hidden rounded-2xl flex flex-col hover:shadow-lg transition-shadow border-gray-100">
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-300 overflow-hidden">
                    {o.thumbnail ? (
                      <MediaImage src={o.thumbnail} alt={o.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Sparkles className="size-10 text-white/60" />
                        <Layers className="size-14 text-white/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {pct > 0 && (
                        <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {pct}% OFF
                        </span>
                      )}
                      {isFree && (
                        <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">FREE</span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3">
                      <div className="flex gap-2">
                        {o.courses.length > 0 && (
                          <span className="text-xs font-semibold text-white bg-white/20 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1">
                            <BookOpen className="size-2.5" />
                            {o.courses.length} Course{o.courses.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {o.testSeriesItems.length > 0 && (
                          <span className="text-xs font-semibold text-white bg-white/20 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ClipboardList className="size-2.5" />
                            {o.testSeriesItems.length} Test Series
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="flex-1 flex flex-col p-4 gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{o.title}</h3>
                      {o.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{o.description}</p>
                      )}
                    </div>

                    {/* Bullets */}
                    {o.featuredBulletsList.length > 0 && (
                      <ul className="space-y-1">
                        {o.featuredBulletsList.slice(0, 4).map((b, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <CheckCircle2 className="size-3 text-green-500 mt-0.5 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Validity */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="size-3.5" />
                      <ValidityText mode={o.validityMode} days={o.validityDays} endDate={o.endDate} />
                    </div>

                    {/* Pricing */}
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        {isFree ? (
                          <span className="text-xl font-bold text-green-600">Free</span>
                        ) : (
                          <div>
                            <span className="text-xl font-bold text-gray-900">₹{o.price.toLocaleString('en-IN')}</span>
                            {o.mrp > o.price && (
                              <span className="ml-2 text-sm text-gray-400 line-through">₹{o.mrp.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {o.purchased ? (
                      <Button variant="outline" className="w-full rounded-xl border-green-200 text-green-700 bg-green-50" disabled>
                        <CheckCircle2 className="size-4 mr-2" />
                        Enrolled
                      </Button>
                    ) : (
                      <Button
                        className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        onClick={() => setSelected(o)}
                      >
                        <ShoppingCart className="size-4" />
                        {isFree ? 'Get Free Access' : 'Buy Now'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail / Purchase Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setCouponResult(null); setCouponCode('') } }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Hero */}
              <div className="relative h-40 bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-300">
                {selected.thumbnail && (
                  <MediaImage src={selected.thumbnail} alt={selected.title} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => { setSelected(null); setCouponResult(null); setCouponCode('') }}
                  className="absolute top-3 right-3 size-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <X className="size-4" />
                </button>
                <div className="absolute bottom-3 left-4">
                  <div className="flex gap-1.5">
                    {discount(selected) > 0 && (
                      <Badge className="bg-red-500 text-white border-0 text-xs">{discount(selected)}% OFF</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                  {selected.description && <p className="text-sm text-gray-600 mt-1">{selected.description}</p>}
                </div>

                {/* Included Content */}
                {(selected.courses.length > 0 || selected.testSeriesItems.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What's Included</p>
                    <div className="space-y-1.5">
                      {selected.courses.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2">
                          <BookOpen className="size-4 text-blue-600 shrink-0" />
                          {c.title}
                        </div>
                      ))}
                      {selected.testSeriesItems.map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 rounded-lg px-3 py-2">
                          <ClipboardList className="size-4 text-purple-600 shrink-0" />
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {selected.featuredBulletsList.length > 0 && (
                  <ul className="space-y-1.5">
                    {selected.featuredBulletsList.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Coupon Code */}
                {!selected.purchased && selected.price > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Tag className="size-3.5" />
                      Have a coupon?
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                        className="flex-1 rounded-xl text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="rounded-xl"
                      >
                        {couponLoading ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                    {couponResult && (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        <CheckCircle2 className="size-4" />
                        {couponResult.message} — You save{' '}
                        {couponResult.type === 'percentage'
                          ? `${couponResult.discount}%`
                          : `₹${couponResult.discount}`}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {selected.price > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Original Price</span>
                        <span>₹{selected.price.toLocaleString('en-IN')}</span>
                      </div>
                      {couponResult && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon Discount</span>
                          <span>
                            -{couponResult.type === 'percentage'
                              ? `${couponResult.discount}%`
                              : `₹${couponResult.discount}`}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                        <span>Total</span>
                        <span>₹{Math.round(finalPrice(selected)).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  {selected.price === 0 && (
                    <p className="text-center font-bold text-green-600">This offering is FREE!</p>
                  )}
                </div>

                {/* CTA */}
                <Button
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white h-12 text-base font-semibold gap-2"
                  onClick={() => handleBuy(selected)}
                >
                  <ShoppingCart className="size-5" />
                  {selected.price === 0 ? 'Get Free Access' : `Pay ₹${Math.round(finalPrice(selected)).toLocaleString('en-IN')}`}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
