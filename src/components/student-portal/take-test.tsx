'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  BookmarkCheck,
  ClipboardList,
  AlertCircle,
  RotateCcw,
  Maximize2,
  Minimize2,
  Menu,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'

interface Question {
  id: string
  type: string
  heading: string | null
  directive: string | null
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
  correctOption?: string | null
  section: string | null
  positiveMarks: number
  negativeMarks: number
  sortOrder: number
}

interface TestData {
  id: string
  title: string
  instructions: string | null
  totalDuration: number
  numberOfQuestions: number
  totalMarks: number
  testMode?: string
  isLive: boolean
  maxAttempts: number
  negativeMarks: number
  showSolution: boolean
  hasInProgress: boolean
  inProgressAttemptId: string | null
  questions: Question[]
}

export default function TakeTest() {
  const { selectedTestId, setStudentPage, setSelectedAttemptId } = useAppStore()
  const [test, setTest] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set([Object.keys({})[0] || '0'])) // initialize in effect
  
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // OMR Hybrid state
  const [omrModalOpen, setOmrModalOpen] = useState(false)
  const [omrFile, setOmrFile] = useState<File | null>(null)
  const [omrPreview, setOmrPreview] = useState<string | null>(null)
  const [uploadingOmr, setUploadingOmr] = useState(false)
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answersRef = useRef(answers)
  answersRef.current = answers

  const load = async () => {
    if (!selectedTestId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; test: TestData }>(
        `/api/student/tests/${selectedTestId}`
      )
      if (res.success) {
        setTest(res.test)
        setTimeLeft((res.test.totalDuration || 0) * 60)
        if (res.test.hasInProgress && res.test.inProgressAttemptId) {
          setAttemptId(res.test.inProgressAttemptId)
          // Attempt to fetch saved answers from attempt
          const attemptRes = await apiFetchJSON<{ success: boolean; attempts: any[] }>(
            `/api/student/test-attempts?testId=${selectedTestId}`
          )
          if (attemptRes.success && attemptRes.attempts?.length > 0) {
            const inProgress = attemptRes.attempts.find((a: any) => a.status === 'in_progress')
            if (inProgress?.answers) {
              try {
                const parsed = JSON.parse(inProgress.answers)
                if (parsed.answers) setAnswers(parsed.answers)
                if (parsed.markedForReview) setMarkedForReview(new Set(parsed.markedForReview))
              } catch (e) {
                // Legacy support if answers was just an object
                try {
                  const parsed = JSON.parse(inProgress.answers)
                  if (!parsed.markedForReview) setAnswers(parsed)
                } catch (e2) {}
              }
              if (inProgress.timeTaken) {
                const elapsed = inProgress.timeTaken
                const totalSecs = (res.test.totalDuration || 0) * 60
                setTimeLeft(Math.max(0, totalSecs - elapsed))
              }
            }
          }
        }
        if (res.test.questions?.length > 0) {
          setVisitedQuestions(new Set([res.test.questions[0].id]))
        }
      }
    } catch (err) {
      console.error('Load test error:', err)
      setError('Failed to load test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedTestId])

  // Auto-save logic
  useEffect(() => {
    if (!attemptId || !test || submitting) return
    const interval = setInterval(async () => {
      try {
        const isUnlimited = test.totalDuration === 0
        const timeTaken = isUnlimited ? timeLeft : (test.totalDuration * 60) - timeLeft
        await apiFetchJSON(`/api/student/test-attempts/${attemptId}/auto-save`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersRef.current,
            timeTaken,
            markedForReview: Array.from(markedForReview),
          })
        })
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, 30000) // Auto-save every 30 seconds
    return () => clearInterval(interval)
  }, [attemptId, test, timeLeft, submitting, markedForReview])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error('Fullscreen mode is not supported by your browser.')
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Start attempt and timer
  const handleStartTest = useCallback(async () => {
    if (!test) return
    try {
      if (!attemptId) {
        const res = await apiFetchJSON<{ success: boolean; attempt: { id: string }; message?: string }>(
          '/api/student/test-attempts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: test.id }),
          }
        )
        if (res.success) {
          setAttemptId(res.attempt.id)
        } else {
          toast.error(res.message || 'Failed to start test')
          return
        }
      }
      setShowInstructions(false)
      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (test.totalDuration === 0) {
            // Count UP for unlimited time
            return prev + 1
          } else {
            // Count DOWN for limited time
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current)
              // Auto-submit
              handleSubmit(true)
              return 0
            }
            return prev - 1
          }
        })
      }, 1000)
    } catch (err) {
      console.error('Start attempt error:', err)
      toast.error('Failed to start test. Please try again.')
    }
  }, [test, attemptId])

  const handleOmrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOmrFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setOmrPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOmrUploadAndSubmit = async () => {
    if (!omrFile && !omrPreview) {
      toast.error('Please select or capture a photo of your OMR sheet.')
      return
    }

    setUploadingOmr(true)
    try {
      let omrImageUrl = omrPreview

      // Try uploading to /api/upload-image if file exists
      if (omrFile) {
        try {
          const formData = new FormData()
          formData.append('file', omrFile)
          formData.append('folder', 'omr-submissions')
          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            if (uploadData.url) {
              omrImageUrl = uploadData.url
            }
          }
        } catch (uploadErr) {
          console.warn('Upload image API failed, using base64 preview:', uploadErr)
        }
      }

      const isUnlimited = test ? test.totalDuration === 0 : false
      const timeTaken = isUnlimited ? timeLeft : (test ? (test.totalDuration * 60) - timeLeft : 0)
      let currentAttemptId = attemptId

      if (!currentAttemptId && test) {
        const createRes = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
          '/api/student/test-attempts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: test.id }),
          }
        )
        if (createRes.success && createRes.attempt?.id) {
          currentAttemptId = createRes.attempt.id
          setAttemptId(currentAttemptId)
        } else {
          toast.error('Failed to create test attempt')
          return
        }
      }

      // Submit attempt with omrImageUrl
      const res = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
        `/api/student/test-attempts/${currentAttemptId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersRef.current,
            timeTaken,
            omrImageUrl,
          }),
        }
      )

      if (res.success) {
        if (document.fullscreenElement) document.exitFullscreen()
        setSelectedAttemptId(res.attempt?.id || currentAttemptId || '')
        setOmrModalOpen(false)
        setStudentPage('test-result')
      } else {
        toast.error('Failed to submit OMR test')
      }
    } catch (err: any) {
      console.error('OMR Submit error:', err)
      toast.error('Failed to upload OMR. Please try again.')
    } finally {
      setUploadingOmr(false)
    }
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    // If OMR mode test, open the OMR upload modal
    if (test?.testMode === 'OMR') {
      if (timerRef.current) clearInterval(timerRef.current)
      setOmrModalOpen(true)
      return
    }

    if (!autoSubmit && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const isUnlimited = test ? test.totalDuration === 0 : false
      const timeTaken = isUnlimited ? timeLeft : (test ? (test.totalDuration * 60) - timeLeft : 0)
      let currentAttemptId = attemptId

      // If no attempt exists yet, create one first
      if (!currentAttemptId && test) {
        const createRes = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
          '/api/student/test-attempts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: test.id }),
          }
        )
        if (createRes.success && createRes.attempt?.id) {
          currentAttemptId = createRes.attempt.id
          setAttemptId(currentAttemptId)
        } else {
          toast.error('Failed to create test attempt')
          return
        }
      }

      // Submit the attempt with answers
      const res = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
        `/api/student/test-attempts/${currentAttemptId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersRef.current,
            timeTaken,
          }),
        }
      )
      if (res.success) {
        if (document.fullscreenElement) document.exitFullscreen()
        setSelectedAttemptId(res.attempt?.id || currentAttemptId || '')
        setStudentPage('test-result')
      } else {
        toast.error('Failed to submit test')
      }
    } catch (err) {
      console.error('Submit test error:', err)
      toast.error('Failed to submit test. Please try again.')
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
    }
  }, [test, timeLeft, attemptId, setSelectedAttemptId, setStudentPage, showConfirm])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Derived values for question rendering
  const optionCount = test?.optionCount || 4
  const optionsList = Array.from({ length: optionCount }, (_, i) => i + 1)
  const unattemptedPenalty = test?.unattemptedPenalty || 0

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  const toggleMultipleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || ''
      const parts = current ? current.split(',') : []
      if (parts.includes(option)) {
        return { ...prev, [questionId]: parts.filter((p) => p !== option).join(',') }
      }
      return { ...prev, [questionId]: [...parts, option].join(',') }
    })
  }

  const handleNext = () => {
    if (!test || currentQ >= test.questions.length - 1) return
    const nextQ = currentQ + 1
    setCurrentQ(nextQ)
    setVisitedQuestions(prev => {
      const next = new Set(prev)
      next.add(test.questions[nextQ].id)
      return next
    })
  }

  const handleReviewAndNext = (questionId: string) => {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      next.add(questionId)
      return next
    })
    handleNext()
  }

  const clearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  const goToQuestion = (idx: number, qId: string) => {
    setCurrentQ(idx)
    setVisitedQuestions(prev => {
      const next = new Set(prev)
      next.add(qId)
      return next
    })
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mx-auto mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load Test</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={load}>
            <RotateCcw className="size-4" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <div className="text-center">
          <AlertCircle className="size-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">Test not found</p>
          <Button variant="outline" className="mt-3" onClick={() => setStudentPage('my-tests')}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Instructions Screen
  if (showInstructions) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{test.title}</h1>
            <p className="text-gray-500">Please read the instructions carefully before starting</p>
          </div>

          <Card className="py-0">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="size-4 text-indigo-600" />
                    Duration: {test.totalDuration === 0 ? 'Unlimited' : `${test.totalDuration} min`}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <ClipboardList className="size-4 text-indigo-600" />
                  Questions: {test.numberOfQuestions}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  Total Marks: {test.totalMarks}
                </div>
                {test.negativeMarks > 0 && (
                  <div className="flex items-center gap-2 text-red-500">
                    Negative Marks: -{test.negativeMarks}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Color Legend:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 text-gray-600 border border-gray-200">1</div>
                    <span>Not Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-red-500 text-white shadow-sm border-b-2 border-red-700">2</div>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-green-500 text-white shadow-sm border-b-2 border-green-700">3</div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-500 text-white shadow-sm border-b-2 border-purple-700">4</div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-500 text-white shadow-sm border-b-2 border-purple-700 relative">
                      5
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    </div>
                    <span>Answered & Marked for Review (Will be considered for evaluation)</span>
                  </div>
                </div>
              </div>

              {attemptId && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>You have an in-progress attempt. Click Start to resume.</span>
                </div>
              )}
              {test.instructions && (
                <div className="text-sm text-gray-600 whitespace-pre-wrap border-t pt-4">
                  {test.instructions}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStudentPage('my-tests')}
            >
              Go Back
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg py-4 sm:py-6"
              onClick={handleStartTest}
            >
              {attemptId ? 'Resume Test' : 'Start Test'}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const questions = test.questions || []
  
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">
        <div className="text-center">
          <AlertCircle className="size-12 mx-auto mb-3 opacity-40 text-indigo-500" />
          <p className="text-base font-medium text-gray-800">This test has no questions yet.</p>
          <p className="text-sm mt-1 mb-4">Please check back later or contact your teacher.</p>
          <Button variant="outline" onClick={() => setStudentPage('my-tests')}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const question = questions[currentQ]
  const isOmr = test?.testMode === 'OMR'
  const isUnlimited = test?.totalDuration === 0
  const isWarning = !isUnlimited && timeLeft <= 300 && timeLeft > 60
  const isDanger = !isUnlimited && timeLeft <= 60

  // Calculate stats for palette
  let answeredCnt = 0
  let notAnsweredCnt = 0
  let markedCnt = 0
  let markedAndAnsweredCnt = 0
  let notVisitedCnt = 0

  questions.forEach(q => {
    const isAns = !!answers[q.id]
    const isMark = markedForReview.has(q.id)
    const isVis = visitedQuestions.has(q.id)

    if (!isVis) notVisitedCnt++
    else if (isAns && isMark) markedAndAnsweredCnt++
    else if (isAns) answeredCnt++
    else if (isMark) markedCnt++
    else notAnsweredCnt++
  })

  // Extract sections
  const sections = Array.from(new Set(questions.map(q => q.section || 'General')))

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col font-sans">
      {/* Top Header */}
      <div className="bg-indigo-700 text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-md z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-wide truncate max-w-md">{test.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleFullscreen} className="text-indigo-200 hover:text-white transition-colors" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold shadow-inner ${
            isDanger ? 'bg-red-600 text-white animate-pulse' :
            isWarning ? 'bg-amber-500 text-white' :
            'bg-indigo-800 text-indigo-50'
          }`}>
            <Clock className="size-4" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* OMR Active Banner */}
      {isOmr && (
        <div className="bg-amber-600 text-white px-6 py-3 flex items-center justify-between text-xs sm:text-sm font-medium shadow-inner shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0" />
            <span>Hybrid OMR Mode: Read questions on screen and darken circles on your physical sheet.</span>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-xs">OMR Sheet</Badge>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.05)] z-0">
          
          {/* Sections Header */}
          <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50">
            {sections.map(sec => {
              const secQuestions = questions.filter(q => (q.section || 'General') === sec)
              const hasCurrent = secQuestions.some(q => q.id === question.id)
              return (
                <div
                  key={sec}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    hasCurrent ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    const firstQIdx = questions.findIndex(q => (q.section || 'General') === sec)
                    if (firstQIdx !== -1) goToQuestion(firstQIdx, questions[firstQIdx].id)
                  }}
                >
                  {sec}
                </div>
              )
            })}
          </div>

          {/* Question Info Bar */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-white text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 text-lg">Question No. {currentQ + 1}</span>
              {isOmr && (
                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs font-semibold">
                  Bubble on OMR Sheet
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1 font-medium">
                Marks: 
                <span className="text-green-600">+{question.positiveMarks}</span>
                {question.negativeMarks > 0 && <span className="text-red-500">-{question.negativeMarks}</span>}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 flex overflow-hidden bg-white">
            {test.isPdfTest && test.pdfUrl && (
              <div className="w-1/2 md:w-3/5 border-r border-gray-200 h-full relative">
                 <iframe src={`${test.pdfUrl}#toolbar=0`} className="w-full h-full border-0" />
              </div>
            )}
            
            <div className={`overflow-y-auto p-6 ${test.isPdfTest ? 'w-1/2 md:w-2/5' : 'flex-1 max-w-4xl'} space-y-6`}>
              {!test.isPdfTest && (
                <>
                  {question.heading && (
                    <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100">{question.heading}</p>
                  )}
                  {question.directive && (
                    <p className="text-sm font-medium text-gray-600 italic bg-gray-50 p-2 border-l-4 border-gray-300">{question.directive}</p>
                  )}
                  
                  <div className="text-base text-gray-900 leading-relaxed space-y-4">
                    <div dangerouslySetInnerHTML={{ __html: (question.title || '').replace(/\n/g, '<br/>') }} />
                    
                    {/* Images */}
                    <div className="space-y-4">
                      {question.image1 && <img src={question.image1} alt="Question Image 1" className="max-w-full h-auto rounded border" />}
                      {question.image2 && <img src={question.image2} alt="Question Image 2" className="max-w-full h-auto rounded border" />}
                      {question.image3 && <img src={question.image3} alt="Question Image 3" className="max-w-full h-auto rounded border" />}
                    </div>
                  </div>
                </>
              )}

              {/* Options */}
              <div className="mt-8 space-y-3">
                {isOmr && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-2 mb-4">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                    <span>Options are display-only in OMR mode. Please mark your answer bubble on your printed OMR sheet.</span>
                  </div>
                )}
                {question.type === 'mcq' || question.type === 'assertion_reason' || question.type === 'true_false' ? (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(val) => !isOmr && selectAnswer(question.id, val)}
                    disabled={isOmr}
                  >
                    {optionsList.map((num) => {
                      const text = (question as any)[`option${num}`]
                      const img = (question as any)[`option${num}Image`]
                      if (!text && !img && !(test.isPdfTest && num !== '5')) return null
                      return (
                        <div
                          key={num}
                          className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 transition-colors ${
                            isOmr
                              ? 'cursor-default bg-gray-50/40'
                              : 'hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer'
                          }`}
                        >
                          <RadioGroupItem value={num} id={`q${question.id}-${num}`} className="mt-1" disabled={isOmr} />
                          <Label htmlFor={`q${question.id}-${num}`} className={`flex-1 text-base text-gray-800 leading-relaxed font-normal ${isOmr ? 'cursor-default' : 'cursor-pointer'}`}>
                            {test.isPdfTest && !text && !img && <span className="font-semibold text-gray-500">Option {['A','B','C','D','E'][parseInt(num)-1]}</span>}
                            {text && <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />}
                            {img && <img src={img} alt={`Option ${num}`} className="mt-2 max-w-full h-auto rounded border" />}
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                ) : question.type === 'multiple_correct' ? (
                  <div className="space-y-3">
                    {optionsList.map((num) => {
                      const text = (question as any)[`option${num}`]
                      const img = (question as any)[`option${num}Image`]
                      if (!text && !img && !(test.isPdfTest && num !== '5')) return null
                      const selected = (answers[question.id] || '').split(',').includes(num)
                      return (
                        <div
                          key={num}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            isOmr
                              ? 'cursor-default bg-gray-50/40 border-gray-200'
                              : selected
                              ? 'border-indigo-400 bg-indigo-50 cursor-pointer'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer'
                          }`}
                          onClick={() => !isOmr && toggleMultipleAnswer(question.id, num)}
                        >
                          <Checkbox checked={selected} disabled={isOmr} className="mt-1" />
                          <div className="flex-1 text-base text-gray-800 leading-relaxed font-normal">
                            {text && <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />}
                            {img && <img src={img} alt={`Option ${num}`} className="mt-2 max-w-full h-auto rounded border" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : question.type === 'numerical' ? (
                  <div className="mt-3">
                    <Input
                      type="number"
                      placeholder="Enter numerical answer"
                      value={answers[question.id] || ''}
                      onChange={(e) => !isOmr && selectAnswer(question.id, e.target.value)}
                      disabled={isOmr}
                      className="max-w-xs text-lg py-6"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-100 font-semibold text-gray-700"
                onClick={() => handleReviewAndNext(question.id)}
              >
                Mark for Review & Next
              </Button>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-100 font-semibold text-gray-700"
                onClick={() => clearAnswer(question.id)}
                disabled={!answers[question.id]}
              >
                Clear Response
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQ > 0) goToQuestion(currentQ - 1, questions[currentQ - 1].id)
                }}
                disabled={currentQ === 0}
                className="bg-white font-semibold text-gray-700"
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                onClick={() => {
                  if (markedForReview.has(question.id)) {
                    setMarkedForReview(prev => {
                      const next = new Set(prev)
                      next.delete(question.id)
                      return next
                    })
                  }
                  handleNext()
                }}
                disabled={currentQ === questions.length - 1}
              >
                Save & Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`w-80 bg-blue-50 border-l border-gray-300 flex flex-col shrink-0 transition-all ${sidebarOpen ? 'block' : 'hidden md:flex'}`}>
          <div className="p-4 bg-blue-100/50 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                {/* Placeholder for user image */}
                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-400">
                  <ClipboardList className="size-6" />
                </div>
              </div>
              <div>
                <div className="font-bold text-gray-800 truncate">Test Taker</div>
                <div className="text-xs text-gray-500">Student</div>
              </div>
            </div>
            
            {/* Legend Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-green-500 text-white shadow-sm border-b-2 border-green-700">{answeredCnt}</div>
                <span className="text-gray-600">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-red-500 text-white shadow-sm border-b-2 border-red-700">{notAnsweredCnt}</div>
                <span className="text-gray-600">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 text-gray-600 border border-gray-200">{notVisitedCnt}</div>
                <span className="text-gray-600">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-500 text-white shadow-sm border-b-2 border-purple-700">{markedCnt}</div>
                <span className="text-gray-600">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-500 text-white shadow-sm border-b-2 border-purple-700 relative">
                  {markedAndAnsweredCnt}
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                </div>
                <span className="text-gray-600">Answered & Marked for Review</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-bold text-sm text-gray-700 mb-3 bg-blue-100 px-3 py-1.5 rounded text-center">
              {question.section || 'General'}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                if ((q.section || 'General') !== (question.section || 'General')) return null

                const isAns = !!answers[q.id]
                const isMark = markedForReview.has(q.id)
                const isVis = visitedQuestions.has(q.id)

                let btnClass = 'bg-gray-100 text-gray-600 border border-gray-300' // Not visited
                let bubbleHtml: React.ReactNode = null

                if (isVis) {
                  if (isAns && isMark) {
                    btnClass = 'bg-purple-500 text-white shadow-sm border-b-2 border-purple-700'
                    bubbleHtml = <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                  } else if (isMark) {
                    btnClass = 'bg-purple-500 text-white shadow-sm border-b-2 border-purple-700'
                  } else if (isAns) {
                    btnClass = 'bg-green-500 text-white shadow-sm border-b-2 border-green-700'
                  } else {
                    btnClass = 'bg-red-500 text-white shadow-sm border-b-2 border-red-700'
                  }
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx, q.id)}
                    className={`relative w-full aspect-square rounded-md text-sm font-bold flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-md ${btnClass}`}
                  >
                    {idx + 1}
                    {bubbleHtml}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-base"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="size-5 animate-spin mr-2" /> : null}
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Sidebar */}
      <button 
        className="md:hidden fixed bottom-4 right-4 z-50 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="size-6" />
      </button>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit Test</DialogTitle>
            <DialogDescription>
                Are you sure you want to submit the test? You cannot change your answers after submission.
                {unattemptedPenalty > 0 && notAnsweredCnt > 0 && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md font-semibold text-left">
                    Warning: You have {notAnsweredCnt} unattempted questions! 
                    Your exam profile has a penalty ({unattemptedPenalty} marks) for leaving questions completely blank. 
                    {optionCount === 5 && " Please select the 5th option (E) if you do not want to attempt."}
                  </div>
                )}
              </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-center font-bold text-gray-700 border-b pb-2 mb-3">Exam Summary</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-500">Total:</span>
                  <span>{questions.length}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-green-600">Answered:</span>
                  <span>{answeredCnt + markedAndAnsweredCnt}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-red-500">Not Answered:</span>
                  <span>{notAnsweredCnt}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-purple-600">Marked:</span>
                  <span>{markedCnt}</span>
                </div>
                <div className="flex justify-between font-medium col-span-2 border-t pt-2 mt-1">
                  <span className="text-gray-500">Not Visited:</span>
                  <span>{notVisitedCnt}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Confirm Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OMR Upload & Submit Modal */}
      <Dialog open={omrModalOpen} onOpenChange={setOmrModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Upload className="size-5 text-amber-600" />
              Upload OMR Sheet & Submit
            </DialogTitle>
            <DialogDescription>
              Please upload a clear photo of your completed physical OMR answer sheet to submit your test for grading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Upload Box */}
            <div className="border-2 border-dashed border-amber-300 rounded-xl p-5 text-center bg-amber-50/50 hover:bg-amber-50 transition-colors relative">
              {omrPreview ? (
                <div className="space-y-3">
                  <div className="relative max-h-56 overflow-hidden rounded-lg border border-amber-200">
                    <img src={omrPreview} alt="OMR Preview" className="w-full h-auto object-contain max-h-56 mx-auto" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setOmrFile(null)
                        setOmrPreview(null)
                      }}
                    >
                      Remove & Choose Another
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Camera className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Take Photo or Select File</p>
                  <p className="text-xs text-gray-500">Supports PNG, JPG, JPEG (Max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleOmrFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Submission Tips:</p>
              <p>• Make sure all 4 corners of the sheet are visible.</p>
              <p>• Ensure good lighting and avoid shadows or blur.</p>
              <p>• Your teacher will evaluate your sheet and publish your marks.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOmrModalOpen(false)} disabled={uploadingOmr}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              onClick={handleOmrUploadAndSubmit}
              disabled={uploadingOmr || (!omrFile && !omrPreview)}
            >
              {uploadingOmr ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <CheckCircle2 className="size-4 mr-1.5" />}
              {uploadingOmr ? 'Uploading...' : 'Confirm & Submit OMR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
