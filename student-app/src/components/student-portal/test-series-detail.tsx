'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Hash,
  CheckCircle2,
  Play,
  Loader2,
  AlertCircle,
  Lock,
  RotateCcw,
  FileText,
  ShoppingCart,
  Calendar,
  Award,
  Target,
  BarChart3,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface TestAttempt {
  id: string
  score: number
  totalMarks: number
  status: string
  startedAt: string
  completedAt: string | null
}

interface TestItem {
  id: string
  title: string
  totalDuration: number
  numberOfQuestions: number
  totalMarks: number
  isLive: boolean
  isLocked: boolean
    isPdfTest?: boolean
    pdfUrl?: string | null
    testMode?: string
    allowPdfDownload?: boolean
    pdfPasswordProtected?: boolean
  maxAttempts: number
  allowAttempt: boolean
  displayResults: boolean
  resultAt: string | null
  negativeMarks: number
  attemptCount: number
  startDate?: string | null
  endDate?: string | null
  canAttempt: boolean
  attempts: TestAttempt[]
}

interface TestSeriesDetailData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  isCombo: boolean
  status: string
  purchased: boolean
  tests: TestItem[]
  children?: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    status: string
  }[]
}

function getScoreColor(percent: number) {
  if (percent >= 70) return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  if (percent >= 40) return 'text-amber-700 bg-amber-100 border-amber-200'
  return 'text-rose-700 bg-rose-100 border-rose-200'
}

