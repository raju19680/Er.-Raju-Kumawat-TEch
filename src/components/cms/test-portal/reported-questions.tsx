'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { CMSPage } from '@/lib/store'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquareWarning,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = 'pending' | 'resolved' | 'dismissed'

interface ReportedQuestion {
  id: string
  questionId?: string
  questionTitle: string
  testName: string
  reportedBy: string
  reason: string
  status: ReportStatus
  date: string
}

interface ReportedQuestionsResponse {
  items: ReportedQuestion[]
  total: number
}

interface QuestionDetail {
  id: string
  type: string
  text: string
  section: string
  marks: number
  difficulty: string
  options?: any[]
  solutionText?: string
}

// ── Tab definition ───────────────────────────────────────────────────────────

const tabs: { label: string; page: CMSPage }[] = [
  { label: 'Test Series', page: 'test-series' },

  { label: 'Results', page: 'results' },
  { label: 'Bulk Uploader', page: 'bulk-uploader' },
  { label: 'Reported Questions', page: 'reported-questions' },
  { label: 'Question Library', page: 'question-library' },
]

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReportStatus }) {
  const config = {
    pending: {
      className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      label: 'Pending',
    },
    resolved: {
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      label: 'Resolved',
    },
    dismissed: {
      className: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100',
      label: 'Dismissed',
    },
  }
  const c = config[status]
  return <Badge className={c.className}>{c.label}</Badge>
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ReportedQuestions({ testIdFilter }: { testIdFilter?: string } = {}) {
  const { currentPage, setCurrentPage } = useAppStore()

  // Data state
  const [reports, setReports] = useState<ReportedQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Status update loading
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Question detail dialog
  const [questionDetailOpen, setQuestionDetailOpen] = useState(false)
  const [questionDetail, setQuestionDetail] = useState<QuestionDetail | null>(null)
  const [questionDetailLoading, setQuestionDetailLoading] = useState(false)

  // ── Fetch reported questions ────────────────────────────────────────────

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (testIdFilter) params.set('testId', testIdFilter)

      const res = await apiFetch(`/api/reported-questions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch reported questions')

      const data: ReportedQuestionsResponse = await res.json()
      setReports(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load reported questions')
      setReports([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, testIdFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // ── Status counts ───────────────────────────────────────────────────────

  const pendingCount = reports.filter((r) => r.status === 'pending').length
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length

  // ── Update status ──────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: ReportStatus) => {
    setUpdatingId(id)
    try {
      const res = await apiFetch(`/api/reported-questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Failed to update status')

      toast.success(`Report ${status === 'resolved' ? 'resolved' : status === 'dismissed' ? 'dismissed' : 'reopened'} successfully`)
      fetchReports()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── View question detail ───────────────────────────────────────────────

  const handleViewQuestion = async (questionId: string | undefined) => {
    if (!questionId) {
      toast.error('Question ID not available')
      return
    }
    setQuestionDetailOpen(true)
    setQuestionDetailLoading(true)
    setQuestionDetail(null)
    try {
      const res = await apiFetch(`/api/questions/${questionId}`)
      if (!res.ok) throw new Error('Failed to load question')
      const data = await res.json()
        const q = data.question || data
        
        // Format options array
        const options = []
        if (q.option1) options.push({ text: q.option1, isCorrect: q.correctOption?.includes('1') || q.correctOption === 'Option 1' })
        if (q.option2) options.push({ text: q.option2, isCorrect: q.correctOption?.includes('2') || q.correctOption === 'Option 2' })
        if (q.option3) options.push({ text: q.option3, isCorrect: q.correctOption?.includes('3') || q.correctOption === 'Option 3' })
        if (q.option4) options.push({ text: q.option4, isCorrect: q.correctOption?.includes('4') || q.correctOption === 'Option 4' })
        if (q.option5) options.push({ text: q.option5, isCorrect: q.correctOption?.includes('5') || q.correctOption === 'Option 5' })

        setQuestionDetail({
          type: q.type || 'multiple_choice',
          section: q.section || 'General',
          marks: q.positiveMarks || 1,
          difficulty: 'Medium',
          text: q.title || q.text || 'No question text provided',
          options,
          solutionText: q.solutionText || ''
        })
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to load question details')
    } finally {
      setQuestionDetailLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      {!testIdFilter && (
        <div className="flex items-center gap-1 border-b overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.page}
              onClick={() => setCurrentPage(tab.page)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative flex-shrink-0 ${
                currentPage === tab.page
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {currentPage === tab.page && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Reported Questions</h1>
        {!loading && pendingCount > 0 && (
          <Badge className="w-fit bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1">
            <MessageSquareWarning className="h-3.5 w-3.5" />
            {pendingCount} pending review
          </Badge>
        )}
      </div>

      {/* ── Filters row ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Status filter pills */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-0.5 overflow-x-auto whitespace-nowrap">
          {[
            { value: 'all', label: 'All', count: total },
            { value: 'pending', label: 'Pending', count: pendingCount },
            { value: 'resolved', label: 'Resolved', count: resolvedCount },
            { value: 'dismissed', label: 'Dismissed', count: dismissedCount },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                statusFilter === item.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs ${
                  statusFilter === item.value
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/50 text-muted-foreground/70'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by question, test, or reporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="size-8 text-red-400 mb-3" />
            <p className="text-sm font-medium text-red-700">Failed to load reported questions</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchReports}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* ── Reported questions table ────────────────────────────────────── */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Question</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead className="w-[200px]">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No reported questions found.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    {/* Question title (truncated) */}
                    <TableCell className="font-medium">
                      <p className="line-clamp-2 text-sm" title={report.questionTitle}>
                        {report.questionTitle}
                      </p>
                    </TableCell>

                    {/* Test name */}
                    <TableCell className="text-sm text-muted-foreground">
                      {report.testName}
                    </TableCell>

                    {/* Reported by */}
                    <TableCell className="text-sm">{report.reportedBy}</TableCell>

                    {/* Reason */}
                    <TableCell className="text-sm text-muted-foreground">
                      <p className="line-clamp-2" title={report.reason}>
                        {report.reason}
                      </p>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {updatingId === report.id && (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        )}
                        <StatusBadge status={report.status} />
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm text-muted-foreground">
                      {report.date}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updatingId === report.id}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewQuestion(report.questionId)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Question
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {report.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatus(report.id, 'resolved')}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                Resolve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(report.id, 'dismissed')}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-slate-400" />
                                Dismiss
                              </DropdownMenuItem>
                            </>
                          )}
                          {report.status === 'resolved' && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(report.id, 'pending')}
                            >
                              <MessageSquareWarning className="mr-2 h-4 w-4 text-amber-500" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                          {report.status === 'dismissed' && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(report.id, 'pending')}
                            >
                              <MessageSquareWarning className="mr-2 h-4 w-4 text-amber-500" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Question Detail Dialog ──────────────────────────────────────── */}
      <Dialog open={questionDetailOpen} onOpenChange={setQuestionDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>
              Full details of the reported question
            </DialogDescription>
          </DialogHeader>
          {questionDetailLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : questionDetail ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge variant="secondary" className="text-xs mt-1">{questionDetail.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Section</p>
                  <p className="text-sm font-medium mt-1">{questionDetail.section}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marks</p>
                  <p className="text-sm font-medium mt-1">{questionDetail.marks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <Badge variant="secondary" className="text-xs mt-1">{questionDetail.difficulty}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Question Text</p>
                <div className="rounded-lg border p-3 bg-gray-50">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{questionDetail.text}</p>
                </div>
              </div>
              {questionDetail.options && questionDetail.options.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Options</p>
                  <div className="space-y-1.5">
                    {questionDetail.options.map((opt: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${
                          opt.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
                        }`}
                      >
                        <span className="font-medium text-muted-foreground w-5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={opt.isCorrect ? 'text-emerald-700 font-medium' : ''}>
                          {opt.text}
                        </span>
                        {opt.isCorrect && (
                          <CheckCircle2 className="size-3.5 text-emerald-600 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {questionDetail.solutionText && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Solution</p>
                  <div className="rounded-lg border p-3 bg-gray-50">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{questionDetail.solutionText}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No details available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
