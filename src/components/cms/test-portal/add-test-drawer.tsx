'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function uploadFile(file: File, type: 'document' = 'document'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  const res = await apiFetchJSON(`/api/teacher/upload-image?type=${type}`, { method: 'POST', body: formData })
  if (res && (res.url || res.filePath)) {
    return res.url || res.filePath
  }
  throw new Error('Upload failed')
}
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, FileText, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddTestDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: Record<string, unknown>
  onSave?: () => void
}

// ── Form state type ───────────────────────────────────────────────────────────

interface FormSection {
  id: string
  sectionName: string
  maxQuestions: string
  partTitle: string
  cutoffScore: string
  isOptional: boolean
  fixedTiming: boolean
}

interface FormState {
  title: string
  status: 'free' | 'paid'
  instructions: string
  testSeriesId: string
  numQuestions: string
  totalMarks: string
  duration: string
  chapter: string
  concept: string
  sortingOrder: string
  sections: FormSection[]
  
  startDate: string
  endDate: string
  
  language: string
  translationTitle: string
  maxAttempts: string
  shuffleQuestions: boolean
  shuffleOptions: boolean
  displayPause: boolean
  allowTestAttempt: boolean
  allQuestionsCompulsory: boolean
  uiType: string
  
  allowPdfExport: boolean
  enablePartialScoring: boolean
  displayResults: boolean
  resultDateTime: string
  
  // existing additional fields kept for compatibility
  sectionWiseMarks: boolean
  negativeMarks: string
  displayRank: boolean
  showSolution: boolean
  showTotalStudents: boolean
  showPercentile: boolean
  solutionLink: string
  telegramSettings: string
  markAsLive: boolean
  enabled: boolean
  price: string
  isPdfTest: boolean
  pdfUrl: string
  testMode: string
  allowPdfDownload: boolean
  pdfPasswordProtected: boolean
  examProfileId?: string
  themeId?: string
  seoTitle?: string
  seoDescription?: string
  richSnippets?: boolean
}

const defaultFormState: FormState = {
  title: '',
  status: 'free',
  instructions: '',
  testSeriesId: '',
  numQuestions: '',
  totalMarks: '',
  duration: '',
  chapter: '',
  concept: '',
  sortingOrder: '',
  sections: [{ id: '1', sectionName: 'GK', maxQuestions: '-1', partTitle: '', cutoffScore: '-1.00', isOptional: true, fixedTiming: false }],
  startDate: '',
  endDate: '',
  language: 'english',
  translationTitle: '',
  maxAttempts: '',
  shuffleQuestions: false,
  shuffleOptions: false,
  displayPause: false,
  allowTestAttempt: true,
  allQuestionsCompulsory: true,
  uiType: 'default',
  allowPdfExport: false,
  enablePartialScoring: false,
  displayResults: true,
  resultDateTime: '',
  
  sectionWiseMarks: false,
  negativeMarks: '',
  displayRank: true,
  showSolution: true,
  showTotalStudents: false,
  showPercentile: false,
  solutionLink: '',
  telegramSettings: '',
  markAsLive: false,
  enabled: true,
  price: '',
  isPdfTest: false,
  pdfUrl: '',
  testMode: 'CBT',
  allowPdfDownload: false,
  pdfPasswordProtected: false,
    examProfileId: '',
    themeId: '',
    seoTitle: '',
    seoDescription: '',
    richSnippets: true,
}

