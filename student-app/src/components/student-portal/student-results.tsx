'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface AttemptItem {
  id: string
  testId: string
  score: number
  totalMarks: number
  rank: number | null
  percentile: number | null
  timeTaken: number
  status: string
  startedAt: string
  completedAt: string | null
  test: {
    id: string
    title: string
    totalDuration: number
    numberOfQuestions: number
    testSeries: { id: string; title: string } | null
  }
}

function ResultSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="rounded-xl py-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Skeleton className="size-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function StudentResults() {
  const { setStudentPage, setSelectedAttemptId } = useAppStore()
  const [attempts, setAttempts] = useState<AttemptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; attempts: AttemptItem[] }>('/api/student/test-attempts')
      if (res.success) {
        setAttempts(res.attempts)
      }
    } catch (err) {
      console.error('Results load error:', err)
      setError('Failed to load results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = attempts
    .filter((a) => a.status === 'completed' || a.status === 'omr_pending')
    .filter((a) =>
      a.test.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.test.testSeries?.title || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') {
        const pctA = a.totalMarks > 0 ? (a.score / a.totalMarks) : 0
        const pctB = b.totalMarks > 0 ? (b.score / b.totalMarks) : 0
        return pctB - pctA
      }
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    })

  const handleViewResult = (attemptId: string) => {
    setSelectedAttemptId(attemptId)
    setStudentPage('test-result')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
          <p className="text-gray-500 text-sm mt-1">View your test attempts and performance</p>
        </div>
        <ResultSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
          <p className="text-gray-500 text-sm mt-1">View your test attempts and performance</p>
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
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500 text-sm mt-1">View your test attempts and performance</p>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search by test name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            className={sortBy === 'date' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            onClick={() => setSortBy('date')}
          >
            <Clock className="size-3.5 mr-1" />
            By Date
          </Button>
          <Button
            variant={sortBy === 'score' ? 'default' : 'outline'}
            size="sm"
            className={sortBy === 'score' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            onClick={() => setSortBy('score')}
          >
            <Trophy className="size-3.5 mr-1" />
            By Score
          </Button>
        </div>
      </div>

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Trophy className="size-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No results yet</p>
          <p className="text-sm mt-1">Complete a test to see your results here</p>
          <Button
            className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setStudentPage('my-tests')}
          >
            Browse Tests
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((attempt, idx) => {
            const isPending = attempt.status === 'omr_pending'
              const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0
            const timeMins = Math.floor(attempt.timeTaken / 60)
            const timeSecs = attempt.timeTaken % 60

            return (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border border-gray-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer py-0"
                  onClick={() => handleViewResult(attempt.id)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
                          isPending ? 'bg-amber-50' : pct >= 60 ? 'bg-emerald-50' : pct >= 40 ? 'bg-amber-50' : 'bg-red-50'
                        }`}>
                          {isPending ? <Clock className="size-6 text-amber-600" /> : <Trophy className={`size-6 ${
                            pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'
                          }`} />}
                        </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {attempt.test.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>{attempt.test.testSeries?.title || 'Unknown Series'}</span>
                          <span>•</span>
                          <span>{attempt.score}/{attempt.totalMarks}</span>
                          {attempt.timeTaken > 0 && (
                            <>
                              <span>•</span>
                              <span>{timeMins}m {timeSecs}s</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isPending ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending Review</Badge>
                          ) : (
                            <>
                              <div className="w-20">
                                <Progress value={pct} className="h-2" />
                              </div>
                              <span className={`text-lg font-bold ${
                                pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'
                              }`}>
                                {pct}%
                              </span>
                            </>
                          )}
                      </div>
                    </div>
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
