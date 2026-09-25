'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Clock,
  Hash,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface QuestionReview {
  id: string
  type: string
  title: string
  image1: string | null
  option1: string | null
  option2: string | null
  option3: string | null
  option4: string | null
  option5: string | null
  option1Image: string | null
  option2Image: string | null
  option3Image: string | null
  option4Image: string | null
  option5Image: string | null
  solutionImage1: string | null
  correctOption: string | null
  selectedOption: string | null
  isCorrect: boolean
  isAttempted: boolean
  marksObtained: number
  positiveMarks: number
  negativeMarks: number
  section: string | null
  timeTaken?: number
  solution: {
    heading: string | null
    image1: string | null
    image2: string | null
    video: string | null
    text: string | null
  } | null
}

interface AttemptData {
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
  totalStudents: number | null
  test: {
    id: string
    title: string
    totalDuration: number
    numberOfQuestions: number
    showSolution: boolean
    displayResults: boolean
      testMode?: string
    testSeries: { id: string; title: string } | null
  }
  questionReview: QuestionReview[]
}

interface LeaderboardEntry {
  id: string
  score: number
  totalMarks: number
  timeTaken: number
  completedAt: string
  student: {
    id: string
    name: string | null
    email: string | null
  }
}

export default function TestResult() {
  const { selectedAttemptId, setStudentPage } = useAppStore()
  const [data, setData] = useState<AttemptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const load = async () => {
    if (!selectedAttemptId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; attempt: AttemptData }>(
        `/api/student/test-attempts/${selectedAttemptId}`
      )
      if (res.success) {
        setData(res.attempt)
        
        // Fetch Leaderboard
        if (res.attempt.test?.id && res.attempt.status === 'completed') {
          setLeaderboardLoading(true)
          apiFetchJSON<{ success: boolean; data: any }>(
            `/api/student/tests/${res.attempt.test.id}/leaderboard`
          ).then((lbRes) => {
             if (lbRes.success && lbRes.data?.topAttempts) {
               setLeaderboard(lbRes.data.topAttempts)
             }
          }).finally(() => setLeaderboardLoading(false))
        }
      }
    } catch (err) {
      console.error('Test result load error:', err)
      setError('Failed to load test result. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedAttemptId])

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
        <Card className="border-0 shadow-sm overflow-hidden py-0">
          <Skeleton className="h-40 w-full" />
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-xl py-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
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
          <Button variant="outline" size="sm" onClick={() => setStudentPage('results')} className="shrink-0 gap-1.5 h-8">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
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
        <p className="text-base font-medium">Result not found</p>
        <Button variant="outline" className="mt-3" onClick={() => setStudentPage('results')}>
          View All Results
        </Button>
      </div>
    )
  }

  const pct = data.totalMarks > 0 ? Math.round((data.score / data.totalMarks) * 100) : 0
  const correctCount = data.questionReview.filter(q => q.isCorrect).length
  const incorrectCount = data.questionReview.filter(q => q.isAttempted && !q.isCorrect).length
  const unattempted = data.questionReview.filter(q => !q.isAttempted).length
  
  const sectionStats = data.questionReview.reduce((acc, q) => {
    const section = q.section || 'General'
    if (!acc[section]) acc[section] = { total: 0, correct: 0, incorrect: 0, unattempted: 0, timeTaken: 0, score: 0 }
    acc[section].total++
    acc[section].timeTaken += (q.timeTaken || 0)
    acc[section].score += q.marksObtained
    if (!q.isAttempted) acc[section].unattempted++
    else if (q.isCorrect) acc[section].correct++
    else acc[section].incorrect++
    return acc
  }, {} as Record<string, { total: number, correct: number, incorrect: number, unattempted: number, timeTaken: number, score: number }>)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setStudentPage('results')} className="shrink-0 gap-1.5 h-8">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{data.test.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data.test.testSeries?.title || 'Test Result'}
          </p>
        </div>
      </div>

      {/* OMR Pending Banner */}
      {data.status === 'omr_pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-900">OMR Sheet Verification Pending</h4>
            <p className="text-amber-700 mt-0.5">
              Your physical OMR sheet photo has been submitted successfully. Your teacher is reviewing and grading your responses. Final scores and rankings will update once verified.
            </p>
          </div>
        </div>
      )}

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden py-0">
          <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400 p-6 sm:p-8 text-white text-center">
            <Trophy className="size-10 mx-auto mb-3 opacity-80" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-1">{data.score}/{data.totalMarks}</h2>
            <p className="text-white/80 text-sm">Your Score</p>
            <div className="mt-4 w-full max-w-xs mx-auto">
              <Progress value={pct} className="h-3 bg-white/20 [&>[data-slot=indicator]]:bg-white" />
              <p className="text-sm font-medium mt-1">{pct}%</p>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {data.rank && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">#{data.rank}</p>
                  <p className="text-xs text-gray-500">Rank</p>
                  {data.totalStudents && <p className="text-xs text-gray-400">out of {data.totalStudents}</p>}
                </div>
              )}
              {data.percentile !== null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-violet-600">{data.percentile}%</p>
                  <p className="text-xs text-gray-500">Percentile</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{formatTime(data.timeTaken)}</p>
                <p className="text-xs text-gray-500">Time Taken</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
                <p className="text-xs text-gray-500">Correct</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="size-4" /> {correctCount} Correct
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <XCircle className="size-4" /> {incorrectCount} Wrong
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <MinusCircle className="size-4" /> {unattempted} Unattempted
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4 text-indigo-500" />
                Section & Topic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {Object.entries(sectionStats).map(([sectionName, stats]) => (
                  <div key={sectionName} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{sectionName}</h4>
                      <span className="font-bold text-indigo-600">{stats.score} marks</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">{stats.correct} Correct</span>
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">{stats.incorrect} Wrong</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{stats.unattempted} Unattempted</span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                        <Clock className="size-3" /> {formatTime(stats.timeTaken)}
                      </span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                      <div style={{ width: `${(stats.correct / stats.total) * 100}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${(stats.incorrect / stats.total) * 100}%` }} className="bg-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-0 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-80">
              {leaderboardLoading ? (
                <div className="flex items-center justify-center flex-1 py-12">
                  <Loader2 className="size-6 text-gray-400 animate-spin" />
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {leaderboard.map((lb, idx) => (
                    <div key={lb.id} className={`flex items-center justify-between p-4 ${lb.id === selectedAttemptId ? 'bg-amber-50/50' : 'hover:bg-gray-50/50 transition-colors'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-600' :
                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {lb.student.name || 'Anonymous Student'} {lb.id === selectedAttemptId && <span className="text-xs font-normal text-amber-600 ml-1">(You)</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(lb.timeTaken)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{lb.score}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-12 text-gray-400 text-sm">
                  <Trophy className="size-10 mb-2 opacity-20" />
                  No leaderboard data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Question Review */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.questionReview.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className={`border py-0 ${
                q.isCorrect ? 'border-emerald-200' :
                q.isAttempted ? 'border-red-200' :
                'border-gray-100'
              }`}>
                <button
                  className="w-full p-4 text-left flex items-start gap-3"
                  onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ${
                    q.isCorrect ? 'bg-emerald-50 text-emerald-600' :
                    q.isAttempted ? 'bg-red-50 text-red-500' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {q.isCorrect ? <CheckCircle2 className="size-4" /> :
                     q.isAttempted ? <XCircle className="size-4" /> :
                     <MinusCircle className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Q{idx + 1}. <span className="whitespace-pre-wrap">{q.title}</span>
                    </div>
                    {q.image1 && (
                      <div className="mt-2 max-w-sm rounded overflow-hidden border border-gray-200">
                        <MediaImage src={q.image1} alt="Question figure" className="w-full h-auto object-contain bg-gray-50" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className={q.marksObtained > 0 ? 'text-emerald-600' : q.marksObtained < 0 ? 'text-red-500' : 'text-gray-400'}>
                        {q.marksObtained > 0 ? '+' : ''}{q.marksObtained.toFixed(q.marksObtained % 1 === 0 ? 0 : 1)} marks
                      </span>
                      {q.section && <Badge variant="secondary" className="text-xs">{q.section}</Badge>}
                    </div>
                  </div>
                  {expandedQ === q.id ? (
                    <ChevronUp className="size-4 text-gray-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="size-4 text-gray-400 shrink-0 mt-1" />
                  )}
                </button>

                {expandedQ === q.id && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <Separator />
                    {/* Options */}
                    <div className="space-y-2">
                      {['1', '2', '3', '4', '5'].map((num) => {
                        const text = (q as any)[`option${num}`]
                          const isOmr = data.test.testMode === 'OMR' || data.status === 'omr_pending';
                          if (!text && !(isOmr && parseInt(num) <= 4)) return null
                        const isCorrect = q.correctOption?.split(',').map(s => s.trim()).includes(num)
                        const isSelected = q.selectedOption === num
                        return (
                          <div
                            key={num}
                            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                              isCorrect ? 'bg-emerald-50 border border-emerald-200' :
                              isSelected ? 'bg-red-50 border border-red-200' :
                              'bg-gray-50'
                            }`}
                          >
                            <span className="font-medium text-gray-600">{num}.</span>
                            <div className="flex-1 space-y-1">
                              {text ? <span className="text-gray-800 block">{text}</span> : (isOmr && parseInt(num) <= 4) ? <span className="text-gray-800 block">Option {String.fromCharCode(64 + parseInt(num))}</span> : null}
                              {(q as any)[`option${num}Image`] && (
                                <img src={(q as any)[`option${num}Image`]} alt={`Option ${num}`} className="max-h-24 object-contain rounded border border-gray-100 bg-white" />
                              )}
                            </div>
                            {isCorrect && <CheckCircle2 className="size-4 text-emerald-500 ml-auto shrink-0" />}
                            {isSelected && !isCorrect && <XCircle className="size-4 text-red-500 ml-auto shrink-0" />}
                          </div>
                        )
                      })}
                    </div>

                    {/* Your Answer */}
                    <div className="text-sm">
                      <span className="text-gray-500">Your answer: </span>
                      <span className={`font-medium ${q.isCorrect ? 'text-emerald-600' : q.isAttempted ? 'text-red-500' : 'text-gray-400'}`}>
                        {q.selectedOption || 'Not attempted'}
                      </span>
                      {q.correctOption && (
                        <>
                          <span className="text-gray-400 mx-2">•</span>
                          <span className="text-gray-500">Correct: </span>
                          <span className="font-medium text-emerald-600">{q.correctOption}</span>
                        </>
                      )}
                    </div>

                    {q.solution && (q.solution.text || q.solution.heading) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="size-4 text-amber-700" />
                          <h4 className="text-sm font-bold text-amber-900">Solution</h4>
                        </div>
                        {q.solution.heading && (
                          <p className="text-sm font-medium text-amber-800 mb-2">{q.solution.heading}</p>
                        )}
                        {q.solution.text && (
                          <div className="text-sm text-amber-800 prose prose-sm prose-amber max-w-none" dangerouslySetInnerHTML={{ __html: q.solution.text }} />
                        )}
                      </div>
                    )}
                    {q.solution?.image1 && (
                      <div className="mt-2 max-w-sm rounded overflow-hidden border border-gray-200">
                        <MediaImage src={q.solution.image1} alt="Solution figure 1" className="w-full h-auto object-contain bg-gray-50" />
                      </div>
                    )}
                    {q.solution?.image2 && (
                      <div className="mt-2 max-w-sm rounded overflow-hidden border border-gray-200">
                        <MediaImage src={q.solution.image2} alt="Solution figure 2" className="w-full h-auto object-contain bg-gray-50" />
                      </div>
                    )}
                    {q.solution?.video && (
                      <div className="mt-2 max-w-sm rounded overflow-hidden border border-gray-200 p-2 bg-gray-50">
                        <a href={q.solution.video} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                          <BookOpen className="size-4" /> Watch Video Solution
                        </a>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