function getInitialState(editData?: Record<string, unknown>): FormState {
  if (!editData) return { ...defaultFormState }
  
  const sectionsData = editData.testSections as any[]
  const mappedSections = sectionsData && sectionsData.length > 0 
    ? sectionsData.map(s => ({
        id: s.id || Date.now().toString() + Math.random(),
        sectionName: s.sectionName || '',
        maxQuestions: s.maxQuestions?.toString() || '-1',
        partTitle: s.partTitle || '',
        cutoffScore: s.cutoffScore?.toString() || '0',
        isOptional: s.isOptional || false,
        fixedTiming: s.fixedTiming || false,
      }))
    : defaultFormState.sections

  return {
    ...defaultFormState,
    title: (editData.title as string) || '',
    status: (editData.status as 'free' | 'paid') || 'free',
    instructions: (editData.instructions as string) || '',
    testSeriesId: (editData.testSeriesId as string) || (editData.series as string) || '',
    numQuestions: (editData.totalQuestions ?? editData.numQuestions ?? '').toString(),
    totalMarks: (editData.totalMarks ?? '').toString(),
    duration: (editData.duration ?? '').toString(),
    sortingOrder: (editData.sortingOrder ?? '').toString(),
    
    // New fields won't exist yet, fallback to default
    chapter: (editData.chapterId as string) || 'none',
    concept: (editData.conceptId as string) || 'none',
    sections: mappedSections,
    resultDateTime: (editData.resultAt as string) || '',
    
    sectionWiseMarks: (editData.sectionWiseMarks as boolean) || false,
    negativeMarks: (editData.negativeMarks ?? '').toString(),
    startDate: (editData.startDate as string) || '',
    endDate: (editData.endDate as string) || '',
    language: (editData.language as string) || 'english',
    translationTitle: (editData.translationTitle as string) || '',
    maxAttempts: (editData.maxAttempts ?? '').toString(),
    shuffleQuestions: (editData.shuffleQuestions as boolean) || false,
    shuffleOptions: (editData.shuffleOptions as boolean) || false,
    displayPause: (editData.displayPause as boolean) || false,
    allowTestAttempt: (editData.allowTestAttempt as boolean) ?? true,
    allQuestionsCompulsory: (editData.allQuestionsCompulsory as boolean) ?? true,
    uiType: (editData.uiType as string) || 'default',
    allowPdfExport: (editData.allowPdfExport as boolean) || false,
    enablePartialScoring: (editData.enablePartialScoring as boolean) || false,
    displayResults: (editData.displayResults as boolean) ?? true,
    displayRank: (editData.displayRank as boolean) ?? true,
    showSolution: (editData.showSolution as boolean) ?? true,
    showTotalStudents: (editData.showTotalStudents as boolean) || false,
    showPercentile: (editData.showPercentile as boolean) || false,
    solutionLink: (editData.solutionLink as string) || '',
    telegramSettings: (editData.telegramSettings as string) || '',
    markAsLive: (editData.isLive as boolean) || (editData.markAsLive as boolean) || false,
    enabled: (editData.enabled as boolean) ?? true,
    price: (editData.price ?? '').toString(),
    isPdfTest: (editData.isPdfTest as boolean) || false,
    pdfUrl: (editData.pdfUrl as string) || '',
    testMode: (editData.testMode as string) || 'CBT',
    allowPdfDownload: (editData.allowPdfDownload as boolean) || (editData.allowPdfExport as boolean) || false,
    pdfPasswordProtected: (editData.pdfPasswordProtected as boolean) || false,
      examProfileId: (editData.examProfileId as string) || '',
      themeId: (editData.themeId as string) || '',
      seoTitle: (editData.seoTitle as string) || '',
      seoDescription: (editData.seoDescription as string) || '',
      richSnippets: editData.richSnippets !== undefined ? (editData.richSnippets as boolean) : true,
  }
}

interface TestSeriesOption {
  id: string
  title: string
}

