'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { CMSPage } from '@/lib/store'
import { apiFetch, apiFetchJSON } from '@/lib/api-client'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  X,
  Pencil,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Eye,
  Edit2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParsedQuestion {
  id: number
  title: string
  type: string
  section: string
  posMarks: number
  negMarks: number
  option1: string
  option2: string
  option3: string
  option4: string
  option5?: string
  correctOption: string
  status: 'valid' | 'error'
  error?: string
  image1?: string
  solutionText?: string
  option1Image?: string
  option2Image?: string
  option3Image?: string
  option4Image?: string
  option5Image?: string
  solutionImage1?: string
}

interface UploadedFile {
  name: string
  size: string
  file?: File
}

interface TestSeriesItem {
  id: string
  title: string
}

interface TestItem {
  id: string
  title: string
}

// ── Step definitions ───────────────────────────────────────────────────────────

const steps = [
  { id: 1, label: 'Select Test' },
  { id: 2, label: 'Upload File' },
  { id: 3, label: 'Preview & Edit' },
  { id: 4, label: 'Final Upload' },
]

// ── Tab definition (shared with tests-list) ────────────────────────────────────

const tabs: { label: string; page: CMSPage }[] = [
  { label: 'Test Series', page: 'test-series' },

  { label: 'Results', page: 'results' },
  { label: 'Bulk Uploader', page: 'bulk-uploader' },
  { label: 'Reported Questions', page: 'reported-questions' },
  { label: 'Question Library', page: 'question-library' },
]

// ── CSV Parser ─────────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedQuestion[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) return []

  // Skip header row if it looks like a header
  const firstLine = lines[0].toLowerCase()
  const startIndex = firstLine.includes('title') || firstLine.includes('type') ? 1 : 0

  const questions: ParsedQuestion[] = []
  const seenTitles = new Set<string>()

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV split (handles basic quoting)
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))

    const id = i - startIndex + 1
    const title = cols[0] || ''
    const type = cols[1] || 'MCQ'
    const section = cols[2] || ''
    const posMarks = parseFloat(cols[3]) || 4
    const negMarks = parseFloat(cols[4]) || 0
    const option1 = cols[5] || ''
    const option2 = cols[6] || ''
    const option3 = cols[7] || ''
    const option4 = cols[8] || ''
    const correctOption = (cols[9] || '').toUpperCase()
    const solutionText = cols[10] || ''

    // Validation
    const errors: string[] = []
    if (!title) errors.push('Missing question title')
    if (!section) errors.push('Missing section')
    if (type === 'MCQ' && (!option1 || !option2)) errors.push('MCQ requires at least 2 options')
    if (type === 'MCQ' && correctOption && !['1', '2', '3', '4', 'A', 'B', 'C', 'D'].includes(correctOption)) {
      errors.push('Invalid correct option')
    }
    if (title && seenTitles.has(title.toLowerCase())) {
      errors.push('Duplicate question')
    }

    if (title) seenTitles.add(title.toLowerCase())

    questions.push({
      id,
      title,
      type,
      section,
      posMarks,
      negMarks,
      option1,
      option2,
      option3,
      option4,
      correctOption,
      solutionText,
      status: errors.length > 0 ? 'error' : 'valid',
      error: errors.length > 0 ? errors.join('; ') : undefined,
    })
  }

  return questions
}

