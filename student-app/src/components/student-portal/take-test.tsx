'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookmarkCheck,
  ClipboardList,
  AlertCircle,
  RotateCcw,
  Upload,
  Camera,
  FileText,
  BookOpen,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

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
  isPdfTest?: boolean
  pdfUrl?: string | null
  allowPdfDownload?: boolean
  pdfPasswordProtected?: boolean
  themeSnapshot?: string | null
  theme?: any
  
  
}

export default function TakeTest() {
  const { selectedTestId, isPracticeMode, setStudentPage, setSelectedAttemptId, takeTestMode } = useAppStore()
  const [test, setTest] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const currentQRef = useRef(currentQ)
  currentQRef.current = currentQ

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const answersRef = useRef(answers)
  answersRef.current = answers

  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({})
  const timePerQuestionRef = useRef(timePerQuestion)
  timePerQuestionRef.current = timePerQuestion

  const markedForReviewRef = useRef(markedForReview)
  markedForReviewRef.current = markedForReview

  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({})

  // Report state
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  // OMR Hybrid state
  const [omrModalOpen, setOmrModalOpen] = useState(false)
  const [omrFile, setOmrFile] = useState<File | null>(null)
  const [omrPreview, setOmrPreview] = useState<string | null>(null)
  const [uploadingOmr, setUploadingOmr] = useState(false)

  const isOmr = (test as any)?.testMode === 'OMR' || (test as any)?.isOmr || false

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

  // Start attempt and timer
  const [isStarting, setIsStarting] = useState(false)
  const handleStartTest = useCallback(async () => {
    if (!test) return
    try {
      if (!attemptId) {
        const res = await apiFetchJSON<{ success: boolean; attempt: { id: string }; message?: string }>(
          '/api/student/test-attempts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: test.id, isPractice: isPracticeMode }),
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
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            // Auto-submit
            handleSubmit(true)
            return 0
          }
          
          // Auto-save every 30 seconds
          if (prev % 30 === 0 && attemptId) {
             apiFetchJSON(`/api/student/test-attempts/${attemptId}/auto-save`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 answers: answersRef.current,
                 markedForReview: Array.from(markedForReviewRef.current),
                 timePerQuestion: timePerQuestionRef.current,
                 timeTaken: (test.totalDuration || 0) * 60 - prev
               })
             }).catch(console.error)
          }
          
          return prev - 1
        })

        // Track time per question
        if (test && test.questions && test.questions.length > 0) {
           const currentQuestionId = test.questions[currentQRef.current]?.id
           if (currentQuestionId) {
             setTimePerQuestion(prev => ({
               ...prev,
               [currentQuestionId]: (prev[currentQuestionId] || 0) + 1
             }))
           }
        }
      }, 1000)
    } catch (err) {
      console.error('Start attempt error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to start test. Please try again.')
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
          console.warn('Upload image failed, using base64 data URL:', uploadErr)
        }
      }

      const timeTaken = test ? (test.totalDuration * 60) - timeLeft : 0
      let currentAttemptId = attemptId

      if (!currentAttemptId && test) {
        const createRes = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
          '/api/student/test-attempts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: test.id, isPractice: isPracticeMode }),
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

      // Submit the attempt with omrImageUrl
      const res = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
        `/api/student/test-attempts/${currentAttemptId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersRef.current,
            markedForReview: Array.from(markedForReviewRef.current),
            timePerQuestion: timePerQuestionRef.current,
            timeTaken,
            omrImageUrl,
          }),
        }
      )

      if (res.success) {
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
      const timeTaken = test ? (test.totalDuration * 60) - timeLeft : 0
      let currentAttemptId = attemptId

      // If no attempt exists yet, create one first
      if (!currentAttemptId && test) {
        const createRes = await apiFetchJSON<{ success: boolean; attempt: { id: string } }>(
          '/api/student/test-attempts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: test.id, isPractice: isPracticeMode }),
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
            markedForReview: Array.from(markedForReviewRef.current),
            timePerQuestion: timePerQuestionRef.current,
            timeTaken,
          }),
        }
      )
      if (res.success) {
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

  const toggleReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  const handleReportSubmit = async () => {
    if (!reportingQuestionId || !reportReason.trim()) return
    setSubmittingReport(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; message?: string }>(
        `/api/student/questions/${reportingQuestionId}/report`,
        { 
          method: 'POST',
          body: JSON.stringify({ reason: reportReason })
        }
      )
      if (res.success) {
        toast.success(res.message || 'Question reported successfully')
        setReportModalOpen(false)
        setReportReason('')
        setReportingQuestionId(null)
      } else {
        toast.error(res.message || 'Failed to report question')
      }
    } catch (err) {
      toast.error('Network error. Could not report question.')
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleBookmark = async (questionId: string) => {
    const prev = bookmarked[questionId]
    setBookmarked(p => ({ ...p, [questionId]: !prev })) // optimistic
    try {
      const res = await apiFetchJSON<{ success: boolean; bookmarked: boolean }>(
        `/api/student/questions/${questionId}/bookmark`,
        { method: 'POST' }
      )
      if (res.success) {
        setBookmarked(p => ({ ...p, [questionId]: res.bookmarked }))
      } else {
        setBookmarked(p => ({ ...p, [questionId]: prev })) // revert
        toast.error('Failed to bookmark question')
      }
    } catch (err) {
      setBookmarked(p => ({ ...p, [questionId]: prev })) // revert
      toast.error('Network error')
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // Safe parse JSON
  const safeJsonParse = (val: any, fallback: any) => {
    if (!val) return fallback
    if (typeof val === 'object') return val
    try { return JSON.parse(val) } catch { return fallback }
  }

  // Parse Theme
  let themeConfig: any = null
  if (test) {
    let tData = test.themeSnapshot ? safeJsonParse(test.themeSnapshot, null) : test.theme
    if (tData) {
      themeConfig = {
        typography: safeJsonParse(tData.typography, {}),
        colorTokens: safeJsonParse(tData.colorTokens, {}),
        questionStyle: safeJsonParse(tData.questionStyle, {}),
        optionStyle: safeJsonParse(tData.optionStyle, {}),
        cbtSettings: safeJsonParse(tData.cbtSettings, {}),
        pdfSettings: safeJsonParse(tData.pdfSettings, {}),
        brandingConfig: safeJsonParse(tData.brandingConfig, {}),
        accessibility: safeJsonParse(tData.accessibility, {}),
      }
    }
  }

const questions = test?.questions || []
  const isPdfMode = takeTestMode === 'PDF' && test?.pdfUrl


  // Sections Logic
  const sections = React.useMemo(() => {
    const s = new Set<string>()
    questions.forEach(q => {
      if (q.section) s.add(q.section)
    })
    return Array.from(s)
  }, [questions])

  React.useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0])
    }
  }, [sections, activeSection])

  React.useEffect(() => {
    if (questions[currentQ]?.section && questions[currentQ]?.section !== activeSection) {
      setActiveSection(questions[currentQ].section)
    }
  }, [currentQ, questions, activeSection])

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
      setTimeout(() => {
        (window as any).renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
        })
      }, 100) // Small delay to let DOM render
    }
  }, [currentQ, activeSection])

  const displayedQuestions = React.useMemo(() => {
    if (!activeSection) return questions.map((q, idx) => ({ q, idx }))
    return questions.map((q, idx) => ({ q, idx })).filter(item => item.q.section === activeSection)
  }, [questions, activeSection])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-amber-600 mx-auto mb-4" />
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
                  <Clock className="size-4 text-amber-600" />
                  Duration: {test.totalDuration} min
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <ClipboardList className="size-4 text-amber-600" />
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
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-base sm:text-lg py-4 sm:py-6"
              onClick={handleStartTest}
                disabled={isStarting}
            >
              {attemptId ? 'Resume Test' : 'Start Test'}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  
  
  if (questions.length === 0 && !isPdfMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="size-16 text-amber-500 mb-4 opacity-50 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
        <p className="text-gray-500 mb-6">This test does not have any questions yet.</p>
        <Button onClick={() => setStudentPage('my-tests')}>Go Back to My Tests</Button>
      </div>
    )
  }

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
    const firstQIdx = questions.findIndex(q => q.section === section)
    if (firstQIdx !== -1) {
      setCurrentQ(firstQIdx)
    }
  }

  const question = questions.length > 0 ? questions[currentQ] : null
  const isWarning = timeLeft <= 300 && timeLeft > 60
  const isDanger = timeLeft <= 60

  const containerStyle = themeConfig ? {
    backgroundColor: themeConfig.colorTokens?.background || '#f9fafb',
    fontFamily: themeConfig.typography?.englishFont || 'inherit',
  } : {}

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col" style={containerStyle}>
      {/* Top Bar */}
      <div 
        className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 shrink-0"
        style={themeConfig ? { backgroundColor: themeConfig.colorTokens?.primary, color: '#fff', borderColor: 'transparent' } : {}}
      >
        <h2 className="text-sm font-semibold truncate flex-1 min-w-0" style={themeConfig ? { color: '#fff' } : {}}>{test.title}</h2>
        <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-1.5 rounded-lg text-sm font-bold shrink-0 ${
          isDanger ? 'bg-red-50 text-red-600 animate-pulse' :
          isWarning ? 'bg-amber-50 text-amber-600' :
          'bg-gray-100 text-gray-700'
        }`}>
          <Clock className="size-4" />
          {formatTime(timeLeft)}
        </div>
        {!isPdfMode && (
          <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
            {Object.keys(answers).length}/{questions.length} answered
          </Badge>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="shrink-0"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Submit'}
        </Button>
      </div>

      {/* Sections Tab Bar */}
      {sections.length > 0 && !isPdfMode && (
        <div className="bg-white border-b border-gray-200 px-2 flex items-center overflow-x-auto shrink-0 hide-scrollbar" style={themeConfig ? { backgroundColor: themeConfig.colorTokens?.surface } : {}}>
          {sections.map(section => (
            <button
              key={section}
              onClick={() => handleSectionClick(section)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === section 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              style={themeConfig && activeSection === section ? { borderColor: themeConfig.colorTokens?.primary, color: themeConfig.colorTokens?.primary } : {}}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigation Sidebar - desktop */}
        {sidebarOpen && questions.length > 0 && (
          <div className="hidden md:block w-64 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Questions</p>
              <div className="grid grid-cols-5 gap-1.5">
                {displayedQuestions.map(({q, idx}) => {
                  const isAnswered = !!answers[q.id]
                  const isReview = markedForReview.has(q.id)
                  const isCurrent = idx === currentQ
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQ(idx)}
                      className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                        isCurrent ? 'ring-2 ring-amber-500' :
                        isReview ? 'bg-violet-100 text-violet-700' :
                        isAnswered ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-violet-100 border border-violet-300" /> Marked for Review
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Not Answered
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Question Area */}
        <div className="flex-1 overflow-y-auto">
          {isPdfMode && test.pdfUrl ? (
            <div className="h-full flex flex-col md:flex-row gap-4 p-4">
              <div className="flex-1 min-h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <SecurePdfViewer 
                  url={test.pdfUrl} 
                  title={test.title}
                  allowDownload={test.allowPdfDownload}
                  isPasswordProtected={test.pdfPasswordProtected}
                  testId={test.id}
                />
              </div>
              {questions.length > 0 && (
                <div className="w-full md:w-[360px] flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 shadow-sm max-h-[80vh] md:max-h-full">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b border-gray-200 p-4 font-bold text-center shrink-0 shadow-sm flex flex-col">
                    <span className="text-lg tracking-wide">Digital OMR Sheet</span>
                    <span className="text-xs font-medium text-blue-100 opacity-90">Fill bubbles according to PDF</span>
                  </div>
                  <ScrollArea className="flex-1 p-1">
                    <div className="space-y-1.5 p-2 pb-10">
                      {questions.map((q, idx) => {
                        const qNum = idx + 1;
                        const currentAns = answers[q.id] || '';
                        return (
                          <div key={q.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors border ${currentAns ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-transparent hover:border-gray-100'}`}>
                            <span className="w-8 text-right font-bold text-gray-500">{qNum}.</span>
                            <div className="flex gap-3 mx-2">
                              {['1','2','3','4'].map(opt => {
                                const letter = opt === '1' ? 'A' : opt === '2' ? 'B' : opt === '3' ? 'C' : 'D';
                                const isSelected = currentAns === opt;
                                return (
                                  <button
                                    key={opt}
                                    onClick={() => selectAnswer(q.id, opt)}
                                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                                      isSelected 
                                        ? 'bg-blue-600 border-blue-600 text-white scale-105' 
                                        : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                                  >
                                    {letter}
                                  </button>
                                )
                              })}
                            </div>
                            <div className="w-10 text-center">
                              {currentAns && (
                                <button
                                  onClick={() => setAnswers(prev => { const n = {...prev}; delete n[q.id]; return n; })}
                                  className="text-xs uppercase font-bold text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : question ? (
            <div className={`mx-auto p-4 sm:p-6 space-y-6 ${((question as any).passage || (question as any).passageId) ? 'max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : 'max-w-4xl'}`}>
              
              {/* Passage Block */}
              {((question as any).passage) && (
                <Card className="py-0 sticky top-4 max-h-[85vh] overflow-y-auto">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3 mb-4">
                      <BookOpen className="size-5 text-emerald-600" />
                      <h3 className="font-semibold text-gray-800">Read the passage</h3>
                    </div>
                    {((question as any).passage.text) && (
                      <div className="text-sm text-gray-700 leading-relaxed space-y-3 prose max-w-none" dangerouslySetInnerHTML={{ __html: (question as any).passage.text }} />
                    )}
                    {((question as any).passage.textHi) && (
                      <div className="text-sm text-amber-900 leading-relaxed space-y-3 prose max-w-none border-t border-amber-100 pt-4" dangerouslySetInnerHTML={{ __html: (question as any).passage.textHi }} />
                    )}
                    {((question as any).passage.image) && (
                      <MediaImage src={(question as any).passage.image} alt="Passage" className="max-w-full rounded border mt-4" />
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-semibold text-xs">
                    Q {currentQ + 1} / {questions.length}
                  </Badge>
                  {isOmr && (
                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-xs">
                      Bubble on OMR Sheet
                    </Badge>
                  )}
                  {question.section && (
                    <Badge variant="secondary" className="text-xs">{question.section}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 mr-2">
                    +{question.positiveMarks} {question.negativeMarks > 0 ? `/ -${question.negativeMarks}` : ''}
                  </span>
                  <Button
                    variant={bookmarked[question.id] ? 'default' : 'outline'}
                    size="sm"
                    className={bookmarked[question.id] ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                    onClick={() => handleBookmark(question.id)}
                    title="Bookmark for Revision"
                  >
                    <FileText className="size-3.5 mr-1" />
                    {bookmarked[question.id] ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant={markedForReview.has(question.id) ? 'default' : 'outline'}
                    size="sm"
                    className={markedForReview.has(question.id) ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
                    onClick={() => toggleReview(question.id)}
                  >
                    <BookmarkCheck className="size-3.5 mr-1" />
                    {markedForReview.has(question.id) ? 'Marked' : 'Mark'}
                  </Button>
                </div>
              </div>

              {/* Question */}
            <Card className="py-0">
              <CardContent className="p-5 sm:p-6">
                {question.heading && (
                  <p className="text-sm font-medium text-amber-700 mb-2">{question.heading}</p>
                )}
                {question.directive && (
                  <p className="text-xs text-gray-500 mb-3">{question.directive}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div 
                      className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap"
                      style={themeConfig ? {
                        fontSize: `${themeConfig.typography?.questionFontSize || 16}px`,
                        lineHeight: themeConfig.typography?.lineHeight || 1.6,
                        color: themeConfig.colorTokens?.text || '#111827',
                        textAlign: themeConfig.typography?.textAlignment || 'left'
                      } : {}}
                      dangerouslySetInnerHTML={{ __html: question.title }}
                    />
                  </div>
                  {/* Bilingual (Hindi) text */}
                  {(question as any).titleHi && (
                    <div 
                      className="text-base text-amber-900 leading-relaxed whitespace-pre-wrap pb-4 md:pb-0 md:border-l md:border-amber-100 md:pl-4"
                      style={themeConfig ? {
                        fontSize: `${themeConfig.typography?.questionFontSize || 16}px`,
                        lineHeight: themeConfig.typography?.lineHeight || 1.6,
                        textAlign: themeConfig.typography?.textAlignment || 'left'
                      } : {}}
                      dangerouslySetInnerHTML={{ __html: (question as any).titleHi }}
                    />
                  )}
                </div>
                {question.image1 && (
                  <div className="mt-4 max-w-lg rounded-xl overflow-hidden border border-gray-200">
                    <MediaImage src={question.image1} alt="Question figure" className="w-full h-auto object-contain bg-gray-50" />
                  </div>
                )}

                {/* Options */}
                <div className="mt-5 space-y-3">
                  {isOmr && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-2 mb-3">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <span>Options are display-only. Please bubble your answer on your physical OMR sheet.</span>
                    </div>
                  )}
                  {['mcq', 'assertion_reason', 'true_false'].includes(question.type?.toLowerCase() || '') ? (
                    <RadioGroup
                      value={answers[question.id] || ''}
                      onValueChange={(val) => !isOmr && selectAnswer(question.id, val)}
                      disabled={isOmr}
                    >
                      {['1', '2', '3', '4', '5'].map((num) => {
                        const text = (question as any)[`option${num}`]
                        const textHi = (question as any)[`option${num}Hi`]
                        if (!text && !textHi && !(question as any)[`option${num}Image`]) return null
                        return (
                          <div
                            key={num}
                            className={`flex items-start gap-3 p-3 rounded-xl border border-gray-100 transition-colors ${
                              isOmr
                                ? 'cursor-default bg-gray-50/40'
                                : 'hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer'
                            }`}
                          >
                            <RadioGroupItem value={num} id={`q${question.id}-${num}`} disabled={isOmr} className="mt-1" />
                            <Label htmlFor={`q${question.id}-${num}`} className={`flex-1 space-y-2 ${isOmr ? 'cursor-default' : 'cursor-pointer'}`}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {text && <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: text }} />}
                                {textHi && <div className="text-sm text-amber-800 md:border-l md:border-amber-100 md:pl-4" dangerouslySetInnerHTML={{ __html: textHi }} />}
                              </div>
                              {(question as any)[`option${num}Image`] && (
                                <img src={(question as any)[`option${num}Image`]} alt={`Option ${num}`} className="max-h-32 object-contain rounded border border-gray-100 bg-white mt-2" />
                              )}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  ) : question.type?.toLowerCase() === 'multiple_correct' ? (
                    <div className="space-y-3">
                      {['1', '2', '3', '4', '5'].map((num) => {
                        const text = (question as any)[`option${num}`]
                        const textHi = (question as any)[`option${num}Hi`]
                        if (!text && !textHi && !(question as any)[`option${num}Image`]) return null
                        const selected = (answers[question.id] || '').split(',').includes(num)
                        return (
                          <div
                            key={num}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                              isOmr
                                ? 'cursor-default bg-gray-50/40 border-gray-100'
                                : selected
                                ? 'border-amber-300 bg-amber-50/50 cursor-pointer'
                                : 'border-gray-100 hover:border-amber-200 cursor-pointer'
                            }`}
                            onClick={() => !isOmr && toggleMultipleAnswer(question.id, num)}
                          >
                            <Checkbox checked={selected} disabled={isOmr} className="mt-1" />
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {text && <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: text }} />}
                                {textHi && <div className="text-sm text-amber-800 md:border-l md:border-amber-100 md:pl-4" dangerouslySetInnerHTML={{ __html: textHi }} />}
                              </div>
                              {(question as any)[`option${num}Image`] && (
                                <img src={(question as any)[`option${num}Image`]} alt={`Option ${num}`} className="max-h-32 object-contain rounded border border-gray-100 bg-white mt-2" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : question.type?.toLowerCase() === 'numerical' ? (
                    <div className="mt-3">
                      <Input
                        type="number"
                        placeholder="Enter your answer"
                        value={answers[question.id] || ''}
                        onChange={(e) => !isOmr && selectAnswer(question.id, e.target.value)}
                        disabled={isOmr}
                        className="max-w-xs"
                      />
                    </div>
                  ) : (
                    <RadioGroup
                      value={answers[question.id] || ''}
                      onValueChange={(val) => !isOmr && selectAnswer(question.id, val)}
                      disabled={isOmr}
                    >
                      {['1', '2', '3', '4', '5'].map((num) => {
                        const text = (question as any)[`option${num}`]
                        if (!text) return null
                        return (
                          <div
                            key={num}
                            className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 transition-colors ${
                              isOmr
                                ? 'cursor-default bg-gray-50/40'
                                : 'hover:border-amber-200 cursor-pointer'
                            }`}
                          >
                            <RadioGroupItem value={num} id={`q${question.id}-${num}`} disabled={isOmr} />
                            <Label htmlFor={`q${question.id}-${num}`} className={`flex-1 space-y-2 ${isOmr ? 'cursor-default' : 'cursor-pointer'}`}>
                              <span className="text-sm text-gray-800 block">{text}</span>
                              {(question as any)[`option${num}Image`] && (
                                <img src={(question as any)[`option${num}Image`]} alt={`Option ${num}`} className="max-h-32 object-contain rounded border border-gray-100 bg-white" />
                              )}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-3 flex items-center gap-2">
                  {answers[question.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setAnswers((prev) => {
                        const next = { ...prev }
                        delete next[question.id]
                        return next
                      })}
                    >
                      Clear Answer
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                    onClick={() => {
                      setReportingQuestionId(question.id)
                      setReportModalOpen(true)
                    }}
                  >
                    <AlertCircle className="size-4 mr-1" />
                    Report Error
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-400">
                {currentQ + 1} / {questions.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                disabled={currentQ === questions.length - 1}
              >
                Next
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
            </div>
          </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Question Nav */}
      {questions.length > 0 && (
        <div className="md:hidden border-t border-gray-200 bg-white p-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {displayedQuestions.map(({q, idx}) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = idx === currentQ
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-amber-600 text-white' :
                    isAnswered ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit the test? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Questions answered:</span>
              <span className="font-medium">{Object.keys(answers).length} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Unanswered:</span>
              <span className="font-medium">{questions.length - Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Marked for review:</span>
              <span className="font-medium">{markedForReview.size}</span>
            </div>
            {questions.length - Object.keys(answers).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700">
                <AlertTriangle className="size-4 shrink-0" />
                <span>You have {questions.length - Object.keys(answers).length} unanswered question(s).</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Submit Test
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

      {/* Report Question Modal */}
      <Dialog open={reportModalOpen} onOpenChange={(open) => !open && setReportModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="size-5" />
              Report Error
            </DialogTitle>
            <DialogDescription>
              Please describe the issue with this question (e.g. wrong answer key, missing options, typing error).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="What's wrong with this question?..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReportModalOpen(false); setReportReason(''); }} disabled={submittingReport}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleReportSubmit} 
              disabled={submittingReport || !reportReason.trim()}
            >
              {submittingReport ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


