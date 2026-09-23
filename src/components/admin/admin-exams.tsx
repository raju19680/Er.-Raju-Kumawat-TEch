'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
  Globe,
  Settings,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ── Types ────────────────────────────────────────────────────────────────────
interface ExamProfileData {
  id: string
  name: string
  code: string | null
  category: string | null
  description: string | null
  language: string
  defaultTestMode: string
  instructions: string | null
  createdAt: string
  _count?: {
    testSeries: number
    tests: number
  }
}

interface ExamFormState {
  name: string
  code: string
  category: string
  description: string
  language: string
  defaultTestMode: string
  instructions: string
}

const defaultFormState: ExamFormState = {
  name: '',
  code: '',
  category: '',
  description: '',
  language: 'english',
  defaultTestMode: 'CBT',
  instructions: '',
}

// ── Loading Skeletons ────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Exam Profile Form ────────────────────────────────────────────────────────
function ExamProfileForm({
  form,
  setForm,
  error,
}: {
  form: ExamFormState
  setForm: React.Dispatch<React.SetStateAction<ExamFormState>>
  error: string
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="examName" className="text-xs font-medium text-gray-700">
            Exam Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="examName"
            placeholder="e.g. JEE Mains 2025"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="examCode" className="text-xs font-medium text-gray-700">
            Code <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="examCode"
            placeholder="e.g. JEE_MAIN"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            className="h-10 text-sm font-mono uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="examCategory" className="text-xs font-medium text-gray-700">
            Category <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="examCategory"
            placeholder="e.g. Engineering"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Language</Label>
          <Select
            value={form.language}
            onValueChange={(value) => setForm((prev) => ({ ...prev, language: value }))}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="bilingual">Bilingual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Default Test Mode</Label>
          <Select
            value={form.defaultTestMode}
            onValueChange={(value) => setForm((prev) => ({ ...prev, defaultTestMode: value }))}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CBT">Computer Based Test (CBT)</SelectItem>
              <SelectItem value="OMR">OMR Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="examDesc" className="text-xs font-medium text-gray-700">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="examDesc"
          placeholder="Brief description about the exam..."
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="text-sm resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="examInstructions" className="text-xs font-medium text-gray-700">
          Global Instructions <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="examInstructions"
          placeholder="General instructions that appear before the test begins..."
          value={form.instructions}
          onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
          className="text-sm resize-none"
          rows={4}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}

// ── Add Exam Dialog ──────────────────────────────────────────────────────────
function AddExamDialog({
  open,
  onOpenChange,
  onExamCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExamCreated: () => void
}) {
  const [form, setForm] = useState<ExamFormState>(defaultFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setForm(defaultFormState)
        setError('')
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Exam name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await apiFetch('/api/teacher/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          category: form.category.trim() || undefined,
          description: form.description.trim() || undefined,
          language: form.language,
          defaultTestMode: form.defaultTestMode,
          instructions: form.instructions.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to create exam profile')
        setLoading(false)
        return
      }

      toast.success('Exam Profile created successfully')
      handleClose(false)
      onExamCreated()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Add Exam Profile</DialogTitle>
          <DialogDescription>
            Create a new exam profile. This defines the standard rules, theme, and structure for tests.
          </DialogDescription>
        </DialogHeader>

        <ExamProfileForm form={form} setForm={setForm} error={error} />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                <Plus className="size-4 mr-1" />
                Create Exam Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Exam Dialog ─────────────────────────────────────────────────────────
function EditExamDialog({
  open,
  onOpenChange,
  exam,
  onExamUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  exam: ExamProfileData | null
  onExamUpdated: () => void
}) {
  const [form, setForm] = useState<ExamFormState>(defaultFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (exam && open) {
      setForm({
        name: exam.name || '',
        code: exam.code || '',
        category: exam.category || '',
        description: exam.description || '',
        language: exam.language || 'english',
        defaultTestMode: exam.defaultTestMode || 'CBT',
        instructions: exam.instructions || '',
      })
      setError('')
    }
  }, [exam, open])

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setError('')
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  const handleSubmit = async () => {
    if (!exam) return
    if (!form.name.trim()) {
      setError('Exam name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await apiFetch(`/api/teacher/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim() || null,
          category: form.category.trim() || null,
          description: form.description.trim() || null,
          language: form.language,
          defaultTestMode: form.defaultTestMode,
          instructions: form.instructions.trim() || null,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to update exam profile')
        setLoading(false)
        return
      }

      toast.success('Exam Profile updated successfully')
      handleClose(false)
      onExamUpdated()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Edit Exam Profile</DialogTitle>
          <DialogDescription>
            Update details for this exam profile.
          </DialogDescription>
        </DialogHeader>

        <ExamProfileForm form={form} setForm={setForm} error={error} />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Check className="size-4 mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Exam Dialog ───────────────────────────────────────────────────────
function DeleteExamDialog({
  open,
  onOpenChange,
  exam,
  onExamDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  exam: ExamProfileData | null
  onExamDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!exam) return

    setLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/exams/${exam.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to delete exam profile')
        setLoading(false)
        return
      }

      toast.success(`Exam Profile "${exam.name}" deleted successfully.`)
      onOpenChange(false)
      onExamDeleted()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Delete Exam Profile</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-red-700">
                You are about to permanently delete <strong>{exam?.name}</strong>.
              </p>
              <p className="text-xs text-red-600">
                Are you sure you want to proceed? Tests using this profile will lose their association.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              <>
                <Trash2 className="size-4 mr-1" />
                Delete Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamProfileData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamProfileData | null>(null)

  const fetchExams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/teacher/exams')
      const data = await res.json()
      if (data.success && data.exams) {
        setExams(data.exams)
      } else {
        toast.error('Failed to load exam profiles')
      }
    } catch {
      toast.error('Failed to load exam profiles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  const filteredExams = exams.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.code && ex.code.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleEdit = (exam: ExamProfileData) => {
    setSelectedExam(exam)
    setEditDialogOpen(true)
  }

  const handleDelete = (exam: ExamProfileData) => {
    setSelectedExam(exam)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Exam Profiles</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage standardized exam settings, themes, and structures.
          </p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Add Exam Profile
        </Button>
      </div>

      {/* Filters & Actions */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search exams by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Area */}
      {loading ? (
        <TableSkeleton />
      ) : filteredExams.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-amber-50 text-amber-600 mb-4">
              <FileText className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No exam profiles found</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Get started by creating your first exam profile.'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="size-4 mr-2" />
                Add Exam Profile
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[300px]">Exam Name</TableHead>
                  <TableHead>Mode & Lang</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-amber-100 text-amber-700 font-bold shrink-0">
                          {exam.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{exam.name}</div>
                          {exam.code && (
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                              {exam.code}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge variant="outline" className="w-fit text-xs font-normal">
                          {exam.defaultTestMode}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Globe className="size-3" />
                          <span className="capitalize">{exam.language}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {exam.category ? (
                        <span className="text-sm text-gray-600">{exam.category}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-700">
                          {exam._count?.testSeries || 0} Test Series
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {exam._count?.tests || 0} Tests
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => handleEdit(exam)}>
                            <Pencil className="mr-2 h-4 w-4 text-gray-500" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4 text-gray-500" />
                            Theme & Rules
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(exam)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <AddExamDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onExamCreated={fetchExams} />
      <EditExamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        exam={selectedExam}
        onExamUpdated={fetchExams}
      />
      <DeleteExamDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        exam={selectedExam}
        onExamDeleted={fetchExams}
      />
    </div>
  )
}
