'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Trophy, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData, BLUE, BLUE_BORDER, BLUE_LIGHT, cardGradients, tags } from './types'

// ─── Courses Section ─────────────────────────────────────────────────────────
function CoursesSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout } = useAppStore()
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
              <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg py-0">
                <div className="relative h-40 flex items-center justify-center" style={{ backgroundColor: BLUE_LIGHT }}>
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
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
                  <Button variant="outline" className="w-full font-semibold rounded-lg"
                    style={{ borderColor: BLUE_BORDER, color: BLUE }}
                    onClick={() => !isAuthenticated ? onLoginClick() : openCheckout({ id: course.id, type: 'course', title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail })}>Enroll Now</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { CoursesSection }
