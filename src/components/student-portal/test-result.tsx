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
  Flag,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface QuestionReview {
  id: string
  type: string
  title: string
  image1: string | null
  image2: string | null
  image3: string | null
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
  correctOption: string | null
  selectedOption: string | null
  isCorrect: boolean
  isAttempted: boolean
  marksObtained: number
  positiveMarks: number
  negativeMarks: number
  section: string | null
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
    testSeries: { id: string; title: string } | null
  }
  questionReview: QuestionReview[]
}

export default function TestResult() {
  const { selectedAttemptId, setStudentPage } = useAppStore()
  const [data, setData] = useState<AttemptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('All')

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

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
      }
    } catch (err) {
      console.error('Test result load error:', err)
      setError('Failed to load test result. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReportSubmit = async () => {
    if (!reportingQuestionId || !reportReason.trim()) {
      toast.error('Please enter a reason for reporting.')
      return
    }
    
    setIsSubmittingReport(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; message: string }>('/api/student/report-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: reportingQuestionId,
          reason: reportReason,
        }),
      })

      if (res.success) {
        toast.success(res.message || 'Error reported successfully.')
        setReportModalOpen(false)
        setReportReason('')
        setReportingQuestionId(null)
      } else {
        toast.error(res.message || 'Failed to report error.')
      }
    } catch (err) {
      console.error('Submit report error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmittingReport(false)
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
          <Button variant="ghost" size="icon" onClick={() => setStudentPage('results')} className="shrink-0">
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
  const totalAttempted = correctCount + incorrectCount
  const overallAccuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  const sections = Array.from(new Set(data.questionReview.map(q => q.section || 'General')))
  
  const sectionStats = sections.map(sec => {
    const qs = data.questionReview.filter(q => (q.section || 'General') === sec)
    const total = qs.length
    const correct = qs.filter(q => q.isCorrect).length
    const wrong = qs.filter(q => q.isAttempted && !q.isCorrect).length
    const skipped = qs.filter(q => !q.isAttempted).length
    const score = qs.reduce((acc, q) => acc + q.marksObtained, 0)
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0
    return { section: sec, total, correct, wrong, skipped, score, accuracy }
  })

  const filteredQuestions = data.questionReview.filter(q => activeSection === 'All' || (q.section || 'General') === activeSection)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setStudentPage('results')} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{data.test.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data.test.testSeries?.title || 'Test Result'}
          </p>
        </div>
      </div>

      {data.status === 'omr_pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm sm:text-base">OMR Sheet Verification Pending</h3>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              Your physical OMR sheet image has been uploaded successfully and is currently under review by your instructor. Your score and rank will be updated once evaluated.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score & Basic Stats */}
        <div className="lg:col-span-2 space-y-6">
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
                    <p className="text-2xl font-bold text-blue-600">{overallAccuracy}%</p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-6 border-t text-sm justify-center">
                  <span className="flex items-center gap-2 text-emerald-600 font-medium">
                    <CheckCircle2 className="size-5" /> {correctCount} Correct
                  </span>
                  <span className="flex items-center gap-2 text-red-500 font-medium">
                    <XCircle className="size-5" /> {incorrectCount} Wrong
                  </span>
                  <span className="flex items-center gap-2 text-gray-400 font-medium">
                    <MinusCircle className="size-5" /> {unattempted} Unattempted
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section-wise Analysis */}
          {sections.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Section-wise Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Section</th>
                      <th className="px-4 py-3 font-semibold text-center">Score</th>
                      <th className="px-4 py-3 font-semibold text-center">Correct</th>
                      <th className="px-4 py-3 font-semibold text-center">Wrong</th>
                      <th className="px-4 py-3 font-semibold text-center">Skipped</th>
                      <th className="px-4 py-3 font-semibold text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sectionStats.map((stat, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{stat.section}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-600">{stat.score.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-emerald-600">{stat.correct}</td>
                        <td className="px-4 py-3 text-center text-red-500">{stat.wrong}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{stat.skipped}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={stat.accuracy >= 70 ? 'default' : stat.accuracy >= 40 ? 'secondary' : 'destructive'} className={stat.accuracy >= 70 ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                            {stat.accuracy}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Question Palette */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex justify-between items-center">
                Questions
                <Badge variant="outline" className="font-normal">{data.questionReview.length} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2 mb-4">
                {data.questionReview.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveSection(q.section || 'General')
                      setExpandedQ(q.id)
                      // scroll logic could go here
                    }}
                    className={`w-full aspect-square rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                      q.isCorrect ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                      q.isAttempted ? 'bg-red-100 text-red-700 border border-red-300' :
                      'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-xl font-bold text-gray-900">Detailed Review</h2>
          {sections.length > 1 && (
            <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
              <button
                onClick={() => setActiveSection('All')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeSection === 'All' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Sections
              </button>
              {sections.map(sec => (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                    activeSection === sec ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            // Find global index
            const globalIdx = data.questionReview.findIndex(gq => gq.id === q.id)
            const isMultiple = q.type === 'multiple_correct'
            
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className={`border overflow-hidden ${
                  q.isCorrect ? 'border-emerald-200' :
                  q.isAttempted ? 'border-red-200' :
                  'border-gray-200'
                }`}>
                  <button
                    className="w-full p-4 sm:p-5 text-left flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                  >
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-base font-bold shrink-0 ${
                      q.isCorrect ? 'bg-emerald-100 text-emerald-600' :
                      q.isAttempted ? 'bg-red-100 text-red-500' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      Q{globalIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge variant="outline" className={
                          q.isCorrect ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 
                          q.isAttempted ? 'text-red-500 border-red-200 bg-red-50' : 
                          'text-gray-500 bg-gray-50'
                        }>
                          {q.isCorrect ? 'Correct' : q.isAttempted ? 'Incorrect' : 'Unattempted'}
                        </Badge>
                        <span className={`text-sm font-semibold ${q.marksObtained > 0 ? 'text-emerald-600' : q.marksObtained < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                          {q.marksObtained > 0 ? '+' : ''}{q.marksObtained.toFixed(2)} Marks
                        </span>
                        {q.section && <Badge variant="secondary" className="text-xs">{q.section}</Badge>}
                      </div>
                      <div className="text-base text-gray-900 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.title }} />
                    </div>
                    <div className="shrink-0 mt-2 bg-gray-100 p-1.5 rounded-full">
                      {expandedQ === q.id ? (
                        <ChevronUp className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {expandedQ === q.id && (
                    <CardContent className="px-4 sm:px-6 pb-6 pt-0 space-y-6">
                      <Separator className="mb-4" />
                      
                      {/* Full Question Context */}
                      <div className="space-y-4">
                        <div className="text-base text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div dangerouslySetInnerHTML={{ __html: q.title.replace(/\n/g, '<br/>') }} />
                          {/* Question Images */}
                          <div className="mt-4 space-y-3">
                            {q.image1 && <img src={q.image1} alt="Question Image 1" className="max-w-full rounded-lg border" />}
                            {q.image2 && <img src={q.image2} alt="Question Image 2" className="max-w-full rounded-lg border" />}
                            {q.image3 && <img src={q.image3} alt="Question Image 3" className="max-w-full rounded-lg border" />}
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-700">Options:</h4>
                        
                        {q.type === 'numerical' ? (
                          <div className="flex flex-col gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-500 block mb-1">Your Answer:</span>
                              <span className={`text-lg font-semibold ${q.isCorrect ? 'text-emerald-600' : q.isAttempted ? 'text-red-500' : 'text-gray-500'}`}>
                                {q.selectedOption || 'None'}
                              </span>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                              <span className="text-sm text-emerald-700 block mb-1">Correct Answer:</span>
                              <span className="text-lg font-semibold text-emerald-700">{q.correctOption}</span>
                            </div>
                          </div>
                        ) : (
                          ['1', '2', '3', '4', '5'].map((num) => {
                            const text = (q as any)[`option${num}`]
                            const img = (q as any)[`option${num}Image`]
                            if (!text && !img) return null
                            
                            const correctOpts = q.correctOption?.split(',').map(s => s.trim()) || []
                            const selectedOpts = q.selectedOption?.split(',').map(s => s.trim()) || []
                            
                            const isCorrectOpt = correctOpts.includes(num)
                            const isSelectedOpt = selectedOpts.includes(num)
                            
                            let borderClass = 'border-gray-200 bg-white'
                            let icon: React.ReactNode = null
                            
                            if (isCorrectOpt) {
                              borderClass = 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                              icon = <CheckCircle2 className="size-5 text-emerald-600 ml-auto shrink-0" />
                            } else if (isSelectedOpt) {
                              borderClass = 'border-red-400 bg-red-50/50'
                              icon = <XCircle className="size-5 text-red-500 ml-auto shrink-0" />
                            }

                            return (
                              <div
                                key={num}
                                className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border ${borderClass}`}
                              >
                                <span className={`font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm ${
                                  isCorrectOpt ? 'bg-emerald-100 text-emerald-700' :
                                  isSelectedOpt ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{num}</span>
                                
                                <div className="flex-1">
                                  {text && <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />}
                                  {img && <img src={img} alt={`Option ${num}`} className="mt-2 max-w-full rounded-md border" />}
                                </div>
                                {icon}
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Solution Details */}
                      {q.solution && (q.solution.text || q.solution.heading || q.solution.image1 || q.solution.video) && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl overflow-hidden mt-6">
                          <div className="bg-amber-100/50 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                            <BookOpen className="size-4 text-amber-700" />
                            <h4 className="font-semibold text-amber-800 text-sm">Explanation</h4>
                          </div>
                          <div className="p-4 sm:p-5 space-y-4">
                            {q.solution.heading && (
                              <p className="text-base font-semibold text-gray-900">{q.solution.heading}</p>
                            )}
                            {q.solution.text && (
                              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: q.solution.text.replace(/\n/g, '<br/>') }} />
                            )}
                            {q.solution.image1 && (
                              <img src={q.solution.image1} alt="Solution image 1" className="max-w-full rounded border" />
                            )}
                            {q.solution.image2 && (
                              <img src={q.solution.image2} alt="Solution image 2" className="max-w-full rounded border mt-2" />
                            )}
                            {q.solution.video && (
                              <div className="mt-4 pt-4 border-t border-amber-200">
                                <a href={q.solution.video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10 15 5-3-5-3v6Z"/><rect width="20" height="14" x="2" y="5" rx="2"/></svg>
                                  Watch Video Solution
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Report Button */}
                      <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReportingQuestionId(q.id)
                            setReportReason('')
                            setReportModalOpen(true)
                          }}
                        >
                          <Flag className="size-4 mr-1.5" />
                          Report Error
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Report Error Dialog */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="size-5 text-red-500" />
              Report Question Error
            </DialogTitle>
            <DialogDescription>
              Please describe the issue with this question (e.g., incorrect answer key, typo, missing image). Our team will review it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">Reason for reporting</Label>
            <Textarea
              id="reason"
              placeholder="Provide details here..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReportSubmit}
              disabled={isSubmittingReport || !reportReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmittingReport && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