function DrawerFormContent({
  editData,
  onOpenChange,
  onSave,
}: {
  editData?: Record<string, unknown>
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}) {
  const { orgCode } = useAppStore()
  const isEditMode = !!editData
  const editId = editData?.id as string | undefined

  const [form, setForm] = useState<FormState>(() => getInitialState(editData))
  const [saving, setSaving] = useState(false)
  const [seriesOptions, setSeriesOptions] = useState<TestSeriesOption[]>([])
  const [loadingSeries, setLoadingSeries] = useState(true)

  const [profiles, setProfiles] = useState<any[]>([])
  const [themes, setThemes] = useState<any[]>([])

  useEffect(() => {
    async function loadSeries() {
      try {
        const res = await apiFetchJSON('/api/teacher/test-series')
        if (res.series) {
          setSeriesOptions(res.series.map((s: any) => ({ id: s.id, title: s.title })))
        }
      } catch (err) {
        toast.error('Failed to load test series')
      } finally {
        setLoadingSeries(false)
      }
    }
    loadSeries()
  }, [])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateSection = (id: string, key: keyof FormSection, value: any) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    }))
  }

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: Date.now().toString(), sectionName: '', maxQuestions: '', partTitle: '', cutoffScore: '', isOptional: false, fixedTiming: false }
      ]
    }))
  }

  const removeSection = (id: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }))
  }

  const buildBody = (): Record<string, unknown> => ({
    title: form.title,
    status: form.status,
    instructions: form.instructions,
    testSeriesId: form.testSeriesId,
    chapterId: form.chapter && form.chapter !== 'none' ? form.chapter : undefined,
    conceptId: form.concept && form.concept !== 'none' ? form.concept : undefined,
    totalQuestions: form.numQuestions ? Number(form.numQuestions) : undefined,
    totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
    duration: form.duration ? Number(form.duration) : undefined,
    sortingOrder: form.sortingOrder ? Number(form.sortingOrder) : undefined,
    sectionWiseMarks: form.sectionWiseMarks,
    negativeMarks: form.negativeMarks ? Number(form.negativeMarks) : undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    language: form.language,
    translationTitle: form.translationTitle || undefined,
    maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : undefined,
    shuffleQuestions: form.shuffleQuestions,
    shuffleOptions: form.shuffleOptions,
    displayPause: form.displayPause,
    allowTestAttempt: form.allowTestAttempt,
    allCompulsory: form.allQuestionsCompulsory,
    uiType: form.uiType,
    allowPdfExport: form.allowPdfExport,
    partialScoring: form.enablePartialScoring,
    displayResults: form.displayResults,
    resultAt: form.resultDateTime || undefined,
    displayRank: form.displayRank,
    showSolution: form.showSolution,
    showTotalStudents: form.showTotalStudents,
    showPercentile: form.showPercentile,
    solutionLink: form.solutionLink || undefined,
    telegramSettings: form.telegramSettings || undefined,
    isLive: form.markAsLive,
    enabled: form.enabled,
    price: form.status === 'paid' && form.price ? Number(form.price) : 0,
    isPdfTest: form.isPdfTest,
    pdfUrl: form.pdfUrl || undefined,
    testMode: form.testMode,
    allowPdfDownload: form.allowPdfDownload,
    pdfPasswordProtected: form.pdfPasswordProtected,
    organizationId: orgCode,
    sections: form.sections.map(s => ({
      sectionName: s.sectionName,
      maxQuestions: s.maxQuestions ? Number(s.maxQuestions) : -1,
      partTitle: s.partTitle || undefined,
      cutoffScore: s.cutoffScore ? Number(s.cutoffScore) : 0,
      isOptional: s.isOptional,
      fixedTiming: s.fixedTiming,
    })),
  })

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.testSeriesId) {
      toast.error('Test Series is required')
      return
    }

    setSaving(true)
    try {
      const body = buildBody()

      if (isEditMode && editId) {
        await apiFetchJSON(`/api/tests/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        toast.success('Test updated successfully')
      } else {
        await apiFetchJSON('/api/tests', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Test created successfully')
      }

      onOpenChange(false)
      onSave?.()
    } catch (err) {
      console.error('Failed to save test:', err)
      toast.error(isEditMode ? 'Failed to update test' : 'Failed to create test')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b shrink-0 bg-white z-10 sticky top-0">
        <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Test' : 'Add New Test'}</h2>
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Tabs defaultValue="basic" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-6 pt-2 border-b shrink-0 bg-gray-50/50">
          <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="basic"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              Basic Details
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              Advanced Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
          <TabsContent value="basic" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="test-title" className="text-sm font-semibold">
                      Test Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="test-title"
                      placeholder="e.g. Chapter 1 Mock Test"
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Pricing Status</Label>
                    <div className="flex rounded-md border overflow-hidden p-1 bg-muted/30">
                      <button
                        type="button"
                        className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${form.status === 'free' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => updateField('status', 'free')}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${form.status === 'paid' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => updateField('status', 'paid')}
                      >
                        Paid
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-sm font-semibold">
                    Test Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Enter instructions for students before they start the test..."
                    value={form.instructions}
                    onChange={(e) => updateField('instructions', e.target.value)}
                    className="min-h-[100px] resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Assign to Test Series</Label>
                    <Select
                      value={form.testSeriesId}
                      onValueChange={(val) => updateField('testSeriesId', val)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={loadingSeries ? "Loading..." : "Select test series..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Total Questions</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={form.numQuestions}
                      onChange={(e) => updateField('numQuestions', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Total Marks</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      value={form.totalMarks}
                      onChange={(e) => updateField('totalMarks', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Duration (Minutes)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 60"
                      value={form.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Test Mode & PDF Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Test Mode</Label>
                    <Select
                      value={form.testMode}
                      onValueChange={(val) => updateField('testMode', val)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select mode..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBT">CBT (Computer Based Test)</SelectItem>
                        <SelectItem value="OMR">OMR (Upload Sheet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPdfTest"
                    checked={form.isPdfTest}
                    onCheckedChange={(c) => updateField('isPdfTest', c)}
                  />
                  <Label htmlFor="isPdfTest" className="font-semibold cursor-pointer">
                    Is this a PDF based test?
                  </Label>
                </div>

                {form.isPdfTest && (
                  <div className="space-y-4 p-4 border rounded-lg bg-white">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">PDF File</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="https://example.com/test.pdf"
                          value={form.pdfUrl}
                          onChange={(e) => updateField('pdfUrl', e.target.value)}
                          className="h-10 flex-1"
                        />
                        <div className="relative">
                          <Input 
                            type="file" 
                            accept=".pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                toast.loading('Uploading PDF...', { id: 'upload-pdf' })
                                const url = await uploadFile(file, 'document')
                                updateField('pdfUrl', url)
                                toast.success('PDF uploaded successfully', { id: 'upload-pdf' })
                              } catch (err) {
                                toast.error('Failed to upload PDF', { id: 'upload-pdf' })
                              }
                            }}
                          />
                          <Button type="button" variant="outline" className="h-10 gap-2 shrink-0">
                            <Upload className="size-4" /> Upload
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowPdfDownload"
                          checked={form.allowPdfDownload}
                          onCheckedChange={(c) => updateField('allowPdfDownload', c === true)}
                        />
                        <Label htmlFor="allowPdfDownload" className="text-sm cursor-pointer">
                          Allow PDF Download
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pdfPasswordProtected"
                          checked={form.pdfPasswordProtected}
                          onCheckedChange={(c) => updateField('pdfPasswordProtected', c === true)}
                        />
                        <Label htmlFor="pdfPasswordProtected" className="text-sm cursor-pointer">
                          PDF is Password Protected
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Test Sections</CardTitle>
                <Button variant="outline" size="sm" onClick={addSection} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Section
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form.sections.map((section, index) => (
                    <div key={section.id} className="p-4 border rounded-lg bg-white relative group">
                      {form.sections.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(section.id)}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Section Name <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="e.g. Physics"
                            value={section.sectionName}
                            onChange={(e) => updateSection(section.id, 'sectionName', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Max Questions</Label>
                          <Input
                            type="number"
                            placeholder="-1 for all"
                            value={section.maxQuestions}
                            onChange={(e) => updateSection(section.id, 'maxQuestions', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Section Title (Optional)</Label>
                          <Input
                            placeholder="e.g. Part A"
                            value={section.partTitle}
                            onChange={(e) => updateSection(section.id, 'partTitle', e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Cutoff Score</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={section.cutoffScore}
                            onChange={(e) => updateSection(section.id, 'cutoffScore', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-6 mt-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`opt-${section.id}`}
                            checked={section.isOptional}
                            onCheckedChange={(c) => updateSection(section.id, 'isOptional', c === true)}
                          />
                          <Label htmlFor={`opt-${section.id}`} className="text-sm cursor-pointer">Optional Section</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`fix-${section.id}`}
                            checked={section.fixedTiming}
                            onCheckedChange={(c) => updateSection(section.id, 'fixedTiming', c === true)}
                          />
                          <Label htmlFor={`fix-${section.id}`} className="text-sm cursor-pointer">Fixed Timing</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Display & Access Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 col-span-2 md:col-span-1 border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Security & Flow</h4>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer">Allow Pause/Resume</Label>
                      <Switch
                        checked={form.displayPause}
                        onCheckedChange={(v) => updateField('displayPause', v)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer">Shuffle Questions</Label>
                      <Switch
                        checked={form.shuffleQuestions}
                        onCheckedChange={(v) => updateField('shuffleQuestions', v)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer">Shuffle Options</Label>
                      <Switch
                        checked={form.shuffleOptions}
                        onCheckedChange={(v) => updateField('shuffleOptions', v)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 col-span-2 md:col-span-1 border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Results & Feedback</h4>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer">Display Results After Test</Label>
                      <Switch
                        checked={form.displayResults}
                        onCheckedChange={(v) => updateField('displayResults', v)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer">Show Ranks</Label>
                      <Switch
                        checked={form.displayRank}
                        onCheckedChange={(v) => updateField('displayRank', v)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label className="text-sm cursor-pointer">Show Solutions</Label>
                      <Switch
                        checked={form.showSolution}
                        onCheckedChange={(v) => updateField('showSolution', v)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Scoring Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Enable Partial Scoring</Label>
                      <p className="text-xs text-muted-foreground">For multiple-correct (MSQ) questions</p>
                    </div>
                    <Switch
                      checked={form.enablePartialScoring}
                      onCheckedChange={(v) => updateField('enablePartialScoring', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Section-wise Marks</Label>
                      <p className="text-xs text-muted-foreground">Each section has unique marking</p>
                    </div>
                    <Switch
                      checked={form.sectionWiseMarks}
                      onCheckedChange={(v) => updateField('sectionWiseMarks', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Language & Extras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Test Language</Label>
                    <Select value={form.language} onValueChange={(v) => updateField('language', v)}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="bilingual">Bilingual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Translation Title</Label>
                    <Input
                      placeholder="e.g. Chapter 1 (Hindi)"
                      value={form.translationTitle}
                      onChange={(e) => updateField('translationTitle', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Max Attempts Allowed</Label>
                    <Input
                      type="number"
                      placeholder="Leave blank for unlimited"
                      value={form.maxAttempts}
                      onChange={(e) => updateField('maxAttempts', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-4 mt-2">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Allow PDF Export</Label>
                      <p className="text-xs text-muted-foreground">Let students download test paper</p>
                    </div>
                    <Switch
                      checked={form.allowPdfExport}
                      onCheckedChange={(v) => updateField('allowPdfExport', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">SEO & UI Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Test Interface Theme</Label>
                    <Select value={form.themeId || 'default'} onValueChange={(v) => updateField('themeId', v)}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Theme</SelectItem>
                        <SelectItem value="rssb">RSSB Pattern (Auto-Debar)</SelectItem>
                        <SelectItem value="jee">JEE Pattern</SelectItem>
                        <SelectItem value="neet">NEET Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-4 mt-2">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Enable Rich Snippets</Label>
                      <p className="text-xs text-muted-foreground">Add schema markup for search engines</p>
                    </div>
                    <Switch
                      checked={form.richSnippets}
                      onCheckedChange={(v) => updateField('richSnippets', v)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">SEO Meta Title</Label>
                  <Input
                    placeholder="Enter meta title for SEO"
                    value={form.seoTitle}
                    onChange={(e) => updateField('seoTitle', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">SEO Meta Description</Label>
                  <Textarea
                    placeholder="Enter meta description for SEO"
                    value={form.seoDescription}
                    onChange={(e) => updateField('seoDescription', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>

        <div className="px-6 py-4 bg-white border-t shrink-0 flex items-center justify-between z-10 sticky bottom-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-24">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="w-32">
            {saving ? 'Saving...' : 'Save Test'}
          </Button>
        </div>
      </Tabs>
    </>
  )
}


export default function AddTestDrawer({ open, onOpenChange, editData, onSave }: AddTestDrawerProps) {
  const formKey = (editData?.id as string) ?? 'new'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-[1000px] p-0 flex flex-col bg-white"
      >
        <DrawerFormContent key={formKey} editData={editData} onOpenChange={onOpenChange} onSave={onSave} />
      </SheetContent>
    </Sheet>
  )
}




