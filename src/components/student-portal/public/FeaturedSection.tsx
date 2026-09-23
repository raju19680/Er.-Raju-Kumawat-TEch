'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, User, ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData, BLUE, BLUE_BORDER, BLUE_LIGHT, cardGradients, tags } from './types'

// ─── Featured Test Series ───────────────────────────────────────────────────
function FeaturedSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout } = useAppStore()
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
              <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg py-0">
                <div className={`relative h-36 sm:h-40 bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} flex items-center justify-center`}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
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
                    onClick={() => !isAuthenticated ? onLoginClick() : openCheckout({ id: item.id, type: 'test_series', title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail })}>Buy Now</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { FeaturedSection }
