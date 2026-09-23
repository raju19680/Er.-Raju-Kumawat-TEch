'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { CMSPage } from '@/lib/store'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Users,
  TrendingUp,
  Trophy,
  CheckCircle2,
  FileDown,
  Eye,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  Search,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

interface ResultItem {
  id: string
  studentName: string
  email: string
  score: number
  totalMarks: number
  percentage: number
  rank: number
  timeTaken: string
  attemptedAt: string
  testName: string
  testId?: string
  studentId?: string
  status?: string
}

interface TestOption {
  id: string
  title: string
}

interface TestAttemptsResponse {
  items: ResultItem[]
  total: number
  page: number
  limit: number
}

interface AttemptDetail {
  id: string
  studentName: string
  email: string
  score: number
  totalMarks: number
  percentage: number
  rank: number
  timeTaken: string
  attemptedAt: string
  testName: string
  answers?: any[]
  startTime?: string
  endTime?: string
}

// ── Tab definition ───────────────────────────────────────────────────────────

const tabs: { label: string; page: CMSPage }[] = [
  { label: 'Test Series', page: 'test-series' },

  { label: 'Results', page: 'results' },
  { label: 'Bulk Uploader', page: 'bulk-uploader' },
  { label: 'Reported Questions', page: 'reported-questions' },
  { label: 'Question Library', page: 'question-library' },
]

