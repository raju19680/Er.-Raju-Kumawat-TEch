'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  GripVertical,
  Clock,
  HelpCircle,
  FileText,
  Globe,
  Copy,
  Eye,
  BarChart3,
  CheckCircle,
  FileDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import AddTestDrawer from '../test-portal/add-test-drawer'
import { toast } from 'sonner'
import { TestManager } from './components/test-manager'
import { TestItemCard } from './components/test-item-card'

interface Test {
  id: string
  title: string
  status: string
  isLive: boolean
  isLocked: boolean
  numberOfQuestions: number
  totalMarks: number
  totalDuration: number
  sortOrder: number
  isPdfTest: boolean
  pdfUrl: string | null
  testMode: 'CBT' | 'OMR'
}

export function TestSeriesContentManager({
  testSeriesId,
  onBack,
  embedded = false,
}: {
  testSeriesId: string
  onBack?: () => void
  embedded?: boolean
}) {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog state
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [activeTestManager, setActiveTestManager] = useState<Test | null>(null)
  
  // Form state
  const [testForm, setTestForm] = useState({
    title: '',
    instructions: '',
    status: 'free',
    isLive: false,
    isLocked: false,
    numberOfQuestions: 0,
    totalMarks: 0,
    totalDuration: 0,
    isPdfTest: false,
    pdfUrl: '',
    testMode: 'CBT' as 'CBT' | 'OMR',
    allowPdfDownload: false,
    pdfPasswordProtected: false,
    negativeMarks: 0,
    sectionWiseMarks: false,
    partialScoring: false,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    displayPause: false,
    allCompulsory: true,
    displayResults: true,
    displayRank: true,
    showSolution: true,
    showPercentile: false,
    showTotalStudents: false,
  })
  
  const loadTests = async () => {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; tests: Test[] }>(
        `/api/teacher/test-series/${testSeriesId}/tests`
      )
      if (res.success) {
        setTests(res.tests)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTests()
  }, [testSeriesId])

  const handleOpenAddTest = () => {
    setEditingTest(null)
    setTestForm({
      title: '',
      instructions: '',
      status: 'free',
      isLive: false,
      isLocked: false,
      numberOfQuestions: 0,
      totalMarks: 0,
      totalDuration: 0,
      isPdfTest: false,
      pdfUrl: '',
      testMode: 'CBT',
      allowPdfDownload: false,
      pdfPasswordProtected: false,
      negativeMarks: 0,
      sectionWiseMarks: false,
      partialScoring: false,
      maxAttempts: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      displayPause: false,
      allCompulsory: true,
      displayResults: true,
      displayRank: true,
      showSolution: true,
      showPercentile: false,
      showTotalStudents: false,
    })
    setIsTestDialogOpen(true)
  }

  const handleOpenEditTest = (test: any) => {
    setEditingTest(test)
    setTestForm({
      title: test.title || '',
      instructions: test.instructions || '',
      status: test.status || 'free',
      isLive: Boolean(test.isLive),
      isLocked: Boolean(test.isLocked),
      numberOfQuestions: Number(test.numberOfQuestions) || 0,
      totalMarks: Number(test.totalMarks) || 0,
      totalDuration: Number(test.totalDuration) || 0,
      isPdfTest: Boolean(test.isPdfTest),
      pdfUrl: test.pdfUrl || '',
      testMode: test.testMode || 'CBT',
      allowPdfDownload: Boolean(test.allowPdfDownload || test.allowPdfExport),
      pdfPasswordProtected: Boolean(test.pdfPasswordProtected),
      negativeMarks: Number(test.negativeMarks) || 0,
      sectionWiseMarks: Boolean(test.sectionWiseMarks),
      partialScoring: Boolean(test.partialScoring),
      maxAttempts: Number(test.maxAttempts) || 1,
      shuffleQuestions: Boolean(test.shuffleQuestions),
      shuffleOptions: Boolean(test.shuffleOptions),
      displayPause: Boolean(test.displayPause),
      allCompulsory: test.allCompulsory !== undefined ? Boolean(test.allCompulsory) : true,
      displayResults: test.displayResults !== undefined ? Boolean(test.displayResults) : true,
      displayRank: test.displayRank !== undefined ? Boolean(test.displayRank) : true,
      showSolution: test.showSolution !== undefined ? Boolean(test.showSolution) : true,
      showPercentile: Boolean(test.showPercentile),
      showTotalStudents: Boolean(test.showTotalStudents),
    })
    setIsTestDialogOpen(true)
  }

  const handleSaveTest = async () => {
    if (!testForm.title.trim()) {
      toast.error('Test title is required')
      return
    }

    try {
      if (editingTest) {
        const res = await apiFetchJSON(`/api/teacher/tests/${editingTest.id}`, {
          method: 'PUT',
          body: JSON.stringify(testForm)
        })
        if (res.success) {
          toast.success('Test updated successfully')
          setIsTestDialogOpen(false)
          loadTests()
        }
      } else {
        const res = await apiFetchJSON(`/api/teacher/test-series/${testSeriesId}/tests`, {
          method: 'POST',
          body: JSON.stringify({ ...testForm, sortOrder: tests.length })
        })
        if (res.success) {
          toast.success('Test created successfully')
          setIsTestDialogOpen(false)
          loadTests()
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save test')
    }
  }

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return

    try {
      const res = await apiFetchJSON(`/api/teacher/tests/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Test deleted successfully')
        loadTests()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete test')
    }
  }

  const handleTogglePublish = async (test: Test) => {
    try {
      // Send the entire test object with updated isLive property
      // because the PUT endpoint likely expects full fields or merges them
      const res = await apiFetchJSON(`/api/teacher/tests/${test.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...test, isLive: !test.isLive })
      })
      if (res.success) {
        toast.success(test.isLive ? 'Test unpublished' : 'Test published')
        loadTests()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const handleDuplicateTest = async (test: Test) => {
    try {
      const res = await apiFetchJSON(`/api/teacher/tests/${test.id}/duplicate`, {
        method: 'POST'
      })
      if (res.success) {
        toast.success('Test duplicated successfully')
        loadTests()
      } else {
        toast.error(res.error || 'Failed to duplicate test')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to duplicate test')
    }
  }

  const handlePreviewTest = (test: Test) => {
    toast.info('Preview mode coming in next update')
  }

  const handleAction = async (action: string, test: Test) => {
    switch (action) {
      case 'view_result':
        // Navigate to test results
        toast.info(`Viewing results for ${test.title}`)
        // router.push(`/admin/tests/${test.id}/results`)
        break;
      case 'review_question':
        toast.info(`Reviewing questions for ${test.title}`)
        setActiveTestManager(test) // Or navigate to question review specific view
        break;
      case 'export_pdf_with_sol':
      case 'export_pdf_without_sol': {
        const withSol = action === 'export_pdf_with_sol'
        toast.success('Opening PDF generator in new tab...')
        window.open(`/print-test/${test.id}?solutions=${withSol}`, '_blank')
        break
      }
      case 'reevaluate_marks':
        try {
          toast.loading(`Reevaluating marks for ${test.title}...`, { id: 'reevaluate' })
          const res = await apiFetchJSON(`/api/teacher/tests/${test.id}/reevaluate`, {
            method: 'POST',
            body: JSON.stringify({})
          })
          if (res.success) {
            toast.success(res.message || `Re-evaluation completed`, { id: 'reevaluate' })
          } else {
            toast.error(res.error || 'Failed to re-evaluate', { id: 'reevaluate' })
          }
        } catch (err) {
          console.error(err)
          toast.error('Failed to re-evaluate', { id: 'reevaluate' })
        }
        break;
    }
  }

  if (activeTestManager) {
    return (
      <TestManager
        testId={activeTestManager.id}
        testTitle={activeTestManager.title}
        onBack={() => setActiveTestManager(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      {!embedded && (
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Manage Tests</h1>
              <p className="text-xs text-gray-500">Add or edit tests in this series</p>
            </div>
          </div>
          <Button onClick={handleOpenAddTest} className="gap-2">
            <Plus className="size-4" /> Add Test
          </Button>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tests</h2>
          <Button onClick={handleOpenAddTest} className="gap-2" size="sm">
            <Plus className="size-4" /> Add Test
          </Button>
        </div>
      )}

      <div className={`flex-1 ${!embedded ? 'p-4 lg:p-8 max-w-5xl mx-auto w-full' : ''}`}>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FileText className="size-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No tests yet</h3>
            <p className="text-gray-500 mb-6">Create your first test to get started</p>
            <Button onClick={handleOpenAddTest} className="gap-2">
              <Plus className="size-4" /> Add Test
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <TestItemCard
                key={test.id}
                test={test}
                index={index}
                onSetActiveTestManager={setActiveTestManager}
                onOpenEditTest={handleOpenEditTest}
                onAction={handleAction}
                onDuplicateTest={handleDuplicateTest}
                onTogglePublish={handleTogglePublish}
                onDeleteTest={handleDeleteTest}
              />
            ))}
          </div>
        )}
      </div>

        {/* Test Drawer */}
        <AddTestDrawer
          open={isTestDialogOpen}
          onOpenChange={setIsTestDialogOpen}
          editData={(editingTest as unknown as Record<string, unknown>) || undefined}
          onSave={() => {
            setIsTestDialogOpen(false)
            loadTests()
          }}
        />
    </div>
  )
}
