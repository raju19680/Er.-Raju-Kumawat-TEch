'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Calendar,
  Sparkles,
  Search,
  RotateCcw,
  AlertCircle,
  Megaphone,
} from 'lucide-react'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface Announcement {
  id: string
  title: string
  message: string
  type: string // info, warning, success, maintenance
  isActive: boolean
  startsAt: string
  expiresAt: string | null
  createdByName?: string | null
  createdAt: string
}

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const loadAnnouncements = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; announcements: Announcement[] }>(
        '/api/student/announcements'
      )
      if (res.success) {
        setAnnouncements(res.announcements)
      }
    } catch (err) {
      console.error('Announcements load error:', err)
      setError('Failed to load notices. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const getTypeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return {
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          border: 'border-l-4 border-l-amber-500',
        }
      case 'success':
        return {
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          border: 'border-l-4 border-l-emerald-500',
        }
      case 'maintenance':
        return {
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: Wrench,
          iconColor: 'text-rose-600',
          border: 'border-l-4 border-l-rose-500',
        }
      case 'info':
      default:
        return {
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600',
          border: 'border-l-4 border-l-blue-500',
        }
    }
  }

  const filtered = announcements.filter((item) => {
    if (typeFilter !== 'all' && item.type.toLowerCase() !== typeFilter.toLowerCase()) {
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.message.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Official updates and alerts from your instructors and institute</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Megaphone className="size-3.5 text-blue-200" />
            <span>Institute Broadcasts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Notices & Announcements
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Stay informed with exam schedules, batch timings, live test announcements, and important updates.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Bell className="size-64 text-white" />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'info', 'warning', 'success', 'maintenance'].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className="rounded-xl text-xs capitalize whitespace-nowrap"
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white shadow-sm border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Notices List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <Bell className="size-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No Announcements Found</h3>
          <p className="text-sm text-gray-500 mt-1">There are no new notices published matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((item, idx) => {
              const styles = getTypeStyles(item.type)
              const Icon = styles.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all duration-200 py-0 ${styles.border}`}>
                    <CardContent className="p-5 sm:p-6 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${styles.badgeBg}`}>
                            <Icon className={`size-4 ${styles.iconColor}`} />
                          </div>
                          <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="size-3.5" />
                          <span>
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-8">
                        {item.message}
                      </p>

                      {item.createdByName && (
                        <div className="pl-8 pt-2 text-xs text-gray-400 flex items-center gap-1.5">
                          <span>Posted by:</span>
                          <span className="font-semibold text-gray-600">{item.createdByName}</span>
                        </div>
                      )}
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
