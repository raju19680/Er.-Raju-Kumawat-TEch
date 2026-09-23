'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ClipboardCheck,
  Search,
  Eye,
  CheckCircle,
  Loader2,
  ImageIcon,
  User,
  Clock,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

interface OmrAttempt {
  id: string
  score: number
  totalMarks: number
  status: string
  startedAt: string
  completedAt: string | null
  omrImageUrl: string | null
  student: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  test: {
    id: string
    title: string
    totalMarks: number
    testMode: string
    testSeries: {
      id: string
      title: string
    }
  }
}

interface OmrReviewResponse {
  items: OmrAttempt[]
  total: number
}

// ── Filter tab config ────────────────────────────────────────────────────────

const filterTabs = [
  { label: 'Pending', value: 'omr_pending' },
  { label: 'Reviewed', value: 'completed' },
] as const

type FilterTab = (typeof filterTabs)[number]['value']

// ── Date formatter ───────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OmrReviewPage() {
  // Data state
  const [attempts, setAttempts] = useState<OmrAttempt[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [activeTab, setActiveTab] = useState<FilterTab>('omr_pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState<OmrAttempt | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [publishing, setPublishing] = useState(false)

  // ── Fetch attempts ─────────────────────────────────────────────────────

  const fetchAttempts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', activeTab)
      if (searchQuery) params.set('search', searchQuery)

      const res = await apiFetch(`/api/teacher/omr-review?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch OMR submissions')

      const data: OmrReviewResponse = await res.json()
      setAttempts(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to load OMR submissions')
      setAttempts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery])

  useEffect(() => {
    fetchAttempts()
  }, [fetchAttempts])

  // ── Open review dialog ─────────────────────────────────────────────────

  const handleOpenReview = (attempt: OmrAttempt) => {
    setSelectedAttempt(attempt)
    setScoreInput(attempt.status === 'completed' ? String(attempt.score) : '')
    setReviewOpen(true)
  }

  // ── Publish result ─────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!selectedAttempt) return

    const score = Number(scoreInput)
    if (isNaN(score) || score < 0) {
      toast.error('Please enter a valid score')
      return
    }
    if (score > selectedAttempt.test.totalMarks) {
      toast.error(`Score cannot exceed total marks (${selectedAttempt.test.totalMarks})`)
      return
    }

    setPublishing(true)
    try {
      const res = await apiFetch('/api/teacher/omr-review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: selectedAttempt.id,
          score,
          status: 'completed',
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Failed to publish result')
      }

      toast.success('Result published successfully')
      setReviewOpen(false)
      setSelectedAttempt(null)
      setScoreInput('')
      fetchAttempts()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to publish result')
    } finally {
      setPublishing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            OMR Review
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Review and grade student OMR submissions
        </p>
      </div>

      {/* ── Filter tabs + Search ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.value
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        /* Loading skeleton */
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : attempts.length === 0 ? (
        /* Empty state */
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium">
                {activeTab === 'omr_pending'
                  ? 'No pending OMR submissions'
                  : 'No reviewed OMR submissions yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === 'omr_pending'
                  ? 'All OMR submissions have been reviewed. Check back later!'
                  : 'Reviewed submissions will appear here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Table view */
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">{attempts.length}</span> of{' '}
              <span className="font-medium text-foreground">{total}</span> submission
              {total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">S.No</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt, index) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{attempt.student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.student.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{attempt.test.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.test.testSeries.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {attempt.test.totalMarks}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(attempt.startedAt)}
                      </TableCell>
                      <TableCell>
                        {attempt.status === 'omr_pending' ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                            Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            Reviewed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleOpenReview(attempt)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* ── Review Dialog ───────────────────────────────────────────────── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              OMR Review
            </DialogTitle>
          </DialogHeader>

          {selectedAttempt && (
            <div className="space-y-5 py-2">
              {/* ── Student & Test Info ──────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Student</span>
                  </div>
                  <div className="pl-6">
                    <p className="text-sm font-medium">{selectedAttempt.student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAttempt.student.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Test</span>
                  </div>
                  <div className="pl-6">
                    <p className="text-sm font-medium">{selectedAttempt.test.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Total Marks: {selectedAttempt.test.totalMarks}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── OMR Image ───────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">OMR Sheet</Label>
                <div className="rounded-lg border bg-muted/30 overflow-hidden">
                  {selectedAttempt.omrImageUrl ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      <img
                        src={selectedAttempt.omrImageUrl}
                        alt="OMR Sheet"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <ImageIcon className="h-11 w-11 mb-2" />
                      <p className="text-sm">No OMR image uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Submitted At ────────────────────────────────────────── */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Submitted: {formatDate(selectedAttempt.startedAt)}</span>
              </div>

              {/* ── Score Input ──────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="score-input" className="text-sm font-medium">
                  Score (out of {selectedAttempt.test.totalMarks})
                </Label>
                <Input
                  id="score-input"
                  type="number"
                  min={0}
                  max={selectedAttempt.test.totalMarks}
                  placeholder={`Enter score (0 - ${selectedAttempt.test.totalMarks})`}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  className="rounded-lg"
                  disabled={selectedAttempt.status === 'completed'}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewOpen(false)}
              disabled={publishing}
            >
              Cancel
            </Button>
            {selectedAttempt?.status !== 'completed' && (
              <Button
                onClick={handlePublish}
                disabled={publishing || !scoreInput}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Publish Result
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