export default function TestSeriesDetail() {
  const { selectedTestSeriesId, setStudentPage, setSelectedTestId, setSelectedAttemptId, setIsPracticeMode, setTakeTestMode, openCheckout } = useAppStore()
  const [data, setData] = useState<TestSeriesDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingTest, setStartingTest] = useState<string | null>(null)

  const load = async () => {
    if (!selectedTestSeriesId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; testSeries: TestSeriesDetailData }>(
        `/api/student/test-series/${selectedTestSeriesId}`
      )
      if (!res || !res.success || !res.testSeries) {
        throw new Error('Invalid response format')
      }
      setData(res.testSeries)
    } catch (err) {
      console.error('Test series detail error:', err)
      setError('We could not load this test series right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedTestSeriesId])

  useEffect(() => {
    if (selectedTestSeriesId) {
      apiFetchJSON('/api/student/track-view', {
        method: 'POST',
        body: JSON.stringify({ productId: selectedTestSeriesId, productType: 'test_series' })
      }).catch(console.error)
    }
  }, [selectedTestSeriesId])

  const handleStartTest = (testId: string, isPractice: boolean = false, mode: 'CBT' | 'PDF' = 'CBT') => {
    if (!useAppStore.getState().requireAuth()) return;
    setTakeTestMode(mode)
    setIsPracticeMode(isPractice)
    setSelectedTestId(testId)
    setStudentPage('take-test')
  }

  const handleViewResult = (attemptId: string) => {
    if (!useAppStore.getState().requireAuth()) return;
    setSelectedAttemptId(attemptId)
    setStudentPage('test-result')
  }

  const handleBuyNow = () => {
    if (!useAppStore.getState().requireAuth()) return;
    if (!data) return
    openCheckout({
      id: data.id,
      type: 'test_series',
      title: data.title,
      price: data.price,
      mrp: data.mrp,
      thumbnail: data.thumbnail,
    })
  }

  // Calculate stats
  const stats = useMemo(() => {
    if (!data) return null
    const totalTests = data.tests.length
    
    let completed = 0
    let bestScorePercent = 0
    let totalAttemptsAllowed = 0
    let totalAttemptsUsed = 0

    data.tests.forEach(test => {
      totalAttemptsAllowed += test.maxAttempts
      totalAttemptsUsed += test.attemptCount
      
      const hasCompleted = test.attempts.some(a => a.status === 'completed')
      if (hasCompleted) completed++

      test.attempts.forEach(a => {
        if (a.status === 'completed' && a.totalMarks > 0) {
          const percent = (a.score / a.totalMarks) * 100
          if (percent > bestScorePercent) bestScorePercent = percent
        }
      })
    })

    const remainingAttempts = Math.max(0, totalAttemptsAllowed - totalAttemptsUsed)
    const totalDuration = data.tests.reduce((acc, t) => acc + t.totalDuration, 0)

    return { totalTests, completed, bestScorePercent: Math.round(bestScorePercent), remainingAttempts, totalDuration }
  }, [data])

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="space-y-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <Button variant="outline" size="sm" className="absolute top-6 left-6 gap-1.5 h-8" onClick={() => setStudentPage('my-tests')}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
          <AlertCircle className="w-11 h-11" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
        <Button size="lg" className="gap-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800" onClick={load}>
          <RotateCcw className="w-5 h-5" /> Try Again
        </Button>
      </div>
    )
  }

  if (!data || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Test series not found</h2>
        <Button variant="outline" size="sm" className="mt-6 rounded-xl gap-1.5 h-8" onClick={() => setStudentPage('my-tests')}>
          <ArrowLeft className="size-4" /> Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Button variant="outline" size="sm" onClick={() => setStudentPage('my-tests')} className="shrink-0 gap-1.5 h-8">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-gray-900 truncate max-w-[200px]">{data.title}</span>
      </div>

      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-xl min-h-72 flex flex-col justify-end p-8 md:p-12"
      >
        {/* Background Graphic */}
        <div className="absolute inset-0 z-0">
          {data.thumbnail ? (
            <>
              <MediaImage src={data.thumbnail} alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-black" />
          )}
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex gap-2 mb-4">
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-md px-3 py-1">
              {data.category || 'General'}
            </Badge>
            {data.isCombo && (
              <Badge className="bg-amber-500 text-white border-0 px-3 py-1">
                Combo Pack
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            {data.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-300 font-medium">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              <span>{stats.totalTests} Tests Total</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>{Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m Total</span>
            </div>
          </div>
        </div>

        {/* Floating Buy Button if not purchased */}
        {!data.purchased && data.price > 0 && (
          <div className="absolute top-6 right-6 md:top-auto md:bottom-8 md:right-12 z-20">
            <div className="bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg gap-2 rounded-xl px-8 h-14 text-lg font-bold"
                onClick={handleBuyNow}
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now &#8377;{data.price}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full gap-2">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tests</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full gap-2">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full gap-2">
              <div className="p-3 rounded-full bg-amber-50 text-amber-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.bestScorePercent}%</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Best Score</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="rounded-2xl border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full gap-2">
              <div className="p-3 rounded-full bg-violet-50 text-violet-600">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.remainingAttempts}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sub-Folders (Children Test Series) */}
      {data.children && data.children.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mt-8 border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Folders</h2>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {data.children.length} folders
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.children.map((child) => (
              <Card 
                key={child.id} 
                className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                onClick={() => {
                  useAppStore.getState().setSelectedTestSeriesId(child.id)
                }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{child.title}</h3>
                    {child.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{child.description}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tests List Header */}
      {data.tests.length > 0 && (
        <div className="flex items-center justify-between mt-8 border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">All Tests</h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {data.tests.length} items
          </span>
        </div>
      )}

      {/* Test List */}
      {data.tests.length === 0 && (!data.children || data.children.length === 0) ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 mt-6">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold text-gray-700">No contents available yet</p>
          <p className="text-gray-500">Folders or tests will appear here once they are added.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.tests.map((test, idx) => {
            const isCompleted = test.attempts.some(a => a.status === 'completed')
            const latestAttempt = test.attempts[0]
            
            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.05) }}
              >
                <Card className={`rounded-2xl border ${isCompleted ? 'border-gray-200 bg-white' : 'border-gray-100 bg-white'} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}>
                  <div className="flex flex-col md:flex-row">
                    {/* Number Badge Left (Desktop) */}
                    <div className="hidden md:flex flex-col items-center justify-center w-16 bg-gray-50 border-r border-gray-100 text-gray-400 font-mono font-bold text-xl">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    
                    <CardContent className="p-5 md:p-6 flex-1 flex flex-col md:flex-row md:items-center gap-6">
                      {/* Mobile Header (Number + Status) */}
                      <div className="flex items-center justify-between md:hidden mb-2">
                        <span className="text-sm font-mono font-bold text-gray-400">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        {test.isLive ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                          </span>
                        ) : test.isLocked ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Draft</span>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {test.title}
                          </h3>
                          {/* Desktop Status Badges */}
                          <div className="hidden md:flex">
                            {test.isLive ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                              </span>
                            ) : test.isLocked ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Draft</span>
                            )}
                          </div>
                        </div>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-md">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {test.totalDuration} mins
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-md">
                            <Hash className="w-4 h-4 text-indigo-500" />
                            {test.numberOfQuestions} Qs
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-md">
                            <Award className="w-4 h-4 text-amber-500" />
                            {test.totalMarks} Marks
                          </div>
                          {test.negativeMarks > 0 && (
                            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-md">
                              -{test.negativeMarks} per wrong
                            </div>
                          )}
                        </div>

                        {/* Attempts Info & Progress */}
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mt-2">
                          <span>{test.attemptCount} / {test.maxAttempts === -1 ? '∞' : test.maxAttempts} attempts used</span>
                          {test.attemptCount > 0 && test.displayResults && (!test.resultAt || new Date() >= new Date(test.resultAt)) && (
                            <div className="flex gap-1.5">
                              {test.attempts.slice(0, 3).map((a, i) => {
                                if (a.status !== 'completed') return null
                                const pct = (a.score / a.totalMarks) * 100
                                return (
                                  <button
                                    key={a.id}
                                    onClick={() => handleViewResult(a.id)}
                                    title={`Attempt ${test.attempts.length - i}: ${a.score}/${a.totalMarks}`}
                                    className={`px-2 py-0.5 rounded border ${getScoreColor(pct)} hover:opacity-80 transition-opacity`}
                                  >
                                    {a.score}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <Progress value={test.maxAttempts === -1 ? 0 : (test.attemptCount / test.maxAttempts) * 100} className="h-1 bg-gray-100" />
                      </div>

                      {/* Action Area */}
                      <div className="shrink-0 flex items-center md:border-l md:border-gray-100 md:pl-6 pt-4 md:pt-0 border-t border-gray-100 md:border-t-0">
                        {test.canAttempt ? (
                          <div className="w-full flex flex-col md:flex-row gap-2">
                            {test.isPdfTest && test.pdfUrl ? (
                              <>
                                <Button
                                  size="lg"
                                  className="w-full md:w-auto rounded-xl shadow-sm gap-2 font-bold bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleStartTest(test.id, test.attemptCount > 0, 'CBT')}
                                  disabled={startingTest === test.id}
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  CBT Mode
                                </Button>
                                <Button
                                  size="lg"
                                  className="w-full md:w-auto rounded-xl shadow-sm gap-2 font-bold bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700"
                                  onClick={() => handleStartTest(test.id, test.attemptCount > 0, 'PDF')}
                                  disabled={startingTest === test.id}
                                >
                                  <FileText className="w-4 h-4" />
                                  PDF Mode
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="lg"
                                className={`w-full md:w-auto rounded-xl shadow-sm gap-2 font-bold ${
                                  test.attemptCount > 0
                                    ? 'bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                                }`}
                                onClick={() => handleStartTest(test.id, test.attemptCount > 0, 'CBT')}
                                disabled={startingTest === test.id}
                              >
                                {startingTest === test.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : test.attemptCount > 0 ? (
                                  <RotateCcw className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current" />
                                )}
                                {test.attemptCount > 0 ? 'Practice Mode' : 'Start Test'}
                              </Button>
                            )}
                          </div>
                        ) : !test.isLive ? (
                          <Button size="lg" variant="secondary" className="w-full md:w-auto rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed" disabled>
                            Not Live Yet
                          </Button>
                        ) : test.isLocked ? (
                          <Button size="lg" variant="secondary" className="w-full md:w-auto rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed" disabled>
                            <Lock className="w-4 h-4 mr-2" /> Locked
                          </Button>
                        ) : (test.startDate && new Date() < new Date(test.startDate)) ? (
                          <Button size="lg" variant="secondary" className="w-full md:w-auto rounded-xl bg-blue-50 text-blue-600 cursor-not-allowed" disabled>
                            <Calendar className="w-4 h-4 mr-2" /> Opens {new Date(test.startDate).toLocaleDateString()}
                          </Button>
                        ) : (test.endDate && new Date() > new Date(test.endDate)) ? (
                          <Button size="lg" variant="secondary" className="w-full md:w-auto rounded-xl bg-red-50 text-red-600 cursor-not-allowed" disabled>
                            <AlertCircle className="w-4 h-4 mr-2" /> Missed
                          </Button>
                        ) : !data.purchased && data.price > 0 ? (
                          <Button
                            size="lg"
                            variant="outline"
                            className="w-full md:w-auto rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 gap-2 font-bold"
                            onClick={handleBuyNow}
                          >
                            <Lock className="w-4 h-4" /> Buy to Access
                          </Button>
                        ) : (
                          <div className="w-full md:w-auto flex flex-col gap-2">
                            <Button size="lg" variant="secondary" className="w-full rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" disabled>
                              {!test.allowAttempt ? 'Attempts disabled' : 'Max attempts reached'}
                            </Button>
                            {latestAttempt && latestAttempt.status === 'completed' && test.displayResults && (!test.resultAt || new Date() >= new Date(test.resultAt)) && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-lg w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => handleViewResult(latestAttempt.id)}
                              >
                                View Latest Result
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
