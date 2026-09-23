'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  ShoppingCart,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface TestItem {
  id: string
  title: string
  totalDuration: number
  numberOfQuestions: number
  totalMarks: number
  isLive: boolean
  isLocked: boolean
  maxAttempts: number
  negativeMarks: number
  attemptCount: number
  canAttempt: boolean
  attempts: Array<{
    id: string
    score: number
    totalMarks: number
    status: string
    startedAt: string
    completedAt: string | null
  }>
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
}

export default function TestSeriesDetail() {
  const { selectedTestSeriesId, setStudentPage, setSelectedTestId, setSelectedAttemptId, openCheckout } = useAppStore()
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
      if (res.success) {
        setData(res.testSeries)
      }
    } catch (err) {
      console.error('Test series detail error:', err)
      setError('Failed to load test series details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedTestSeriesId])

  const handleStartTest = async (testId: string) => {
    setStartingTest(testId)
    try {
      const res = await apiFetchJSON<{ success: boolean; attempt: { id: string }; message?: string }>(
        '/api/student/test-attempts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId }),
        }
      )
      if (res.success) {
        setSelectedTestId(testId)
        setStudentPage('take-test')
      } else {
        alert(res.message || 'Failed to start test')
      }
    } catch (err) {
      console.error('Start test error:', err)
      alert('Failed to start test. Please try again.')
    } finally {
      setStartingTest(null)
    }
  }

  const handleViewResult = (attemptId: string) => {
    setSelectedAttemptId(attemptId)
    setStudentPage('test-result')
  }

  const handleBuyNow = () => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-xl py-0">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStudentPage('my-tests')} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
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

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-400">
        <AlertCircle className="size-12 mx-auto mb-3 opacity-40" />
        <p className="text-base font-medium">Test series not found</p>
        <Button variant="outline" className="mt-3" onClick={() => setStudentPage('my-tests')}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setStudentPage('my-tests')} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{data.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data.tests.length} Test{data.tests.length !== 1 ? 's' : ''} • {data.category || 'General'}
          </p>
        </div>
        {!data.purchased && data.price > 0 && (
          <Button
            size="sm"
            className="shrink-0 gap-1.5 sm:gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleBuyNow}
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Buy Now</span> &#8377;{data.price}
          </Button>
        )}
      </div>

      {/* Not purchased notice */}
      {!data.purchased && data.price > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 py-0">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Lock className="size-5 text-amber-600 shrink-0 hidden sm:block" />
            <div className="flex-1 flex items-start gap-2 sm:items-center">
              <Lock className="size-5 text-amber-600 shrink-0 sm:hidden mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Purchase Required</p>
                <p className="text-xs text-amber-700">Buy this test series to access all tests and start attempting.</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 w-full sm:w-auto"
              onClick={handleBuyNow}
            >
              Buy &#8377;{data.price}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test List */}
      {data.tests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="size-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No tests available yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.tests.map((test, idx) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border border-gray-100 rounded-xl hover:shadow-md transition-shadow py-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Test Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {test.title}
                        </h3>
                        {!test.isLive && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs shrink-0">Draft</Badge>
                        )}
                        {test.isLive && (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-xs shrink-0">Live</Badge>
                        )}
                        {test.isLocked && (
                          <Badge variant="secondary" className="bg-red-50 text-red-500 text-xs shrink-0">
                            <Lock className="size-3 mr-0.5" />Locked
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {test.totalDuration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="size-3.5" />
                          {test.numberOfQuestions} Qs
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="size-3.5" />
                          {test.totalMarks} marks
                        </span>
                        {test.negativeMarks > 0 && (
                          <span className="text-red-500">-{test.negativeMarks} neg</span>
                        )}
                        <span>Max {test.maxAttempts} attempt{test.maxAttempts !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Attempt History */}
                      {test.attempts.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {test.attempts.slice(0, 3).map((attempt) => (
                            <button
                              key={attempt.id}
                              onClick={() => handleViewResult(attempt.id)}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            >
                              {attempt.status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="size-3 text-emerald-500" />
                                  {attempt.score}/{attempt.totalMarks}
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="size-3 text-amber-500" />
                                  In Progress
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {test.canAttempt ? (
                        <Button
                          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => handleStartTest(test.id)}
                          disabled={startingTest === test.id}
                        >
                          {startingTest === test.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Play className="size-4" />
                          )}
                          {test.attempts.length > 0 ? 'Re-attempt' : 'Start Test'}
                        </Button>
                      ) : !test.isLive ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500">Not Live</Badge>
                      ) : test.isLocked ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                          <Lock className="size-3 mr-1" />Locked
                        </Badge>
                      ) : !data.purchased && data.price > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={handleBuyNow}
                        >
                          <Lock className="size-3" /> Buy to Access
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500">Max attempts reached</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
