'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
  Search,
  Plus,
  LayoutGrid,
  List,
  Pencil,
  Copy,
  Trash2,
  MoreHorizontal,
  FileQuestion,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QuestionEditor } from '@/components/cms/test-portal/question-editor'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | 'MCQ'
  | 'Multiple Correct'
  | 'Assertion Reason'
  | 'Matching'
  | 'True/False'
  | 'Statement Based'
  | 'Numerical'
  | 'Subjective'
  | 'Image Based'
  | 'PDF Based'
  | 'OMR Based'

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
  correctOption: string | null
  solutionHeading: string | null
  solutionImage1: string | null
  solutionImage2: string | null
  solutionVideo: string | null
  solutionText: string | null
  section: string | null
  positiveMarks: number
  negativeMarks: number
  sortOrder: number
  testId: string
  difficulty: string
}

interface QuestionsResponse {
  items: Question[]
  total: number
  page: number
  limit: number
}





const TYPE_COLORS: Record<string, string> = {
  'MCQ': 'bg-sky-50 text-sky-700',
  'Multiple Correct': 'bg-purple-50 text-purple-700',
  'Assertion Reason': 'bg-orange-50 text-orange-700',
  'Matching': 'bg-pink-50 text-pink-700',
  'True/False': 'bg-cyan-50 text-cyan-700',
  'Statement Based': 'bg-amber-50 text-amber-700',
  'Numerical': 'bg-emerald-50 text-emerald-700',
  'Subjective': 'bg-rose-50 text-rose-700',
  'Image Based': 'bg-teal-50 text-teal-700',
  'PDF Based': 'bg-gray-100 text-gray-700',
  'OMR Based': 'bg-slate-100 text-slate-700',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-50 text-green-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  Hard: 'bg-red-50 text-red-700',
}

