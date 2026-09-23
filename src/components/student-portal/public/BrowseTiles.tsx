'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, BookOpen, Clock, FileText, ClipboardList, Link2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './types'

// ─── Browse Tiles ────────────────────────────────────────────────────────────
function BrowseTiles({ data, onNavigate }: { data: PortalData; onNavigate: (p: PortalPage) => void }) {
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
              <Card className="border border-gray-100 rounded-xl overflow-hidden transition-shadow hover:shadow-lg py-0">
                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} text-white shrink-0`}>
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

export { BrowseTiles }