// ── Stepper Component ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <React.Fragment key={step.id}>
            {/* Step circle + label */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isActive || isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-0.5 w-12 sm:w-20 transition-colors ${
                  isCompleted ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Inline Edit Row ────────────────────────────────────────────────────────────

function EditableRow({
  question,
  onSave,
  onCancel,
  onRemove,
}: {
  question: ParsedQuestion
  onSave: (updated: ParsedQuestion) => void
  onCancel: () => void
  onRemove: () => void
}) {
  const [editData, setEditData] = useState<ParsedQuestion>({ ...question })

  return (
    <TableRow className={question.status === 'error' ? 'bg-red-50/60' : ''}>
      <TableCell className="text-center text-muted-foreground">{question.id}</TableCell>
      <TableCell>
        <Input
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          className="h-8 text-sm min-w-[200px]"
          placeholder="Question title"
        />
      </TableCell>
      <TableCell>
        <Select
          value={editData.type}
          onValueChange={(val) => setEditData({ ...editData, type: val })}
        >
          <SelectTrigger className="h-8 w-full sm:w-[110px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MCQ">MCQ</SelectItem>
            <SelectItem value="Multiple Correct">Multiple Correct</SelectItem>
            <SelectItem value="Numerical">Numerical</SelectItem>
            <SelectItem value="Subjective">Subjective</SelectItem>
            <SelectItem value="True/False">True/False</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={editData.section}
          onChange={(e) => setEditData({ ...editData, section: e.target.value })}
          className="h-8 w-full sm:w-[120px] text-sm"
          placeholder="Section"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={editData.posMarks}
          onChange={(e) => setEditData({ ...editData, posMarks: Number(e.target.value) })}
          className="h-8 w-[70px] text-sm text-center"
          min={0}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={editData.negMarks}
          onChange={(e) => setEditData({ ...editData, negMarks: Number(e.target.value) })}
          className="h-8 w-[70px] text-sm text-center"
          step={0.25}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => onSave(editData)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function BulkUploader({ preselectedTestId }: { preselectedTestId?: string } = {}) {
  const { currentPage, setCurrentPage, orgCode } = useAppStore()

  // Step state
  const [currentStep, setCurrentStep] = useState(preselectedTestId ? 2 : 1)

  // Step 1 state
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [selectedSeriesName, setSelectedSeriesName] = useState('')
  const [selectedTestId, setSelectedTestId] = useState(preselectedTestId || '')
  const [selectedTestName, setSelectedTestName] = useState('')

  useEffect(() => {
    if (preselectedTestId) {
      setSelectedTestId(preselectedTestId)
      setCurrentStep(2)
    }
  }, [preselectedTestId])

  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>([])
  const [testsList, setTestsList] = useState<TestItem[]>([])
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [loadingTests, setLoadingTests] = useState(false)

  // Step 2 state
  const [uploadFormat, setUploadFormat] = useState('default')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3 state
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [bulkSection, setBulkSection] = useState('')
  const [bulkPosMarks, setBulkPosMarks] = useState('')
  const [bulkNegMarks, setBulkNegMarks] = useState('')
  const [bulkType, setBulkType] = useState('')
  const [parsing, setParsing] = useState(false)
  
  // DOCX Parse Options Modal state
  const [showDocxModal, setShowDocxModal] = useState(false)
  const [docxParseOption, setDocxParseOption] = useState('text_images')

  // Step 4 state
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0, success: 0, errors: 0 })

  // Trigger KaTeX render in Preview Mode when questions change or preview mode toggles
  useEffect(() => {
    if (previewMode && typeof window !== 'undefined' && (window as any).renderMathInElement) {
      setTimeout(() => {
        (window as any).renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
        })
      }, 100)
    }
  }, [previewMode, questions])

  // ── Fetch test series on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!orgCode) return
    let cancelled = false

    async function fetchSeries() {
      setLoadingSeries(true)
      try {
        const data = await apiFetchJSON<{ items: TestSeriesItem[]; total: number }>(
          `/api/teacher/test-series?organizationId=${encodeURIComponent(orgCode)}&limit=100`
        )
        if (!cancelled) {
          setTestSeriesList(data.items || [])
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load test series')
          console.error('Failed to fetch test series:', err)
        }
      } finally {
        if (!cancelled) setLoadingSeries(false)
      }
    }

    fetchSeries()
    return () => { cancelled = true }
  }, [orgCode])

  // ── Fetch tests when series changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedSeriesId || !orgCode) {
      setTestsList([])
      return
    }
    let cancelled = false

    async function fetchTests() {
      setLoadingTests(true)
      try {
        const data = await apiFetchJSON<{ items: TestItem[]; total: number }>(
          `/api/tests?testSeriesId=${encodeURIComponent(selectedSeriesId)}&organizationId=${encodeURIComponent(orgCode)}&limit=100`
        )
        if (!cancelled) {
          setTestsList(data.items || [])
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load tests')
          console.error('Failed to fetch tests:', err)
        }
      } finally {
        if (!cancelled) setLoadingTests(false)
      }
    }

    fetchTests()
    return () => { cancelled = true }
  }, [selectedSeriesId, orgCode])

  // ── Derived ────────────────────────────────────────────────────────────────
  const validCount = questions.filter((q) => q.status === 'valid').length
  const errorCount = questions.filter((q) => q.status === 'error').length

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDownloadSample = (format: string, e: React.MouseEvent) => {
    e.stopPropagation()
    let content = ''
    let filename = `sample_${format}.csv`
    
    if (format === 'default') {
      content = 'title,type,section,posMarks,negMarks,option1,option2,option3,option4,correctOption,solutionText\n' +
                'What is 2+2?,MCQ,Math,4,1,3,4,5,6,2,"It is 4"\n'
    } else if (format === 'format3') {
      content = 'Question: Match List-I with List-II...\n\n(a) Option A\n(b) Option B\n(c) Option C\n(d) Option D\n\nAnswer: a\n\nSolution:\nThis is the solution.\n\nPositive Marks: 1\nNegative Marks: 0.33\n\n'
      filename = `sample_erktacademy.txt`
    } else {
      content = 'Question\nWhat is 2+2?\nType\nMCQ\nOption\n3\nOption\n4\nOption\n5\nOption\n6\nAnswer\n2\nSolution\n4 is correct.\nPositive Marks\n4\nNegative Marks\n1\n\n'
      filename = `sample_${format}.txt`
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleNext = async () => {
    if (currentStep === 1 && !selectedSeriesId) return
    if (currentStep === 1 && !selectedTestId) return
    if (currentStep === 2 && !uploadedFile) return

    if (currentStep === 2) {
      if (uploadedFile?.file) {
        const ext = uploadedFile.name.substring(uploadedFile.name.lastIndexOf('.')).toLowerCase()
        if (ext === '.csv' || ext === '.txt') {
          setParsing(true)
          try {
            const text = await uploadedFile.file.text()
            const parsed = parseCSV(text)
            setQuestions(parsed)
            if (parsed.length > 0) {
              toast.success(`Parsed ${parsed.length} questions from file`)
            } else {
              toast.warning('No questions found in the file. Ensure CSV format is correct.')
            }
            setCurrentStep(3)
          } catch (err) {
            console.error('Failed to parse file:', err)
            toast.error('Failed to parse file. Please check the format.')
            setQuestions([])
          } finally {
            setParsing(false)
          }
        } else if (ext === '.docx') {
          // Open the modal for docx options
          setShowDocxModal(true)
          return
        } else {
          toast.error('Unsupported file format. Please upload .docx or .csv')
          return
        }
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const handleDocxConfirm = async () => {
    setShowDocxModal(false)
    if (!uploadedFile?.file) return
    
    setParsing(true)
    const formData = new FormData()
    formData.append('file', uploadedFile.file)
    formData.append('testId', selectedTestId)
    formData.append('format', uploadFormat)
    formData.append('parseOption', docxParseOption)

    try {
      const res = await apiFetch('/api/teacher/bulk-upload-docx', {
        method: 'POST',
        body: formData
      })
      
      let data
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        throw new Error(`Server returned ${res.status}: ${text.substring(0, 100)}`)
      }
      
      if (res.ok && data.success) {
        setQuestions(data.questions || [])
        toast.success(`Parsed ${data.questions?.length || 0} questions`)
        setCurrentStep(3)
      } else {
        toast.error(data.error || `Upload failed with status ${res.status}`)
      }
    } catch (err: any) {
      console.error('Failed to parse DOCX:', err)
      toast.error(err.message || 'An error occurred while parsing the DOCX file')
    } finally {
      setParsing(false)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, preselectedTestId ? 2 : 1))
  }

  const handleFileSelect = useCallback((file: File) => {
    const validExtensions = ['.docx', '.csv']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validExtensions.includes(ext)) return

    const sizeKB = file.size / 1024
    const sizeStr = sizeKB >= 1024
      ? `${(sizeKB / 1024).toFixed(1)} MB`
      : `${sizeKB.toFixed(0)} KB`

    setUploadedFile({ name: file.name, size: sizeStr, file })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveEdit = (updated: ParsedQuestion) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== updated.id) return q
        // Re-validate: if title is now filled and section is filled, mark as valid
        const hasTitle = updated.title.trim() !== ''
        const hasSection = updated.section.trim() !== ''
        if (hasTitle && hasSection) {
          return { ...updated, status: 'valid', error: undefined }
        }
        return updated
      })
    )
    setEditingId(null)
  }

  const handleRemoveQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleBulkApply = () => {
    let from = Number(rangeFrom)
    let to = Number(rangeTo)
    
    // If no range specified, apply to all questions
    if (!rangeFrom && !rangeTo) {
      from = 1
      to = questions.length
    } else if (!from || !to || from > to) {
      toast.error('Invalid question range')
      return
    }

    let appliedCount = 0
    setQuestions((prev) => {
      const seenTitles = new Set<string>()
      
      return prev.map((q) => {
        let updated = { ...q }
          if (q.id >= from && q.id <= to) {
            appliedCount++
            updated = {
              ...q,
              ...(bulkSection ? { section: bulkSection } : {}),
              ...(bulkPosMarks ? { posMarks: Number(bulkPosMarks) } : {}),
              ...(bulkNegMarks ? { negMarks: Math.abs(Number(bulkNegMarks)) } : {}),
              ...(bulkType ? { type: bulkType.toUpperCase() } : {}),
            }
          }
        
        const errors: string[] = []
        if (!updated.title || updated.title.trim() === '') errors.push('Missing question title')
        if (!updated.section || updated.section.trim() === '') errors.push('Missing section')
        if (updated.type === 'MCQ' && (!updated.option1 || !updated.option2)) errors.push('MCQ requires at least 2 options')
        if (updated.type === 'MCQ' && updated.correctOption && !['1', '2', '3', '4', 'A', 'B', 'C', 'D'].includes(updated.correctOption.toUpperCase())) {
          errors.push('Invalid correct option')
        }
        
        if (updated.title && updated.title.trim() !== '') {
          const lowerTitle = updated.title.trim().toLowerCase()
          if (seenTitles.has(lowerTitle)) {
            errors.push('Duplicate question')
          }
          seenTitles.add(lowerTitle)
        }

        updated.status = errors.length > 0 ? 'error' : 'valid'
        updated.error = errors.length > 0 ? errors.join('; ') : undefined

        return updated
      })
    })

    if (appliedCount > 0) {
      toast.success(`Successfully applied to ${appliedCount} question${appliedCount > 1 ? 's' : ''}`)
    } else {
      toast.error('No questions found in this range')
    }
  }

  const handleUploadValid = async () => {
    const validQuestions = questions.filter((q) => q.status === 'valid')
    if (validQuestions.length === 0) return

    setUploading(true)
    setUploadProgress({ done: 0, total: validQuestions.length, success: 0, errors: 0 })

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i]

      // Map correctOption letter to number
      let correctOpt = q.correctOption
      if (correctOpt === 'A') correctOpt = '1'
      else if (correctOpt === 'B') correctOpt = '2'
      else if (correctOpt === 'C') correctOpt = '3'
      else if (correctOpt === 'D') correctOpt = '4'

      try {
        const res = await apiFetch('/api/questions', {
          method: 'POST',
          body: JSON.stringify({
            title: q.title,
            type: q.type.toLowerCase().replace('/', ''),
            section: q.section || null,
            positiveMarks: q.posMarks,
            negativeMarks: q.negMarks,
            option1: q.option1 || null,
            option2: q.option2 || null,
            option3: q.option3 || null,
            option4: q.option4 || null,
            option5: q.option5 || null,
            image1: q.image1 || null,
            option1Image: q.option1Image || null,
            option2Image: q.option2Image || null,
            option3Image: q.option3Image || null,
            option4Image: q.option4Image || null,
            option5Image: q.option5Image || null,
            solutionText: q.solutionText || (q as any).solution || null,
            solutionImage1: q.solutionImage1 || null,
            correctOption: correctOpt || null,
            testId: selectedTestId,
            organizationId: orgCode,
            sortOrder: i,
          }),
        })

        if (res.ok) {
          successCount++
        } else {
          errorCount++
          const errData = await res.json().catch(() => ({}))
          console.error(`Failed to upload question ${q.id}:`, errData)
        }
      } catch (err) {
        errorCount++
        console.error(`Failed to upload question ${q.id}:`, err)
      }

      setUploadProgress({ done: i + 1, total: validQuestions.length, success: successCount, errors: errorCount })
    }

    setUploading(false)
    setUploadComplete(true)

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} question${successCount > 1 ? 's' : ''}`)
    }
    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} question${errorCount > 1 ? 's' : ''}`)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
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

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Bulk Uploader</h1>
      </div>

      {/* ── Step Indicator ──────────────────────────────────────────────────── */}
      <Card className="py-4">
        <CardContent className="py-0">
          <StepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* ── Step Content ────────────────────────────────────────────────────── */}

      {/* Step 1: Select Test */}
      {currentStep === 1 && (
        <Card>
          <CardContent>
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Select Test</h2>
                <p className="text-sm text-muted-foreground">
                  Choose the test series and specific test to upload questions into.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Series</Label>
                  <Select
                    value={selectedSeriesId}
                    onValueChange={(val) => {
                      const series = testSeriesList.find((s) => s.id === val)
                      setSelectedSeriesId(val)
                      setSelectedSeriesName(series?.title || '')
                      setSelectedTestId('')
                      setSelectedTestName('')
                    }}
                    disabled={loadingSeries}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingSeries ? 'Loading...' : 'Select test series'} />
                    </SelectTrigger>
                    <SelectContent>
                      {testSeriesList.map((series) => (
                        <SelectItem key={series.id} value={series.id}>
                          {series.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingSeries && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading test series...
                    </p>
                  )}
                  {!loadingSeries && testSeriesList.length === 0 && (
                    <p className="text-xs text-muted-foreground">No test series found.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Test Title</Label>
                  <Select
                    value={selectedTestId}
                    onValueChange={(val) => {
                      const test = testsList.find((t) => t.id === val)
                      setSelectedTestId(val)
                      setSelectedTestName(test?.title || '')
                    }}
                    disabled={!selectedSeriesId || loadingTests}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingTests
                          ? 'Loading...'
                          : selectedSeriesId
                            ? 'Select test title'
                            : 'Select a series first'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {testsList.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingTests && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading tests...
                    </p>
                  )}
                  {!loadingTests && selectedSeriesId && testsList.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tests found in this series.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleNext}
                  disabled={!selectedSeriesId || !selectedTestId}
                  className="w-full sm:w-auto gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload File */}
      {currentStep === 2 && (
        <Card>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Upload File</h2>
                <p className="text-sm text-muted-foreground">
                  Select a format and upload your question file.
                </p>
              </div>

              {/* Upload Format Selection */}
              <div className="space-y-3">
                <Label>Upload Format</Label>
                <RadioGroup
                  value={uploadFormat}
                  onValueChange={setUploadFormat}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50/50">
                    <RadioGroupItem value="default" id="format-default" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="format-default" className="cursor-pointer font-medium">
                        Default Format
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Standard English template
                      </p>
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={(e) => handleDownloadSample('default', e)}
                      >
                        <Download className="h-3 w-3" />
                        Download Sample
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50/50">
                    <RadioGroupItem value="format1" id="format-format1" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="format-format1" className="cursor-pointer font-medium">
                        Format 1
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hindi/English Bilingual
                      </p>
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={(e) => handleDownloadSample('format1', e)}
                      >
                        <Download className="h-3 w-3" />
                        Download Sample
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50/50">
                    <RadioGroupItem value="format2" id="format-format2" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="format-format2" className="cursor-pointer font-medium">
                        Format 2
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Number List (1. A. B. C.)
                      </p>
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={(e) => handleDownloadSample('format2', e)}
                      >
                        <Download className="h-3 w-3" />
                        Download Sample
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50/50">
                    <RadioGroupItem value="format3" id="format-format3" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="format-format3" className="cursor-pointer font-medium text-amber-700">
                        Format 3 (ERKTACADEMY)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Question: ... (a) ... (b) ...
                      </p>
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={(e) => handleDownloadSample('format3', e)}
                      >
                        <Download className="h-3 w-3" />
                        Download Sample
                      </button>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* CSV format hint */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                <p className="font-medium mb-1">CSV Format</p>
                <p className="text-amber-700">
                  For real parsing, use CSV with columns: <code className="bg-amber-100 px-1 rounded">title, type, section, posMarks, negMarks, option1, option2, option3, option4, correctOption, solutionText</code>
                </p>
              </div>

              {/* Drag & Drop Upload Area */}
              {!uploadedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-muted-foreground/25 bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/40'
                  }`}
                  onClick={handleBrowseClick}
                >
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                    isDragOver ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drag & drop your DOCX, Excel, or CSV file here
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Accepted formats: .docx, .csv
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBrowseClick()
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Browse Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.csv"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border bg-emerald-50/50 border-emerald-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{uploadedFile.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!uploadedFile || parsing}
                  className="w-full sm:w-auto gap-2"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DOCX Parse Options Modal */}
      {showDocxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Choose Options</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-foreground" onClick={() => setShowDocxModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                How would you like to parse this DOCX file?
              </p>
              
              <RadioGroup value={docxParseOption} onValueChange={setDocxParseOption} className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50/50">
                  <RadioGroupItem value="text_images" id="opt-text" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="opt-text" className="cursor-pointer font-medium">
                      Text and Images Only
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fast parsing. Mathematical equations might be stripped or malformed.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50/50">
                  <RadioGroupItem value="equations" id="opt-equations" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="opt-equations" className="cursor-pointer font-medium">
                      Equations, Images, and Text
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Slower parsing. Safely extracts equations to text blocks.
                    </p>
                  </div>
                </div>
              </RadioGroup>
              
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" onClick={() => setShowDocxModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDocxConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  {parsing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {currentStep === 3 && (
        <Card>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Preview & Edit</h2>
                    <p className="text-sm text-muted-foreground">
                      Review parsed questions. Fix errors or edit before final upload.
                    </p>
                  </div>
                  <Button 
                    variant={previewMode ? 'default' : 'outline'}
                    onClick={() => setPreviewMode(!previewMode)}
                    className="gap-2"
                  >
                    {previewMode ? <Edit2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {previewMode ? 'Edit Mode' : 'Preview Mode'}
                  </Button>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1.5 px-3 py-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {validCount} Valid
                </Badge>
                <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 gap-1.5 px-3 py-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errorCount} Errors
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {questions.length} Total
                </Badge>
              </div>

              {!previewMode ? (
                <>
                  {/* Questions Table */}
                  <div className="rounded-xl border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px] text-center">#</TableHead>
                          <TableHead className="min-w-[220px]">Question Title</TableHead>
                          <TableHead>Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-center">Pos. Marks</TableHead>
                      <TableHead className="text-center">Neg. Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No questions parsed.
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((q) =>
                        editingId === q.id ? (
                          <EditableRow
                            key={q.id}
                            question={q}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingId(null)}
                            onRemove={() => handleRemoveQuestion(q.id)}
                          />
                        ) : (
                          <TableRow
                            key={q.id}
                            className={q.status === 'error' ? 'bg-red-50/60' : ''}
                          >
                            <TableCell className="text-center text-muted-foreground">
                              {q.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <span className={q.title ? '' : 'text-muted-foreground italic'}>
                                  {q.title || '(empty)'}
                                </span>
                                {q.image1 && <MediaImage src={q.image1} alt="Question" className="max-h-24 object-contain rounded border" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {q.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={q.section ? '' : 'text-muted-foreground italic'}>
                                {q.section || '(empty)'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{q.posMarks}</TableCell>
                            <TableCell className="text-center">{q.negMarks}</TableCell>
                            <TableCell>
                              {q.status === 'valid' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  {q.error || 'Error'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditingId(q.id)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                  onClick={() => handleRemoveQuestion(q.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Bulk Apply Range */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium mb-3">Bulk Apply</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">From Q (Leave empty for All)</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                      className="h-8 w-[80px] text-sm"
                      min={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">To Q</Label>
                    <Input
                      type="number"
                      placeholder={questions.length.toString() || "10"}
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                      className="h-8 w-[80px] text-sm"
                      min={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={bulkType}
                      onChange={(e) => setBulkType(e.target.value)}
                      className="flex h-8 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Leave As-is</option>
                      <option value="MCQ">MCQ</option>
                      <option value="MSQ">MSQ</option>
                      <option value="NAT">NAT</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Section</Label>
                    <Input
                      placeholder="e.g. Physics"
                      value={bulkSection}
                      onChange={(e) => setBulkSection(e.target.value)}
                      className="h-8 w-[130px] text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pos. Marks</Label>
                    <Input
                      type="number"
                      placeholder="4"
                      value={bulkPosMarks}
                      onChange={(e) => setBulkPosMarks(e.target.value)}
                      className="h-8 w-[80px] text-sm"
                      min={0}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Neg. Marks</Label>
                    <Input
                      type="number"
                      placeholder="0.25"
                      value={bulkNegMarks}
                      onChange={(e) => setBulkNegMarks(e.target.value)}
                      className="h-8 w-[80px] text-sm"
                      step={0.25}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={handleBulkApply}
                    
                  >
                    <Check className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                </div>
              </div>
                </>
              ) : (
                <div className="rounded-xl border bg-muted/10 p-6 space-y-8 max-h-[600px] overflow-y-auto">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white border rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b pb-4">
                        <Badge variant="outline" className="font-semibold text-xs">
                          Q {idx + 1}
                        </Badge>
                        <div className="flex gap-2">
                          {q.section && <Badge variant="secondary" className="text-xs">{q.section}</Badge>}
                          <Badge variant="outline" className="text-xs">{q.type}</Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            +{q.posMarks} {q.negMarks > 0 ? `/ -${q.negMarks}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {q.title && <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: q.title }} />}
                        {(q as any).titleHi && <div className="text-sm font-medium text-amber-700 mt-2" dangerouslySetInnerHTML={{ __html: (q as any).titleHi }} />}
                        {q.image1 && <MediaImage src={q.image1} alt="Question" className="max-w-full rounded border mt-4" />}

                        <div className="space-y-2 mt-6">
                          {[1, 2, 3, 4, 5].map((optIdx) => {
                            const optHtml = q[(`option${optIdx}` as keyof ParsedQuestion)];
                            const optHi = q[(`option${optIdx}Hi` as keyof ParsedQuestion)];
                            const optImg = q[(`option${optIdx}Image` as keyof ParsedQuestion)];
                            
                            if (!optHtml && !optImg && !optHi) return null;
                            
                            const isCorrect = q.correctOption === String(optIdx);

                            return (
                              <div key={optIdx} className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-medium ${isCorrect ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-700'}`}>
                                  {String.fromCharCode(64 + optIdx)}
                                </div>
                                <div className="flex-1 overflow-hidden text-sm pt-0.5">
                                  {optHtml && <div dangerouslySetInnerHTML={{ __html: String(optHtml) }} />}
                                  {optHi && <div className="text-amber-700 mt-1" dangerouslySetInnerHTML={{ __html: String(optHi) }} />}
                                  {optImg && <img src={String(optImg)} alt={`Option ${optIdx}`} className="max-w-[200px] mt-2 rounded border border-gray-200" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {(q.solutionText || q.solutionImage1 || (q as any).solutionHeading) && (
                          <div className="mt-6 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                            <p className="text-xs font-semibold text-blue-800 uppercase mb-3 flex items-center gap-1.5">
                              <CheckCircle className="size-3.5" /> Solution
                            </p>
                            {(q as any).solutionHeading && <h4 className="font-medium text-sm text-gray-900 mb-2">{(q as any).solutionHeading}</h4>}
                            {q.solutionText && <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: q.solutionText }} />}
                            {(q as any).solutionTextHi && <div className="text-sm text-amber-700 mt-2" dangerouslySetInnerHTML={{ __html: String((q as any).solutionTextHi) }} />}
                            <div className="flex gap-4 mt-3">
                              {q.solutionImage1 && <img src={q.solutionImage1} alt="Solution 1" className="max-w-[200px] rounded border" />}
                              {(q as any).solutionImage2 && <img src={(q as any).solutionImage2} alt="Solution 2" className="max-w-[200px] rounded border" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={questions.length === 0}
                  className="w-full sm:w-auto gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Final Upload */}
      {currentStep === 4 && (
        <Card>
          <CardContent>
            <div className="max-w-lg mx-auto space-y-6">
              {!uploadComplete ? (
                <>
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Final Upload</h2>
                    <p className="text-sm text-muted-foreground">
                      Review the summary and upload your questions.
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl border p-5 space-y-4">
                    <p className="text-sm font-medium">Upload Summary</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-emerald-50 p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{validCount}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">Valid Questions</p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                        <p className="text-xs text-red-600 font-medium mt-1">Questions with Errors</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-muted-foreground">Test Series</span>
                        <span className="font-medium">{selectedSeriesName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-muted-foreground">Test Title</span>
                        <span className="font-medium">{selectedTestName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-muted-foreground">Upload Format</span>
                        <span className="font-medium capitalize">
                          {uploadFormat === 'default' ? 'Default' : uploadFormat === 'bilingual' ? 'Hindi/English Bilingual' : 'Custom Template'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">File</span>
                        <span className="font-medium">{uploadedFile?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="rounded-xl border p-5 space-y-3">
                      <p className="text-sm font-medium">Uploading Questions...</p>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{uploadProgress.done} / {uploadProgress.total} questions</span>
                        <span className="text-emerald-600">{uploadProgress.success} success</span>
                        {uploadProgress.errors > 0 && (
                          <span className="text-red-600">{uploadProgress.errors} failed</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handleUploadValid}
                      disabled={validCount === 0 || uploading}
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading... ({uploadProgress.done}/{uploadProgress.total})
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Valid Questions ({validCount})
                        </>
                      )}
                    </Button>
                    {errorCount > 0 && (
                      <Button variant="outline" className="flex-1 gap-2" disabled={uploading}>
                        <Download className="h-4 w-4" />
                        Download Error Report
                      </Button>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-start pt-2">
                    <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto gap-2" disabled={uploading}>
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="flex flex-col items-center py-8 text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Upload Complete!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {uploadProgress.success} of {uploadProgress.total} questions uploaded to{' '}
                      <span className="font-medium text-foreground">{selectedTestName}</span>
                    </p>
                    {uploadProgress.errors > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {uploadProgress.errors} question{uploadProgress.errors > 1 ? 's' : ''} failed to upload.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(1)
                        setSelectedSeriesId('')
                        setSelectedSeriesName('')
                        setSelectedTestId('')
                        setSelectedTestName('')
                        setUploadFormat('default')
                        setUploadedFile(null)
                        setQuestions([])
                        setEditingId(null)
                        setUploadComplete(false)
                        setUploadProgress({ done: 0, total: 0, success: 0, errors: 0 })
                        setRangeFrom('')
                        setRangeTo('')
                        setBulkSection('')
                        setBulkType('')
                        setBulkPosMarks('')
                        setBulkNegMarks('')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="gap-2"
                    >
                      Upload More Questions
                    </Button>
                      <Button
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setCurrentPage('test-series')}
                      >
                        Go to Test Series
                      </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