const DIFFICULTY_DOTS: Record<string, string> = {
  Easy: 'bg-green-500',
  Medium: 'bg-yellow-500',
  Hard: 'bg-red-500',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-7 w-7 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Separator />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16 rounded hidden sm:block" />
              <Skeleton className="h-4 w-14 rounded hidden md:block" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuestionLibrary() {
  const { orgCode } = useAppStore()

  // Data state
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dynamic metadata
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableSections, setAvailableSections] = useState<string[]>([])

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await apiFetch('/api/teacher/questions/metadata')
        if (res.ok) {
          const data = await res.json()
          setAvailableTypes(data.types || [])
          setAvailableSections(data.sections || [])
        }
      } catch (e) {}
    }
    fetchMetadata()
  }, [])
  // Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 50
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Selection state
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [createTestModalOpen, setCreateTestModalOpen] = useState(false)
  const [newTestTitle, setNewTestTitle] = useState('')
  const [newTestSeriesId, setNewTestSeriesId] = useState('')
  const [testSeriesOptions, setTestSeriesOptions] = useState<any[]>([])
  const [isCreatingTest, setIsCreatingTest] = useState(false)

  const handleCreateTest = async () => {
    if (!newTestTitle.trim() || !newTestSeriesId || selectedQuestions.length === 0) return
    setIsCreatingTest(true)
    try {
      const res = await apiFetch('/api/teacher/tests/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTestTitle,
          testSeriesId: newTestSeriesId,
          questionIds: selectedQuestions
        })
      })
      if (res.ok) {
        toast.success('Test created successfully!')
        setCreateTestModalOpen(false)
        setSelectedQuestions([])
        setNewTestTitle('')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create test')
      }
    } catch (e) {
      toast.error('An error occurred')
    } finally {
      setIsCreatingTest(false)
    }
  }

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await apiFetch('/api/teacher/test-series')
        if (res.ok) {
          const data = await res.json()
          setTestSeriesOptions(data.items || [])
        }
      } catch (e) {
        console.error('Failed to fetch test series')
      }
    }
    fetchSeries()
  }, [])

  // Question editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<Question | null>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch questions ────────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (sectionFilter !== 'all') params.set('section', sectionFilter)
      if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter)

      const res = await apiFetch(`/api/teacher/questions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch questions')

      const data: QuestionsResponse = await res.json()
      setQuestions(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load questions')
      setQuestions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, sectionFilter, difficultyFilter])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, sectionFilter, difficultyFilter])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const openAddEditor = () => {
    setEditQuestion(null)
    setEditorOpen(true)
  }

  const openEditEditor = (question: Question) => {
    setEditQuestion(question)
    setEditorOpen(true)
  }

  const handleEditorSave = () => {
    setEditorOpen(false)
    setEditQuestion(null)
    fetchQuestions()
  }

  const handleDuplicate = async (question: Question) => {
    try {
      const body = {
        ...question,
        id: undefined,
        text: question.title + ' (Copy)',
        
      }
      delete (body as any).id

      const res = await apiFetch('/api/teacher/questions', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to duplicate question')

      toast.success('Question duplicated successfully')
      fetchQuestions()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to duplicate question')
    }
  }

  const handleDelete = async () => {
    if (!questionToDelete) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/questions/${questionToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete question')

      toast.success('Question deleted successfully')
      fetchQuestions()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete question')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
    }
  }

  // ─── Pagination ────────────────────────────────────────────────────────

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

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Question Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${total} questions in your library`}
          </p>
        </div>
        {/* Add Question Button Removed: Questions must be added within a specific test context */}
      </div>

      {/* Filters Row */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[170px] rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-full sm:w-[170px] rounded-lg">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-lg">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                className={`flex items-center justify-center size-9 transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-muted-foreground hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                className={`flex items-center justify-center size-9 transition-colors ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-muted-foreground hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && !loading && (
        <Card className="rounded-xl border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="size-8 text-red-400 mb-3" />
              <p className="text-sm font-medium text-red-700">Failed to load questions</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchQuestions}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeletons */}
      {loading && !error && (
        viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />
      )}

      {/* Questions Display - Empty State */}
      {!loading && !error && questions.length === 0 && (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileQuestion className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No questions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Display - Grid View */}
      {!loading && !error && questions.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question) => (
            <Card key={question.id} className="rounded-xl hover:shadow-md transition-shadow min-w-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${TYPE_COLORS[question.type] ?? ''}`}>
                    {question.type}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditEditor(question)}>
                        <Pencil className="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(question)}>
                        <Copy className="size-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          setQuestionToDelete(question)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {question.title}
                </p>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {question.section}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${DIFFICULTY_COLORS[question.difficulty] ?? ''}`}>
                      <span className={`size-1.5 rounded-full ${DIFFICULTY_DOTS[question.difficulty] ?? ''} mr-1`} />
                      {question.difficulty}
                    </Badge>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {question.positiveMarks} marks
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Questions Display - List View */}
        {!loading && !error && questions.length > 0 && viewMode === 'list' && (
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {questions.map((question) => (
                  <div key={question.id} className="p-6 flex flex-col md:flex-row justify-between items-start gap-4 hover:bg-gray-50/50 transition-colors relative group">
                    <div className="mt-1 flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 rounded p-1">
                      <Checkbox 
                         checked={selectedQuestions.includes(question.id)} 
                         onCheckedChange={(checked) => {
                           if (checked) setSelectedQuestions(prev => [...prev, question.id])
                           else setSelectedQuestions(prev => prev.filter(id => id !== question.id))
                         }}
                      />
                    </div>
                    <div className="flex-1 space-y-3 overflow-hidden ml-2">
                      <div className="font-medium flex items-start text-gray-900">
                        <span className="mr-2 text-gray-500">Q.</span>
                        <div className="whitespace-pre-wrap break-words overflow-x-auto w-full" dangerouslySetInnerHTML={{ __html: (question.title || 'Untitled Question').replace(/\n/g, '<br/>') }} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 md:ml-6 overflow-x-auto">
                        {question.option1 && <div className={question.correctOption === '1' || question.correctOption === 1 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>1. <span dangerouslySetInnerHTML={{__html: question.option1}}/></div>}
                        {question.option2 && <div className={question.correctOption === '2' || question.correctOption === 2 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>2. <span dangerouslySetInnerHTML={{__html: question.option2}}/></div>}
                        {question.option3 && <div className={question.correctOption === '3' || question.correctOption === 3 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>3. <span dangerouslySetInnerHTML={{__html: question.option3}}/></div>}
                        {question.option4 && <div className={question.correctOption === '4' || question.correctOption === 4 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>4. <span dangerouslySetInnerHTML={{__html: question.option4}}/></div>}
                      </div>

                      {question.solutionText && (
                        <div className="md:ml-6 mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 text-sm overflow-x-auto">
                          <div className="font-semibold text-blue-800 mb-1 flex items-center gap-1"><CheckCircle className="size-4"/> Solution</div>
                          <div className="text-gray-700 whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: question.solutionText }} />
                        </div>
                      )}

                      <div className="text-xs text-gray-500 md:ml-6 flex flex-wrap gap-3 items-center mt-2">
                        <Badge variant="outline" className="bg-white">{question.type || 'MCQ'}</Badge>
                        <span className="font-medium">Marks: <span className="text-green-600">+{question.positiveMarks ?? 1}</span> / <span className="text-red-600">-{question.negativeMarks ?? 0}</span></span>
                        {question.solutionText && <span className="flex items-center text-blue-600"><CheckCircle className="size-3 mr-1"/> Solution Attached</span>}
                        {question.section && <Badge variant="secondary" className="text-[10px]">{question.section}</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" onClick={() => openEditEditor(question)} className="h-8 justify-start gap-1.5 w-full md:w-auto">
                        <Pencil className="size-3.5" /> <span className="hidden md:inline">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 justify-start text-red-500 hover:text-red-600 hover:bg-red-50 w-full md:w-auto" onClick={() => { setQuestionToDelete(question); setDeleteDialogOpen(true) }}>
                        <Trash2 className="size-3.5" /> <span className="hidden md:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Pagination */}
      {!loading && !error && renderPagination()}

      {/* Question Editor Dialog */}
      <QuestionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editData={editQuestion}
        onSave={handleEditorSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {questionToDelete && (
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: questionToDelete.title || '' }} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Floating Action Bar */}
      {selectedQuestions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
          <span className="font-medium">{selectedQuestions.length} questions selected</span>
          <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
            <Button variant="secondary" size="sm" onClick={() => setCreateTestModalOpen(true)}>
              Create Test from Selected
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => setSelectedQuestions([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      <Dialog open={createTestModalOpen} onOpenChange={setCreateTestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
            <DialogDescription>
              This will duplicate the {selectedQuestions.length} selected questions and add them to a new test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Title</label>
              <Input 
                placeholder="e.g. Weekly Mock Test" 
                value={newTestTitle}
                onChange={e => setNewTestTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Test Series</label>
              <Select value={newTestSeriesId} onValueChange={setNewTestSeriesId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Test Series..." />
                </SelectTrigger>
                <SelectContent>
                  {testSeriesOptions.map(series => (
                    <SelectItem key={series.id} value={series.id}>{series.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTestModalOpen(false)} disabled={isCreatingTest}>Cancel</Button>
            <Button 
              onClick={handleCreateTest} 
              disabled={isCreatingTest || !newTestTitle.trim() || !newTestSeriesId}
            >
              {isCreatingTest ? 'Creating...' : 'Create Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