// ── Summary card component ───────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  accentColor: string
}) {
  return (
    <Card className="rounded-xl overflow-hidden min-w-0">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${accentColor}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ResultsPage({ testIdFilter }: { testIdFilter?: string } = {}) {
  const { currentPage, setCurrentPage, orgCode } = useAppStore()

  // Data state
  const [results, setResults] = useState<ResultItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [selectedTest, setSelectedTest] = useState<string>(testIdFilter || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  // Tests for dropdown
  const [tests, setTests] = useState<TestOption[]>([])
  const [testsLoading, setTestsLoading] = useState(true)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<AttemptDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Fetch tests for filter ──────────────────────────────────────────────

  useEffect(() => {
    if (testIdFilter) {
      setTestsLoading(false)
      return
    }
    async function fetchTests() {
      setTestsLoading(true)
      try {
        const res = await apiFetch(`/api/tests?organizationId=${orgCode}&limit=100`)
        if (!res.ok) throw new Error('Failed to fetch tests')
        const data = await res.json()
        setTests(data.items ?? data ?? [])
      } catch {
        setTests([])
      } finally {
        setTestsLoading(false)
      }
    }
    if (orgCode) fetchTests()
  }, [orgCode, testIdFilter])

  // ── Fetch results ───────────────────────────────────────────────────────

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('status', 'completed')
      if (searchQuery) params.set('search', searchQuery)
      if (selectedTest !== 'all') params.set('testId', selectedTest)

      const res = await apiFetch(`/api/test-attempts?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch results')

      const data: TestAttemptsResponse = await res.json()
      setResults(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load results')
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, selectedTest])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTest])

  // ── Summary calculations ────────────────────────────────────────────────

  const totalAttempts = total
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((a, b) => a + b.percentage, 0) / results.length)
      : 0
  const highestScore =
    results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0
  const passRate =
    results.length > 0
      ? Math.round(
          (results.filter((r) => r.percentage >= 50).length / results.length) * 100
        )
      : 0

  // ── View Details ────────────────────────────────────────────────────────

  const handleViewDetails = async (attemptId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailData(null)
    try {
      const res = await apiFetch(`/api/test-attempts/${attemptId}`)
      if (!res.ok) throw new Error('Failed to load details')
      const data = await res.json()
      setDetailData(data)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to load attempt details')
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Export CSV ──────────────────────────────────────────────────────────

  const handleExport = () => {
    if (results.length === 0) {
      toast.error('No data to export')
      return
    }
    const headers = ['Student Name', 'Email', 'Score', 'Total Marks', 'Percentage', 'Rank', 'Time Taken', 'Attempted At', 'Test Name']
    const rows = results.map((r) =>
      [r.studentName, r.email, r.score, r.totalMarks, r.percentage, r.rank, r.timeTaken, r.attemptedAt, r.testName]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `test-results-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  // ── Re-evaluate ────────────────────────────────────────────────────────

  const handleReevaluate = async (attemptId: string) => {
    try {
      // Find the test ID from the result
      const result = results.find(r => r.id === attemptId)
      if (!result?.testId) return

      const res = await apiFetch(`/api/teacher/tests/${result.testId}/reevaluate`, {
        method: 'POST',
        body: JSON.stringify({ organizationId: orgCode }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Re-evaluation completed')
        fetchResults() // Refresh the list
      } else {
        toast.error(data.error || 'Re-evaluation failed')
      }
    } catch (err) {
      console.error('Re-evaluation error:', err)
      toast.error('Failed to re-evaluate. Please try again.')
    }
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('ellipsis')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
               onClick={() => setPage((p) => Math.max(1, p - 1))}
               className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
               className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

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
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Test Results</h1>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto gap-2"
          onClick={handleExport}
          disabled={loading || results.length === 0}
        >
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* ── Filters row ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Test selector */}
        {!testIdFilter && (
          <Select value={selectedTest} onValueChange={setSelectedTest}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select test" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              {!testsLoading && tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Attempts"
            value={totalAttempts.toString()}
            subtitle="Across all tests"
            icon={Users}
            accentColor="bg-sky-500"
          />
          <SummaryCard
            title="Average Score"
            value={`${avgScore}%`}
            subtitle="Mean percentage"
            icon={TrendingUp}
            accentColor="bg-emerald-500"
          />
          <SummaryCard
            title="Highest Score"
            value={`${highestScore}%`}
            subtitle="Top performer"
            icon={Trophy}
            accentColor="bg-amber-500"
          />
          <SummaryCard
            title="Pass Rate"
            value={`${passRate}%`}
            subtitle="Score ≥ 50%"
            icon={CheckCircle2}
            accentColor="bg-purple-500"
          />
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────── */}
      {error && !loading && (
        <Card className="rounded-xl border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="size-8 text-red-400 mb-3" />
              <p className="text-sm font-medium text-red-700">Failed to load results</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchResults}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results table ──────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Score / Total</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Time Taken</TableHead>
                <TableHead>Attempted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No results found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.studentName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {result.email}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{result.score}</span>
                      <span className="text-muted-foreground"> / {result.totalMarks}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          result.percentage >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : result.percentage >= 50
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }
                      >
                        {result.percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {result.rank <= 3 && (
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="font-medium">#{result.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.timeTaken}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.attemptedAt}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(result.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReevaluate(result.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Re-evaluate
                          </DropdownMenuItem>
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

      {/* Pagination */}
      {!loading && !error && renderPagination()}

      {/* ── Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Attempt Details</DialogTitle>
            <DialogDescription>
              Detailed view of the test attempt
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : detailData ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Student</p>
                  <p className="text-sm font-medium">{detailData.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{detailData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Test</p>
                  <p className="text-sm font-medium">{detailData.testName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-sm font-medium">{detailData.score} / {detailData.totalMarks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentage</p>
                  <Badge
                    className={
                      detailData.percentage >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : detailData.percentage >= 50
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {detailData.percentage}%
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="text-sm font-medium">#{detailData.rank}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                  <p className="text-sm font-medium">{detailData.timeTaken}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attempted At</p>
                  <p className="text-sm font-medium">{detailData.attemptedAt}</p>
                </div>
              </div>
              {detailData.answers && detailData.answers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Answers ({detailData.answers.length})</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded border p-2">
                    {detailData.answers.map((ans: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                        <span className="text-muted-foreground">Q{idx + 1}</span>
                        <Badge variant={ans.isCorrect ? 'default' : 'destructive'} className="text-xs px-1.5 py-0">
                          {ans.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                    ))}
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
